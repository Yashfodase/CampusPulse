import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/common/Alert';
import { Lock, Mail, Calendar } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = (location.state as any)?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await login(email, password);
      if (res.success && res.user) {
        if (from) {
          navigate(from, { replace: true });
        } else {
          if (res.user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else if (res.user.role === 'organizer') {
            navigate('/organizer', { replace: true });
          } else {
            navigate('/student/dashboard', { replace: true });
          }
        }
      } else {
        setErrorMessage(res.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-page-enter">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-[12px] bg-indigo-600 text-white shadow-sm mb-1">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Sign In to CampusPulse
          </h1>
          <p className="text-sm text-slate-600">
            Access your event passes, organizer console, or administrative portal
          </p>
        </div>

        {/* Form Card */}
        <div className="academic-card p-6 sm:p-8 space-y-5">
          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base w-full pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-800 underline">
            Register as a student
          </Link>
        </div>

      </div>
    </div>
  );
};
