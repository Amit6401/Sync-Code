import { useState } from 'react';
import api from '../lib/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex h-screen items-center justify-center bg-gray-950 text-white'>
      <form onSubmit={handleSubmit} className='space-y-4 w-80'>
        <h1 className='text-2xl font-bold'>Register</h1>
        {error && <div className='text-sm text-red-400'>{error}</div>}
        <input className='w-full p-2 rounded bg-gray-800 border border-gray-700' placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} />
        <input className='w-full p-2 rounded bg-gray-800 border border-gray-700' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className='w-full p-2 rounded bg-gray-800 border border-gray-700' type='password' placeholder='Password (min 6)' value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className='w-full p-2 bg-blue-600 rounded disabled:opacity-50' disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
        <div className='text-sm text-gray-400'>
          Have an account? <Link className='text-blue-400' to='/login'>Login</Link>
        </div>
      </form>
    </div>
  );
}
