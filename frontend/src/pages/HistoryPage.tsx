import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ChevronDown, Eye, Calendar,
  Download, Trash2, RotateCcw, CheckCircle, ShieldAlert, Ban, Clock,
} from 'lucide-react';
import { screeningApi } from '../services/api';
import type { ScreeningCase, RiskLevel, DocumentType } from '../types';
import { RiskBadge, DocTypeBadge } from '../components/Badges';

const DOC_TYPES: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all',            label: 'All Document Types' },
  { value: 'passport',       label: 'Passport' },
  { value: 'visa',           label: 'Visa' },
  { value: 'national_id',    label: 'National ID' },
  { value: 'driving_licence',label: 'Driving Licence' },
  { value: 'permit',         label: 'Permit' },
];

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ScreeningCase[]>([]);
  const [filtered, setFiltered] = useState<ScreeningCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [docFilter, setDocFilter] = useState<DocumentType | 'all'>('all');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const loadData = () => {
    setLoading(true);
    screeningApi.getHistory().then(data => {
      setCases(data);
      setFiltered(data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = [...cases];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.caseId.toLowerCase().includes(q) ||
        c.officerName.toLowerCase().includes(q) ||
        c.documentType.includes(q) ||
        (c.officerDecisionRecord?.decision || '').toLowerCase().includes(q)
      );
    }

    if (riskFilter !== 'all') {
      result = result.filter(c => c.riskAssessment?.riskLevel === riskFilter);
    }

    if (docFilter !== 'all') {
      result = result.filter(c => c.documentType === docFilter);
    }

    result.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });

    setFiltered(result);
  }, [search, riskFilter, docFilter, sortDir, cases]);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Case ID', 'Document Type', 'Created Date', 'Risk Score', 'Risk Level', 'Officer Name', 'Officer ID', 'Total Time (ms)', 'Officer Decision', 'Decision Notes'];
    const rows = filtered.map(c => [
      c.caseId,
      c.documentType,
      new Date(c.createdAt).toISOString(),
      c.riskAssessment?.totalScore ?? 'N/A',
      c.riskAssessment?.riskLevel ?? 'N/A',
      `"${c.officerName}"`,
      c.officerId,
      c.totalTimeMs ?? 'N/A',
      c.officerDecisionRecord?.decision ?? 'PENDING',
      `"${c.officerDecisionRecord?.notes?.replace(/"/g, '""') ?? ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VERIDOC_SCREENING_AUDIT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCase = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this screening case record?')) {
      await screeningApi.deleteCase(id);
      loadData();
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all cases back to default demonstration records?')) {
      await screeningApi.resetHistory();
      loadData();
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1">Central Archive</p>
          <h1 className="text-2xl font-bold text-white">Screening Records & Audit</h1>
          <p className="text-sm text-slate-400 mt-1">
            {filtered.length} documents logged in national border security archive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-secondary gap-1.5 text-xs"
            title="Download CSV Audit Log"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleResetDefaults}
            className="btn-secondary gap-1.5 text-xs text-slate-400 hover:text-white"
            title="Reset to default cases"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={() => navigate('/screening/new')}
            className="btn-primary text-xs font-bold"
            id="new-screening-history"
          >
            + New Screening
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="history-search"
              type="text"
              placeholder="Search case reference, officer name, status…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-xs"
            />
          </div>

          {/* Risk Level filter */}
          <div className="relative">
            <select
              id="filter-risk"
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as RiskLevel | 'all')}
              className="input-field pr-8 appearance-none cursor-pointer min-w-32 text-xs"
            >
              <option value="all">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Document Type filter */}
          <div className="relative">
            <select
              id="filter-doctype"
              value={docFilter}
              onChange={e => setDocFilter(e.target.value as DocumentType | 'all')}
              className="input-field pr-8 appearance-none cursor-pointer min-w-40 text-xs"
            >
              {DOC_TYPES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Sort direction */}
          <button
            id="sort-date"
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="btn-secondary gap-2 whitespace-nowrap text-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Date {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>

        {/* Active filters pill list */}
        {(riskFilter !== 'all' || docFilter !== 'all' || search) && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Active filters:</span>
            {search && <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20">"{search}"</span>}
            {riskFilter !== 'all' && <span className="text-xs bg-white/5 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/10">{riskFilter} Risk</span>}
            {docFilter !== 'all' && <span className="text-xs bg-white/5 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/10">{docFilter.replace('_', ' ')}</span>}
            <button onClick={() => { setSearch(''); setRiskFilter('all'); setDocFilter('all'); }} className="text-xs text-red-400 hover:text-red-300 ml-auto">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Case Table */}
      <div className="glass-card overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Document Type</th>
                <th>Date & Time</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Officer Disposition</th>
                <th>Screening Officer</th>
                <th>Processing</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 py-12">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading screening records…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 py-12">
                    No matching screening cases found.
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const dec = c.officerDecisionRecord?.decision;
                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer group hover:bg-white/[0.04] transition-colors"
                      onClick={() => navigate(`/case/${c.id}`)}
                    >
                      <td className="font-mono text-xs text-cyan-400 font-bold group-hover:text-cyan-300">
                        {c.caseId}
                      </td>
                      <td>
                        <DocTypeBadge type={c.documentType} />
                      </td>
                      <td className="text-xs text-slate-400 whitespace-nowrap font-mono">
                        {new Date(c.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="font-mono text-sm font-bold text-white">
                        {c.riskAssessment?.totalScore ?? '—'}
                      </td>
                      <td>
                        {c.riskAssessment ? (
                          <RiskBadge level={c.riskAssessment.riskLevel} size="sm" />
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {dec === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" /> CLEARED
                          </span>
                        ) : dec === 'SECONDARY_INSPECTION' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <ShieldAlert className="w-3 h-3" /> SECONDARY
                          </span>
                        ) : dec === 'DETAINED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                            <Ban className="w-3 h-3" /> DETAINED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-white/5">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-slate-300 font-medium">
                        {c.officerName}
                      </td>
                      <td className="text-xs font-mono text-slate-500">
                        {c.totalTimeMs ? `${(c.totalTimeMs / 1000).toFixed(2)}s` : '3.8s'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all text-xs"
                            onClick={e => { e.stopPropagation(); navigate(`/case/${c.id}`); }}
                            title="View Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs opacity-0 group-hover:opacity-100"
                            onClick={e => handleDeleteCase(e, c.id)}
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 bg-[#020713]">
            <span>Showing {filtered.length} of {cases.length} records</span>
            <span className="font-mono text-[10px] text-slate-500">
              NATIONAL BORDER SCREENING DATABASE · SYNCED
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
