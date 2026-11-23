import axios from 'axios';
import {
  Village,
  VillageDetail,
  WeatherSummary,
  Farmer,
  Farm,
  FarmerReport,
  Alert,
  Crop,
  PredictionResult,
  ModelBenchmark,
  DashboardStats,
} from '../types/api';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const ApiService = {
  // Health
  getHealth: () => api.get('/health').then(res => res.data),

  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    api.get('/dashboard/stats').then(res => res.data),

  // Villages & GIS
  getVillages: (params?: { district?: string; risk_category?: string; disease?: string }): Promise<Village[]> =>
    api.get('/villages', { params }).then(res => res.data),

  getVillageDetail: (villageId: string): Promise<VillageDetail> =>
    api.get(`/villages/${villageId}`).then(res => res.data),

  assessVillageRisk: (villageId: string, crop: string = 'Cotton', disease: string = 'Pink Bollworm'): Promise<PredictionResult> =>
    api.post(`/villages/${villageId}/assess`, null, { params: { crop_name: crop, disease_name: disease } }).then(res => res.data),

  // Weather
  getVillageWeather: (villageId: string): Promise<WeatherSummary> =>
    api.get(`/weather/village/${villageId}`).then(res => res.data),

  // Crops
  getCrops: (): Promise<Crop[]> =>
    api.get('/crops').then(res => res.data),

  // Farmers & Farms
  getFarmers: (): Promise<Farmer[]> =>
    api.get('/farmers').then(res => res.data),

  createFarmer: (farmerData: Partial<Farmer>): Promise<Farmer> =>
    api.post('/farmers', farmerData).then(res => res.data),

  getFarms: (): Promise<Farm[]> =>
    api.get('/farmers/farms').then(res => res.data),

  // Reports
  getReports: (status?: string): Promise<FarmerReport[]> =>
    api.get('/reports', { params: { status } }).then(res => res.data),

  submitReport: (reportData: Partial<FarmerReport>): Promise<FarmerReport> =>
    api.post('/reports', reportData).then(res => res.data),

  reviewReport: (reportId: string, status: 'VERIFIED' | 'REJECTED', notes: string): Promise<FarmerReport> =>
    api.put(`/reports/${reportId}/review`, { status, officer_review_notes: notes }).then(res => res.data),

  // Predictions
  predictRisk: (data: { village_id: string; crop_name: string; growth_stage: string; target_disease: string }): Promise<PredictionResult> =>
    api.post('/predictions/assess', data).then(res => res.data),

  getPredictionHistory: (villageId?: string): Promise<any[]> =>
    api.get('/predictions/history', { params: { village_id: villageId } }).then(res => res.data),

  runBatchPredictions: (): Promise<any> =>
    api.post('/predictions/batch-run').then(res => res.data),

  // Alerts
  getAlerts: (status?: string, risk_category?: string): Promise<Alert[]> =>
    api.get('/alerts', { params: { status, risk_category } }).then(res => res.data),

  updateAlertStatus: (alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED'): Promise<Alert> =>
    api.put(`/alerts/${alertId}/status`, { status }).then(res => res.data),

  // Analytics
  getModelBenchmarks: (): Promise<ModelBenchmark[]> =>
    api.get('/analytics/models').then(res => res.data),

  getGlobalFeatureImportance: (): Promise<Array<{ feature: string; importance: number; name: string }>> =>
    api.get('/analytics/feature-importance').then(res => res.data),

  // Settings
  getSettings: () => api.get('/settings').then(res => res.data),
  updateSettings: (config: any) => api.post('/settings', config).then(res => res.data),

  // Farmer Portal
  getFarmerPortalData: (farmerId: string) =>
    api.get(`/farmers/${farmerId}/portal`).then(res => res.data),

  // Data Ingestion Engine
  previewDataset: (formData: FormData) =>
    api.post('/ingest/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),

  processDataset: (formData: FormData) =>
    api.post('/ingest/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),

  downloadTemplateUrl: '/api/v1/ingest/template',
};

export default ApiService;
