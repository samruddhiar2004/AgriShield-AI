import React, { useState, useEffect } from 'react';
import {
  Sprout,
  ShieldAlert,
  Thermometer,
  Droplets,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Compass,
  FileText,
  Clock,
  XCircle,
  X,
  User,
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import ApiService from '../services/api';

interface FarmerPortalViewProps {
  farmerId: string;
  onSwitchToOfficer: () => void;
}

export const FarmerPortalView: React.FC<FarmerPortalViewProps> = ({
  farmerId,
  onSwitchToOfficer,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Report modal
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [symptoms, setSymptoms] = useState<string>('');
  const [affectedPct, setAffectedPct] = useState<number>(10);
  const [severity, setSeverity] = useState<string>('High');
  const [suspectedDisease, setSuspectedDisease] = useState<string>('Pink Bollworm');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadPortalData();
  }, [farmerId]);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getFarmerPortalData(farmerId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepNum: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    try {
      await ApiService.submitReport({
        farmer_name: data.farmer.name,
        farmer_id_code: data.farmer.farmer_id_code,
        village_id: data.farmer.village_id,
        crop_name: 'Cotton',
        crop_growth_stage: data.primary_plot.current_growth_stage,
        suspected_disease_name: suspectedDisease,
        symptoms,
        affected_plants_pct: affectedPct,
        severity,
      });
      setReportSuccess(true);
      setShowReportModal(false);
      setSymptoms('');
      await loadPortalData();
      setTimeout(() => setReportSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Opening your personalized farm dashboard...</p>
      </div>
    );
  }

  const { farmer, primary_plot, plot_risk, action_protocol, local_weather, my_reports } = data;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
            <Sprout className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded font-mono font-medium">
                Farmer ID: {farmer.farmer_id_code}
              </span>
              <span className="text-xs text-emerald-200/80">• Survey {primary_plot.survey_number}</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Namaste, {farmer.name}!</h1>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              {farmer.village_name}, {farmer.district_name} • {primary_plot.area_hectares} Hectares ({primary_plot.soil_type})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Report Plant Symptoms</span>
          </button>
        </div>
      </div>

      {reportSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Observation report submitted successfully! It has been dispatched to your Agricultural Officer for validation.</span>
        </div>
      )}

      {/* Main Grid: Personalized Risk & Field Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Plot Risk Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Your Cotton Plot Disease Threat</h2>
            </div>
            <RiskBadge category={plot_risk.risk_category} score={plot_risk.risk_score} size="lg" />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 font-medium">Dominant Active Pathogen / Pest</span>
              <p className="text-lg font-bold text-slate-900">{plot_risk.dominant_threat}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Crop Phenology: <span className="font-semibold text-emerald-700">{primary_plot.current_growth_stage} Stage</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-slate-900">{plot_risk.risk_score}%</span>
              <span className="block text-[11px] text-slate-400">Outbreak Probability</span>
            </div>
          </div>

          {/* Contributing Drivers */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-2">Why Is Risk Elevated In Your Sector?</h3>
            <ul className="space-y-1.5">
              {plot_risk.key_drivers.map((driver: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hyperlocal Weather for Farmer's Field */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Your Field Weather</h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                Live Open-Meteo
              </span>
            </div>
            <p className="text-xs text-slate-500">{farmer.village_name} Microclimate</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Thermometer className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400">Temperature</span>
                <p className="text-base font-bold text-slate-800">{local_weather.temp_c}°C</p>
                <span className="text-[10px] text-slate-400">7d Avg: {local_weather.temp_7d_avg}°C</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400">Humidity</span>
                <p className="text-base font-bold text-slate-800">{local_weather.humidity_pct}%</p>
                <span className="text-[10px] text-slate-400">Rain (7d): {local_weather.rainfall_7d_mm}mm</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
            <span className="font-bold text-emerald-900 block mb-0.5">Microclimate Status:</span>
            <p className="text-emerald-800">{local_weather.summary}</p>
          </div>
        </div>
      </div>

      {/* Action Protocol Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Recommended Actions For Your Farm Today</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ICAR-CICR approved agronomic inspection & non-pesticide bio-control steps for {primary_plot.current_growth_stage} cotton
          </p>
        </div>

        <div className="space-y-2.5">
          {action_protocol.map((step: any) => {
            const isDone = !!completedSteps[step.step];
            return (
              <div
                key={step.step}
                onClick={() => toggleStep(step.step)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/60'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900">Step {step.step}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                        step.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {step.priority}
                    </span>
                  </div>
                  <p className={`leading-relaxed ${isDone ? 'line-through text-emerald-700' : 'text-slate-700'}`}>
                    {step.action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Farmer's Past Reports & Verification Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Field Observation History</h2>
            <p className="text-xs text-slate-500">Track verification status from your Agricultural Officer</p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            + New Observation
          </button>
        </div>

        {my_reports.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
            <p>You have not submitted any symptom observations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Symptoms Observed</th>
                  <th className="py-2.5 px-3">Affected Plants</th>
                  <th className="py-2.5 px-3">Verification Status</th>
                  <th className="py-2.5 px-3">Officer Review Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {my_reports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{r.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.stage}</td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs">{r.symptoms}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{r.affected_pct}%</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status === 'VERIFIED' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : r.status === 'REJECTED' ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 italic">
                      {r.officer_notes || 'Pending officer inspection'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Report Symptoms on Plot {primary_plot.survey_number}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Suspected Pest / Pathogen</label>
                <select
                  value={suspectedDisease}
                  onChange={e => setSuspectedDisease(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                >
                  <option value="Pink Bollworm">Pink Bollworm (Caterpillar in bolls)</option>
                  <option value="Bacterial Blight">Bacterial Blight (Water-soaked angular leaf spots)</option>
                  <option value="Cotton Leaf Curl Virus">Cotton Leaf Curl Virus (Curled leaves, whiteflies)</option>
                  <option value="Grey Mildew">Grey Mildew (White powdery underside patches)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approx Affected Plants (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={affectedPct}
                    onChange={e => setAffectedPct(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Observed Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Describe What You Saw on the Crop</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Dissected 5 green bolls and saw small pink worms inside locules..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Send Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
