import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both fields');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      // Redirect to correct dashboard based on role
      const role = result.user.role;
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'COMMITTEE') {
        navigate('/committee/dashboard');
      } else {
        navigate('/resident/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200 p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-xl font-medium tracking-tight">Society Management System</h1>
          <p className="text-sm text-slate-500">Sign in to your account to manage society operations</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@society.com"
              disabled={submitting}
              className="w-full px-3 py-2 border border-slate-200 text-sm bg-white focus:outline-none focus:border-indigo-600 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={submitting}
              className="w-full px-3 py-2 border border-slate-200 text-sm bg-white focus:outline-none focus:border-indigo-600 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <LogIn size={16} />
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer info */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <span className="text-xs text-slate-400">
            Secure Role-Based Access Credentials Required
          </span>
        </div>
      </div>
    </div>
  );
}
