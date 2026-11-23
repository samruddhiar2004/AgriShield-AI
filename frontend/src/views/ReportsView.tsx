import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, XCircle, Clock, AlertCircle, Check, X } from 'lucide-react';
import { FarmerReport, Village } from '../types/api';
import ApiService from '../services/api';

interface ReportsViewProps {
  villages: Village[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ villages }) => {
  const [reports, setReports] = useState<FarmerReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [farmerName, setFarmerName] = useState<string>('');
  const [selectedVillageId, setSelectedVillageId] = useState<string>(villages[0]?.id || '');
  const [growthStage, setGrowthStage] = useState<string>('Flowering');
  const [suspectedDisease, setSuspectedDisease] = useState<string>('Pink Bollworm');
  const [symptoms, setSymptoms] = useState<string>('');
  const [affectedPct, setAffectedPct] = useState<number>(10);
  const [severity, setSeverity] = useState<string>('High');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Review Modal
  const [reviewReport, setReviewReport] = useState<FarmerReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewing, setReviewing] = useState<boolean>(false);

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getReports(filterStatus !== 'ALL' ? filterStatus : undefined);
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.submitReport({
        farmer_name: farmerName,
        village_id: selectedVillageId,
        crop_name: 'Cotton',
        crop_growth_stage: growthStage,
        suspected_disease_name: suspectedDisease,
        symptoms,
        affected_plants_pct: affectedPct,
        severity,
      });
      setShowSubmitModal(false);
      setFarmerName('');
      setSymptoms('');
      await loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAction = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!reviewReport) return;
    setReviewing(true);
    try {
      await ApiService.reviewReport(reviewReport.id, status, reviewNotes || `Reviewed and ${status.toLowerCase()} by Agricultural Officer.`);
      setReviewReport(null);
      setReviewNotes('');
      await loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Field Symptom Observations & Validation</h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
              Extension Officer Review
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Observations submitted by growers and field scouts. Verified records directly recalibrate village risk.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">Verified Case</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Observation</span>
          </button>
        </div>
      </div>

      {/* Reports Feed Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Village</th>
              <th className="py-3 px-4">Grower</th>
              <th className="py-3 px-4">Suspected Disease</th>
              <th className="py-3 px-4">Phenology Stage</th>
              <th className="py-3 px-4">Affected Plants</th>
              <th className="py-3 px-4">Reported Symptoms</th>
              <th className="py-3 px-4">Validation Status</th>
              <th className="py-3 px-4 text-right">Officer Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{r.village_name}</td>
                <td className="py-3 px-4 text-slate-700">{r.farmer_name}</td>
                <td className="py-3 px-4 font-semibold text-amber-800">{r.suspected_disease_name}</td>
                <td className="py-3 px-4 text-slate-600">{r.crop_growth_stage}</td>
                <td className="py-3 px-4 font-medium text-slate-800">
                  <span className="font-bold">{r.affected_plants_pct}%</span> ({r.severity})
                </td>
                <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={r.symptoms}>
                  {r.symptoms}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
                <td className="py-3 px-4 text-right">
                  {r.status === 'PENDING' ? (
                    <button
                      onClick={() => {
                        setReviewReport(r);
                        setReviewNotes('');
                      }}
                      className="px-2.5 py-1 bg-slate-800 text-white rounded font-medium text-[11px] hover:bg-slate-900 transition-colors"
                    >
                      Review
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {r.officer_review_notes ? 'Reviewed' : 'Validated'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Report Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Submit Field Disease Observation</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Farmer / Observer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={farmerName}
                    onChange={e => setFarmerName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Village Location</label>
                  <select
                    value={selectedVillageId}
                    onChange={e => setSelectedVillageId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                  >
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.district_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Crop Growth Stage</label>
                  <select
                    value={growthStage}
                    onChange={e => setGrowthStage(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                  >
                    <option value="Seedling">Seedling</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Squaring">Squaring</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Boll Formation">Boll Formation</option>
                    <option value="Maturity">Maturity</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Suspected Pathogen</label>
                  <select
                    value={suspectedDisease}
                    onChange={e => setSuspectedDisease(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                  >
                    <option value="Pink Bollworm">Pink Bollworm</option>
                    <option value="Bacterial Blight">Bacterial Blight</option>
                    <option value="Cotton Leaf Curl Virus">Cotton Leaf Curl Virus</option>
                    <option value="Grey Mildew">Grey Mildew</option>
                  </select>
                </div>
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
                <label className="font-semibold text-slate-700 block mb-1">Detailed Field Symptoms & Damage Observed</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe rosetted flowers, leaf spot shape, discoloration, larva presence..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Officer Modal */}
      {reviewReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Review Field Observation</h3>
              <button onClick={() => setReviewReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <p><span className="font-semibold text-slate-700">Village:</span> {reviewReport.village_name}</p>
                <p><span className="font-semibold text-slate-700">Farmer:</span> {reviewReport.farmer_name}</p>
                <p><span className="font-semibold text-slate-700">Suspected:</span> {reviewReport.suspected_disease_name}</p>
                <p><span className="font-semibold text-slate-700">Symptoms:</span> {reviewReport.symptoms}</p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Agricultural Officer Verification Notes</label>
                <textarea
                  rows={2}
                  placeholder="Enter diagnostic confirmation, trap catch correlation or rejection rationale..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReviewAction('REJECTED')}
                className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold hover:bg-red-100"
              >
                Reject Observation
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReviewAction('VERIFIED')}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                {reviewing ? 'Validating...' : 'Verify Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
