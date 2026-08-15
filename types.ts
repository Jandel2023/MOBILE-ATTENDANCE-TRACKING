export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';
export type PunchType = 'time_in' | 'time_out';
export type TrainingSession = 'Morning' | 'Afternoon' | 'Evening' | 'Full Day';

export const TRAINING_SESSIONS: TrainingSession[] = [
  'Morning',
  'Afternoon',
  'Evening',
  'Full Day',
];

export interface Trainee {
  id: string; // unique internal uuid
  traineeCode: string; // e.g. "TR-2026-001" or student number
  name: string;
  email?: string;
  phone?: string;
  batchId: string;
  avatarColor?: string;
  notes?: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  title: string; // e.g. "Computer Systems Servicing NC II - Batch 2026-A"
  code: string;  // e.g. "CSS-2026-A"
  description?: string;
  trainerName?: string;
  location?: string;
  startDate?: string; // Date Start
  endDate?: string;   // Date End
  trainingDuration?: string; // e.g. "280 Hours" or "35 Days"
  nttcNumber?: string; // Trainer NTTC No. (National TVET Trainer Certificate)
  validityDate?: string; // NTTC / Qualification Validity Date
  modeOfTraining?: string; // e.g. "Institution-Based", "Enterprise-Based", "Blended"
  scholarshipProgram?: string; // e.g. "TWSP", "STEP", "PESFA", "UAQTEA", "LGU Sponsored"
  createdAt: string;
  isActive?: boolean;
}

export interface AttendanceRecord {
  id: string;
  batchId: string;
  traineeId: string;
  date: string; // YYYY-MM-DD
  session: TrainingSession; // 'Morning' | 'Afternoon' | 'Evening' | 'Full Day'
  sessionName?: string; // backwards compatibility
  timeIn?: string; // e.g. "08:00 AM" or "08:00:15"
  timeOut?: string; // e.g. "05:00 PM" or "17:00:20"
  status: AttendanceStatus;
  timestamp: string; // ISO string
  remarks?: string;
  scannedVia: 'qr_scanner' | 'manual' | 'qr_image_upload';
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  autoMarkLateMinutes: number; // e.g. after 08:15 AM
  defaultPunchType?: PunchType;
}

