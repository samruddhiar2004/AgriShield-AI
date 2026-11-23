import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import { Alert, RiskCategory } from '../types/api';
import { RiskBadge } from '../components/RiskBadge';
import ApiService from '../services/api';

export const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [filterStatus, filterRisk]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getAlerts(
        filterStatus !== 'ALL' ? filterStatus : undefined,
        filterRisk !== 'All' ? filterRisk : undefined
      );
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (alertId: string, newStatus: 'ACKNOWLEDGED' | 'RESOLVED') => {
    setUpdatingId(alertId);
    try {
      await ApiService.updateAlertStatus(alertId, newStatus);
      await loadAlerts();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Early Warning Outbreak Notifications</h2>
            <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded border border-red-200">
              Threshold Triggered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated alerts issued to agricultural officers when probability exceeds risk tolerance (High &gt;50%, Critical &gt;75%)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
            >
              <option value="ALL">All Alerts</option>
              <option value="ACTIVE">Active Warning</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span>Risk Tier:</span>
            <select
              value={filterRisk}
              onChange={e => setFilterRisk(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
            >
              <option value="All">All Tiers</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active alerts matching your criteria</p>
            <p className="text-xs text-slate-400">All monitored cotton zones are operating within safe baseline thresholds.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border bg-white shadow-xs transition-all ${
                alert.status === 'ACTIVE'
                  ? 'border-red-200 ring-1 ring-red-500/10'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      alert.risk_category === 'Critical'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {alert.village_name} ({alert.district_name})
                      </h3>
                      <RiskBadge category={alert.risk_category} score={Math.round(alert.risk_probability * 100)} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target Threat: <span className="font-bold text-amber-800">{alert.suspected_disease}</span> • Crop: {alert.crop}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                      disabled={updatingId === alert.id}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                      disabled={updatingId === alert.id}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {alert.status === 'RESOLVED' && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Resolved</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Contributing Factors */}
              {alert.contributing_factors && alert.contributing_factors.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Critical Contributing Risk Factors:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {alert.contributing_factors.map((cf, i) => (
                      <div key={i} className="p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100 flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{cf}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Protocols */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg">
                  <span className="font-bold text-blue-900 block mb-1">Recommended Field Inspection:</span>
                  <p className="text-blue-800 leading-relaxed">{alert.recommended_inspection}</p>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                  <span className="font-bold text-emerald-900 block mb-1">Mandatory Preventive / Bio-Control Action:</span>
                  <p className="text-emerald-800 leading-relaxed">{alert.preventive_actions}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
