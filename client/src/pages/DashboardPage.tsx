import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import type { Workspace } from '../types';

interface TemplateOption {
  id: string;
  label: string;
}

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('blank');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data.workspaces);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load');
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/workspaces/templates');
      setTemplates(res.data.templates);
    } catch {
      setTemplates([{ id: 'blank', label: 'Blank' }]);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchTemplates();
  }, []);

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setError('');
    setCreating(true);
    try {
      const res = await api.post('/workspaces', { name: name.trim(), template });
      setName('');
      setWorkspaces((prev) => [res.data.workspace, ...prev]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const deleteWorkspace = async (e: React.MouseEvent, w: Workspace) => {
    e.stopPropagation();
    if (!window.confirm('Delete workspace "' + w.name + '" and all its files?')) return;
    try {
      await api.delete('/workspaces/' + w._id);
      setWorkspaces((prev) => prev.filter((x) => x._id !== w._id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className='h-screen bg-gray-950 text-white p-6 overflow-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Workspaces</h1>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-gray-400'>{user?.name}</span>
          <button className='p-2 bg-gray-800 rounded text-sm' onClick={async () => { await logout(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={createWorkspace} className='mb-4 flex gap-2 flex-wrap'>
        <input className='p-2 rounded bg-gray-800 border border-gray-700 flex-1 max-w-md' placeholder='New workspace name' value={name} onChange={(e) => setName(e.target.value)} />
        <select className='p-2 rounded bg-gray-800 border border-gray-700' value={template} onChange={(e) => setTemplate(e.target.value)}>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button className='p-2 px-4 bg-blue-600 rounded disabled:opacity-50' disabled={creating}>
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      {error && <div className='text-red-400 text-sm mb-3'>{error}</div>}

      <div className='flex flex-col gap-2'>
        {workspaces.length === 0 && <div className='text-gray-500 text-sm'>No workspaces yet. Create one above.</div>}
        {workspaces.map((w) => {
          const ownerId = typeof w.owner === 'string' ? w.owner : w.owner._id || w.owner.id;
          const isOwner = ownerId === user?.id;
          return (
            <div key={w._id} className='group p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 flex items-start justify-between' onClick={() => navigate('/workspace/' + w._id)}>
              <div>
                <div className='font-medium'>{w.name}</div>
                {w.description && <div className='text-sm text-gray-400'>{w.description}</div>}
                <div className='text-xs text-gray-500 mt-1'>{w.members.length} member(s)</div>
              </div>
              {isOwner && (
                <button
                  className='opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-sm px-2'
                  onClick={(e) => deleteWorkspace(e, w)}
                  title='Delete workspace'
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
