import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, MapPin, Phone, CheckCircle, X } from 'lucide-react';
import { Farmer, Farm, Village } from '../types/api';
import ApiService from '../services/api';

interface FarmersViewProps {
  villages: Village[];
}

export const FarmersView: React.FC<FarmersViewProps> = ({ villages }) => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'farmers' | 'farms'>('farmers');

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newVillageId, setNewVillageId] = useState<string>(villages[0]?.id || '');
  const [newArea, setNewArea] = useState<number>(2.5);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [farmersData, farmsData] = await Promise.all([
        ApiService.getFarmers(),
        ApiService.getFarms(),
      ]);
      setFarmers(farmersData);
      setFarms(farmsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const code = `FMR-MH-${(farmers.length + 1).toString().padStart(3, '0')}`;
      await ApiService.createFarmer({
        farmer_id_code: code,
        name: newName,
        contact_number: newPhone,
        village_id: newVillageId,
        total_land_area_ha: Number(newArea),
      });
      setShowModal(false);
      setNewName('');
      setNewPhone('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFarmers = farmers.filter(
    f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.farmer_id_code.toLowerCase().includes(search.toLowerCase()) ||
      (f.village_name && f.village_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Growers & Landholding Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered cotton farmers and mapped farm survey parcels across Maharashtra
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID or village..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-emerald-500"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Grower</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('farmers')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'farmers'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Grower Profiles ({farmers.length})
        </button>
        <button
          onClick={() => setActiveTab('farms')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'farms'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Surveyed Plots ({farms.length})
        </button>
      </div>

      {/* Farmers Table */}
      {activeTab === 'farmers' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Farmer ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Total Land</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Plots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFarmers.map(farmer => (
                <tr key={farmer.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-800">{farmer.farmer_id_code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{farmer.name}</td>
                  <td className="py-3 px-4 text-slate-700">{farmer.village_name}</td>
                  <td className="py-3 px-4 text-slate-500">{farmer.district_name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{farmer.total_land_area_ha} ha</td>
                  <td className="py-3 px-4 text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{farmer.contact_number}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{farmer.farms_count} parcel(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Farms Table */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Survey Gat No.</th>
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">Acreage</th>
                <th className="py-3 px-4">Soil Type</th>
                <th className="py-3 px-4">Growth Stage</th>
                <th className="py-3 px-4">Coordinates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {farms.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">{f.survey_number}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{f.farmer_name}</td>
                  <td className="py-3 px-4 text-slate-700">{f.village_name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{f.area_hectares} ha</td>
                  <td className="py-3 px-4 text-slate-600">{f.soil_type}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {f.current_growth_stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Farmer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Register New Farmer</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterFarmer} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dattatray Shinde"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Contact Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91-98XXXXXXXX"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Village</label>
                <select
                  value={newVillageId}
                  onChange={e => setNewVillageId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                >
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.district_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Total Cultivated Area (Hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  required
                  value={newArea}
                  onChange={e => setNewArea(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
