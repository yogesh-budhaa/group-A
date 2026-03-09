import { useState, useEffect } from 'react';
import { accidentAPI } from '../services/api';
import { Database, Search, Trash2, RefreshCw, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SEVERITY_COLORS = { Minor: 'bg-green-950 text-green-400 border-green-800', Serious: 'bg-orange-950 text-orange-400 border-orange-800', Fatal: 'bg-red-950 text-red-400 border-red-800' };

// Generate mock data
const generateMock = () => Array.from({ length: 50 }, (_, i) => ({
  _id: (i + 1).toString(),
  latitude: (51.505 + (Math.random() - 0.5) * 0.1).toFixed(4),
  longitude: (-0.09 + (Math.random() - 0.5) * 0.1).toFixed(4),
  weather: ['Clear', 'Rain', 'Fog', 'Snow'][i % 4],
  road_condition: ['Dry', 'Wet', 'Icy'][i % 3],
  vehicle_type: ['Car', 'Motorcycle', 'Truck', 'Bus', 'Van'][i % 5],
  speed_limit: [30, 40, 50, 60, 70][i % 5],
  light_condition: ['Daylight', 'Dusk', 'Darkness'][i % 3],
  time_of_day: ['Morning', 'Afternoon', 'Evening', 'Night'][i % 4],
  accident_severity: ['Minor', 'Serious', 'Fatal'][i % 3],
  year: 2022 + (i % 3),
  month: (i % 12) + 1,
}));

export default function AccidentData() {
  const { user } = useAuth();
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const limit = 10;

  const fetchAccidents = async () => {
    setLoading(true);
    try {
      const res = await accidentAPI.getAll({ page, limit });
      setAccidents(res.data.accidents);
      setTotal(res.data.total);
    } catch {
      const mock = generateMock();
      setAccidents(mock.slice((page - 1) * limit, page * limit));
      setTotal(mock.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccidents(); }, [page]);

  const handleDelete = async (id) => {
    try {
      await accidentAPI.delete(id);
      fetchAccidents();
    } catch {
      setAccidents(prev => prev.filter(a => a._id !== id));
      setTotal(t => t - 1);
    }
    setDeleteId(null);
  };

  const filtered = accidents.filter(a =>
    !search || [a.weather, a.vehicle_type, a.accident_severity, a.road_condition]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Database size={24} className="text-sky-400" />
            Accident Records
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total records in database</p>
        </div>
        <button onClick={fetchAccidents} className="flex items-center gap-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-10" placeholder="Filter by weather, vehicle, severity..." />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Severity', 'Weather', 'Road', 'Vehicle', 'Speed', 'Light', 'Time', 'Year', user?.role === 'admin' && 'Actions'].filter(Boolean).map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Loading records...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500">No records found</td></tr>
              ) : filtered.map(acc => (
                <tr key={acc._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[acc.accident_severity] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {acc.accident_severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{acc.weather}</td>
                  <td className="px-4 py-3 text-slate-300">{acc.road_condition}</td>
                  <td className="px-4 py-3 text-slate-300">{acc.vehicle_type}</td>
                  <td className="px-4 py-3 text-slate-300">{acc.speed_limit} mph</td>
                  <td className="px-4 py-3 text-slate-300">{acc.light_condition}</td>
                  <td className="px-4 py-3 text-slate-300">{acc.time_of_day}</td>
                  <td className="px-4 py-3 text-slate-400">{acc.year}</td>
                  {user?.role === 'admin' && (
                    <td className="px-4 py-3">
                      {deleteId === acc._id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(acc._id)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-all">Confirm</button>
                          <button onClick={() => setDeleteId(null)} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded transition-all">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(acc._id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition-all border border-slate-700">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition-all border border-slate-700">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {user?.role !== 'admin' && (
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Shield size={12} />
          Admin access required to delete records
        </div>
      )}
    </div>
  );
}
