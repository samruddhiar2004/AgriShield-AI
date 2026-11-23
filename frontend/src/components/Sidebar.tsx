import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  CloudSun,
  Sprout,
  Users,
  FileText,
  Cpu,
  BellRing,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';

export type NavItem =
  | 'overview'
  | 'map'
  | 'weather'
  | 'crops'
  | 'farmers'
  | 'reports'
  | 'predictions'
  | 'alerts'
  | 'analytics'
  | 'settings'
  | 'ingest'
  | 'farmer_portal';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  activeAlertsCount?: number;
  userRole?: 'OFFICER' | 'FARMER';
  selectedFarmerName?: string;
}

interface MenuItem {
  id: NavItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeAlertsCount = 0,
  userRole = 'OFFICER',
  selectedFarmerName = 'Rameshwar Patil',
}) => {
  const officerMenuItems: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Disease Risk Map', icon: MapPin },
    { id: 'weather', label: 'Weather Intelligence', icon: CloudSun },
    { id: 'crops', label: 'Crop Monitoring', icon: Sprout },
    { id: 'farmers', label: 'Farmers & Plots', icon: Users },
    { id: 'reports', label: 'Disease Reports', icon: FileText },
    { id: 'predictions', label: 'Predictions Engine', icon: Cpu },
    { id: 'alerts', label: 'Alerts & Warnings', icon: BellRing, badge: activeAlertsCount },
    { id: 'ingest', label: 'Data Ingestion Tool', icon: UploadCloud },
    { id: 'analytics', label: 'ML Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const farmerMenuItems: MenuItem[] = [
    { id: 'farmer_portal', label: 'My Farm Dashboard', icon: Sprout },
    { id: 'map', label: 'Regional Risk Map', icon: MapPin },
    { id: 'weather', label: 'Local Weather', icon: CloudSun },
    { id: 'reports', label: 'Submit Observation', icon: FileText },
  ];

  const menuItems = userRole === 'FARMER' ? farmerMenuItems : officerMenuItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-white text-base tracking-tight">AgriShield AI</h1>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-medium border border-emerald-500/30">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {userRole === 'FARMER' ? 'Grower Intelligence' : 'Regional Surveillance'}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {userRole === 'FARMER' ? 'My Farm Navigation' : 'Command Center'}
        </div>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {'badge' in item && item.badge !== undefined && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="h-4 w-4 opacity-70" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
            {userRole === 'FARMER' ? 'RP' : 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">
              {userRole === 'FARMER' ? selectedFarmerName : 'Dr. Anil Deshmukh'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {userRole === 'FARMER' ? 'Registered Cotton Grower' : 'Divisional Joint Director (Agri)'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
