import { Link } from 'react-router-dom';
import { Activity, MapPin, Brain, Shield, ArrowRight, ChevronRight, Zap } from 'lucide-react';

const features = [
  { icon: Brain, title: 'ML-Powered Predictions', desc: 'Random Forest, Decision Tree & Logistic Regression models predict accident severity with high accuracy.', color: 'sky' },
  { icon: MapPin, title: 'Hotspot Detection', desc: 'DBSCAN & K-Means clustering algorithms identify dangerous accident-prone areas on interactive maps.', color: 'orange' },
  { icon: Activity, title: 'Real-time Analytics', desc: 'Comprehensive dashboards with charts showing severity trends, weather impact, and yearly statistics.', color: 'green' },
  { icon: Shield, title: 'Role-based Access', desc: 'Secure JWT authentication with Admin and User roles. Admins manage data, users analyze insights.', color: 'purple' },
];

const stats = [
  { value: '3', label: 'ML Models', sub: 'Trained & Evaluated' },
  { value: '2', label: 'Clustering Algorithms', sub: 'DBSCAN & K-Means' },
  { value: '100%', label: 'Responsive', sub: 'Works on all devices' },
  { value: '∞', label: 'Datasets', sub: 'CSV Upload Support' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <Activity size={18} />
          </div>
          <span className="font-bold text-lg">AccidentIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2">Sign In</Link>
          <Link to="/register" className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-900/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-2 bg-sky-950 border border-sky-800 text-sky-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Zap size={12} />
            AI-Powered Road Safety Intelligence
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Predict. Detect.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
              Prevent.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Advanced machine learning platform for road accident severity prediction and hotspot detection.
            Turn accident data into life-saving insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-sky-900/50 hover:shadow-sky-800/60">
              Start Analyzing <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all border border-slate-700">
              Sign In <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="card p-6 text-center">
              <div className="text-3xl font-extrabold text-sky-400 mb-1">{s.value}</div>
              <div className="font-semibold text-white text-sm">{s.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center mb-3">Everything you need</h2>
        <p className="text-slate-400 text-center mb-12">A complete road safety analytics platform</p>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map(f => (
            <div key={f.title} className="card p-6 hover:border-slate-600 transition-all group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${f.color}-950 border border-${f.color}-800`}>
                <f.icon size={22} className={`text-${f.color}-400`} />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-7xl mx-auto text-center">
        <div className="card p-12 bg-gradient-to-br from-sky-950/50 to-slate-900 border-sky-800/50">
          <h2 className="text-3xl font-extrabold mb-4">Ready to improve road safety?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">Join AccidentIQ and start analyzing accident data with powerful ML algorithms today.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-sky-900/50">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-slate-500 text-sm">
        <p>© 2024 AccidentIQ — AI-Based Accident Severity Prediction and Hotspot Detection System</p>
      </footer>
    </div>
  );
}
