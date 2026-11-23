export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface Village {
  id: string;
  name: string;
  code: string;
  district_id: string;
  district_name: string;
  latitude: float;
  longitude: float;
  elevation_m: number;
  total_cultivated_area_ha: number;
  cotton_cultivated_area_ha: number;
  current_risk_score: number;
  current_risk_category: RiskCategory;
  dominant_threat_disease: string;
  recent_alert_count: number;
  monitored_farmers_count: number;
}

export type float = number;

export interface VillageDetail extends Village {
  key_drivers: string[];
  recommended_action?: string;
  weather_summary?: WeatherSummary;
  historical_predictions: Array<{
    id: string;
    date: string;
    disease: string;
    risk_percentage: number;
    category: RiskCategory;
  }>;
  recent_farmer_reports: Array<{
    id: string;
    farmer_name: string;
    crop: string;
    stage: string;
    symptoms: string;
    status: string;
    date: string;
  }>;
}

export interface WeatherObservation {
  id: string;
  village_id: string;
  observation_date: string;
  temperature_c: number;
  relative_humidity_pct: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  temp_avg_3d: number;
  temp_avg_7d: number;
  humidity_avg_3d: number;
  humidity_avg_7d: number;
  cumulative_rainfall_7d: number;
  conducive_weather_index: number;
}

export interface WeatherSummary {
  village_id: string;
  village_name: string;
  current_temperature_c: number;
  current_humidity_pct: number;
  current_rainfall_mm: number;
  temp_avg_3d: number;
  temp_avg_7d: number;
  humidity_avg_3d: number;
  humidity_avg_7d: number;
  cumulative_rainfall_7d: number;
  conducive_index: number;
  risk_assessment: string;
  observations_history: WeatherObservation[];
}

export interface Farmer {
  id: string;
  farmer_id_code: string;
  name: string;
  contact_number: string;
  village_id: string;
  village_name?: string;
  district_name?: string;
  total_land_area_ha: number;
  farms_count: number;
}

export interface Farm {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  village_id: string;
  village_name?: string;
  crop_name: string;
  survey_number?: string;
  area_hectares: number;
  soil_type: string;
  current_growth_stage: string;
  latitude: number;
  longitude: number;
}

export interface FarmerReport {
  id: string;
  farmer_id?: string;
  farmer_name?: string;
  farmer_id_code?: string;
  village_id: string;
  village_name?: string;
  crop_name: string;
  suspected_disease_id?: string;
  suspected_disease_name?: string;
  crop_growth_stage: string;
  observation_date: string;
  symptoms: string;
  affected_plants_pct: number;
  severity: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  officer_review_notes?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  village_id: string;
  village_name: string;
  district_name: string;
  crop: string;
  suspected_disease: string;
  risk_probability: number;
  risk_category: RiskCategory;
  contributing_factors: string[];
  recommended_inspection: string;
  preventive_actions: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  alert_timestamp: string;
  resolved_at?: string;
}

export interface CropGrowthStage {
  id: string;
  stage_name: string;
  stage_order: number;
  duration_days: number;
  description: string;
  susceptibility_multiplier: number;
}

export interface Disease {
  id: string;
  name: string;
  pathogen_type: string;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  optimal_humidity_min?: number;
  description?: string;
  symptoms?: string;
}

export interface Crop {
  id: string;
  name: string;
  scientific_name?: string;
  category: string;
  description?: string;
  growth_stages: CropGrowthStage[];
  diseases: Disease[];
}

export interface ContributingFactor {
  feature_name: string;
  contribution_weight: number;
  description: string;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
}

export interface PredictionResult {
  village_id: string;
  village_name: string;
  crop_name: string;
  disease_name: string;
  outbreak_probability: number;
  risk_percentage: number;
  risk_category: RiskCategory;
  confidence_range: [number, number];
  top_contributing_factors: ContributingFactor[];
  model_used: string;
  model_version: string;
  shap_summary: Record<string, number>;
  recommended_action: string;
  weather_risk_component?: number;
  spatial_risk_component?: number;
  crop_vulnerability_component?: number;
}

export interface ModelBenchmark {
  id: string;
  model_name: string;
  algorithm: string;
  version: string;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  brier_score: number;
  is_active: boolean;
  feature_importances?: Record<string, number>;
}

export interface DashboardStats {
  total_registered_farmers: number;
  total_monitored_villages: number;
  total_monitored_farms: number;
  crops_under_monitoring: number;
  active_disease_alerts: number;
  high_risk_villages_count: number;
  average_regional_risk_pct: number;
  risk_category_distribution: Record<string, number>;
  disease_outbreak_trends: Array<{ month: string; incidents: number; avg_risk: number }>;
  crop_wise_risk: Array<{ crop: string; monitored_ha: number; avg_risk: number; primary_threat: string }>;
  weather_overview: {
    avg_temperature_c: number;
    avg_relative_humidity_pct: number;
    total_regional_rainfall_mm: number;
    status: string;
  };
  recent_farmer_reports: Array<{
    id: string;
    farmer_name: string;
    village_name: string;
    crop: string;
    suspected_disease: string;
    severity: string;
    status: string;
    affected_pct: number;
    date: string;
    symptoms: string;
  }>;
}
