import React from 'react';
import { RefreshCw, AlertTriangle, Users, Shield, User } from 'lucide-react';
import { NavItem } from './Sidebar';
import { Farmer } from '../types/api';

interface NavbarProps {
  currentTab: NavItem;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeAlertsCount: number;
  userRole: 'OFFICER' | 'FARMER';
  onRoleChange: (role: 'OFFICER' | 'FARMER', farmerId?: string) => void;
  farmers: Farmer[];
  selectedFarmerId: string;
}

const titles: Record<NavItem, { title: string; subtitle: string }> = {
  overview: {
    title: 'Executive Intelligence Overview',
    subtitle: 'Real-time regional surveillance and outbreak risk analytics',
  },
  map: {
    title: 'Geographic Disease Risk Map',
    subtitle: 'Interactive GIS spatial epidemiology across Maharashtra cotton belt',
  },
  weather: {
    title: 'Weather Intelligence & Microclimate',
    subtitle: 'Open-Meteo rolling agro-meteorology and disease conducive index',
  },
  crops: {
    title: 'Crop & Phenology Monitoring',
    subtitle: 'Vulnerability mapping across cotton growth stages and pathogens',
  },
  farmers: {
    title: 'Farmer & Landholding Directory',
    subtitle: 'Registered growers and surveyed farm plots under surveillance',
  },
  reports: {
    title: 'Farmer Symptom Reports',
    subtitle: 'Field observations and extension officer verification workflow',
  },
  predictions: {
    title: 'Outbreak Prediction Engine',
    subtitle: 'On-demand machine learning risk inference with SHAP explanations',
  },
  alerts: {
    title: 'Early Warning Disease Alerts',
    subtitle: 'Actionable threshold breaches, inspection protocols and bio-control',
  },
  analytics: {
    title: 'ML Models & Geospatial Analytics',
    subtitle: 'Logistic Regression, Random Forest and XGBoost comparative benchmarks',
  },
  settings: {
    title: 'Platform Settings & Governance',
    subtitle: 'Configurable risk thresholds, notifications and database health',
  },
  ingest: {
    title: 'Dataset Ingestion & Parameter Grasper',
    subtitle: 'Upload external datasets, auto-detect columns and recalculate risk grids',
  },
  farmer_portal: {
    title: 'My Farm Personalized Portal',
    subtitle: 'Hyperlocal crop risk, field weather and approved bio-control advisories',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onRefresh,
  isRefreshing,
  activeAlertsCount,
  userRole,
  onRoleChange,
  farmers,
  selectedFarmerId,
}) => {
  const info = titles[currentTab] || { title: 'AgriShield AI', subtitle: 'Platform' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">{info.title}</h2>
        <p className="text-xs text-slate-500">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Role & Persona Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold pl-2 pr-1 hidden sm:inline">Active View:</span>
          <select
            value={userRole === 'OFFICER' ? 'OFFICER' : `FARMER:${selectedFarmerId}`}
            onChange={e => {
              const val = e.target.value;
              if (val === 'OFFICER') {
                onRoleChange('OFFICER');
              } else {
                const fId = val.split(':')[1];
                onRoleChange('FARMER', fId);
              }
            }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-emerald-500 shadow-2xs"
          >
            <option value="OFFICER">🏢 Extension Officer (All Villages)</option>
            <optgroup label="👨‍🌾 Individual Farmer Portals">
              {farmers.map(f => (
                <option key={f.id} value={`FARMER:${f.id}`}>
                  👨‍🌾 {f.name} ({f.village_name})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Active Alert Banner Pill */}
        {activeAlertsCount > 0 && userRole === 'OFFICER' && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>{activeAlertsCount} Alerts</span>
          </div>
        )}

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
};
