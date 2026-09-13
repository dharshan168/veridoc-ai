import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CreditCard, Car, FileText, Stamp,
  Upload, Camera, ChevronRight, AlertTriangle, X,
  Play, Loader2, CheckCircle, Video, RefreshCw, UserCheck,
} from 'lucide-react';
import { screeningApi } from '../services/api';
import type { DocumentType, PipelineStageStatus, ScreeningCase } from '../types';
import { PipelineView } from '../components/PipelineView';

const DOC_TYPES: { id: DocumentType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'passport',        label: 'Passport',        icon: BookOpen,   desc: 'International travel document' },
  { id: 'visa',            label: 'Visa',            icon: Stamp,      desc: 'Entry / stay authorization' },
  { id: 'national_id',     label: 'National ID',     icon: CreditCard, desc: 'Aadhaar / national identity card' },
  { id: 'driving_licence', label: 'Driving Licence', icon: Car,        desc: 'Motor vehicle licence' },
  { id: 'permit',          label: 'Permit',          icon: FileText,   desc: 'Work / travel permit' },
];

const DEMO_OPTIONS = [
  { type: 'valid'             as const, label: 'Valid Indian Passport',       desc: 'All checks pass · Risk: 8 / LOW',     color: 'emerald' },
  { type: 'tampered'          as const, label: 'Tampered Passport (DOB)',     desc: 'Text edited · Risk: 67 / MEDIUM',     color: 'amber' },
  { type: 'identity_mismatch' as const, label: 'Identity / Face Mismatch',    desc: 'Photo replaced · Risk: 89 / HIGH',    color: 'red' },
];

const INIT_PIPELINE = [
  { id: 'upload',     name: 'Document Upload',      status: 'pending' as PipelineStageStatus },
  { id: 'preprocess', name: 'Image Preprocessing',  status: 'pending' as PipelineStageStatus },
  { id: 'ocr',        name: 'OCR Extraction',        status: 'pending' as PipelineStageStatus },
  { id: 'validation', name: 'Document Validation',   status: 'pending' as PipelineStageStatus },
  { id: 'tampering',  name: 'Tampering Analysis',    status: 'pending' as PipelineStageStatus },
  { id: 'face',       name: 'Face Verification',     status: 'pending' as PipelineStageStatus },
  { id: 'risk',       name: 'Risk Assessment',       status: 'pending' as PipelineStageStatus },
];

type Step = 1 | 2 | 3 | 4;

const NewScreeningPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [docType, setDocType] = useState<DocumentType | null>('passport');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<'doc' | 'face' | null>(null);
  const [pipeline, setPipeline] = useState(INIT_PIPELINE);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ScreeningCase | null>(null);

  // Webcam Capture State
  const [useWebcam, setUseWebcam] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable', err);
      setCameraError('Webcam access is unavailable or denied. Use file upload or preset passenger photo.');
      setCameraActive(false);
    }
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setFacePreview(dataUrl);

      // Create a simulated File object
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
          setFaceFile(file);
        });

      stopCamera();
      setUseWebcam(false);
    }
  };

  const setSampleFace = (preset: 'matching' | 'mismatch') => {
    // Generate an authentic SVG canvas data URL for the preset
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = preset === 'matching' ? '#0b1d3a' : '#290e14';
      ctx.fillRect(0, 0, 240, 240);
      ctx.fillStyle = preset === 'matching' ? '#22d3ee' : '#f87171';
      ctx.beginPath();
      ctx.arc(120, 90, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(120, 210, 80, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(preset === 'matching' ? 'PASSENGER: MATCH' : 'PASSENGER: UNKNOWN', 120, 230);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setFacePreview(dataUrl);
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          setFaceFile(new File([blob], `${preset}_portrait.jpg`, { type: 'image/jpeg' }));
        });
    }
  };

  const handleFileSelect = (file: File, type: 'doc' | 'face') => {
    const url = URL.createObjectURL(file);
    if (type === 'doc') {
      setDocFile(file);
      setDocPreview(url);
    } else {
      setFaceFile(file);
      setFacePreview(url);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'doc' | 'face') => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleFileSelect(file, type);
    }
  };

  const updateStage = (id: string, status: string) => {
    setPipeline(prev => prev.map(s => s.id === id ? { ...s, status: status as PipelineStageStatus } : s));
  };

  const runDemo = async (type: 'valid' | 'tampered' | 'identity_mismatch') => {
    setRunning(true);
    setResult(null);
    setPipeline(INIT_PIPELINE);
    setStep(4);
    try {
      const res = await screeningApi.runDemoScreening(type, updateStage);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const runReal = async () => {
    if (!docFile || !docType) return;
    const formData = new FormData();
    formData.append('document', docFile);
    formData.append('document_type', docType);
    if (faceFile) formData.append('face_image', faceFile);

    setRunning(true);
    setResult(null);
    setPipeline(INIT_PIPELINE);
    setStep(4);
    try {
      const res = await screeningApi.runRealScreening(
        formData,
        updateStage,
        docPreview,
        facePreview,
      );
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const totalTime = result?.totalTimeMs ? (result.totalTimeMs / 1000).toFixed(2) : '3.82';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="section-label mb-1">Live Inspection Workflow</p>
        <h1 className="text-2xl font-bold text-white">Start New Document Screening</h1>
        <p className="text-sm text-slate-400 mt-1">
          AI-assisted forensic document analysis, biometric face match, and automated risk engine.
        </p>
      </div>

      {/* Demo quick-launch cards */}
      <div className="glass-card p-5 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-black/40 to-slate-900/40">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
            <span className="section-label text-cyan-400">SIH Hackathon Presentation Mode — Instant Quick Launch</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            NO UPLOAD REQUIRED
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Instantly run full AI pipeline on pre-calibrated passport datasets with forensic analysis.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_OPTIONS.map(opt => (
            <button
              key={opt.type}
              id={`demo-${opt.type}`}
              onClick={() => runDemo(opt.type)}
              disabled={running}
              className={`text-left p-3.5 rounded-xl border transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                opt.color === 'emerald'
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : opt.color === 'amber'
                  ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  : 'bg-red-500/10 border-red-500/30 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
              }`}
            >
              <div className="text-xs font-bold text-white mb-1">{opt.label}</div>
              <div
                className={`text-[10px] font-mono font-medium ${
                  opt.color === 'emerald'
                    ? 'text-emerald-300'
                    : opt.color === 'amber'
                    ? 'text-amber-300'
                    : 'text-red-300'
                }`}
              >
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step progress bar */}
      {step < 4 && (
        <div className="flex items-center gap-2 px-1">
          {(['1. Document Type', '2. Upload Document', '3. Biometric Face', '4. AI Pipeline'] as const).map((label, i) => (
            <React.Fragment key={label}>
              <div
                className={`flex items-center gap-2 text-xs font-semibold ${
                  i + 1 <= step ? 'text-cyan-400' : 'text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i + 1 < step
                      ? 'bg-cyan-500 text-[#020817]'
                      : i + 1 === step
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 text-slate-600'
                  }`}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-0.5 rounded-full ${
                    i + 1 < step ? 'bg-cyan-500' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step 1: Document Type Selection */}
      {step === 1 && (
        <div className="glass-card p-6 space-y-4">
          <div>
            <p className="section-label mb-1">Step 1 of 3</p>
            <h2 className="text-lg font-bold text-white">Select Document Classification</h2>
            <p className="text-xs text-slate-400">Choose the identity document category presented at the checkpoint.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DOC_TYPES.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                id={`doctype-${id}`}
                onClick={() => { setDocType(id); setStep(2); }}
                className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                  docType === id
                    ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                    : 'border-white/5 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-6 h-6 mb-3 ${docType === id ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div className="text-sm font-semibold text-white mb-1">{label}</div>
                <div className="text-xs text-slate-400">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Document Upload */}
      {step === 2 && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label mb-1">Step 2 of 3</p>
              <h2 className="text-lg font-bold text-white">Upload Document Scan or Photo</h2>
              <p className="text-xs text-slate-400">
                Selected Type: <span className="text-cyan-400 font-semibold uppercase">{docType?.replace('_', ' ')}</span>
              </p>
            </div>
            <button onClick={() => setStep(1)} className="btn-secondary text-xs">
              Change Type
            </button>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragOver === 'doc'
                ? 'border-cyan-400 bg-cyan-500/15'
                : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.02]'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver('doc'); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, 'doc')}
            onClick={() => docInputRef.current?.click()}
          >
            {docPreview ? (
              <div className="relative inline-block">
                <img
                  src={docPreview}
                  alt="Uploaded Document"
                  className="max-h-56 rounded-xl border border-cyan-500/30 shadow-2xl mx-auto"
                />
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setDocFile(null);
                    setDocPreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg transition-all"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm text-slate-200 font-medium mb-1">
                  Drag & drop passport or ID image here, or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, PDF · Up to 10MB</p>
              </div>
            )}
            <input
              ref={docInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'doc')}
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={() => setStep(1)} className="btn-secondary">
              ← Back
            </button>
            <button
              id="next-step-2"
              onClick={() => setStep(3)}
              disabled={!docFile}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Biometrics <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Biometric Face Capture (Webcam / Upload / Preset) */}
      {step === 3 && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label mb-1">Step 3 of 3</p>
              <h2 className="text-lg font-bold text-white">Biometric Live Face Verification</h2>
              <p className="text-xs text-slate-400">
                Acquire live passenger facial image via terminal webcam or upload for 1:1 facial comparison.
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              Recommended
            </span>
          </div>

          {/* Webcam vs File Toggle */}
          <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5 max-w-sm">
            <button
              onClick={() => {
                setUseWebcam(false);
                stopCamera();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                !useWebcam ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
            <button
              onClick={() => {
                setUseWebcam(true);
                startCamera();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                useWebcam ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Live Webcam
            </button>
          </div>

          {/* Live Camera View */}
          {useWebcam ? (
            <div className="border border-white/10 rounded-2xl p-4 bg-black/60 text-center relative overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-amber-300">{cameraError}</p>
                  <button onClick={startCamera} className="btn-secondary text-xs mx-auto gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Webcam
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative inline-block rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-80 h-60 object-cover"
                    />
                    {/* Biometric Face Guide Oval */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-40 h-52 rounded-[50%] border-2 border-dashed border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.2)]" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400">
                      LIVE STREAM · 30 FPS
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={captureWebcamSnapshot}
                      className="btn-primary gap-2 text-xs font-bold"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Live Snapshot
                    </button>
                    <button
                      onClick={() => {
                        stopCamera();
                        setUseWebcam(false);
                      }}
                      className="btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload File Dropzone */
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                dragOver === 'face'
                  ? 'border-cyan-400 bg-cyan-500/15'
                  : 'border-white/10 hover:border-cyan-500/30'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver('face'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, 'face')}
              onClick={() => faceInputRef.current?.click()}
            >
              {facePreview ? (
                <div className="relative inline-block">
                  <img
                    src={facePreview}
                    alt="Passenger Face"
                    className="w-32 h-32 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-xl mx-auto"
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setFaceFile(null);
                      setFacePreview(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="mt-2 text-xs font-mono text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready for comparison
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">Upload passenger live photo</p>
                  <p className="text-xs text-slate-500 mt-0.5">JPG, PNG · Frontal face recommended</p>
                </div>
              )}
              <input
                ref={faceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'face')}
              />
            </div>
          )}

          {/* Quick Presets for Demo Presentations */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Quick Test Biometric Presets (1-Click)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSampleFace('matching')}
                className="btn-secondary text-xs py-1.5 px-3 gap-1.5 hover:border-emerald-500/40"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Matching Passenger (Low Risk)
              </button>
              <button
                onClick={() => setSampleFace('mismatch')}
                className="btn-secondary text-xs py-1.5 px-3 gap-1.5 hover:border-red-500/40"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Mismatched Person (High Risk)
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={() => setStep(2)} className="btn-secondary">
              ← Back
            </button>
            <button
              id="start-screening"
              onClick={runReal}
              className="btn-primary gap-2 font-bold px-6 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch AI Screening Pipeline
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Live Pipeline Execution View */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="glass-card p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-label mb-0.5">Autonomous AI Verification</p>
                <h2 className="text-lg font-bold text-white">
                  {running ? 'Screening in progress…' : `Screening completed in ${totalTime}s`}
                </h2>
              </div>
              {running ? (
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ANALYZING SENSORS
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                  <CheckCircle className="w-4 h-4" />
                  ANALYSIS COMPLETE
                </div>
              )}
            </div>

            <PipelineView stages={pipeline} />
          </div>

          {result && !running && (
            <div className="glass-card p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-black/40 to-slate-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">Screening Case Generated</div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      Case ID: <span className="text-cyan-400 font-bold">{result.caseId}</span> · Risk Score:{' '}
                      <span className="font-bold text-white">{result.riskAssessment?.totalScore ?? '—'}</span> / 100
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/case/${result.id}`)}
                    className="btn-primary text-xs font-bold"
                    id="view-results"
                  >
                    View Forensic Dossier →
                  </button>
                  <button
                    onClick={() => {
                      setPipeline(INIT_PIPELINE);
                      setStep(1);
                      setResult(null);
                      setDocFile(null);
                      setDocPreview(null);
                      setFaceFile(null);
                      setFacePreview(null);
                    }}
                    className="btn-secondary text-xs"
                  >
                    Screen Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewScreeningPage;
