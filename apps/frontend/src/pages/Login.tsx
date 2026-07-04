import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="w-full max-w-md p-8 space-y-8 bg-[var(--color-bg-surface)] rounded-2xl shadow-xl border border-[var(--color-bg-elevated)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[var(--color-brand-600)] rounded-xl flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Sign in to Codity</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Manage your distributed jobs with ease</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 rounded-xl bg-[var(--color-bg-elevated)] border-transparent focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-opacity-50 text-white transition duration-200"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 rounded-xl bg-[var(--color-bg-elevated)] border-transparent focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-opacity-50 text-white transition duration-200"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-[var(--color-bg-surface)] transition duration-200"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-[var(--color-brand-500)] hover:text-white transition"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
