import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup } from 'react-leaflet';
import { accidentAPI, mlAPI } from '../services/api';
import { Map, RefreshCw, Layers, AlertTriangle } from 'lucide-react';

const SEVERITY_COLORS = { Minor: '#10b981', Serious: '#3b82f6', Fatal: '#f43f5e' };

// Mock accidents for demo when server is unavailable
const MOCK_ACCIDENTS = Array.from({ length: 50 }, (_, i) => ({
  _id: i.toString(),
  latitude: 28.6124 + (Math.random() - 0.5) * 0.1,
  longitude: 81.6099 + (Math.random() - 0.5) * 0.1,
  accident_severity: ['Minor', 'Serious', 'Fatal'][Math.floor(Math.random() * 3)],
  weather: ['Clear', 'Rain', 'Fog'][Math.floor(Math.random() * 3)],
  vehicle_type: ['Car', 'Motorcycle', 'Truck'][Math.floor(Math.random() * 3)],
  time_of_day: ['Morning', 'Evening', 'Night'][Math.floor(Math.random() * 3)],
}));

const MOCK_HOTSPOTS = [
  { cluster_id: 0, center: { latitude: 51.508, longitude: -0.095 }, accident_count: 12, risk_level: 'High', severity_breakdown: { Fatal: 4, Serious: 5, Minor: 3 } },
  { cluster_id: 1, center: { latitude: 51.502, longitude: -0.083 }, accident_count: 8, risk_level: 'Medium', severity_breakdown: { Fatal: 1, Serious: 4, Minor: 3 } },
  { cluster_id: 2, center: { latitude: 51.512, longitude: -0.108 }, accident_count: 6, risk_level: 'Low', severity_breakdown: { Fatal: 0, Serious: 2, Minor: 4 } },
];

const RISK_COLORS = { High: '#f43f5e', Medium: '#fb923c', Low: '#10b981' };

export default function HotspotMap() {
  const [accidents, setAccidents] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showAccidents, setShowAccidents] = useState(true);
  const [algorithm, setAlgorithm] = useState('dbscan');
  const mapRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await accidentAPI.getAll({ limit: 200 });
      setAccidents(res.data.accidents || MOCK_ACCIDENTS);
    } catch { setAccidents(MOCK_ACCIDENTS); }

    try {
      const res = await mlAPI.getHotspots(algorithm);
      setHotspots(res.data.hotspots || MOCK_HOTSPOTS);
    } catch { setHotspots(MOCK_HOTSPOTS); }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [algorithm]);

  // Center/zoom map based on fetched data (falls back to default Surkhet view)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const points = [];
    if (showAccidents) {
      points.push(...accidents.map((a) => [a.latitude, a.longitude]));
    }
    if (showHotspots) {
      points.push(...hotspots.map((h) => [h.center.latitude, h.center.longitude]));
    }

    if (points.length === 0) return;

    // If only one point, create a small bbox so fitBounds works
    const bounds = points.length === 1
      ? [[points[0][0] - 0.01, points[0][1] - 0.01], [points[0][0] + 0.01, points[0][1] + 0.01]]
      : points;

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [accidents, hotspots, showAccidents, showHotspots]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Map size={24} className="text-sky-400" />
            Accident Hotspot Map
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Interactive map showing accident locations and danger zones</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={algorithm} onChange={e => setAlgorithm(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-sky-500">
            <option value="dbscan">DBSCAN Clustering</option>
            <option value="kmeans">K-Means Clustering</option>
          </select>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowAccidents(!showAccidents)}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-all ${showAccidents ? 'bg-sky-950 border-sky-700 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          <div className="w-3 h-3 rounded-full bg-sky-400" />
          Accident Points
        </button>
        <button onClick={() => setShowHotspots(!showHotspots)}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-all ${showHotspots ? 'bg-red-950 border-red-700 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          <div className="w-3 h-3 rounded-full bg-red-400" />
          Hotspot Clusters
        </button>

        {/* Legend */}
        <div className="flex items-center gap-4 ml-auto bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-xs">
          {Object.entries(SEVERITY_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span className="text-slate-400">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="card overflow-hidden" style={{ height: '500px' }}>
        <MapContainer
          center={[28.6124, 81.6099]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => { mapRef.current = map; }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />

          {showAccidents && (
            <LayerGroup>
              {accidents.map((acc, i) => (
                <CircleMarker
                  key={acc._id || i}
                  center={[acc.latitude, acc.longitude]}
                  radius={6}
                  fillColor={SEVERITY_COLORS[acc.accident_severity] || '#6b7280'}
                  color={SEVERITY_COLORS[acc.accident_severity] || '#6b7280'}
                  weight={1}
                  opacity={0.9}
                  fillOpacity={0.7}
                >
                  <Popup>
                    <div className="text-sm">
                      <p><strong>Severity:</strong> {acc.accident_severity}</p>
                      <p><strong>Weather:</strong> {acc.weather}</p>
                      <p><strong>Vehicle:</strong> {acc.vehicle_type}</p>
                      <p><strong>Time:</strong> {acc.time_of_day}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          )}

          {showHotspots && (
            <LayerGroup>
              {hotspots.map((hs) => (
                <CircleMarker
                  key={hs.cluster_id}
                  center={[hs.center.latitude, hs.center.longitude]}
                  radius={Math.max(15, hs.accident_count * 2)}
                  fillColor={RISK_COLORS[hs.risk_level]}
                  color={RISK_COLORS[hs.risk_level]}
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.25}
                >
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-bold text-base mb-1">🔴 Hotspot Zone</p>
                      <p><strong>Risk Level:</strong> {hs.risk_level}</p>
                      <p><strong>Accidents:</strong> {hs.accident_count}</p>
                      <hr className="my-1" />
                      <p><strong>Fatal:</strong> {hs.severity_breakdown?.Fatal || 0}</p>
                      <p><strong>Serious:</strong> {hs.severity_breakdown?.Serious || 0}</p>
                      <p><strong>Minor:</strong> {hs.severity_breakdown?.Minor || 0}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          )}
        </MapContainer>
      </div>

      {/* Hotspot Summary */}
      {hotspots.length > 0 && (
        <div>
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            Identified Hotspot Zones
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {hotspots.slice(0, 6).map(hs => (
              <div key={hs.cluster_id} className="card p-4 border-l-4" style={{ borderLeftColor: RISK_COLORS[hs.risk_level] }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white text-sm">Zone #{hs.cluster_id + 1}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full`}
                    style={{ background: RISK_COLORS[hs.risk_level] + '33', color: RISK_COLORS[hs.risk_level] }}>
                    {hs.risk_level} Risk
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-white">{hs.accident_count}</p>
                <p className="text-xs text-slate-400">accidents in cluster</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-500">
                  <span>💀 {hs.severity_breakdown?.Fatal || 0}</span>
                  <span>🟠 {hs.severity_breakdown?.Serious || 0}</span>
                  <span>🟢 {hs.severity_breakdown?.Minor || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
