import React, { useState } from 'react';
import { Settings, Shield, Eye, Database, Sliders, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface WeightConfig {
  ocrAnomalies: number;
  documentValidation: number;
  tampering: number;
  faceVerification: number;
  expiryBlacklist: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  ocrAnomalies: 20,
  documentValidation: 20,
  tampering: 30,
  faceVerification: 25,
  expiryBlacklist: 5,
};

const SettingsPage: React.FC = () => {
  const { officer, demoMode } = useAuth();
  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'risk' | 'privacy'>('general');

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'risk',    label: 'Risk Engine', icon: Sliders },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ] as const;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <p className="section-label mb-1">Configuration</p>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">System configuration and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 space-y-1 flex-shrink-0">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`settings-${id}`}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeSection === id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* General */}
          {activeSection === 'general' && (
            <div className="glass-card p-5 space-y-5">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" /> General Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Officer Name</label>
                  <input type="text" value={officer?.name ?? ''} readOnly className="input-field opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Officer ID</label>
                  <input type="text" value={officer?.officerId ?? ''} readOnly className="input-field opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Unit</label>
                  <input type="text" value={officer?.unit ?? ''} readOnly className="input-field opacity-60 cursor-not-allowed" />
                </div>
              </div>

              {/* Demo mode status */}
              <div className={`p-4 rounded-lg border ${demoMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-xs font-semibold text-white">Demo Mode</span>
                  <span className={`ml-auto text-xs font-medium ${demoMode ? 'text-amber-400' : 'text-slate-600'}`}>
                    {demoMode ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {demoMode
                    ? 'System is running with simulated AI results and demo data. Real document uploads are processed through the demo pipeline.'
                    : 'System is connected to production AI services and live databases.'}
                </p>
              </div>

              {/* System info */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">System Information</p>
                {[
                  ['Version', 'VERIDOC AI v2.4.1'],
                  ['OCR Engine', demoMode ? 'Demo Mock Engine' : 'Tesseract + Custom Model'],
                  ['Face Verify', demoMode ? 'Demo Mock Engine' : 'DeepFace + Embeddings'],
                  ['Tampering', demoMode ? 'Demo Mock Engine' : 'CNN Forensic Model'],
                  ['Database', demoMode ? 'In-Memory (Demo)' : 'PostgreSQL'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs py-1.5 border-b border-white/5">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-300 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Engine */}
          {activeSection === 'risk' && (
            <div className="glass-card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Risk Engine Weights
                </h2>
                <div className={`text-xs font-mono font-bold ${totalWeight === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Total: {totalWeight}/100
                </div>
              </div>

              {totalWeight !== 100 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Weights must total 100 points
                </div>
              )}

              <div className="space-y-5">
                {Object.entries(weights).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    ocrAnomalies:      'OCR Anomalies',
                    documentValidation:'Document Validation',
                    tampering:         'Tampering Probability',
                    faceVerification:  'Face Verification',
                    expiryBlacklist:   'Expiry / Blacklist',
                  };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-2">
                        <label className="font-medium text-white">{labels[key]}</label>
                        <span className="font-mono text-cyan-400">{value} pts</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={value}
                        onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-xs text-slate-400 mb-2">Risk Thresholds</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="font-bold text-emerald-400">0–29</div>
                    <div className="text-slate-400">LOW</div>
                  </div>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-center">
                    <div className="font-bold text-amber-400">30–59</div>
                    <div className="text-slate-400">MEDIUM</div>
                  </div>
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-center">
                    <div className="font-bold text-red-400">60–100</div>
                    <div className="text-slate-400">HIGH</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="save-settings"
                  onClick={handleSave}
                  disabled={totalWeight !== 100}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved!' : 'Save Configuration'}
                </button>
                <button onClick={handleReset} className="btn-secondary">
                  <RotateCcw className="w-4 h-4" /> Reset Defaults
                </button>
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeSection === 'privacy' && (
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Privacy & Security
              </h2>
              <div className="space-y-3">
                {[
                  { icon: Database, title: 'Data Retention', desc: 'Screening records are retained for 90 days by default. Configure via backend .env settings.' },
                  { icon: Eye,      title: 'Document Storage', desc: 'Uploaded document images are processed in-memory and not permanently stored in demo mode.' },
                  { icon: Shield,   title: 'Access Control', desc: 'All endpoints require Bearer token authentication. Tokens expire after 8 hours.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-white">{title}</span>
                    </div>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-xs text-amber-400 font-semibold mb-1">⚠ DEMO MODE NOTICE</p>
                <p className="text-xs text-slate-400">This application is running in demo mode. No real document data is stored or transmitted. All screening results are simulated.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
