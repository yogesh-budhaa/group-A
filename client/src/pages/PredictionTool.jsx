import { useState } from 'react';
import { mlAPI } from '../services/api';
import { Brain, AlertTriangle, CheckCircle, XCircle, ChevronDown, Zap } from 'lucide-react';

const OPTIONS = {
  weather: ['Clear', 'Rain', 'Fog', 'Snow'],
  road_condition: ['Dry', 'Wet', 'Icy'],
  vehicle_type: ['Car', 'Motorcycle', 'Truck', 'Bus', 'Van'],
  light_condition: ['Daylight', 'Dusk', 'Darkness'],
  time_of_day: ['Morning', 'Afternoon', 'Evening', 'Night'],
  model: ['random_forest', 'decision_tree', 'logistic_regression'],
};

const SEVERITY_CONFIG = {
  Minor: { color: 'green', bg: 'bg-green-950', border: 'border-green-700', text: 'text-green-400', icon: CheckCircle, label: '🟢 Minor Accident' },
  Serious: { color: 'blue', bg: 'bg-sky-950', border: 'border-sky-700', text: 'text-sky-400', icon: AlertTriangle, label: '🟠 Serious Accident' },
  Fatal: { color: 'red', bg: 'bg-red-950', border: 'border-red-700', text: 'text-red-400', icon: XCircle, label: '🔴 Fatal Accident' },
};

const SelectField = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="label">{label}</label>
    <div className="relative">
      <select name={name} value={value} onChange={onChange} className="input appearance-none pr-8">
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

export default function PredictionTool() {
  const [form, setForm] = useState({
    weather: 'Clear', road_condition: 'Dry', vehicle_type: 'Car',
    speed_limit: 50, light_condition: 'Daylight', time_of_day: 'Morning', model: 'random_forest'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'speed_limit' ? parseInt(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await mlAPI.predictSeverity(form);
      setResult(res.data);
    } catch (err) {
      // Fallback demo prediction
      const score = (form.weather !== 'Clear' ? 2 : 0) + (form.road_condition !== 'Dry' ? 2 : 0) +
        (form.light_condition === 'Darkness' ? 2 : 0) + (form.speed_limit >= 70 ? 3 : form.speed_limit >= 50 ? 1 : 0);
      const severity = score <= 2 ? 'Minor' : score <= 5 ? 'Serious' : 'Fatal';
      setResult({
        severity,
        confidence: 72,
        probabilities: { Minor: severity === 'Minor' ? 72 : 10, Serious: severity === 'Serious' ? 72 : 18, Fatal: severity === 'Fatal' ? 72 : 10 },
        model_used: 'rule_based_fallback',
        risk_factors: [],
        note: 'ML service offline — using rule-based fallback'
      });
    } finally {
      setLoading(false);
    }
  };

  const config = result ? SEVERITY_CONFIG[result.severity] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Brain size={24} className="text-sky-400" />
          Accident Severity Predictor
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Enter road conditions to predict accident severity using ML models</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-sky-400" />
            Input Parameters
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <SelectField label="Weather Condition" name="weather" value={form.weather} onChange={handleChange} options={OPTIONS.weather} />
            <SelectField label="Road Condition" name="road_condition" value={form.road_condition} onChange={handleChange} options={OPTIONS.road_condition} />
            <SelectField label="Vehicle Type" name="vehicle_type" value={form.vehicle_type} onChange={handleChange} options={OPTIONS.vehicle_type} />
            <SelectField label="Light Condition" name="light_condition" value={form.light_condition} onChange={handleChange} options={OPTIONS.light_condition} />
            <SelectField label="Time of Day" name="time_of_day" value={form.time_of_day} onChange={handleChange} options={OPTIONS.time_of_day} />

            <div>
              <label className="label">Speed Limit: <span className="text-sky-400 font-bold">{form.speed_limit} mph</span></label>
              <input type="range" name="speed_limit" min="20" max="100" step="10"
                value={form.speed_limit} onChange={handleChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>20 mph</span><span>60 mph</span><span>100 mph</span>
              </div>
            </div>

            <div>
              <label className="label">ML Model</label>
              <div className="grid grid-cols-3 gap-2">
                {OPTIONS.model.map(m => (
                  <button key={m} type="button" onClick={() => setForm(f => ({...f, model: m}))}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all ${
                      form.model === m ? 'bg-sky-950 border-sky-600 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                    {m.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Predicting...</> : <><Brain size={16} />Predict Severity</>}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className={`card p-6 border-2 ${config.border} ${config.bg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <config.icon size={32} className={config.text} />
                  <div>
                    <p className="text-sm text-slate-400">Predicted Outcome</p>
                    <p className={`text-2xl font-extrabold ${config.text}`}>{config.label}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-400">Confidence</span>
                  <span className={`font-bold ${config.text}`}>{result.confidence?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className={`h-2 rounded-full`} style={{ width: `${result.confidence}%`, background: config.color === 'green' ? '#10b981' : config.color === 'blue' ? '#3b82f6' : '#f43f5e' }} />
                </div>
                <p className="text-xs text-slate-500 mt-3">Model: {result.model_used?.replace(/_/g, ' ')}</p>
                {result.note && <p className="text-xs text-yellow-400 mt-1">⚠️ {result.note}</p>}
              </div>

              {/* Probability Breakdown */}
              <div className="card p-5">
                <h3 className="font-bold text-white mb-4 text-sm">Probability Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(result.probabilities || {}).map(([sev, prob]) => {
                    const cfg = SEVERITY_CONFIG[sev];
                    return (
                      <div key={sev}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={cfg?.text || 'text-slate-400'}>{sev}</span>
                          <span className="text-white font-semibold">{prob?.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${prob}%`, background: cfg?.color === 'green' ? '#10b981' : cfg?.color === 'blue' ? '#3b82f6' : '#f43f5e' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk Factors */}
              {result.risk_factors?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-white mb-3 text-sm">⚠️ Risk Factors Identified</h3>
                  <ul className="space-y-2">
                    {result.risk_factors.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <Brain size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Fill in the road conditions and click <strong className="text-white">Predict Severity</strong> to get an ML-powered prediction</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
