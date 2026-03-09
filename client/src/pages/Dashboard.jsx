import { useState, useEffect } from 'react';
import { accidentAPI } from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { AlertTriangle, Activity, TrendingUp, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SEVERITY_COLORS = { Minor: '#10b981', Serious: '#3b82f6', Fatal: '#f43f5e' };
const WEATHER_COLOR = '#3b82f6';
const TIME_COLOR = '#8b5cf6';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await accidentAPI.getStats();
      setStats(res.data);
    } catch (err) {
      // Use mock data for demo
      setStats({
        total: 100,
        bySeverity: { Minor: 52, Serious: 31, Fatal: 17 },
        byWeather: { Clear: 45, Rain: 28, Fog: 15, Snow: 12 },
        byTime: { Morning: 22, Afternoon: 30, Evening: 28, Night: 20 },
        byYear: { 2022: 28, 2023: 36, 2024: 36 }
      });
      setError('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <RefreshCw size={20} className="animate-spin" />
        <span>Loading dashboard...</span>
      </div>
    </div>
  );

  const severityData = stats ? Object.entries(stats.bySeverity).map(([name, value]) => ({ name, value })) : [];
  const weatherData = stats ? Object.entries(stats.byWeather).map(([name, value]) => ({ name, value })) : [];
  const timeData = stats ? Object.entries(stats.byTime).map(([name, value]) => ({ name, accidents: value })) : [];
  const yearData = stats ? Object.entries(stats.byYear).sort().map(([year, count]) => ({ year, accidents: count })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-all border border-slate-700">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Accidents" value={stats?.total || 0} sub="All time" color="bg-sky-950 text-sky-400" />
        <StatCard icon={AlertTriangle} label="Fatal" value={stats?.bySeverity?.Fatal || 0} sub="Highest severity" color="bg-red-950 text-red-400" />
        <StatCard icon={TrendingUp} label="Serious" value={stats?.bySeverity?.Serious || 0} sub="Medium severity" color="bg-orange-950 text-orange-400" />
        <StatCard icon={MapPin} label="Minor" value={stats?.bySeverity?.Minor || 0} sub="Low severity" color="bg-green-950 text-green-400" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Severity Pie */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-4">Accidents by Severity</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#121c2b', border: '1px solid #1e2f3f', borderRadius: 8, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {severityData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_COLORS[d.name] }} />
                <span className="text-slate-400">{d.name}: <span className="text-white font-semibold">{d.value}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Bar */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-4">Accidents by Weather</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weatherData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2f3f" />
              <XAxis dataKey="name" tick={{ fill: '#a9bcd0', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a9bcd0', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#121c2b', border: '1px solid #1e2f3f', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="value" name="Accidents" fill={WEATHER_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Time Line */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-4">Accidents by Time of Day</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2f3f" />
              <XAxis dataKey="name" tick={{ fill: '#a9bcd0', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a9bcd0', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#121c2b', border: '1px solid #1e2f3f', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="accidents" stroke={TIME_COLOR} strokeWidth={2} dot={{ fill: TIME_COLOR, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Year Trend */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-4">Yearly Accident Trends</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2f3f" />
              <XAxis dataKey="year" tick={{ fill: '#a9bcd0', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a9bcd0', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#121c2b', border: '1px solid #1e2f3f', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="accidents" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
