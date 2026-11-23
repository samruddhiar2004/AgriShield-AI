import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewView } from './views/OverviewView';
import { RiskMapView } from './views/RiskMapView';
import { WeatherView } from './views/WeatherView';
import { CropMonitoringView } from './views/CropMonitoringView';
import { FarmersView } from './views/FarmersView';
import { ReportsView } from './views/ReportsView';
import { PredictionsView } from './views/PredictionsView';
import { AlertsView } from './views/AlertsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { DataIngestionView } from './views/DataIngestionView';
import { FarmerPortalView } from './views/FarmerPortalView';
import { DashboardStats, Village, Farmer } from './types/api';
import ApiService from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [villages, setVillages] = useState<Village[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Role & Persona State
  const [userRole, setUserRole] = useState<'OFFICER' | 'FARMER'>('OFFICER');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [statsData, villagesData, farmersData] = await Promise.all([
        ApiService.getDashboardStats(),
        ApiService.getVillages(),
        ApiService.getFarmers(),
      ]);
      setStats(statsData);
      setVillages(villagesData);
      setFarmers(farmersData);
      if (farmersData.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(farmersData[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [statsData, villagesData, farmersData] = await Promise.all([
        ApiService.getDashboardStats(),
        ApiService.getVillages(),
        ApiService.getFarmers(),
      ]);
      setStats(statsData);
      setVillages(villagesData);
      setFarmers(farmersData);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRoleChange = (newRole: 'OFFICER' | 'FARMER', farmerId?: string) => {
    setUserRole(newRole);
    if (newRole === 'FARMER') {
      if (farmerId) setSelectedFarmerId(farmerId);
      setCurrentTab('farmer_portal');
    } else {
      setCurrentTab('overview');
    }
  };

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        activeAlertsCount={stats?.active_disease_alerts || 0}
        userRole={userRole}
        selectedFarmerName={selectedFarmer?.name || 'Rameshwar Patil'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          currentTab={currentTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          activeAlertsCount={stats?.active_disease_alerts || 0}
          userRole={userRole}
          onRoleChange={handleRoleChange}
          farmers={farmers}
          selectedFarmerId={selectedFarmerId}
        />

        <main className="flex-1 overflow-y-auto bg-slate-100/60">
          {/* Farmer Portal View */}
          {currentTab === 'farmer_portal' && (
            <FarmerPortalView
              farmerId={selectedFarmerId || (farmers[0]?.id ?? '')}
              onSwitchToOfficer={() => handleRoleChange('OFFICER')}
            />
          )}

          {/* Officer Dashboard Views */}
          {currentTab === 'overview' && (
            <OverviewView
              stats={stats}
              loading={loading}
              onNavigateToMap={() => setCurrentTab('map')}
              onNavigateToAlerts={() => setCurrentTab('alerts')}
              onNavigateToReports={() => setCurrentTab('reports')}
            />
          )}

          {currentTab === 'map' && (
            <RiskMapView
              villages={villages}
              onVillageUpdated={handleRefresh}
            />
          )}

          {currentTab === 'weather' && (
            <WeatherView villages={villages} />
          )}

          {currentTab === 'crops' && (
            <CropMonitoringView />
          )}

          {currentTab === 'farmers' && (
            <FarmersView villages={villages} />
          )}

          {currentTab === 'reports' && (
            <ReportsView villages={villages} />
          )}

          {currentTab === 'predictions' && (
            <PredictionsView villages={villages} />
          )}

          {currentTab === 'alerts' && (
            <AlertsView />
          )}

          {currentTab === 'ingest' && (
            <DataIngestionView onIngestionComplete={handleRefresh} />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
