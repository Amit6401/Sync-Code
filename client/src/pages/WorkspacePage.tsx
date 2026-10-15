import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../lib/axios';
import { useAuthStore } from '../store/auth';
import { useWorkspaceStore } from '../store/workspace';
import { useWorkspaceSocket } from '../hooks/useWorkspaceSocket';
import FileExplorer from '../features/explorer/FileExplorer';
import EditorTabs from '../features/editor/EditorTabs';
import MembersPanel from '../features/workspace/MembersPanel';
import SettingsModal from '../features/workspace/SettingsModal';
import type { WsServerEvent, WorkspaceFile } from '../types';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const store = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readOnly = store.myRole === 'viewer';

  const handleEvent = useCallback((event: WsServerEvent) => {
    const s = useWorkspaceStore.getState();
    switch (event.type) {
      case 'presence:update':
        s.setOnline(event.payload.online);
        break;
      case 'file:update':
        s.updateFileContent(event.payload.fileId, event.payload.content);
        break;
      case 'file:created':
        s.upsertFile(event.payload.file);
        break;
      case 'file:renamed':
        s.upsertFile(event.payload.file);
        break;
      case 'file:deleted':
        s.removeFile(event.payload.fileId);
        break;
      default:
        break;
    }
  }, []);

  const { send } = useWorkspaceSocket(workspaceId, token, handleEvent);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const [wsRes, filesRes] = await Promise.all([
          api.get('/workspaces/' + workspaceId),
          api.get('/workspaces/' + workspaceId + '/files'),
        ]);
        store.setWorkspace(wsRes.data.workspace, user!.id);
        store.setFiles(filesRes.data.files);
        const firstFile = filesRes.data.files.find((f: WorkspaceFile) => !f.isDirectory);
        if (firstFile) store.openFile(firstFile);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };
    if (user) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, user?.id]);

  const activeFile = store.files.find((f) => f._id === store.activeFileId) || null;

  const onEditorChange = (value: string | undefined) => {
    if (!activeFile || readOnly) return;
    const content = value ?? '';
    store.updateFileContent(activeFile._id, content);

    send({ type: 'file:update', payload: { fileId: activeFile._id, content } });

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.patch('/workspaces/' + activeFile.workspaceId + '/files/' + activeFile._id, { content });
      } catch {
        // keep silent; will retry on next edit
      }
    }, 800);
  };

  const onCursorChange = (position: { lineNumber: number; column: number } | null) => {
    if (!activeFile || !position) return;
    if (cursorTimer.current) clearTimeout(cursorTimer.current);
    cursorTimer.current = setTimeout(() => {
      send({ type: 'cursor:update', payload: { fileId: activeFile._id, line: position.lineNumber, column: position.column, name: user?.name } });
    }, 200);
  };

  const onLocalCreate = (file: WorkspaceFile) => {
    store.upsertFile(file);
    send({ type: 'file:created', payload: { file } });
  };

  const onLocalRename = (file: WorkspaceFile) => {
    store.upsertFile(file);
    send({ type: 'file:renamed', payload: { file } });
  };

  const onLocalDelete = (fileId: string) => {
    store.removeFile(fileId);
    send({ type: 'file:deleted', payload: { fileId } });
  };

  if (loading) {
    return <div className='flex h-screen items-center justify-center bg-gray-950 text-white'>Loading workspace...</div>;
  }

  if (error) {
    return (
      <div className='flex h-screen flex-col items-center justify-center bg-gray-950 text-white gap-3'>
        <div className='text-red-400'>{error}</div>
        <button className='p-2 bg-gray-800 rounded' onClick={() => navigate('/')}>Back to dashboard</button>
      </div>
    );
  }

  return (
    <div className='h-screen flex flex-col bg-gray-950 text-white'>
      <header className='flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800'>
        <div className='flex items-center gap-3'>
          <button className='text-sm text-gray-400 hover:text-white' onClick={() => navigate('/')}>←</button>
          <span className='font-semibold'>{store.workspace?.name}</span>
          <span className='text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400'>{store.myRole}</span>
          {store.myRole === 'owner' && (
            <button className='text-gray-400 hover:text-white text-sm' onClick={() => setShowSettings(true)} title='Settings'>
              Settings
            </button>
          )}
        </div>
        <div className='flex items-center gap-2 text-xs text-gray-400'>
          <span className='text-green-400'>●</span> {store.online.length} online
        </div>
      </header>

      <div className='flex flex-1 min-h-0'>
        <FileExplorer readOnly={!!readOnly} onLocalCreate={onLocalCreate} onLocalRename={onLocalRename} onLocalDelete={onLocalDelete} />

        <div className='flex-1 flex flex-col min-w-0'>
          <EditorTabs />
          <div className='flex-1 min-h-0'>
            {activeFile ? (
              <Editor
                height='100%'
                language={activeFile.language || 'plaintext'}
                value={activeFile.content}
                theme='vs-dark'
                options={{ readOnly: !!readOnly, minimap: { enabled: true } }}
                onChange={onEditorChange}
                onMount={(editor) => {
                  editor.onDidChangeCursorPosition((e) => onCursorChange(e.position));
                }}
              />
            ) : (
              <div className='flex h-full items-center justify-center text-gray-500 text-sm'>Open a file to start editing</div>
            )}
          </div>
        </div>

        <MembersPanel meId={user!.id} />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
