import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSearch, Eye, EyeOff, Shield, AlertTriangle, Loader2, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(officerId, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setOfficerId('DEMO001');
    setPassword('demo123');
    setError('');
    setLoading(true);
    try {
      await login('DEMO001', 'demo123');
      navigate('/');
    } catch {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] bg-grid flex items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      {/* Radial top glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-medium">SYSTEM ONLINE</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className="text-slate-500">VERIDOC AI v2.4.1</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>🔒 TLS 1.3 ENCRYPTED</span>
          <span>CISF BORDER SECURITY</span>
        </div>
      </div>

      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/35 mb-5 relative shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <FileSearch className="w-10 h-10 text-cyan-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#020817] flex items-center justify-center animate-pulse">
              <Shield className="w-2 h-2 text-[#020817]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-mono">VERIDOC AI</h1>
          <p className="text-sm text-cyan-400/80 mt-1.5 tracking-widest uppercase font-medium">
            AI-Powered Identity &amp; Document Screening
          </p>
          <p className="text-xs text-slate-600 mt-2">Authorized Personnel Only · Government Classified System</p>
        </div>

        {/* Login card */}
        <div className="glass-card glow-border p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="section-label">Officer Authentication</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Officer ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="officer-id"
                  type="text"
                  value={officerId}
                  onChange={e => setOfficerId(e.target.value)}
                  placeholder="e.g. OFF-001"
                  className="input-field pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-field pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Secure Login
                </>
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a1628] px-3 text-xs text-slate-600 uppercase tracking-wider">Demo Access</span>
            </div>
          </div>

          <button
            id="demo-login"
            onClick={handleDemo}
            disabled={loading}
            className="w-full btn-secondary justify-center py-3 text-xs disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-semibold">Load Demo Mode</span>
            <span className="text-slate-500 ml-1">· ID: DEMO001 / demo123</span>
          </button>

          <p className="text-center text-[10px] text-slate-600 mt-4">
            This system is for authorized border security personnel only.
            Unauthorized access is a criminal offence.
          </p>
        </div>

        {/* Security indicators */}
        <div className="flex justify-center gap-6 mt-6">
          {[
            { dot: 'bg-emerald-400', label: 'AUTH SERVICE ONLINE' },
            { dot: 'bg-emerald-400', label: 'DB CONNECTION ACTIVE' },
            { dot: 'bg-emerald-400', label: 'AI ENGINE READY' },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              <span className="text-[9px] text-slate-600 font-medium tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
