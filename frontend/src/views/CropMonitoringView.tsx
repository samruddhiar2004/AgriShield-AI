import React, { useState, useEffect } from 'react';
import { Sprout, ShieldAlert, Bug, Check, Info } from 'lucide-react';
import { Crop } from '../types/api';
import ApiService from '../services/api';

export const CropMonitoringView: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    ApiService.getCrops()
      .then(data => setCrops(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const primaryCrop = crops[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sprout className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{primaryCrop?.name || 'Cotton (Bt Cotton)'}</h2>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                  {primaryCrop?.scientific_name || 'Gossypium hirsutum'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary surveillance crop across Vidarbha and Marathwada agro-ecological zones
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            Active Surveillance Season
          </span>
        </div>
      </div>

      {/* Phenological Growth Stages Progression */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Cotton Phenological Growth Stages & Susceptibility</h3>
          <p className="text-xs text-slate-500">
            Outbreak risk calculation dynamically integrates stage vulnerability multipliers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {primaryCrop?.growth_stages.map(stage => {
            const isHighVulnerability = stage.susceptibility_multiplier >= 1.5;
            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border transition-all ${
                  isHighVulnerability
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Stage {stage.stage_order}: {stage.stage_name}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isHighVulnerability
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {stage.susceptibility_multiplier}x Multiplier
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{stage.description}</p>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Duration: ~{stage.duration_days} days</span>
                  <span className="font-medium text-slate-500">
                    {isHighVulnerability ? 'Peak Attack Phase' : 'Normal Monitoring'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pathogens and Bioclimatic Requirements */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Monitored Cotton Pathogens & Insect Pests</h3>
          <p className="text-xs text-slate-500">
            Epidemiological profiles and microclimate favorability triggers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {primaryCrop?.diseases.map(disease => (
            <div key={disease.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{disease.name}</h4>
                  <span className="text-[11px] text-emerald-700 font-semibold">{disease.pathogen_type}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-medium">
                  <span>Optimal: {disease.optimal_temp_min}°C - {disease.optimal_temp_max}°C</span>
                  <span className="block text-slate-400">RH &gt; {disease.optimal_humidity_min}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{disease.description}</p>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block mb-0.5">Key Field Diagnostic Symptoms:</span>
                <p className="text-xs text-slate-500 italic">{disease.symptoms}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
