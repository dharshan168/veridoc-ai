// ─── Document Types ─────────────────────────────────────────────────────────

export type DocumentType = 'passport' | 'visa' | 'national_id' | 'driving_licence' | 'permit';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ScreeningStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ValidationStatus = 'passed' | 'warning' | 'failed';

export type PipelineStageStatus = 'pending' | 'processing' | 'completed' | 'warning' | 'failed';

// ─── Officer ────────────────────────────────────────────────────────────────

export interface Officer {
  id: string;
  officerId: string;
  name: string;
  rank: string;
  unit: string;
  lastLogin: string;
}

// ─── OCR ────────────────────────────────────────────────────────────────────

export interface OCRField {
  label: string;
  value: string;
  confidence: number;  // 0-100
  flagged: boolean;
}

export interface OCRResult {
  documentType: DocumentType;
  overallConfidence: number;
  fields: OCRField[];
  mrzData?: {
    line1: string;
    line2: string;
    parsed: Record<string, string>;
  };
  processingTimeMs: number;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationCheck {
  id: string;
  name: string;
  category: string;
  status: ValidationStatus;
  message: string;
  detail?: string;
  expectedValue?: string;
  actualValue?: string;
}

export interface ValidationResult {
  overallStatus: ValidationStatus;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  checks: ValidationCheck[];
  processingTimeMs: number;
}

// ─── Tampering ───────────────────────────────────────────────────────────────

export interface TamperingIndicator {
  id: string;
  name: string;
  probability: number;  // 0-100
  status: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  region?: { x: number; y: number; width: number; height: number };
}

export interface TamperingResult {
  overallRisk: RiskLevel;
  overallProbability: number;
  indicators: TamperingIndicator[];
  heatmapAvailable: boolean;
  processingTimeMs: number;
  disclaimer: string;
}

// ─── Face Verification ───────────────────────────────────────────────────────

export interface FaceVerificationResult {
  similarityScore: number;  // 0-100
  isMatch: boolean;
  confidence: number;
  explanation: string;
  faceDetectedInDocument: boolean;
  faceDetectedInLive: boolean;
  processingTimeMs: number;
}

// ─── Risk Assessment ─────────────────────────────────────────────────────────

export interface RiskFactor {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  description: string;
  level: RiskLevel;
}

export interface RiskAssessment {
  totalScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  reasons: string[];
  recommendation: string;
  processingTimeMs: number;
}

// ─── Screening Case ──────────────────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStageStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export type OfficerDecision = 'APPROVED' | 'SECONDARY_INSPECTION' | 'DETAINED';

export interface OfficerDecisionRecord {
  decision: OfficerDecision;
  notes: string;
  officerId: string;
  officerName: string;
  timestamp: string;
}

export interface ScreeningCase {
  id: string;
  caseId: string;
  documentType: DocumentType;
  officerId: string;
  officerName: string;
  createdAt: string;
  completedAt?: string;
  totalTimeMs?: number;
  status: ScreeningStatus;
  documentImageUrl?: string;
  faceImageUrl?: string;
  ocrResult?: OCRResult;
  validationResult?: ValidationResult;
  tamperingResult?: TamperingResult;
  faceVerificationResult?: FaceVerificationResult;
  riskAssessment?: RiskAssessment;
  pipeline: PipelineStage[];
  demoType?: 'valid' | 'tampered' | 'identity_mismatch';
  officerDecisionRecord?: OfficerDecisionRecord;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalScreened: number;
  suspicious: number;
  highRisk: number;
  verified: number;
  avgScreeningTimeMs: number;
  todayScreened: number;
}

export interface ActivityDataPoint {
  date: string;
  low: number;
  medium: number;
  high: number;
}

export interface DocumentTypeCount {
  type: string;
  count: number;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  officer: Officer;
  demoMode: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthState {
  officer: Officer | null;
  token: string | null;
  demoMode: boolean;
  isAuthenticated: boolean;
}
