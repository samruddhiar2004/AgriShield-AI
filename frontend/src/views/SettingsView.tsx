import React, { useState, useEffect } from 'react';
import { Sliders, Database, Bell, Save, CheckCircle, Server, ShieldCheck } from 'lucide-react';
import ApiService from '../services/api';

export const SettingsView: React.FC = () => {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Editable threshold state
  const [lowMax, setLowMax] = useState<number>(25);
  const [moderateMax, setModerateMax] = useState<number>(50);
  const [highMax, setHighMax] = useState<number>(75);
  const [criticalMax, setCriticalMax] = useState<number>(100);

  // Notifications
  const [inApp, setInApp] = useState<boolean>(true);
  const [smsGateway, setSmsGateway] = useState<boolean>(false);
  const [emailDigest, setEmailDigest] = useState<boolean>(false);

  useEffect(() => {
    ApiService.getSettings()
      .then(res => {
        setSettingsData(res);
        const thresh = res.config?.risk_thresholds;
        if (thresh) {
          setLowMax(thresh.low_max || 25);
          setModerateMax(thresh.moderate_max || 50);
          setHighMax(thresh.high_max || 75);
          setCriticalMax(thresh.critical_max || 100);
        }
        const notifs = res.config?.alert_notifications;
        if (notifs) {
          setInApp(notifs.in_app_enabled ?? true);
          setSmsGateway(notifs.sms_gateway_enabled ?? false);
          setEmailDigest(notifs.email_digest_enabled ?? false);
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.updateSettings({
        risk_thresholds: {
          low_max: lowMax,
          moderate_max: moderateMax,
          high_max: highMax,
          critical_max: criticalMax,
        },
        alert_notifications: {
          in_app_enabled: inApp,
          sms_gateway_enabled: smsGateway,
          email_digest_enabled: emailDigest,
        },
      });
      setSavedMessage('Platform thresholds and notification preferences updated successfully.');
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Platform Settings & Governance</h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
              Configurable Thresholds
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure risk tolerance cutoffs, dispatch policies, and inspect PostGIS database connectivity
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Thresholds */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <span>Configurable Risk Category Cutoffs (%)</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Low Risk Ceiling: {lowMax}%</span>
                <span className="text-slate-400">Baseline Safe Zone (0 - {lowMax}%)</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={lowMax}
                onChange={e => setLowMax(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Moderate Risk Ceiling: {moderateMax}%</span>
                <span className="text-slate-400">Routine Scouting Zone ({lowMax + 1} - {moderateMax}%)</span>
              </div>
              <input
                type="range"
                min="35"
                max="65"
                value={moderateMax}
                onChange={e => setModerateMax(Number(e.target.value))}
                className="w-full accent-yellow-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>High Risk Ceiling: {highMax}%</span>
                <span className="text-slate-400">Trigger Alert Warning ({moderateMax + 1} - {highMax}%)</span>
              </div>
              <input
                type="range"
                min="60"
                max="85"
                value={highMax}
                onChange={e => setHighMax(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Critical Risk Ceiling: 100%</span>
                <span className="text-slate-400">Emergency Bio-control Zone (&gt;{highMax}%)</span>
              </div>
              <div className="h-2 bg-red-500 rounded-full w-full" />
            </div>
          </div>

          {/* Notification Gateway Preferences */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <span>Outbreak Alert Dispatch Channels</span>
            </h4>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inApp}
                  onChange={e => setInApp(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">In-App Command Dashboard Alerts (Enabled)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsGateway}
                  onChange={e => setSmsGateway(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700">mKisan / National SMS Gateway Integration (Kisan SMS)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailDigest}
                  onChange={e => setEmailDigest(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700">Daily Agronomic Officer Email Digest</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>

        {/* Database & PostGIS Status Inspector */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>Infrastructure Status</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1.5">
              <span className="text-slate-400 block font-medium">Storage Engine</span>
              <p className="font-bold text-slate-800">
                {settingsData?.database?.dialect === 'postgresql'
                  ? 'PostgreSQL 15 (Enterprise RDBMS)'
                  : 'SQLite (Portable Embedded Execution)'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Connected & Healthy</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1.5">
              <span className="text-slate-400 block font-medium">PostGIS Spatial Extension</span>
              <p className="font-bold text-slate-800">
                {settingsData?.database?.postgis_enabled
                  ? `Active (${settingsData.database.postgis_version})`
                  : 'GeoJSON & Spatial Euclidean Fallback'}
              </p>
              <p className="text-[11px] text-slate-500">
                {settingsData?.database?.details}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1.5">
              <span className="text-slate-400 block font-medium">Azure Cloud Compatibility</span>
              <p className="font-bold text-slate-800">Azure Static Web Apps + Container Apps</p>
              <span className="text-[11px] text-slate-500 block">
                Docker images optimized with multi-stage builds.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
