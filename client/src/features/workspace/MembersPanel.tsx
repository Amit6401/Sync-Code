import { useState } from 'react';
import api from '../../lib/axios';
import { useWorkspaceStore } from '../../store/workspace';
import { refId, refName, type Role } from '../../types';

interface Props {
  meId: string;
}

export default function MembersPanel({ meId }: Props) {
  const { workspace, online, myRole, setWorkspace } = useWorkspaceStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!workspace) return null;

  const ownerId = refId(workspace.owner);
  const isOwner = ownerId === meId;

  const applyWorkspace = (updated: any) => {
    if (updated) setWorkspace(updated, meId);
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const res = await api.post('/workspaces/' + workspace._id + '/members', { email: email.trim(), role });
      applyWorkspace(res.data.workspace);
      setMsg('Member added');
      setEmail('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invite failed');
    }
  };

  const changeRole = async (userId: string, newRole: Role) => {
    setError('');
    setMsg('');
    setBusyId(userId);
    try {
      const res = await api.patch('/workspaces/' + workspace._id + '/members/' + userId, { role: newRole });
      applyWorkspace(res.data.workspace);
      setMsg('Role updated');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (userId: string, name: string) => {
    if (!window.confirm('Remove ' + name + ' from this workspace?')) return;
    setError('');
    setMsg('');
    setBusyId(userId);
    try {
      const res = await api.delete('/workspaces/' + workspace._id + '/members/' + userId);
      applyWorkspace(res.data.workspace);
      setMsg('Member removed');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Remove failed');
    } finally {
      setBusyId(null);
    }
  };

  const others = workspace.members.filter((m) => refId(m.user) !== ownerId);

  return (
    <div className='w-64 bg-gray-900 border-l border-gray-800 p-3 text-sm h-full overflow-auto'>
      <div className='text-xs font-semibold text-gray-400 uppercase mb-2'>Members</div>

      <div className='flex flex-col gap-2 mb-4'>
        <div className='flex items-center justify-between'>
          <span className='truncate'>
            {online.includes(ownerId) && <span className='text-green-400 mr-1'>●</span>}
            {refName(workspace.owner)}
          </span>
          <span className='text-xs text-blue-400'>owner</span>
        </div>

        {others.map((m) => {
          const id = refId(m.user);
          const name = refName(m.user);
          const isMe = id === meId;
          return (
            <div key={id} className='flex items-center justify-between gap-1'>
              <span className='truncate flex-1 min-w-0'>
                {online.includes(id) && <span className='text-green-400 mr-1'>●</span>}
                {name}
                {isMe && <span className='text-gray-500'> (you)</span>}
              </span>
              {isOwner ? (
                <span className='flex items-center gap-1'>
                  <select
                    className='bg-gray-800 border border-gray-700 rounded text-xs py-0.5'
                    value={m.role}
                    disabled={busyId === id}
                    onChange={(e) => changeRole(id, e.target.value as Role)}
                  >
                    <option value='editor'>editor</option>
                    <option value='viewer'>viewer</option>
                  </select>
                  <button
                    className='text-gray-500 hover:text-red-400 text-xs disabled:opacity-40'
                    disabled={busyId === id}
                    onClick={() => removeMember(id, name)}
                    title='Remove member'
                  >
                    x
                  </button>
                </span>
              ) : (
                <span className='text-xs text-gray-500'>{m.role}</span>
              )}
            </div>
          );
        })}
        {others.length === 0 && <div className='text-xs text-gray-600'>No other members</div>}
      </div>

      {isOwner && (
        <form onSubmit={invite} className='flex flex-col gap-2 border-t border-gray-800 pt-3'>
          <div className='text-xs font-semibold text-gray-400 uppercase'>Invite</div>
          <input className='bg-gray-800 p-1.5 rounded border border-gray-700' placeholder='email@x.com' value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className='bg-gray-800 p-1.5 rounded border border-gray-700' value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value='editor'>editor</option>
            <option value='viewer'>viewer</option>
          </select>
          <button className='bg-blue-600 rounded p-1.5'>Add</button>
        </form>
      )}

      {error && <div className='text-red-400 text-xs mt-3'>{error}</div>}
      {msg && <div className='text-green-400 text-xs mt-3'>{msg}</div>}
      {myRole === 'viewer' && <div className='text-xs text-yellow-500 mt-4'>You have read-only access</div>}
    </div>
  );
}
