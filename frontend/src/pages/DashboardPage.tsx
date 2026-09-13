import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, AlertTriangle, ShieldAlert, CheckCircle, Clock,
  PlusCircle, RefreshCw, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { RiskBadge, DocTypeBadge } from '../components/Badges';
import { dashboardApi } from '../services/api';
import type { DashboardStats, ScreeningCase } from '../types';
import { activityData, documentTypeData, riskDistributionData } from '../utils/demoData';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<ScreeningCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveTime, setLiveTime] = useState(new Date());
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([dashboardApi.getStats(), dashboardApi.getRecentCases()]);
      setStats(s);
      // Deduplicate by id to prevent React key warnings
      const seen = new Set<string>();
      const deduped = r.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      setRecent(deduped.slice(0, 7));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1">Operations Center</p>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <span className="text-slate-700">·</span>
            <span className="text-sm font-mono text-cyan-400/80">
              {liveTime.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-secondary gap-2" id="refresh-dashboard">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => navigate('/screening/new')} className="btn-primary" id="new-screening-btn">
            <PlusCircle className="w-4 h-4" />
            New Screening
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Screened"
          value={loading ? '—' : stats?.totalScreened.toLocaleString() ?? '—'}
          sub="All time"
          icon={FileText}
          accentColor="cyan"
        />
        <MetricCard
          label="Suspicious"
          value={loading ? '—' : stats?.suspicious.toLocaleString() ?? '—'}
          sub="Flagged for review"
          icon={AlertTriangle}
          accentColor="amber"
        />
        <MetricCard
          label="High Risk"
          value={loading ? '—' : stats?.highRisk.toLocaleString() ?? '—'}
          sub="Secondary inspection"
          icon={ShieldAlert}
          accentColor="red"
        />
        <MetricCard
          label="Verified"
          value={loading ? '—' : stats?.verified.toLocaleString() ?? '—'}
          sub="Cleared documents"
          icon={CheckCircle}
          accentColor="emerald"
        />
        <MetricCard
          label="Avg. Screen Time"
          value={loading ? '—' : formatMs(stats?.avgScreeningTimeMs ?? 0)}
          sub="Per document"
          icon={Clock}
          accentColor="blue"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-label mb-0.5">Screening Activity</p>
              <p className="text-sm text-slate-400">7-day risk distribution</p>
            </div>
            <Activity className="w-4 h-4 text-slate-600" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Area type="monotone" dataKey="low" name="Low Risk" stroke="#10b981" fill="url(#colorLow)" strokeWidth={2} />
              <Area type="monotone" dataKey="medium" name="Medium Risk" stroke="#f59e0b" fill="url(#colorMed)" strokeWidth={2} />
              <Area type="monotone" dataKey="high" name="High Risk" stroke="#ef4444" fill="url(#colorHigh)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk distribution pie */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <p className="section-label mb-0.5">Risk Distribution</p>
            <p className="text-sm text-slate-400">Overall breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {riskDistributionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {riskDistributionData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="font-mono font-medium text-white">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document type bar + recent cases */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Document types */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <p className="section-label mb-0.5">Document Types</p>
            <p className="text-sm text-slate-400">Screened by category</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={documentTypeData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent screenings */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div>
              <p className="section-label mb-0.5">Recent Screenings</p>
              <p className="text-sm text-slate-400">Latest cases processed</p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              id="view-all-history"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Document</th>
                  <th>Date / Time</th>
                  <th>Risk</th>
                  <th>Officer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-slate-500 py-8">Loading…</td></tr>
                ) : recent.map((c) => (
                  <tr key={`${c.id}-${c.caseId}`} className="cursor-pointer" onClick={() => navigate(`/case/${c.id}`)}>
                    <td className="font-mono text-xs text-cyan-400">{c.caseId}</td>
                    <td><DocTypeBadge type={c.documentType} /></td>
                    <td className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      {c.riskAssessment ? (
                        <RiskBadge level={c.riskAssessment.riskLevel} score={c.riskAssessment.totalScore} size="sm" />
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="text-xs text-slate-400">{c.officerName}</td>
                    <td>
                      <button
                        className="text-xs text-cyan-500 hover:text-cyan-300 font-medium transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/case/${c.id}`); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
