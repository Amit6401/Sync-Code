import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { useWorkspaceStore } from '../../store/workspace';
import { useAuthStore } from '../../store/auth';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { workspace, setWorkspace } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!workspace) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.patch('/workspaces/' + workspace._id, { name: name.trim(), description });
      setWorkspace(res.data.workspace, user?.id || '');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this workspace and ALL its files? This cannot be undone.')) return;
    setSaving(true);
    try {
      await api.delete('/workspaces/' + workspace._id);
      onClose();
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed');
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50' onClick={onClose}>
      <div className='bg-gray-900 border border-gray-800 rounded-lg p-5 w-96' onClick={(e) => e.stopPropagation()}>
        <h2 className='text-lg font-semibold mb-4'>Workspace settings</h2>
        <form onSubmit={save} className='flex flex-col gap-3'>
          <label className='text-xs text-gray-400'>Name</label>
          <input className='bg-gray-800 p-2 rounded border border-gray-700' value={name} onChange={(e) => setName(e.target.value)} />
          <label className='text-xs text-gray-400'>Description</label>
          <input className='bg-gray-800 p-2 rounded border border-gray-700' value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <div className='text-red-400 text-xs'>{error}</div>}
          <div className='flex justify-between mt-2'>
            <button type='button' className='text-red-400 text-sm px-2 py-1 hover:bg-red-500/10 rounded disabled:opacity-50' disabled={saving} onClick={remove}>
              Delete workspace
            </button>
            <div className='flex gap-2'>
              <button type='button' className='px-3 py-1 rounded bg-gray-800 text-sm' onClick={onClose}>Cancel</button>
              <button className='px-3 py-1 rounded bg-blue-600 text-sm disabled:opacity-50' disabled={saving}>Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
