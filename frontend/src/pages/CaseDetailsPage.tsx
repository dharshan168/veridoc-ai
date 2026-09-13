import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Eye, AlertTriangle, CheckCircle,
  XCircle, User, Shield, Download, BarChart3, Camera,
  Check, ShieldAlert, Ban, Save, Clock,
} from 'lucide-react';
import { screeningApi } from '../services/api';
import type { ScreeningCase, OfficerDecision } from '../types';
import { RiskBadge, DocTypeBadge, ValidationBadge, TamperingBadge } from '../components/Badges';
import ConfidenceBar from '../components/ConfidenceBar';
import { PipelineView } from '../components/PipelineView';
import { DocumentVisualizer } from '../components/DocumentVisualizer';

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({
  title, icon: Icon, children, className = '',
}) => (
  <div className={`glass-card overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
      <Icon className="w-4 h-4 text-cyan-400" />
      <span className="section-label">{title}</span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const CaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cs, setCs] = useState<ScreeningCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'document' | 'ocr' | 'validation' | 'tampering' | 'face' | 'risk'>('overview');

  // Officer Decision State
  const [decision, setDecision] = useState<OfficerDecision | null>(null);
  const [notes, setNotes] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionSaved, setDecisionSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    screeningApi.getCase(id).then(data => {
      setCs(data);
      if (data.officerDecisionRecord) {
        setDecision(data.officerDecisionRecord.decision);
        setNotes(data.officerDecisionRecord.notes);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSaveDecision = async (dec: OfficerDecision) => {
    if (!cs) return;
    setSavingDecision(true);
    setDecision(dec);
    try {
      const updated = await screeningApi.updateCaseDecision(cs.id, dec, notes);
      setCs(updated);
      setDecisionSaved(true);
      setTimeout(() => setDecisionSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading case records…</span>
      </div>
    );
  }

  if (!cs) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Case Not Found</h2>
        <p className="text-xs text-slate-400">The requested screening record could not be located in active storage.</p>
        <button onClick={() => navigate('/history')} className="btn-secondary mx-auto">
          Return to History
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: Eye },
    { id: 'document',   label: 'Document Scan', icon: Shield },
    { id: 'ocr',        label: 'OCR Results', icon: FileText },
    { id: 'validation', label: 'Validation',  icon: CheckCircle },
    { id: 'tampering',  label: 'Tampering',   icon: AlertTriangle },
    { id: 'face',       label: 'Face Match',  icon: User },
    { id: 'risk',       label: 'Risk Score',  icon: BarChart3 },
  ] as const;

  const risk = cs.riskAssessment;
  const riskColor = risk?.riskLevel === 'HIGH' ? 'text-red-400' : risk?.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400';
  const riskBg   = risk?.riskLevel === 'HIGH' ? 'from-red-500/10'   : risk?.riskLevel === 'MEDIUM' ? 'from-amber-500/10'   : 'from-emerald-500/10';

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all mt-0.5"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-white font-mono">{cs.caseId}</h1>
              <DocTypeBadge type={cs.documentType} />
              {risk && <RiskBadge level={risk.riskLevel} score={risk.totalScore} />}
              {cs.officerDecisionRecord && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-1 ${
                  cs.officerDecisionRecord.decision === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : cs.officerDecisionRecord.decision === 'SECONDARY_INSPECTION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  <Check className="w-3 h-3" />
                  {cs.officerDecisionRecord.decision.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Screening Officer: <span className="text-slate-200 font-medium">{cs.officerName}</span> ({cs.officerId}) ·{' '}
              {new Date(cs.createdAt).toLocaleString('en-IN')}
              {cs.totalTimeMs && ` · Pipeline Duration: ${(cs.totalTimeMs / 1000).toFixed(2)}s`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="view-report"
            onClick={() => navigate(`/screening/${cs.id}/report`)}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            Official Report
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl overflow-x-auto border border-white/5">
        {tabs.map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            id={`tab-${tid}`}
            onClick={() => setActiveTab(tid)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tid
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Document Scan Tab or Quick Visualizer */}
      {activeTab === 'document' && (
        <DocumentVisualizer screeningCase={cs} />
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Document Visualizer Banner */}
          <DocumentVisualizer screeningCase={cs} />

          {/* Decision & Action Bar */}
          <div className="glass-card p-5 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-black/40 to-cyan-950/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="section-label">Official Officer Disposition</span>
                <h3 className="text-base font-bold text-white mt-0.5">Border Control Decision & Action</h3>
                <p className="text-xs text-slate-400">Record final clearance or inspection protocol for passenger records.</p>
              </div>
              {decisionSaved && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5" /> Disposition Saved to Secure Audit Log
                </div>
              )}
            </div>

            {/* Decision Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => handleSaveDecision('APPROVED')}
                disabled={savingDecision}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                GRANT CLEARANCE / PASS
              </button>

              <button
                onClick={() => handleSaveDecision('SECONDARY_INSPECTION')}
                disabled={savingDecision}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  decision === 'SECONDARY_INSPECTION'
                    ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                SECONDARY INSPECTION
              </button>

              <button
                onClick={() => handleSaveDecision('DETAINED')}
                disabled={savingDecision}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  decision === 'DETAINED'
                    ? 'bg-red-500/25 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-red-500/40 text-slate-300 hover:text-red-300'
                }`}
              >
                <Ban className="w-4 h-4 text-red-400" />
                REFUSE ENTRY / DETAIN
              </button>
            </div>

            {/* Officer Notes & Remarks */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Officer Field Notes & Inspection Log
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter observation notes (e.g., 'Passenger interview cleared', 'Additional ID requested'…)"
                  className="input-field text-xs flex-1"
                />
                <button
                  onClick={() => decision && handleSaveDecision(decision)}
                  disabled={savingDecision || !decision}
                  className="btn-secondary gap-1.5 text-xs whitespace-nowrap disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Notes
                </button>
              </div>
              {cs.officerDecisionRecord && (
                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Last recorded by {cs.officerDecisionRecord.officerName} on{' '}
                    {new Date(cs.officerDecisionRecord.timestamp).toLocaleTimeString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="AI Pipeline Stages" icon={Shield}>
              <PipelineView stages={cs.pipeline} />
            </Section>
            <div className="space-y-4">
              {risk && (
                <div className={`glass-card p-5 bg-gradient-to-br ${riskBg} to-transparent border border-white/10`}>
                  <p className="section-label mb-2">Automated Risk Assessment</p>
                  <div className={`text-5xl font-bold font-mono ${riskColor} mb-2`}>
                    {risk.totalScore}<span className="text-2xl text-slate-500">/100</span>
                  </div>
                  <RiskBadge level={risk.riskLevel} size="lg" />
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">{risk.recommendation}</p>
                </div>
              )}
              <Section title="Case Metadata" icon={FileText}>
                <div className="space-y-2 text-xs">
                  {[
                    ['Case Reference', cs.caseId],
                    ['Document Classification', cs.documentType.replace('_', ' ')],
                    ['Screening Officer', cs.officerName],
                    ['Unit / Badge ID', cs.officerId],
                    ['Timestamp', new Date(cs.createdAt).toLocaleString('en-IN')],
                    ['Pipeline Runtime', cs.totalTimeMs ? `${(cs.totalTimeMs / 1000).toFixed(2)}s` : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-white font-medium capitalize font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* OCR tab */}
      {activeTab === 'ocr' && cs.ocrResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold font-mono text-cyan-400">{cs.ocrResult.overallConfidence}%</div>
              <div className="text-xs text-slate-400 mt-1">OCR Confidence</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold font-mono text-white">{cs.ocrResult.fields.length}</div>
              <div className="text-xs text-slate-400 mt-1">Fields Extracted</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold font-mono text-amber-400">{cs.ocrResult.fields.filter(f => f.flagged).length}</div>
              <div className="text-xs text-slate-400 mt-1">Flagged Fields</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold font-mono text-white">{(cs.ocrResult.processingTimeMs / 1000).toFixed(2)}s</div>
              <div className="text-xs text-slate-400 mt-1">Processing Time</div>
            </div>
          </div>

          <Section title="Extracted Fields & Confidence Scores" icon={FileText}>
            <div className="space-y-3">
              {cs.ocrResult.fields.map(field => (
                <div key={field.label} className={`p-3 rounded-lg border ${field.flagged ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{field.label}</span>
                    <div className="flex items-center gap-2">
                      {field.flagged && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                      <span className="text-xs font-mono text-slate-500">{field.confidence.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-base font-semibold text-white font-mono">{field.value}</div>
                  <ConfidenceBar value={field.confidence} size="sm" showValue={false} />
                </div>
              ))}
            </div>
          </Section>

          {cs.ocrResult.mrzData && (
            <Section title="MRZ Data (Machine Readable Zone)" icon={FileText}>
              <div className="space-y-2 mb-4">
                <div className="font-mono text-xs bg-black/40 p-3 rounded-lg text-emerald-400 break-all border border-white/5">{cs.ocrResult.mrzData.line1}</div>
                <div className="font-mono text-xs bg-black/40 p-3 rounded-lg text-emerald-400 break-all border border-white/5">{cs.ocrResult.mrzData.line2}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(cs.ocrResult.mrzData.parsed).map(([k, v]) => (
                  <div key={k} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-xs font-mono text-white font-semibold">{v}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Validation tab */}
      {activeTab === 'validation' && cs.validationResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center border-emerald-500/10">
              <div className="text-3xl font-bold font-mono text-emerald-400">{cs.validationResult.passedCount}</div>
              <div className="text-xs text-slate-400 mt-1">Passed Checks</div>
            </div>
            <div className="glass-card p-4 text-center border-amber-500/10">
              <div className="text-3xl font-bold font-mono text-amber-400">{cs.validationResult.warningCount}</div>
              <div className="text-xs text-slate-400 mt-1">Warnings</div>
            </div>
            <div className="glass-card p-4 text-center border-red-500/10">
              <div className="text-3xl font-bold font-mono text-red-400">{cs.validationResult.failedCount}</div>
              <div className="text-xs text-slate-400 mt-1">Failed Checks</div>
            </div>
          </div>

          <Section title="Format & Security Check Validation" icon={CheckCircle}>
            <div className="space-y-2">
              {cs.validationResult.checks.map(check => (
                <div
                  key={check.id}
                  className={`p-4 rounded-lg border transition-all ${
                    check.status === 'failed'  ? 'bg-red-500/5 border-red-500/20' :
                    check.status === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                                                 'bg-emerald-500/5 border-emerald-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ValidationBadge status={check.status} />
                        <span className="text-sm font-medium text-white">{check.name}</span>
                        <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{check.category}</span>
                      </div>
                      <p className="text-xs text-slate-400">{check.message}</p>
                      {check.detail && (
                        <p className="text-xs text-amber-300/80 mt-1.5 font-mono">{check.detail}</p>
                      )}
                    </div>
                  </div>
                  {(check.expectedValue || check.actualValue) && (
                    <div className="flex gap-4 mt-2 pt-2 border-t border-white/5">
                      {check.expectedValue && <div className="text-xs"><span className="text-slate-500">Expected: </span><span className="text-emerald-400 font-mono">{check.expectedValue}</span></div>}
                      {check.actualValue   && <div className="text-xs"><span className="text-slate-500">Found: </span><span className="text-red-400 font-mono">{check.actualValue}</span></div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Tampering tab */}
      {activeTab === 'tampering' && cs.tamperingResult && (
        <div className="space-y-4">
          <DocumentVisualizer screeningCase={cs} />

          <div className="glass-card p-5 border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">AI FORENSIC DISCLAIMER</p>
                <p className="text-xs text-slate-300 leading-relaxed">{cs.tamperingResult.disclaimer}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold font-mono text-white">{cs.tamperingResult.overallProbability}%</div>
              <div className="text-xs text-slate-400 mt-1">Overall Tampering Probability</div>
            </div>
            <div className="glass-card p-4 text-center">
              <RiskBadge level={cs.tamperingResult.overallRisk} size="lg" />
              <div className="text-xs text-slate-400 mt-2">Forensic Tampering Risk</div>
            </div>
          </div>

          <Section title="Digital & Physical Forensic Indicators" icon={AlertTriangle}>
            <div className="space-y-4">
              {cs.tamperingResult.indicators.map(ind => (
                <div key={ind.id} className={`p-4 rounded-lg border ${
                  ind.status === 'HIGH'   ? 'bg-red-500/5 border-red-500/20' :
                  ind.status === 'MEDIUM' ? 'bg-amber-500/5 border-amber-500/20' :
                                            'bg-white/[0.02] border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{ind.name}</span>
                    <div className="flex items-center gap-2">
                      <TamperingBadge status={ind.status} />
                      <span className="text-sm font-bold font-mono text-white">{ind.probability}%</span>
                    </div>
                  </div>
                  <ConfidenceBar value={ind.probability} showValue={false} size="sm" />
                  <p className="text-xs text-slate-400 mt-2">{ind.explanation}</p>
                  {ind.region && (
                    <p className="text-xs text-cyan-400 mt-1 font-mono">
                      Detected Anomaly Zone: ({ind.region.x}, {ind.region.y}) {ind.region.width}×{ind.region.height}px
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Face Match tab with Biometric Landmark Visualizer */}
      {activeTab === 'face' && cs.faceVerificationResult && (
        <div className="space-y-4">
          <div className={`glass-card p-6 border ${cs.faceVerificationResult.isMatch ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* Document face portrait */}
              <div className="text-center flex-1">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/40 relative flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden">
                  <svg className="w-16 h-16 text-cyan-300/80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  {/* Landmark overlay points */}
                  <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-8 left-9 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <div className="absolute top-8 right-9 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full bg-cyan-400" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/60 text-[8px] font-mono text-cyan-400 px-1 rounded">DOC</div>
                </div>
                <div className="text-xs text-white font-semibold uppercase tracking-wider">Document Photo</div>
                <div className="text-[10px] text-slate-500 mt-0.5">ICAO Biometric Format</div>
              </div>

              {/* Similarity Score Dial / Center */}
              <div className="text-center px-6 py-4 rounded-xl bg-black/30 border border-white/5">
                <div className={`text-5xl font-bold font-mono mb-2 ${cs.faceVerificationResult.isMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                  {cs.faceVerificationResult.similarityScore.toFixed(1)}%
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 rounded-full inline-block ${
                  cs.faceVerificationResult.isMatch ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {cs.faceVerificationResult.isMatch ? '✓ BIOMETRIC MATCH' : '✕ IDENTITY MISMATCH'}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Confidence: <span className="text-white font-bold">{cs.faceVerificationResult.confidence.toFixed(1)}%</span>
                </div>
              </div>

              {/* Live camera face portrait */}
              <div className="text-center flex-1">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/40 relative flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden">
                  <Camera className="w-12 h-12 text-slate-500" />
                  {/* Live face mesh simulation */}
                  <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-8 left-9 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="absolute top-8 right-9 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full bg-emerald-400" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/60 text-[8px] font-mono text-emerald-400 px-1 rounded">LIVE</div>
                </div>
                <div className="text-xs text-white font-semibold uppercase tracking-wider">Live Capture</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Border Terminal Camera</div>
              </div>
            </div>
          </div>

          <Section title="Biometric Comparison Vectors" icon={User}>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                <span className="text-slate-400">Cosine Similarity Score</span>
                <span className="font-mono font-bold text-white">{cs.faceVerificationResult.similarityScore.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                <span className="text-slate-400">Identity Verdict</span>
                {cs.faceVerificationResult.isMatch ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Identity Verified</span>
                ) : (
                  <span className="text-red-400 font-semibold flex items-center gap-1"><XCircle className="w-4 h-4" /> Discrepancy Flagged</span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                <span className="text-slate-400">Document Face Landmark Detection</span>
                <span className={cs.faceVerificationResult.faceDetectedInDocument ? 'text-emerald-400 font-semibold' : 'text-red-400'}>
                  {cs.faceVerificationResult.faceDetectedInDocument ? '68 Points Calibrated' : 'Failed Detection'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                <span className="text-slate-400">Live Face Frame Quality</span>
                <span className={cs.faceVerificationResult.faceDetectedInLive ? 'text-emerald-400 font-semibold' : 'text-red-400'}>
                  {cs.faceVerificationResult.faceDetectedInLive ? 'Optimal Lighting & Focus' : 'Not Detected'}
                </span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5">
                  {cs.faceVerificationResult.explanation}
                </p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* Risk tab */}
      {activeTab === 'risk' && risk && (
        <div className="space-y-4">
          <div className={`glass-card p-6 bg-gradient-to-br ${riskBg} to-transparent border ${
            risk.riskLevel === 'HIGH' ? 'border-red-500/30' : risk.riskLevel === 'MEDIUM' ? 'border-amber-500/30' : 'border-emerald-500/30'
          }`}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <p className="section-label mb-2">Composite AI Risk Score</p>
                <div className={`text-7xl font-bold font-mono ${riskColor}`}>{risk.totalScore}</div>
                <div className="text-slate-500 text-lg mt-1 font-mono">/ 100 MAXIMUM RISK</div>
                <div className="mt-4"><RiskBadge level={risk.riskLevel} size="lg" /></div>
              </div>
              <div className="text-left sm:text-right max-w-sm">
                <p className="section-label mb-2">Operational Recommendation</p>
                <p className="text-sm text-slate-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                  {risk.recommendation}
                </p>
              </div>
            </div>
          </div>

          <Section title="Multi-Factor Risk Breakdown" icon={BarChart3}>
            <div className="space-y-4">
              {risk.factors.map(f => (
                <div key={f.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-white">{f.name}</span>
                    <span className="font-mono text-slate-400">{f.score} / {f.maxScore} pts</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        f.level === 'HIGH'   ? 'bg-red-500' :
                        f.level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(f.score / f.maxScore) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{f.description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="AI Explainability: Primary Flags Triggered" icon={AlertTriangle}>
            <div className="space-y-2">
              {risk.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">{r}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

export default CaseDetailsPage;
