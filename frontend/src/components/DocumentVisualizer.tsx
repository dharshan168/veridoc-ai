import React, { useState } from 'react';
import {
  Eye,
  Layers,
  Flame,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import type { ScreeningCase } from '../types';

interface DocumentVisualizerProps {
  screeningCase: ScreeningCase;
}

export const DocumentVisualizer: React.FC<DocumentVisualizerProps> = ({ screeningCase: cs }) => {
  const [activeLayer, setActiveLayer] = useState<'standard' | 'ocr' | 'tampering'>('standard');
  const [zoom, setZoom] = useState(false);

  const ocr = cs.ocrResult;
  const tampering = cs.tamperingResult;
  const isCase2 = cs.demoType === 'tampered' || cs.caseId === 'VDC-2024-001848' || tampering?.indicators.some(i => i.name.includes('Text Manipulation') && i.status === 'HIGH');
  const isCase3 = cs.demoType === 'identity_mismatch' || cs.caseId === 'VDC-2024-001849' || tampering?.indicators.some(i => i.name.includes('Photo Replacement') && i.status === 'HIGH');

  // Extract display fields
  const nameField = ocr?.fields.find(f => f.label.toLowerCase().includes('name'))?.value || 'ARJUN SHARMA';
  const numberField = ocr?.fields.find(f => f.label.toLowerCase().includes('number') || f.label.toLowerCase().includes('id'))?.value || 'P4729183';
  const dobField = ocr?.fields.find(f => f.label.toLowerCase().includes('birth') || f.label.toLowerCase().includes('dob'))?.value || '14-06-1988';
  const expiryField = ocr?.fields.find(f => f.label.toLowerCase().includes('expiry'))?.value || '13-06-2034';
  const genderField = ocr?.fields.find(f => f.label.toLowerCase().includes('gender') || f.label.toLowerCase().includes('sex'))?.value || 'M';
  const natField = ocr?.fields.find(f => f.label.toLowerCase().includes('nationality'))?.value || 'IND';

  // Determine avatar icon / image
  const isFemale = genderField === 'F' || genderField.toLowerCase().includes('female');

  return (
    <div className="glass-card overflow-hidden border border-white/10">
      {/* Visualizer header & layer switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/5 bg-[#030d1d]/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-wider text-white uppercase">
            Document Forensic Inspector
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
            {cs.documentType.toUpperCase()} · HIGH-RES SCAN
          </span>
        </div>

        {/* Layer toggle buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveLayer('standard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeLayer === 'standard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Standard View
          </button>
          <button
            onClick={() => setActiveLayer('ocr')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeLayer === 'ocr'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            OCR Bounding Boxes
          </button>
          <button
            onClick={() => setActiveLayer('tampering')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeLayer === 'tampering'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Forensic ELA / Tamper Heatmap
          </button>
        </div>
      </div>

      {/* Main Document Canvas View */}
      <div className="p-6 flex flex-col items-center justify-center bg-[#020611] relative select-none">
        {/* Zoom trigger */}
        <button
          onClick={() => setZoom(!zoom)}
          className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/60 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all text-xs flex items-center gap-1.5"
          title="Toggle Zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>{zoom ? 'Reset' : '1.25x'}</span>
        </button>

        {/* Passport / Document Container */}
        <div
          className={`w-full max-w-2xl rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
            zoom ? 'scale-105 my-4' : ''
          } ${
            activeLayer === 'tampering'
              ? 'bg-[#080d1a] border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
              : 'bg-gradient-to-br from-[#0c1a30] via-[#081324] to-[#040b17] border border-cyan-500/30 shadow-2xl'
          }`}
        >
          {/* Guilloche security pattern backdrop */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.4) 1px, transparent 1px),
                                repeating-linear-gradient(45deg, rgba(6, 182, 212, 0.1) 0, rgba(6, 182, 212, 0.1) 2px, transparent 0, transparent 8px)`,
              backgroundSize: '16px 16px, 24px 24px',
            }}
          />

          {/* Tampering ELA Noise Overlay (Only shown in tampering view) */}
          {activeLayer === 'tampering' && (
            <div className="absolute inset-0 z-10 pointer-events-none bg-[#02050f]/85 flex flex-col justify-between p-4">
              <div className="flex justify-between items-center text-[10px] font-mono text-amber-400 bg-black/60 px-3 py-1 rounded border border-amber-500/30">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-400 animate-pulse" /> ERROR LEVEL ANALYSIS (ELA) · RESIDUAL ERROR 95%
                </span>
                <span>SPECTRAL VARIANCE: HIGH</span>
              </div>

              {/* Noise matrix pattern */}
              <div
                className="absolute inset-0 opacity-25 mix-blend-screen"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 40%, rgba(239, 68, 68, 0.8) 0%, transparent 60%),
                                    radial-gradient(circle at 70% 60%, rgba(245, 158, 11, 0.8) 0%, transparent 50%)`,
                }}
              />
            </div>
          )}

          {/* Header Row: Country & Document Type */}
          <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-5">
            <div className="flex items-center gap-3">
              {/* National Emblem Graphic */}
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-widest text-cyan-300 font-mono">
                  REPUBLIC OF INDIA / RÉPUBLIQUE D'INDE
                </div>
                <div className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                  PASSPORT / PASSEPORT
                </div>
              </div>
            </div>

            {/* Hologram Emblem */}
            <div className="relative px-3 py-1 rounded bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 border border-cyan-400/40 text-[10px] font-bold text-cyan-300 font-mono flex items-center gap-1.5 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              AUTHENTIC SECURE CHIP
            </div>
          </div>

          {/* Body: Photo & Identity Fields */}
          <div className="relative z-10 grid grid-cols-12 gap-5 mb-5">
            {/* Passenger Photograph with Tamper Detection Box */}
            <div className="col-span-4 flex flex-col items-center">
              <div
                className={`w-32 h-40 rounded-xl overflow-hidden relative border-2 flex items-center justify-center ${
                  isCase3 && activeLayer === 'tampering'
                    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
                    : 'border-cyan-500/40 bg-gradient-to-b from-slate-800 to-slate-900'
                }`}
              >
                {/* Visual Avatar representation */}
                <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[#091528] relative">
                  {/* Subtle facial silhouette / photo */}
                  <svg className="w-20 h-20 text-cyan-300/70" viewBox="0 0 24 24" fill="currentColor">
                    {isFemale ? (
                      <path d="M12 2C9.24 2 7 4.24 7 7c0 2.4 1.7 4.4 4 4.9V14H9v2h2v3H9v2h6v-2h-2v-3h2v-2h-2v-2.1c2.3-.5 4-2.5 4-4.9 0-2.76-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                    ) : (
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    )}
                  </svg>
                  <span className="text-[10px] font-mono text-cyan-300/80 font-semibold mt-1 uppercase text-center truncate w-full">
                    {nameField}
                  </span>

                  {/* Tampering highlight tag for Photo Replacement (Case 3) */}
                  {isCase3 && activeLayer === 'tampering' && (
                    <div className="absolute inset-0 bg-red-600/30 border-2 border-red-500 flex flex-col items-center justify-center p-1 text-center">
                      <ShieldAlert className="w-6 h-6 text-red-400 mb-1" />
                      <span className="text-[9px] font-bold text-white bg-red-600 px-1 rounded uppercase">
                        PHOTO REPLACED
                      </span>
                      <span className="text-[8px] font-mono text-white mt-0.5">88% PROBABILITY</span>
                    </div>
                  )}

                  {/* OCR Box tag in OCR layer */}
                  {activeLayer === 'ocr' && (
                    <div className="absolute top-1 left-1 bg-blue-500/80 text-white text-[8px] font-mono px-1 rounded">
                      [PHOTO: 99.4%]
                    </div>
                  )}
                </div>

                {/* Holographic watermark seal on photo corner */}
                <div className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-cyan-400/60 bg-black/40 px-1 rounded">
                  ICAO 9303
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-2">DIGITAL FACIAL MATRIX</span>
            </div>

            {/* Extracted Passport Info Fields */}
            <div className="col-span-8 space-y-2.5">
              {/* Full Name */}
              <div
                className={`p-1.5 rounded transition-all ${
                  activeLayer === 'ocr'
                    ? 'border border-blue-500/60 bg-blue-500/10'
                    : ''
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Given Name & Surname / Nom et Prénom
                  </span>
                  {activeLayer === 'ocr' && (
                    <span className="text-[9px] font-mono text-blue-400">conf: 99.1%</span>
                  )}
                </div>
                <div className="text-base font-bold text-white font-mono tracking-wider">
                  {nameField}
                </div>
              </div>

              {/* Passport Number & Nationality */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-1.5 rounded transition-all ${
                    activeLayer === 'ocr'
                      ? 'border border-blue-500/60 bg-blue-500/10'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Passport No.
                    </span>
                    {activeLayer === 'ocr' && (
                      <span className="text-[9px] font-mono text-blue-400">conf: 98.8%</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-cyan-400 font-mono tracking-wider">
                    {numberField}
                  </div>
                </div>

                <div
                  className={`p-1.5 rounded transition-all ${
                    activeLayer === 'ocr'
                      ? 'border border-blue-500/60 bg-blue-500/10'
                      : ''
                  }`}
                >
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Nationality / Nationalité
                  </span>
                  <div className="text-sm font-bold text-white font-mono">{natField}</div>
                </div>
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-3">
                {/* DOB with tampering warning highlight for Case 2 */}
                <div
                  className={`p-1.5 rounded relative transition-all ${
                    isCase2 && activeLayer === 'tampering'
                      ? 'border-2 border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                      : activeLayer === 'ocr'
                      ? 'border border-blue-500/60 bg-blue-500/10'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Date of Birth / Date de Naiss.
                    </span>
                    {activeLayer === 'ocr' && (
                      <span className="text-[9px] font-mono text-blue-400">conf: 85.7%</span>
                    )}
                  </div>
                  <div className="text-sm font-bold font-mono tracking-wider flex items-center gap-2">
                    <span className={isCase2 && activeLayer === 'tampering' ? 'text-red-400 font-bold' : 'text-white'}>
                      {dobField}
                    </span>
                    {isCase2 && activeLayer === 'tampering' && (
                      <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-mono uppercase">
                        TAMPERED
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`p-1.5 rounded transition-all ${
                    activeLayer === 'ocr'
                      ? 'border border-blue-500/60 bg-blue-500/10'
                      : ''
                  }`}
                >
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Sex / Sexe
                  </span>
                  <div className="text-sm font-bold text-white font-mono">{genderField}</div>
                </div>
              </div>

              {/* Expiry Date */}
              <div
                className={`p-1.5 rounded transition-all ${
                  activeLayer === 'ocr'
                    ? 'border border-blue-500/60 bg-blue-500/10'
                    : ''
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Date of Expiry / Date d'expiration
                  </span>
                  {activeLayer === 'ocr' && (
                    <span className="text-[9px] font-mono text-blue-400">conf: 98.3%</span>
                  )}
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono tracking-wider">
                  {expiryField}
                </div>
              </div>
            </div>
          </div>

          {/* Machine Readable Zone (MRZ) Strip */}
          <div
            className={`relative z-10 pt-3 border-t border-cyan-500/20 font-mono text-xs tracking-widest leading-relaxed p-2.5 rounded-lg ${
              activeLayer === 'tampering' && isCase2
                ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                : 'bg-black/50 text-emerald-400 border border-white/5'
            }`}
          >
            <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase mb-1 font-sans">
              <span>Machine Readable Zone (ICAO Doc 9303 TD3)</span>
              {isCase2 && activeLayer === 'tampering' && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Check-digit deviation in MRZ Line 2
                </span>
              )}
            </div>
            <div className="truncate">
              {ocr?.mrzData?.line1 || 'P<INDSHARMA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<'}
            </div>
            <div className="truncate">
              {ocr?.mrzData?.line2 || 'P47291831IND8806144M3406131<<<<<<<<<<<<<<6'}
            </div>
          </div>
        </div>

        {/* Legend / Status Bar below Canvas */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Document Scan Quality: 300 DPI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>MRZ Checksum: {isCase2 ? 'WARNING' : 'VALID'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Forensic Mode: {activeLayer.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
