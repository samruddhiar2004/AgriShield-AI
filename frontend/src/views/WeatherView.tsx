import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  AlertCircle,
  TrendingUp,
  RefreshCw,
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
} from 'recharts';
import { Village, WeatherSummary } from '../types/api';
import ApiService from '../services/api';

interface WeatherViewProps {
  villages: Village[];
}

export const WeatherView: React.FC<WeatherViewProps> = ({ villages }) => {
  const [selectedVillageId, setSelectedVillageId] = useState<string>(villages[0]?.id || '');
  const [weatherData, setWeatherData] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedVillageId) {
      loadWeather(selectedVillageId);
    }
  }, [selectedVillageId]);

  const loadWeather = async (id: string) => {
    setLoading(true);
    try {
      const data = await ApiService.getVillageWeather(id);
      setWeatherData(data);
    } catch (e) {
      console.error('Failed to load weather:', e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = weatherData?.observations_history
    ? [...weatherData.observations_history].reverse().map(obs => ({
        date: obs.observation_date.slice(5),
        temperature: obs.temperature_c,
        humidity: obs.relative_humidity_pct,
        rainfall: obs.rainfall_mm,
      }))
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Village Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Agro-Meteorological Surveillance</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
              Open-Meteo REST API
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time rolling temperature, relative humidity and precipitation indices for cotton microclimates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Select Village:</label>
          <select
            value={selectedVillageId}
            onChange={e => setSelectedVillageId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
          >
            {villages.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.district_name})
              </option>
            ))}
          </select>
          <button
            onClick={() => loadWeather(selectedVillageId)}
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {weatherData && (
        <>
          {/* Key Weather Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 7-Day Temperature */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">7-Day Avg Temp</span>
                <Thermometer className="h-5 w-5 text-amber-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{weatherData.temp_avg_7d}°C</span>
                <span className="text-xs text-slate-500">Current: {weatherData.current_temperature_c}°C</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">3-day average: {weatherData.temp_avg_3d}°C</p>
            </div>

            {/* 7-Day Humidity */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">7-Day Avg Humidity</span>
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{weatherData.humidity_avg_7d}%</span>
                <span className="text-xs text-slate-500">Current: {weatherData.current_humidity_pct}%</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">3-day average: {weatherData.humidity_avg_3d}%</p>
            </div>

            {/* Cumulative Rainfall */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Cumulative Rainfall (7d)</span>
                <CloudRain className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{weatherData.cumulative_rainfall_7d} mm</span>
                <span className="text-xs text-slate-500">Today: {weatherData.current_rainfall_mm} mm</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Soil moisture saturation trigger</p>
            </div>

            {/* Microclimate Conducive Index */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Conducive Index</span>
                <TrendingUp className="h-5 w-5 text-red-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{weatherData.conducive_index}</span>
                <span className="text-xs text-slate-400">/ 1.00</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-amber-700">{weatherData.risk_assessment}</p>
            </div>
          </div>

          {/* Meteorological Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature & Humidity Trends */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Temperature & Relative Humidity Trend</h3>
              <p className="text-xs text-slate-500 mb-4">Past 7 days observations for {weatherData.village_name}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#f59e0b" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2.5} />
                    <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Precipitation Daily Histogram */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Daily Rainfall Distribution</h3>
              <p className="text-xs text-slate-500 mb-4">Precipitation events promoting foliar fungal & bacterial sporulation</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="rainfall" name="Rainfall (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
