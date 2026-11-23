import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import {
  MapPin,
  Filter,
  Play,
  Layers,
  Thermometer,
  Droplets,
  Calendar,
  AlertTriangle,
  Compass,
  X,
  CheckCircle,
} from 'lucide-react';
import { Village, VillageDetail, RiskCategory } from '../types/api';
import { RiskBadge } from '../components/RiskBadge';
import ApiService from '../services/api';

interface RiskMapViewProps {
  villages: Village[];
  onVillageUpdated: () => void;
}

// Center around Vidarbha, Maharashtra cotton zone
const MAHARASHTRA_CENTER: [number, number] = [20.45, 77.6];

const RISK_COLORS: Record<RiskCategory, { stroke: string; fill: string; radius: number }> = {
  Critical: { stroke: '#b91c1c', fill: '#ef4444', radius: 14 },
  High: { stroke: '#c2410c', fill: '#f97316', radius: 12 },
  Moderate: { stroke: '#a16207', fill: '#eab308', radius: 10 },
  Low: { stroke: '#047857', fill: '#10b981', radius: 8 },
};

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export const RiskMapView: React.FC<RiskMapViewProps> = ({ villages, onVillageUpdated }) => {
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [villageDetail, setVillageDetail] = useState<VillageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [assessing, setAssessing] = useState<boolean>(false);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedDisease, setSelectedDisease] = useState<string>('All');

  // Extract unique districts
  const districts = ['All', ...Array.from(new Set(villages.map(v => v.district_name))).filter(Boolean)];
  const diseases = ['All', 'Pink Bollworm', 'Bacterial Blight', 'Cotton Leaf Curl Virus', 'Grey Mildew'];
  const risks = ['All', 'Critical', 'High', 'Moderate', 'Low'];

  // Filtered villages
  const filteredVillages = villages.filter(v => {
    if (selectedDistrict !== 'All' && v.district_name !== selectedDistrict) return false;
    if (selectedRisk !== 'All' && v.current_risk_category !== selectedRisk) return false;
    if (selectedDisease !== 'All' && !v.dominant_threat_disease.toLowerCase().includes(selectedDisease.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSelectVillage = async (v: Village) => {
    setSelectedVillageId(v.id);
    setLoadingDetail(true);
    try {
      const detail = await ApiService.getVillageDetail(v.id);
      setVillageDetail(detail);
    } catch (e) {
      console.error('Error fetching village detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRunAssessment = async (villageId: string) => {
    setAssessing(true);
    try {
      await ApiService.assessVillageRisk(villageId, 'Cotton', 'Pink Bollworm');
      onVillageUpdated();
      const updatedDetail = await ApiService.getVillageDetail(villageId);
      setVillageDetail(updatedDetail);
    } catch (e) {
      console.error('Failed to run risk assessment:', e);
    } finally {
      setAssessing(false);
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-100">
      {/* Top Filter Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] pointer-events-none flex flex-wrap items-center justify-between gap-3">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-lg flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <Compass className="h-4 w-4" />
            <span>GIS Surveillance Layer</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* District Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">District:</span>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
            >
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Risk Tier:</span>
            <select
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
            >
              {risks.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Disease Threat Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Threat:</span>
            <select
              value={selectedDisease}
              onChange={e => setSelectedDisease(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
            >
              {diseases.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Showing {filteredVillages.length} of {villages.length} villages
          </span>
        </div>

        {/* Legend Box */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-lg flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Low (0-25%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="text-slate-600">Moderate (26-50%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-600">High (51-75%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-slate-600">Critical (&gt;75%)</span>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={MAHARASHTRA_CENTER}
          zoom={8}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredVillages.map(v => {
            const style = RISK_COLORS[v.current_risk_category] || RISK_COLORS.Low;
            const isSelected = selectedVillageId === v.id;

            return (
              <CircleMarker
                key={v.id}
                center={[v.latitude, v.longitude]}
                radius={isSelected ? style.radius + 5 : style.radius}
                pathOptions={{
                  color: style.stroke,
                  fillColor: style.fill,
                  fillOpacity: 0.85,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => handleSelectVillage(v),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="text-xs font-sans">
                    <p className="font-bold text-slate-900">{v.name}</p>
                    <p className="text-slate-500">{v.district_name} District</p>
                    <p className="font-semibold text-emerald-700 mt-0.5">
                      Risk: {v.current_risk_score}% ({v.current_risk_category})
                    </p>
                    <p className="text-[10px] text-slate-400">Threat: {v.dominant_threat_disease}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Side Inspector Drawer for Selected Village */}
      {selectedVillageId && (
        <div className="absolute top-20 right-4 bottom-4 w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl z-[600] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                GIS
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {villageDetail?.name || 'Village Profile'}
                </h3>
                <p className="text-xs text-slate-500">
                  {villageDetail?.district_name} District • Code: {villageDetail?.code}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedVillageId(null);
                setVillageDetail(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400 text-xs">
                <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading village telemetry...</span>
              </div>
            ) : villageDetail ? (
              <>
                {/* Risk Score Highlight Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Current Disease Risk
                    </span>
                    <RiskBadge category={villageDetail.current_risk_category} score={villageDetail.current_risk_score} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-slate-900">
                        {villageDetail.current_risk_score}%
                      </span>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Dominant Threat:{' '}
                        <span className="font-bold text-amber-700">
                          {villageDetail.dominant_threat_disease}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleRunAssessment(villageDetail.id)}
                      disabled={assessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                    >
                      <Play className={`h-3 w-3 ${assessing ? 'animate-spin' : ''}`} />
                      <span>{assessing ? 'Evaluating...' : 'Run Assessment'}</span>
                    </button>
                  </div>
                </div>

                {/* Acreage & Farmers */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400">Cotton Acreage</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {villageDetail.cotton_cultivated_area_ha} ha
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Total: {villageDetail.total_cultivated_area_ha} ha
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400">Growers Monitored</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {villageDetail.monitored_farmers_count} Farmers
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Elevation: {villageDetail.elevation_m}m
                    </span>
                  </div>
                </div>

                {/* Weather Telemetry */}
                {villageDetail.weather_summary && (
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900 flex items-center gap-1">
                        <Thermometer className="h-3.5 w-3.5 text-emerald-600" />
                        Microclimate Status
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded">
                        Open-Meteo
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-1.5 bg-white rounded border border-emerald-100">
                        <p className="text-[10px] text-slate-400">7d Avg Temp</p>
                        <p className="font-bold text-slate-800">{villageDetail.weather_summary.temp_avg_7d}°C</p>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-emerald-100">
                        <p className="text-[10px] text-slate-400">7d Humidity</p>
                        <p className="font-bold text-slate-800">{villageDetail.weather_summary.humidity_avg_7d}%</p>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-emerald-100">
                        <p className="text-[10px] text-slate-400">Rainfall (7d)</p>
                        <p className="font-bold text-slate-800">{villageDetail.weather_summary.cumulative_rainfall_7d}mm</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contributing Factor Explanations */}
                {villageDetail.key_drivers && villageDetail.key_drivers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2">Key Contributing Drivers</h4>
                    <ul className="space-y-1.5">
                      {villageDetail.key_drivers.map((driver, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Field Action */}
                {villageDetail.recommended_action && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                    <span className="font-bold text-blue-900 block mb-1">Recommended Officer Action:</span>
                    <p className="text-blue-800 leading-relaxed">{villageDetail.recommended_action}</p>
                  </div>
                )}

                {/* Prediction History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Prediction History</h4>
                  <div className="space-y-1.5">
                    {villageDetail.historical_predictions.slice(0, 4).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                        <div>
                          <span className="font-semibold text-slate-700">{p.disease}</span>
                          <span className="text-[10px] text-slate-400 block">{p.date}</span>
                        </div>
                        <RiskBadge category={p.category} score={p.risk_percentage} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
