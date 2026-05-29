export type SupportedLanguage = 
  | 'python' 
  | 'javascript' 
  | 'typescript' 
  | 'java' 
  | 'go' 
  | 'rust' 
  | 'cpp' 
  | 'auto';

export interface SnippetReviewRequest {
  code: string;
  language?: SupportedLanguage;
  context?: string;
}

export interface PRReviewRequest {
  github_pr_url: string;
  context?: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Category = 'bug' | 'security' | 'performance' | 'style';

export interface SuggestedFix {
  original_code: string;
  fixed_code: string;
  explanation: string;
}

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  line_reference: string;
  suggested_fix: SuggestedFix | null;
  confidence: number;
}

export interface CategorySummary {
  category: Category;
  score: number;
  finding_count: number;
  critical_count: number;
}

export interface ReviewResult {
  review_id: string;
  language: string;
  overall_score: number;
  overall_verdict: string;
  category_summaries: CategorySummary[];
  findings: Finding[];
  positive_aspects: string[];
  top_recommendations: string[];
  review_duration_ms: number;
}

export interface SSEProgressEvent {
  stage: string;
  message: string;
}

export interface SSEAgentCompleteEvent {
  agent: string;
  finding_count: number;
}

export interface SSECompleteEvent {
  review_id: string;
  overall_score: number;
}

export interface SSEFatalErrorEvent {
  error: string;
}
