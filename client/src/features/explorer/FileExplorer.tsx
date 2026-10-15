import { useState } from 'react';
import api from '../../lib/axios';
import { useWorkspaceStore } from '../../store/workspace';
import type { WorkspaceFile } from '../../types';

interface Props {
  readOnly: boolean;
  onLocalCreate: (file: WorkspaceFile) => void;
  onLocalRename: (file: WorkspaceFile) => void;
  onLocalDelete: (fileId: string) => void;
}

export default function FileExplorer({ readOnly, onLocalCreate, onLocalRename, onLocalDelete }: Props) {
  const { files, openFile, activeFileId } = useWorkspaceStore();
  const [newFileName, setNewFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState('');

  const topLevel = files.filter((f) => !f.parentId);

  const createFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    setError('');
    try {
      const res = await api.post('/workspaces/' + useWorkspaceStore.getState().workspace?._id + '/files', {
        name: newFileName.trim(),
      });
      onLocalCreate(res.data.file);
      setNewFileName('');
      setCreating(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Create failed');
    }
  };

  const startRename = (file: WorkspaceFile) => {
    setRenamingId(file._id);
    setRenameValue(file.name);
  };

  const commitRename = async (file: WorkspaceFile) => {
    if (!renameValue.trim() || renameValue === file.name) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await api.patch('/workspaces/' + file.workspaceId + '/files/' + file._id, { name: renameValue.trim() });
      onLocalRename(res.data.file);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Rename failed');
    }
    setRenamingId(null);
  };

  const removeFile = async (file: WorkspaceFile) => {
    if (!window.confirm('Delete ' + file.path + '?')) return;
    try {
      await api.delete('/workspaces/' + file.workspaceId + '/files/' + file._id);
      onLocalDelete(file._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className='w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full'>
      <div className='flex items-center justify-between p-2 border-b border-gray-800'>
        <span className='text-xs font-semibold text-gray-400 uppercase'>Explorer</span>
        {!readOnly && (
          <button className='text-gray-400 hover:text-white text-lg leading-none' title='New file' onClick={() => setCreating((v) => !v)}>
            +
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={createFile} className='p-2 flex gap-1 border-b border-gray-800'>
          <input
            autoFocus
            className='bg-gray-800 text-white text-sm p-1 rounded flex-1 min-w-0'
            placeholder='file.js'
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button className='text-xs bg-blue-600 px-2 rounded'>Add</button>
        </form>
      )}

      {error && <div className='text-red-400 text-xs p-2'>{error}</div>}

      <div className='flex-1 overflow-auto py-1'>
        {topLevel.map((file) => (
          <div key={file._id} className='group flex items-center justify-between px-2 py-1 text-sm hover:bg-gray-800'>
            {renamingId === file._id ? (
              <input
                autoFocus
                className='bg-gray-800 text-white p-0.5 rounded flex-1 min-w-0'
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(file)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(file);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
              />
            ) : (
              <button
                className={'truncate text-left flex-1 min-w-0 ' + (activeFileId === file._id ? 'text-blue-400' : file.isDirectory ? 'text-gray-300' : 'text-gray-400')}
                onClick={() => !file.isDirectory && openFile(file)}
              >
                {(file.isDirectory ? '[dir] ' : '') + file.name}
              </button>
            )}
            {!readOnly && renamingId !== file._id && (
              <span className='hidden group-hover:flex gap-1 text-xs'>
                <button className='text-gray-500 hover:text-white' onClick={() => startRename(file)} title='Rename'>
                  R
                </button>
                <button className='text-gray-500 hover:text-red-400' onClick={() => removeFile(file)} title='Delete'>
                  X
                </button>
              </span>
            )}
          </div>
        ))}
        {topLevel.length === 0 && <div className='text-xs text-gray-600 p-2'>No files</div>}
      </div>
    </div>
  );
}
