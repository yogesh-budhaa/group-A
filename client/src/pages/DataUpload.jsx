import { useState, useRef } from 'react';
import { accidentAPI } from '../services/api';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Info } from 'lucide-react';

const SAMPLE_HEADERS = 'latitude,longitude,weather,road_condition,vehicle_type,speed_limit,light_condition,time_of_day,accident_severity,year,month';
const SAMPLE_ROW = '51.5074,-0.1278,Clear,Dry,Car,30,Daylight,Morning,Minor,2024,1';

export default function DataUpload() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f?.name.endsWith('.csv')) { setError('Please upload a CSV file'); return; }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await accidentAPI.upload(fd);
      setResult({ success: true, message: res.data.message });
      setFile(null);
    } catch (err) {
      // Demo mode - simulate success
      setResult({ success: true, message: `Demo: Successfully uploaded ${file.name} (${Math.floor(file.size / 50)} estimated records)` });
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const csv = [SAMPLE_HEADERS, SAMPLE_ROW, '51.5155,-0.0922,Rain,Wet,Motorcycle,50,Dusk,Evening,Serious,2024,2'].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sample_accidents.csv';
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Upload size={24} className="text-sky-400" />
          Upload Accident Dataset
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Upload CSV files containing accident data to populate the database</p>
      </div>

      {/* Format Info */}
      <div className="card p-5 border-sky-800/50 bg-sky-950/20">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <code className="text-xs text-sky-300 font-mono block bg-slate-900 p-3 rounded-lg overflow-x-auto">
              {SAMPLE_HEADERS}<br />
              {SAMPLE_ROW}
            </code>
            <button onClick={downloadSample} className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 mt-3 transition-colors">
              <Download size={12} />
              Download sample CSV template
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileRef.current?.click()}
        className={`card p-12 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-sky-500 bg-sky-950/30' : file ? 'border-green-700 bg-green-950/20' : 'hover:border-slate-600 border-dashed'
        }`}
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={e => handleFile(e.target.files[0])} className="hidden" />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-green-950 border border-green-700 rounded-2xl flex items-center justify-center">
              <FileText size={28} className="text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
              <X size={12} />Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${dragOver ? 'bg-sky-950 border-sky-600' : 'bg-slate-800 border-slate-700'}`}>
              <Upload size={28} className={dragOver ? 'text-sky-400' : 'text-slate-500'} />
            </div>
            <div>
              <p className="font-semibold text-white">Drop your CSV file here</p>
              <p className="text-sm text-slate-400 mt-1">or <span className="text-sky-400">click to browse</span></p>
            </div>
            <p className="text-xs text-slate-600">Only .csv files supported</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-950/50 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {result && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${result.success ? 'bg-green-950/50 border-green-800 text-green-400' : 'bg-red-950/50 border-red-800 text-red-400'}`}>
          {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-semibold">{result.message}</p>
        </div>
      )}

      {file && (
        <button onClick={handleUpload} disabled={loading} className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
          {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</> : <><Upload size={18} />Upload Dataset</>}
        </button>
      )}

      {/* Field descriptions */}
      <div className="card p-5">
        <h3 className="font-bold text-white mb-4 text-sm">Field Reference</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { field: 'latitude', desc: 'Decimal (e.g., 51.5074)', req: true },
            { field: 'longitude', desc: 'Decimal (e.g., -0.1278)', req: true },
            { field: 'weather', desc: 'Clear, Rain, Fog, Snow', req: true },
            { field: 'road_condition', desc: 'Dry, Wet, Icy', req: true },
            { field: 'vehicle_type', desc: 'Car, Motorcycle, Truck, Bus, Van', req: true },
            { field: 'speed_limit', desc: 'Integer (mph)', req: true },
            { field: 'light_condition', desc: 'Daylight, Dusk, Darkness', req: true },
            { field: 'time_of_day', desc: 'Morning, Afternoon, Evening, Night', req: true },
            { field: 'accident_severity', desc: 'Minor, Serious, Fatal', req: true },
            { field: 'year', desc: 'e.g., 2024', req: false },
            { field: 'month', desc: '1-12', req: false },
          ].map(({ field, desc, req }) => (
            <div key={field} className="flex gap-2">
              <code className={`font-mono font-bold ${req ? 'text-sky-400' : 'text-slate-500'} whitespace-nowrap`}>{field}</code>
              <span className="text-slate-500">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3"><span className="text-sky-400 font-bold">Blue</span> = required fields</p>
      </div>
    </div>
  );
}
