export type InputType = "pdf" | "docx" | "image" | "url";
export type Market = "south_africa" | "kenya";
export type RiskClassification = "low" | "medium" | "high";
export type JobStatus = "payment_required" | "processing" | "complete";
export type PaymentStatus = "unpaid" | "paid";
export type MessageRole = "user" | "assistant";

export interface RiskFactor {
  key: string;
  label: string;
  weight: number;
  evidence: string;
  explanation: string;
}

export interface PreviewAnalysisResponse {
  contract_type: string;
  summary: string;
  key_points: string[];
  red_flags: string[];
  risk_score: number;
  risk_level: RiskClassification;
  factors: RiskFactor[];
  financial_obligations: string[];
  duration_terms: string[];
  cancellation_terms: string[];
  recommended_actions: string[];
}

export interface PreviewIntakeRequest {
  input_type: InputType;
  market: Market;
  text: string;
  source_name?: string;
  customer_email?: string;
  disclaimer_accepted: boolean;
}

export interface PaymentQuote {
  provider: string;
  payment_status: PaymentStatus;
  payment_reference: string;
  checkout_url: string;
  display_amount: string;
  note: string;
}

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface FollowUpAllowance {
  free_limit: number;
  questions_used: number;
  questions_remaining: number;
}

export interface ContractJobResponse {
  job_id: string;
  status: JobStatus;
  input_type: InputType;
  market: Market;
  source_name?: string | null;
  customer_email?: string | null;
  disclaimer_accepted: boolean;
  payment: PaymentQuote;
  analysis?: PreviewAnalysisResponse | null;
  conversation: ConversationMessage[];
  follow_up: FollowUpAllowance;
  escalation_recommended: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUpResponse {
  job_id: string;
  answer: string;
  follow_up: FollowUpAllowance;
  conversation: ConversationMessage[];
  upgrade_required: boolean;
  suggested_next_step?: string | null;
}

export interface SampleContract {
  id: string;
  title: string;
  source_name: string;
  market: Market;
  input_type: InputType;
  text: string;
}
