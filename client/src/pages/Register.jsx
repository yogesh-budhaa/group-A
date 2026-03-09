import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, User, Mail, Lock, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import InputWithIcon from '../components/InputWithIcon';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center">
              <Activity size={22} />
            </div>
            <span className="font-bold text-xl text-white">AccidentIQ</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Create account</h1>
          <p className="text-slate-400 mt-1">Start analyzing road safety data</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <InputWithIcon
                icon={User}
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <InputWithIcon
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <InputWithIcon
                icon={Lock}
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label">Account type</label>
              <div className="grid grid-cols-2 gap-3">
                {['user', 'admin'].map(r => (
                  <button key={r} type="button" onClick={() => setForm({...form, role: r})}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      form.role === r ? 'border-sky-500 bg-sky-950 text-sky-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                    {r === 'admin' && <Shield size={14} />}
                    <span className="capitalize">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? 'Creating account...' : <><span>Create account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
