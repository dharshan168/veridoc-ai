import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Printer, Shield, CheckCircle, AlertTriangle,
  XCircle, FileText, User, Calendar, Clock,
} from 'lucide-react';
import { screeningApi } from '../services/api';
import type { ScreeningCase } from '../types';
import { RiskBadge, DocTypeBadge, ValidationBadge, TamperingBadge } from '../components/Badges';
import ConfidenceBar from '../components/ConfidenceBar';

const ScreeningReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cs, setCs] = useState<ScreeningCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    screeningApi.getCase(id).then(setCs).finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading report…</div>;
  if (!cs) return <div className="flex items-center justify-center h-64 text-slate-500">Case not found</div>;

  const risk = cs.riskAssessment;
  const riskColor = risk?.riskLevel === 'HIGH' ? '#ef4444' : risk?.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .glass-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
          .text-white { color: #1e293b !important; }
          .text-slate-400 { color: #64748b !important; }
          .text-slate-500 { color: #64748b !important; }
          .text-cyan-400 { color: #0891b2 !important; }
        }
      `}</style>

      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between no-print">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="btn-secondary gap-2" id="print-report">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handlePrint} className="btn-primary gap-2" id="download-report">
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        </div>

        {/* Report document */}
        <div className="glass-card p-8 space-y-8">
          {/* Report header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-wider">VERIDOC AI</div>
                <div className="text-xs text-cyan-400/80 tracking-widest uppercase">AI-Powered Identity & Document Screening</div>
                <div className="text-xs text-slate-500 mt-0.5">OFFICIAL SCREENING REPORT · GOVERNMENT CLASSIFIED</div>
              </div>
            </div>
            <div className="text-right">
              {risk && <RiskBadge level={risk.riskLevel} score={risk.totalScore} size="lg" />}
              <div className="text-xs text-slate-500 mt-2">Generated: {new Date().toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Case metadata */}
          <section>
            <h2 className="section-label mb-3">Case Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: FileText,  label: 'Case ID',        value: cs.caseId },
                { icon: Calendar,  label: 'Date',           value: new Date(cs.createdAt).toLocaleDateString('en-IN') },
                { icon: Clock,     label: 'Time',           value: new Date(cs.createdAt).toLocaleTimeString('en-IN') },
                { icon: User,      label: 'Officer',        value: cs.officerName },
                { icon: Shield,    label: 'Officer ID',     value: cs.officerId },
                { icon: FileText,  label: 'Document Type',  value: cs.documentType.replace('_', ' ') },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="text-sm font-medium text-white capitalize">{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Extracted identity */}
          {cs.ocrResult && (
            <section>
              <h2 className="section-label mb-3">Extracted Identity Information</h2>
              <div className="grid grid-cols-2 gap-2">
                {cs.ocrResult.fields.map(f => (
                  <div key={f.label} className={`p-3 rounded-lg border ${f.flagged ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{f.label}</div>
                    <div className="text-sm font-bold text-white font-mono">{f.value}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">OCR: {f.confidence.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Overall OCR Confidence</span>
                  <span className="text-sm font-bold font-mono text-white">{cs.ocrResult.overallConfidence}%</span>
                </div>
                <ConfidenceBar value={cs.ocrResult.overallConfidence} showValue={false} />
              </div>
            </section>
          )}

          {/* Validation summary */}
          {cs.validationResult && (
            <section>
              <h2 className="section-label mb-3">Document Validation</h2>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-2xl font-bold font-mono text-emerald-400">{cs.validationResult.passedCount}</div>
                  <div className="text-xs text-slate-400">Passed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="text-2xl font-bold font-mono text-amber-400">{cs.validationResult.warningCount}</div>
                  <div className="text-xs text-slate-400">Warnings</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="text-2xl font-bold font-mono text-red-400">{cs.validationResult.failedCount}</div>
                  <div className="text-xs text-slate-400">Failed</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {cs.validationResult.checks.map(c => (
                  <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-white/5">
                    <ValidationBadge status={c.status} showLabel={false} />
                    <span className="text-xs text-white font-medium flex-1">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.message}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tampering summary */}
          {cs.tamperingResult && (
            <section>
              <h2 className="section-label mb-1">Tampering Analysis</h2>
              <p className="text-xs text-slate-500 mb-3 italic">{cs.tamperingResult.disclaimer}</p>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <span className="text-xs text-slate-400">Overall Probability: </span>
                  <span className="text-sm font-bold font-mono text-white">{cs.tamperingResult.overallProbability}%</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Risk: </span>
                  <RiskBadge level={cs.tamperingResult.overallRisk} size="sm" />
                </div>
              </div>
              <div className="space-y-2">
                {cs.tamperingResult.indicators.map(ind => (
                  <div key={ind.id} className="flex items-center gap-3 py-1.5 border-b border-white/5">
                    <TamperingBadge status={ind.status} />
                    <span className="text-xs text-white font-medium flex-1">{ind.name}</span>
                    <span className="text-xs font-mono text-slate-400">{ind.probability}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Face verification */}
          {cs.faceVerificationResult && (
            <section>
              <h2 className="section-label mb-3">Face Verification</h2>
              <div className={`p-4 rounded-lg border ${cs.faceVerificationResult.isMatch ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center gap-3">
                  {cs.faceVerificationResult.isMatch
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <XCircle className="w-5 h-5 text-red-400" />}
                  <div>
                    <div className={`text-base font-bold ${cs.faceVerificationResult.isMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cs.faceVerificationResult.isMatch ? 'IDENTITY MATCH' : 'IDENTITY MISMATCH'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Similarity: {cs.faceVerificationResult.similarityScore.toFixed(1)}% ·
                      Confidence: {cs.faceVerificationResult.confidence.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{cs.faceVerificationResult.explanation}</p>
              </div>
            </section>
          )}

          {/* Risk score */}
          {risk && (
            <section>
              <h2 className="section-label mb-3">Risk Assessment</h2>
              <div className="flex items-start gap-6 p-4 rounded-lg border border-white/10 bg-white/[0.02] mb-4">
                <div>
                  <div className="text-5xl font-bold font-mono" style={{ color: riskColor }}>{risk.totalScore}</div>
                  <div className="text-slate-500 text-sm">/ 100</div>
                </div>
                <div className="flex-1">
                  <RiskBadge level={risk.riskLevel} size="lg" />
                  <p className="text-xs text-slate-400 mt-2">{risk.recommendation}</p>
                </div>
              </div>

              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Risk Flags</h3>
              <div className="space-y-1.5">
                {risk.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-white/5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{r}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Officer Disposition & Audit */}
          <section>
            <h2 className="section-label mb-3">Officer Disposition & Audit Log</h2>
            <div className={`p-4 rounded-lg border ${
              cs.officerDecisionRecord?.decision === 'APPROVED'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : cs.officerDecisionRecord?.decision === 'SECONDARY_INSPECTION'
                ? 'bg-amber-500/5 border-amber-500/20'
                : cs.officerDecisionRecord?.decision === 'DETAINED'
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-white/[0.02] border-white/5'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Final Verdict</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40 text-white">
                  {cs.officerDecisionRecord?.decision ? cs.officerDecisionRecord.decision.replace('_', ' ') : 'PENDING OFFICER SIGN-OFF'}
                </span>
              </div>
              {cs.officerDecisionRecord?.notes && (
                <p className="text-xs text-slate-300 font-mono mb-2 bg-black/30 p-2.5 rounded">
                  Notes: {cs.officerDecisionRecord.notes}
                </p>
              )}
              <div className="text-[10px] text-slate-500 flex justify-between pt-2 border-t border-white/5">
                <span>Authorized Officer: {cs.officerDecisionRecord?.officerName || cs.officerName}</span>
                <span>Audit Timestamp: {cs.officerDecisionRecord?.timestamp ? new Date(cs.officerDecisionRecord.timestamp).toLocaleString('en-IN') : 'Pending'}</span>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-white/10 pt-5 text-center text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-400">VERIDOC AI · AI-Powered Identity & Document Screening System</p>
            <p>This report was generated automatically by an AI-assisted screening system. Results are indicative only and must be reviewed by authorized personnel before any action is taken.</p>
            <p>Report ID: {cs.caseId} · Generated: {new Date().toLocaleString('en-IN')}</p>
            <p className="text-amber-400/70">⚠ [DEMO MODE] — This is a demonstration report using simulated data</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScreeningReportPage;
