"use client";

import React, { useState, useEffect, useRef } from 'react';

// Components defined outside for stability
const Overview = ({ telemetry }: { telemetry: any[] }) => {
  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Process Temperature', value: currentPt?.process_temp_k?.toFixed(1) ?? '...', unit: 'K', color: 'text-slate-100' },
          { label: 'Rotational Speed', value: currentPt?.rpm?.toFixed(0) ?? '...', unit: 'RPM', color: 'text-slate-100' },
          { label: 'Torque', value: currentPt?.torque_nm?.toFixed(1) ?? '...', unit: 'Nm', color: 'text-slate-100' },
          { label: 'Tool Wear', value: currentPt?.tool_wear_min?.toFixed(1) ?? '...', unit: 'min', color: currentPt?.tool_wear_min > 180 ? 'text-red-400' : 'text-emerald-400' }
        ].map((m, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{m.label}</p>
            <p className={`text-2xl font-mono font-bold ${m.color}`}>{m.value} <span className="text-sm opacity-30">{m.unit}</span></p>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg min-h-[300px] flex flex-col">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Real-time Anomaly Detection (Isolation Forest)</h3>
        <div className="flex-1 flex items-end justify-between gap-1 border-b border-l border-slate-800 p-2">
          {telemetry.slice(-40).map((pt, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-t-sm transition-all ${pt.is_anomaly ? 'bg-red-500 h-full shadow-[0_0_15px_red]' : 'bg-blue-500/40'}`}
              style={{ height: pt.is_anomaly ? '90%' : `${10 + ((pt.process_temp_k || 300) % 50)}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PipelineIntegrity = () => {
  const [data, setData] = useState<any[]>([]);
  const offsetRef = useRef(0);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8005/api/pipeline/processed_telemetry?offset=${offsetRef.current}&limit=40`);
        const result = await response.json();
        if (result && result.data) {
          setData(result.data);
          offsetRef.current = (offsetRef.current + 2) % 1000;
        }
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPt = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Flow Rate', value: currentPt?.flow_rate_bpd?.toFixed(1) ?? '...', unit: 'BPD', color: 'text-slate-100' },
          { label: 'Pressure', value: currentPt?.pressure_psi?.toFixed(1) ?? '...', unit: 'PSI', color: 'text-slate-100' },
          { label: 'Acoustic Amplitude', value: currentPt?.acoustic_amplitude_db?.toFixed(1) ?? '...', unit: 'dB', color: currentPt?.acoustic_amplitude_db > 35 ? 'text-amber-400' : 'text-emerald-400' }
        ].map((m, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{m.label}</p>
            <p className={`text-2xl font-mono font-bold ${m.color}`}>{m.value} <span className="text-sm opacity-30">{m.unit}</span></p>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
        <h3 className="text-lg font-bold text-slate-100 mb-8 self-start">Fiber Optic DAS Stream (Spatial Acoustic Profiling)</h3>
        <div className="w-full max-w-4xl h-16 bg-slate-800 rounded-full relative overflow-hidden border border-slate-700 flex">
          {data.map((pt, i) => (
            <div 
               key={i} 
               className={`flex-1 h-full transition-all ${pt.is_anomaly ? 'bg-red-500 shadow-[0_0_20px_red]' : 'bg-emerald-500/30'}`}
               style={{ opacity: pt.is_anomaly ? 1 : 0.3 + ((pt.acoustic_amplitude_db || 20) % 10) / 10 }}
            ></div>
          ))}
        </div>
        <p className="mt-8 font-bold uppercase tracking-widest text-lg">
           {currentPt?.is_anomaly ? (
             <span className="text-red-500">{currentPt.anomaly_type} DETECTED at km {currentPt.location_km?.toFixed(1)}</span>
           ) : (
             <span className="text-emerald-400">Stream Nominal: Sensor Fusion Active</span>
           )}
        </p>
      </div>
    </div>
  );
};

const Compressors = () => {
  const [data, setData] = useState<any[]>([]);
  const offsetRef = useRef(0);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8005/api/compressors/processed_telemetry?offset=${offsetRef.current}&limit=20`);
        const result = await response.json();
        if (result && result.data) {
          setData(result.data);
          offsetRef.current = (offsetRef.current + 1) % 1000;
        }
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPt = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">
      <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Suction Pressure</p>
            <p className="text-2xl font-mono font-bold text-slate-100">{currentPt?.suction_psi?.toFixed(1) ?? '...'} <span className="text-sm text-slate-500">PSI</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Discharge Pressure</p>
            <p className="text-2xl font-mono font-bold text-slate-100">{currentPt?.discharge_psi?.toFixed(1) ?? '...'} <span className="text-sm text-slate-500">PSI</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 w-full h-1 ${currentPt?.vibration_in_sec > 0.4 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Vibration</p>
            <p className={`text-2xl font-mono font-bold ${currentPt?.vibration_in_sec > 0.4 ? 'text-red-400' : 'text-slate-100'}`}>{currentPt?.vibration_in_sec?.toFixed(3) ?? '...'} <span className="text-sm text-slate-500">in/s</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Oil Temperature</p>
            <p className={`text-2xl font-mono font-bold ${currentPt?.oil_temp_f > 180 ? 'text-amber-400' : 'text-slate-100'}`}>{currentPt?.oil_temp_f?.toFixed(1) ?? '...'} <span className="text-sm text-slate-500">°F</span></p>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col min-h-[350px]">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Live Machine Harmonics</h3>
          <div className="flex-1 w-full relative border-l border-b border-slate-800 flex items-end justify-between px-2 pt-8 pb-2">
            {data.map((pt, i) => (
              <div key={i} className="flex-1 mx-0.5 h-full relative flex flex-col justify-end">
                <div 
                  className={`w-full transition-all duration-300 rounded-t-sm ${pt.vibration_in_sec > 0.4 ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-t from-blue-600 to-teal-400'}`}
                  style={{ height: `${Math.min(((pt.vibration_in_sec || 0.1) / 0.5) * 100, 100)}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-1 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Diagnostic Agent</h3>
        {currentPt?.is_anomaly ? (
          <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-100 mt-4">
            <p className="text-red-400 font-bold mb-2 uppercase text-sm">{currentPt.anomaly_type}</p>
            <p className="text-sm mb-6 text-slate-300">{currentPt.recommended_solution}</p>
            <button className="w-full bg-red-600/80 hover:bg-red-500 py-3 rounded font-bold shadow-lg shadow-red-900/20 transition-all">Initiate Safe Shutdown</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 mt-4">
            <svg className="w-16 h-16 mb-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-lg">Bearings & Harmonics in Safe Limits</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const offsetRef = useRef(0);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'pipeline') setActiveTab('Pipeline Integrity');
      else if (hash === 'compressors') setActiveTab('Compressors');
      else setActiveTab('Overview');
    };
    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8005/api/assets/processed_telemetry?offset=${offsetRef.current}&limit=40`);
        const result = await response.json();
        if (result && result.data) {
          setTelemetry(result.data);
          offsetRef.current = (offsetRef.current + 5) % 9000;
        }
      } catch (e) {}
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col relative z-[100]">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">PetroSight AI</h1>
          <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Predictive Analytics</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: '', label: 'Overview' },
            { id: 'pipeline', label: 'Pipeline Integrity' },
            { id: 'compressors', label: 'Compressors' }
          ].map(tab => (
            <button 
              key={tab.label}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab(tab.label);
              }}
              style={{ cursor: 'pointer', pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeTab === tab.label ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
           <h2 className="text-xl font-bold text-slate-100">{activeTab}</h2>
           <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">System Active</span>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative h-full">
          <div style={{ display: activeTab === 'Overview' ? 'block' : 'none' }} className="h-full">
            <Overview telemetry={telemetry} />
          </div>
          <div style={{ display: activeTab === 'Pipeline Integrity' ? 'block' : 'none' }} className="h-full">
            <PipelineIntegrity />
          </div>
          <div style={{ display: activeTab === 'Compressors' ? 'block' : 'none' }} className="h-full">
            <Compressors />
          </div>
        </main>
      </div>
    </div>
  );
}
