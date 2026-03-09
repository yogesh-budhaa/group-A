import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Map, AlertTriangle, Upload, Database,
  LogOut, Menu, X, Shield, ChevronRight, Activity
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'Hotspot Map', icon: Map },
  { path: '/predict', label: 'Predict Severity', icon: AlertTriangle },
  { path: '/data', label: 'Accident Data', icon: Database },
];

const adminItems = [
  { path: '/upload', label: 'Upload Dataset', icon: Upload },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive(item.path)
          ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <item.icon size={18} />
      <span>{item.label}</span>
      {isActive(item.path) && <ChevronRight size={14} className="ml-auto" />}
    </Link>
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-800">
        <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-sm">AccidentIQ</h1>
          <p className="text-xs text-slate-500">Road Safety Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">Navigation</p>
        {navItems.map(item => <NavLink key={item.path} item={item} />)}

        {user?.role === 'admin' && (
          <>
            <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mt-4">Admin</p>
            {adminItems.map(item => <NavLink key={item.path} item={item} />)}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              {user?.role === 'admin' && <Shield size={10} className="text-sky-400" />}
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all">
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-bold text-white">AccidentIQ</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
