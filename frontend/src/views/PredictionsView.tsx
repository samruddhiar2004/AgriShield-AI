import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Village, PredictionResult } from '../types/api';
import { RiskBadge } from '../components/RiskBadge';
import ApiService from '../services/api';

interface PredictionsViewProps {
  villages: Village[];
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({ villages }) => {
  const [selectedVillageId, setSelectedVillageId] = useState<string>(villages[0]?.id || '');
  const [growthStage, setGrowthStage] = useState<string>('Flowering');
  const [targetDisease, setTargetDisease] = useState<string>('Pink Bollworm');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await ApiService.getPredictionHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunPrediction = async () => {
    setEvaluating(true);
    setBatchResult(null);
    try {
      const result = await ApiService.predictRisk({
        village_id: selectedVillageId,
        crop_name: 'Cotton',
        growth_stage: growthStage,
        target_disease: targetDisease,
      });
      setPrediction(result);
      await loadHistory();
    } catch (e) {
      console.error('Prediction failed:', e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRunBatch = async () => {
    setBatchRunning(true);
    try {
      const res = await ApiService.runBatchPredictions();
      setBatchResult(`Batch risk assessment completed successfully for ${res.assessed_villages_count} monitored villages.`);
      await loadHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setBatchRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">On-Demand Outbreak Risk Inference</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
              XGBoost + SHAP Explainability
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates 10-step sequence: microclimate, crop phenology, spatial cluster decay & verified surveillance
          </p>
        </div>

        <button
          onClick={handleRunBatch}
          disabled={batchRunning}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${batchRunning ? 'animate-spin' : ''}`} />
          <span>{batchRunning ? 'Computing Batch Grid...' : 'Run Full Grid Batch Inference'}</span>
        </button>
      </div>

      {batchResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{batchResult}</span>
        </div>
      )}

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inference Configuration Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Inference Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Village</label>
              <select
                value={selectedVillageId}
                onChange={e => setSelectedVillageId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500 font-medium"
              >
                {villages.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.district_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Crop Growth Stage</label>
              <select
                value={growthStage}
                onChange={e => setGrowthStage(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500 font-medium"
              >
                <option value="Seedling">Seedling (0.3x vulnerability)</option>
                <option value="Vegetative">Vegetative (0.4x vulnerability)</option>
                <option value="Squaring">Squaring (0.8x vulnerability)</option>
                <option value="Flowering">Flowering (1.6x vulnerability - Peak)</option>
                <option value="Boll Formation">Boll Formation (1.8x vulnerability - Peak)</option>
                <option value="Maturity">Maturity (0.2x vulnerability)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Pathogen / Insect</label>
              <select
                value={targetDisease}
                onChange={e => setTargetDisease(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500 font-medium"
              >
                <option value="Pink Bollworm">Pink Bollworm (Pectinophora gossypiella)</option>
                <option value="Bacterial Blight">Bacterial Blight (Xanthomonas malvacearum)</option>
                <option value="Cotton Leaf Curl Virus">Cotton Leaf Curl Virus (Begomovirus)</option>
                <option value="Grey Mildew">Grey Mildew (Ramularia areola)</option>
              </select>
            </div>

            <button
              onClick={handleRunPrediction}
              disabled={evaluating}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <Play className={`h-4 w-4 ${evaluating ? 'animate-spin' : ''}`} />
              <span>{evaluating ? 'Running 10-Step Risk Engine...' : 'Run Risk Inference'}</span>
            </button>
          </div>
        </div>

        {/* Prediction Results & SHAP Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          {prediction ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{prediction.village_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {prediction.crop_name} • Threat: <span className="text-amber-800 font-bold">{prediction.disease_name}</span>
                  </p>
                </div>
                <RiskBadge category={prediction.risk_category} score={prediction.risk_percentage} size="lg" />
              </div>

              {/* Score Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-center">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Outbreak Probability</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{prediction.outbreak_probability}</p>
                  <span className="text-[10px] text-slate-500">
                    Range: [{prediction.confidence_range[0]} - {prediction.confidence_range[1]}]
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-center">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Active ML Model</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{prediction.model_used}</p>
                  <span className="text-[10px] text-slate-400 font-mono">{prediction.model_version}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-center">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Risk Classification</span>
                  <p className="text-sm font-bold text-emerald-800 mt-1">{prediction.risk_category}</p>
                  <span className="text-[10px] text-slate-400">Calibrated Threshold</span>
                </div>
              </div>

              {/* SHAP Feature Contribution Waterfall */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Top Contributing Risk Drivers (SHAP Local Importance)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Feature impact on log-odds</span>
                </h4>
                <div className="space-y-2">
                  {prediction.top_contributing_factors.map(factor => (
                    <div
                      key={factor.feature_name}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {factor.direction === 'INCREASES_RISK' ? (
                          <ArrowUpRight className="h-4 w-4 text-red-500 shrink-0" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-800">{factor.description}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {factor.feature_name}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`font-bold font-mono text-xs ${
                          factor.direction === 'INCREASES_RISK' ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {factor.direction === 'INCREASES_RISK' ? '+' : '-'}
                        {factor.contribution_weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Field Inspection Protocol */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <span className="font-bold text-emerald-900 block mb-0.5">Recommended Field Action:</span>
                <p className="text-emerald-800 leading-relaxed">{prediction.recommended_action}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Ready for Risk Inference</p>
                <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                  Select a village, growth stage and target disease, then click 'Run Risk Inference' to compute real-time probability.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Inference Records */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Historical Risk Inference Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Village</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Threat</th>
                <th className="py-2.5 px-3">Probability</th>
                <th className="py-2.5 px-3">Risk Tier</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.slice(0, 8).map(h => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{h.village_name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{h.district_name}</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-800">{h.disease}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{h.outbreak_probability}</td>
                  <td className="py-2.5 px-3">
                    <RiskBadge category={h.risk_category} score={h.risk_percentage} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{h.prediction_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
