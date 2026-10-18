export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  organization_id?: number;
  organization_name?: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface KPIOverview {
  total_spend: number;
  attributed_revenue: number;
  roas: number;
  conversions: number;
  cpa: number | null;
  conversion_rate: number | null;
  engagement_rate: number | null;
  cpc: number | null;
  cpm: number | null;
  aov: number | null;
  contribution: number;
  contribution_margin_pct: number | null;
  total_impressions: number;
  total_reach: number;
  total_engagements: number;
  total_clicks: number;
  currency: string;
}

export interface TrendPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  clicks: number;
  impressions: number;
}

export interface PlatformComparison {
  platform: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  cpa: number | null;
  influencer_count: number;
}

export interface Campaign {
  id: number;
  organization_id: number;
  name: string;
  objective: string;
  platform: string;
  start_date: string;
  end_date?: string;
  allocated_budget: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_spend: number;
  attributed_revenue: number;
  roas: number;
  conversions: number;
  cpa: number | null;
}

export interface Influencer {
  id: number;
  organization_id: number;
  name: string;
  handle: string;
  platform: string;
  niche: string;
  follower_count: number;
  audience_quality_score: number;
  created_at: string;
  total_spend: number;
  attributed_revenue: number;
  roas: number;
  conversions: number;
  cpa: number | null;
  conversion_rate: number | null;
  engagement_rate: number | null;
}

export interface AllocationRecommendation {
  influencer_id: number;
  influencer_name: string;
  handle: string;
  platform: string;
  niche: string;
  baseline_budget: number;
  recommended_budget: number;
  budget_change: number;
  budget_change_pct: number;
  expected_revenue: number;
  expected_contribution: number;
  expected_roas: number;
  marginal_return: number;
  saturation_pct: number;
  is_binding_constraint: boolean;
  constraint_note: string | null;
}

export interface OptimizationResponse {
  run_id?: number;
  total_budget: number;
  objective: string;
  solver_status: string;
  solver_message: string;
  baseline_expected_revenue: number;
  optimized_expected_revenue: number;
  revenue_change: number;
  revenue_change_pct: number;
  baseline_expected_contribution: number;
  optimized_expected_contribution: number;
  contribution_change: number;
  baseline_roas: number;
  optimized_roas: number;
  budget_utilization_pct: number;
  allocations: AllocationRecommendation[];
  assumptions_note: string;
}

export interface Scenario {
  id: number;
  organization_id: number;
  campaign_id?: number;
  name: string;
  description?: string;
  assumptions_json: Record<string, any>;
  baseline_results_json: Record<string, any>;
  scenario_results_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: number;
  category: "PERFORMANCE" | "BUDGET" | "RISK" | "OPPORTUNITY";
  title: string;
  explanation: string;
  evidence_json: Record<string, any>;
  recommended_action?: string;
  quality_score: number;
  status: "ACTIVE" | "REVIEWED" | "DISMISSED";
  created_at: string;
}

export interface PredictiveBenchmark {
  target: string;
  baseline_model: string;
  baseline_mae: number;
  baseline_rmse: number;
  best_model_name: string;
  model_mae: number;
  model_rmse: number;
  model_r2: number;
  features_used: string[];
  data_points: number;
  all_models: Record<string, { mae: number; rmse: number; r2: number }>;
  note: string;
}

export interface ImportJob {
  id: number;
  filename: string;
  file_type: string;
  status: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  summary_message?: string;
  created_at: string;
}
