export interface User {
  id: string;
  email: string;
  full_name: string;
  role_id: number;
  role_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Study {
  id: string;
  name: string;
  sponsor: string | null;
  phase: string | null;
  study_type: string | null;
  description: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface StudyDocument {
  id: string;
  study_id: string;
  document_type: string;
  title: string | null;
  version: string | null;
  file_path: string | null;
  processing_status: string;
  created_at: string;
}

export interface StudyVisit {
  id: string;
  study_id: string;
  visit_code: string | null;
  visit_name: string;
  order_index: number;
  day_nominal: number | null;
  window_min_days: number | null;
  window_max_days: number | null;
  description: string | null;
  is_confirmed: boolean;
  procedures: StudyProcedure[];
}

export interface StudyProcedure {
  id: string;
  study_visit_id: string;
  procedure_code: string | null;
  procedure_name: string;
  description: string | null;
  is_required: boolean;
  is_critical: boolean;
  order_index: number;
}

export interface StudyRule {
  id: string;
  study_id: string;
  rule_type: string;
  title: string;
  description: string | null;
  source_excerpt: string | null;
  is_confirmed: boolean;
}

export interface Patient {
  id: string;
  study_id: string;
  subject_code: string;
  sex: string | null;
  birth_year: number | null;
  screening_status: string;
  enrollment_status: string;
  notes: string | null;
  created_at: string;
}

export interface ScreeningItem {
  id: string;
  patient_id: string;
  study_rule_id: string | null;
  criterion_name: string;
  criterion_type: string | null;
  status: string;
  notes: string | null;
  updated_at: string;
}

export interface PatientVisit {
  id: string;
  patient_id: string;
  study_visit_id: string;
  visit_name: string | null;
  visit_code: string | null;
  visit_date: string | null;
  visit_status: string;
  notes: string | null;
  created_at: string;
  tasks: VisitTask[];
}

export interface VisitTask {
  id: string;
  patient_visit_id: string;
  study_procedure_id: string;
  procedure_name: string | null;
  is_required: boolean | null;
  is_critical: boolean | null;
  status: string;
  notes: string | null;
  completed_at: string | null;
}

export interface Alert {
  id: string;
  study_id: string;
  patient_id: string | null;
  patient_visit_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface MetricsOverview {
  patients_by_status: Record<string, number>;
  visits_by_status: Record<string, number>;
  alerts_by_type: Record<string, number>;
  alerts_by_severity: Record<string, number>;
  common_missing_procedures: { name: string; count: number }[];
  deviations_by_category: { name: string; count: number }[];
  total_patients: number;
  total_visits: number;
  total_alerts_open: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
