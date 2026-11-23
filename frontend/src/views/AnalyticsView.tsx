import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Award,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ModelBenchmark } from '../types/api';
import ApiService from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<ModelBenchmark[]>([]);
  const [featureImportance, setFeatureImportance] = useState<Array<{ feature: string; importance: number; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      ApiService.getModelBenchmarks(),
      ApiService.getGlobalFeatureImportance(),
    ])
      .then(([models, feats]) => {
        setBenchmarks(models);
        setFeatureImportance(feats);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const chartData = featureImportance.map(f => ({
    name: f.name,
    importance: Math.round(f.importance * 100),
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Machine Learning Benchmarks & Model Registry</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
              Scikit-Learn & XGBoost Core
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical evaluation of 3 algorithms calibrated against historical pest surveillance datasets
          </p>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Cross-Model Performance Matrix</h3>
          <span className="text-xs text-slate-400">80/20 Stratified Validation</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Algorithm</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">ROC-AUC</th>
              <th className="py-3 px-4">F1-Score</th>
              <th className="py-3 px-4">Precision</th>
              <th className="py-3 px-4">Recall (Sensitivity)</th>
              <th className="py-3 px-4">Brier Score</th>
              <th className="py-3 px-4">Version</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {benchmarks.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{m.model_name}</span>
                </td>
                <td className="py-3 px-4">
                  {m.is_active ? (
                    <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                      Primary Active
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full text-[10px]">
                      Registered
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.roc_auc}</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-700">{m.f1_score}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{m.precision_score}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{m.recall_score}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{m.brier_score}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{m.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Feature Importance & Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SHAP Feature Importance Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Global SHAP Feature Importance</h3>
              <p className="text-xs text-slate-500">Relative impact of agro-meteorological variables on outbreak risk</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
              Mean (|SHAP|)
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 35]} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="importance" name="Contribution (%)" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainability & Calibration Guide */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Model Calibration & Epidemiological Rationale</h3>
            <p className="text-xs text-slate-500 mb-4">
              Why the ensemble emphasizes high-recall and probability calibration
            </p>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">1. Asymmetric Cost of False Negatives</span>
                <p>
                  In crop protection, an unpredicted outbreak (False Negative) can lead to complete locule damage in cotton bolls. The model threshold is calibrated for high sensitivity (&gt;85% recall) to prioritize early warning triggers.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">2. Phenology Stage Weighting</span>
                <p>
                  Flowering and green boll stages carry a 1.6x - 1.8x vulnerability multiplier based on Pink Bollworm oviposition biology, aligning model predictions with ICAR-CICR guidelines.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">3. Spatial Distance Decay</span>
                <p>
                  Surrounding positive pheromone trap catches and verified farmer field observations within a 15km cluster decay spatially to elevate neighboring village vulnerability.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Serialization: Joblib 1.6.0</span>
            <span>SHAP TreeExplainer Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
