import React, { useState } from 'react';
import { Shield, Key, Mail, User, Lock, Activity, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

export default function Auth({ onLoginSuccess, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('login'); // login | register
  const [role, setRole] = useState('patient'); // patient | doctor | admin
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const user = await api.login(email, password, role);
        onLoginSuccess(user);
      } else {
        const user = await api.register(name, email, password, role);
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (selectedRole) => {
    setRole(selectedRole);
    setPassword('password');
    if (selectedRole === 'patient') {
      setEmail('patient@demo.com');
    } else if (selectedRole === 'doctor') {
      setEmail('doctor@demo.com');
    } else if (selectedRole === 'admin') {
      setEmail('admin@demo.com');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.05),transparent_40%)] pointer-events-none" />

      {/* Back button */}
      <button 
        onClick={onBackToHome}
        className="absolute top-6 left-6 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </button>

      {/* Main card */}
      <div className="max-w-md w-full space-y-8 glass-card bg-white p-8 rounded-2xl shadow-xl border border-slate-200 relative z-10">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-teal-600 rounded-xl text-white">
              <Activity className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {activeTab === 'login' ? 'Sign in to access your dashboard' : 'Join our AI-powered clinical portal'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
          {['patient', 'doctor', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                role === r
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md text-sm text-red-700 flex items-start space-x-2">
            <Shield className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  placeholder="Rahul Sharma"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-md shadow-teal-700/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </span>
            ) : (
              <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Tab Toggle */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setActiveTab(activeTab === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline"
          >
            {activeTab === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>

        {/* Auto Fill Quick-Demo Helper Panel */}
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            🚀 Quick Demo Auto-Fill
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fillCredentials('patient')}
              className="flex-1 py-1 px-2 border border-slate-200 hover:border-teal-500 rounded text-[10px] font-semibold text-slate-600 hover:text-teal-700 bg-slate-50 transition-all text-center"
            >
              Fill Patient
            </button>
            <button
              onClick={() => fillCredentials('doctor')}
              className="flex-1 py-1 px-2 border border-slate-200 hover:border-teal-500 rounded text-[10px] font-semibold text-slate-600 hover:text-teal-700 bg-slate-50 transition-all text-center"
            >
              Fill Doctor
            </button>
            <button
              onClick={() => fillCredentials('admin')}
              className="flex-1 py-1 px-2 border border-slate-200 hover:border-teal-500 rounded text-[10px] font-semibold text-slate-600 hover:text-teal-700 bg-slate-50 transition-all text-center"
            >
              Fill Admin
            </button>
          </div>
          <span className="block text-[9px] text-center text-slate-400 font-mono">
            Default password for all roles: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-bold">password</code>
          </span>
        </div>

      </div>
    </div>
  );
}
