import React from 'react';
import {
  Users,
  MapPin,
  AlertTriangle,
  Activity,
  CloudRain,
  ShieldAlert,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardStats } from '../types/api';
import { RiskBadge } from '../components/RiskBadge';

interface OverviewViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigateToMap: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToReports: () => void;
}

const PIE_COLORS: Record<string, string> = {
  Low: '#10b981',
  Moderate: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  loading,
  onNavigateToMap,
  onNavigateToAlerts,
  onNavigateToReports,
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading regional agricultural intelligence...</p>
        </div>
      </div>
    );
  }

  const pieData = Object.entries(stats.risk_category_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Villages */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monitored Villages</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total_monitored_villages}</span>
            <span className="text-xs text-slate-500">across 7 districts</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Cotton surveillance grid</p>
        </div>

        {/* Regional Outbreak Risk */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Regional Avg Risk</span>
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.average_regional_risk_pct}%</span>
            <RiskBadge category={stats.average_regional_risk_pct > 50 ? 'High' : 'Moderate'} size="sm" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Microclimate-adjusted score</p>
        </div>

        {/* Active Disease Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer" onClick={onNavigateToAlerts}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Outbreak Alerts</span>
            <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">{stats.active_disease_alerts}</span>
            <span className="text-xs text-red-600 font-medium">{stats.high_risk_villages_count} High Risk</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>Click to inspect alerts</span>
            <ExternalLink className="h-3 w-3" />
          </p>
        </div>

        {/* Registered Farmers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Growers</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total_registered_farmers}</span>
            <span className="text-xs text-slate-500">{stats.total_monitored_farms} farm plots</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">9,450 hectares under monitor</p>
        </div>
      </div>

      {/* Regional Weather Indicator Banner */}
      <div className="bg-emerald-900 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
            <CloudRain className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Vidarbha & Marathwada Agro-Microclimate</h3>
              <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/20 font-medium">
                Open-Meteo Synced
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">{stats.weather_overview.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-xs text-emerald-300/80">Avg Temperature</p>
            <p className="text-lg font-bold text-white">{stats.weather_overview.avg_temperature_c}°C</p>
          </div>
          <div className="h-8 w-px bg-emerald-800" />
          <div>
            <p className="text-xs text-emerald-300/80">Relative Humidity</p>
            <p className="text-lg font-bold text-white">{stats.weather_overview.avg_relative_humidity_pct}%</p>
          </div>
          <div className="h-8 w-px bg-emerald-800" />
          <div>
            <p className="text-xs text-emerald-300/80">Regional Rainfall (7d)</p>
            <p className="text-lg font-bold text-white">{stats.weather_overview.total_regional_rainfall_mm} mm</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outbreak Trends Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Disease Outbreak Trends & Risk Index</h3>
              <p className="text-xs text-slate-500">Historical seasonal progression across monitored Maharashtra villages</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              Kharif Season 2026
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.disease_outbreak_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="avg_risk" name="Avg Outbreak Risk (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="incidents" name="Recorded Outbreak Incidents" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Village Risk Category Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Village Risk Categorization</h3>
              <span className="text-xs text-slate-400 font-medium">PostGIS Grid</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Distribution of 21 monitored villages across risk thresholds</p>
            
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', borderRadius: '0.5rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[item.name] }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Crop Risk Breakdown & Recent Farmer Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crop-wise Surveillance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Crop Vulnerability Matrix</h3>
          <p className="text-xs text-slate-500 mb-4">Monitored acreage and dominant pathogen threats</p>
          <div className="space-y-3">
            {stats.crop_wise_risk.map(c => (
              <div key={c.crop} className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{c.crop}</span>
                  <RiskBadge category={c.avg_risk > 60 ? 'High' : 'Moderate'} score={c.avg_risk} size="sm" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Acreage: {c.monitored_ha.toLocaleString()} ha</span>
                  <span className="font-medium text-amber-700">{c.primary_threat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Farmer Reports Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Farmer Symptom Observations</h3>
              <p className="text-xs text-slate-500">Unverified & verified field reports awaiting officer review</p>
            </div>
            <button
              onClick={onNavigateToReports}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View all reports</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3">Farmer</th>
                  <th className="py-2.5 px-3">Suspected Threat</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_farmer_reports.slice(0, 5).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.village_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.farmer_name}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{r.suspected_disease}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        r.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        r.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
