'use client';

import { useState, useEffect } from 'react';

// Real ML Data Types
type AssetTelemetry = {
  timestamp: string;
  air_temp_k: number;
  process_temp_k: number;
  rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  is_anomaly: boolean;
  anomaly_type: string;
  recommended_solution: string;
};

type PipelineTelemetry = {
  timestamp: string;
  pressure_psi: number;
  flow_rate_bpd: number;
  acoustic_amplitude_db: number;
  location_km: number;
  is_anomaly: boolean;
  anomaly_type: string;
  scada_confidence: number;
  das_confidence: number;
  fusion_confidence: number;
};

type CompressorTelemetry = {
  timestamp: string;
  suction_psi: number;
  discharge_psi: number;
  vibration_in_sec: number;
  oil_temp_f: number;
  is_anomaly: boolean;
  anomaly_type: string;
  recommended_solution: string;
};

type BriefingData = {
  timestamp: string;
  overall_status: string;
  shift_handover: string;
  weekly_report: string;
};

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<AssetTelemetry[]>([]);
  const [pipelineTelemetry, setPipelineTelemetry] = useState<PipelineTelemetry[]>([]);
  const [compressorTelemetry, setCompressorTelemetry] = useState<CompressorTelemetry[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [pipelineOffset, setPipelineOffset] = useState(0);
  const [compressorOffset, setCompressorOffset] = useState(0);
  
  const [activeEsp, setActiveEsp] = useState('ESP-004');
  const [activeCompressor, setActiveCompressor] = useState('C-001');
  const [activePipeline, setActivePipeline] = useState('P-01');
  const [briefing, setBriefing] = useState<BriefingData | null>(null);

  useEffect(() => {
    // Fetch LIVE ML-processed telemetry from the FastAPI backend
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(`http://localhost:8005/api/assets/processed_telemetry?offset=${offset}&limit=30`);
        const result = await response.json();
        
        if (result && result.data) {
          const formattedData = result.data.map((pt: any) => ({
            timestamp: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            air_temp_k: pt.air_temp_k,
            process_temp_k: pt.process_temp_k,
            rpm: pt.rpm,
            torque_nm: pt.torque_nm,
            tool_wear_min: pt.tool_wear_min,
            is_anomaly: pt.is_anomaly,
            anomaly_type: pt.anomaly_type,
            recommended_solution: pt.recommended_solution,
          }));
          setTelemetry(formattedData);
          // Advance the offset to simulate streaming new data
          setOffset(prev => (prev + 30) % (result.total_records || 10000));
        }
      } catch (error) {
        console.error("Failed to fetch ML telemetry:", error);
      }
    };

    // Fetch real scraped datasets from our backend scraper
    const fetchDatasets = async () => {
      try {
        const response = await fetch('http://localhost:8005/api/datasets/search?q=predictive+maintenance+equipment');
        const result = await response.json();
        if (result && result.results) {
          setDatasets(result.results);
        }
      } catch (error) {
        console.error("Failed to fetch scraped datasets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPipelineTelemetry = async () => {
      try {
        const response = await fetch(`http://localhost:8005/api/pipeline/processed_telemetry?offset=${pipelineOffset}&limit=30`);
        const result = await response.json();
        
        if (result && result.data) {
          const formattedData = result.data.map((pt: any) => ({
            timestamp: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            pressure_psi: pt.pressure_psi,
            flow_rate_bpd: pt.flow_rate_bpd,
            acoustic_amplitude_db: pt.acoustic_amplitude_db,
            location_km: pt.location_km || 0,
            is_anomaly: pt.is_anomaly,
            anomaly_type: pt.anomaly_type,
            scada_confidence: pt.scada_confidence,
            das_confidence: pt.das_confidence,
            fusion_confidence: pt.fusion_confidence,
          }));
          setPipelineTelemetry(formattedData);
          setPipelineOffset(prev => (prev + 30) % (result.total_records || 1000));
        }
      } catch (error) {
        console.error("Failed to fetch pipeline telemetry:", error);
      }
    };

    const fetchCompressorTelemetry = async () => {
      try {
        const response = await fetch(`http://localhost:8005/api/compressors/processed_telemetry?offset=${compressorOffset}&limit=30`);
        const result = await response.json();
        
        if (result && result.data) {
          const formattedData = result.data.map((pt: any) => ({
            timestamp: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            suction_psi: pt.suction_psi,
            discharge_psi: pt.discharge_psi,
            vibration_in_sec: pt.vibration_in_sec,
            oil_temp_f: pt.oil_temp_f,
            is_anomaly: pt.is_anomaly,
            anomaly_type: pt.anomaly_type,
            recommended_solution: pt.recommended_solution,
          }));
          setCompressorTelemetry(formattedData);
          setCompressorOffset(prev => (prev + 30) % (result.total_records || 1000));
        }
      } catch (error) {
        console.error("Failed to fetch compressor telemetry:", error);
      }
    };

    const fetchBriefing = async () => {
      try {
        const response = await fetch('http://localhost:8005/api/briefings/latest');
        const result = await response.json();
        if (result && result.timestamp) {
          setBriefing(result);
        }
      } catch (error) {
        console.error("Failed to fetch briefing:", error);
      }
    };

    fetchTelemetry();
    fetchDatasets();
    fetchPipelineTelemetry();
    fetchCompressorTelemetry();
    fetchBriefing();
    
    // Simulate live data stream every 5 seconds
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchPipelineTelemetry();
      fetchCompressorTelemetry();
    }, 5000);
    return () => clearInterval(interval);
  }, [offset, pipelineOffset, compressorOffset]);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            PetroSight AI
          </h1>
          <p className="text-xs text-emerald-400 mt-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            ML Pipeline Active
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['Overview', 'Data Scraper Hub', 'Compressors', 'ESPs', 'Pipeline Integrity', 'Agentic Briefings'].map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activeTab === item
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                  : 'hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Model: <span className="text-blue-400">Isolation Forest</span><br/>
          Source: <span className="text-slate-400">UCI AI4I</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur z-10">
          <h2 className="text-xl font-semibold text-slate-100">{activeTab}</h2>
          <div className="flex items-center space-x-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">Autonomous Agent: Idle</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400"></div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Main Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'ML Processed Records', value: telemetry.length ? '10,000' : '0', trend: 'Live Stream', color: 'text-blue-400' },
                  { label: 'Fleet Health Index', value: '94.2%', trend: 'Global Average', color: 'text-emerald-400' },
                  { label: 'Active Critical Alerts', value: telemetry.filter(t => t.is_anomaly).length > 0 ? '1' : '0', trend: 'Unit ESP-004', color: 'text-red-400' },
                ].map((stat, idx) => (
                  <div key={idx} className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-800 to-transparent opacity-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-slate-400 text-sm">{stat.label}</h3>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className={`text-4xl font-bold ${stat.color}`}>{stat.value}</span>
                      <span className="text-xs text-slate-500">{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fleet Status Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Asset Status Matrix</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {['ESP-001', 'ESP-002', 'ESP-003', 'ESP-004', 'C-001', 'C-002', 'P-01', 'P-02'].map((id) => (
                      <button 
                        key={id} 
                        onClick={() => {
                          if (id.startsWith('ESP')) { setActiveTab('ESPs'); setActiveEsp(id); }
                          else if (id.startsWith('C')) { setActiveTab('Compressors'); setActiveCompressor(id); }
                          else if (id.startsWith('P')) { setActiveTab('Pipeline Integrity'); setActivePipeline(id); }
                        }}
                        className={`p-3 rounded border transition-colors hover:border-teal-500/50 ${id === 'ESP-004' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'} flex flex-col items-center justify-center cursor-pointer`}
                      >
                        <span className="text-xs font-medium text-slate-100">{id}</span>
                        <div className={`w-2 h-2 rounded-full mt-2 ${id === 'ESP-004' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Agentic Interventions</h3>
                  <div className="space-y-3">
                    <div className="text-xs p-3 rounded bg-slate-800/50 border-l-2 border-blue-500">
                      <span className="text-blue-400 block mb-1">08:45 AM - AI Dispatch</span>
                      Maintenance crew rerouted to ESP-004 following anomaly detection.
                    </div>
                    <div className="text-xs p-3 rounded bg-slate-800/50 border-l-2 border-emerald-500">
                      <span className="text-emerald-400 block mb-1">07:20 AM - Optimization</span>
                      Pipeline P-01 flow rate increased by 4% to balance network pressure.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Data Scraper Hub' && (
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-2xl font-semibold text-slate-100 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Live Scraped Datasets
              </h3>
              <p className="text-slate-400 mb-6">These are real datasets autonomously discovered by our backend agent querying public data catalogs (e.g. Data.gov).</p>
              
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-4"></div>
                  <p className="mt-2 text-slate-500">Querying public data catalogs...</p>
                </div>
              ) : datasets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {datasets.map((ds, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-teal-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-blue-300 line-clamp-1" title={ds.name}>{ds.name}</h4>
                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded whitespace-nowrap ml-2">{ds.source}</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-3">{ds.description || 'No description provided.'}</p>
                      <a href={ds.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 hover:underline">
                        View Source Data &rarr;
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded">
                  No datasets currently found or backend is offline.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Compressors' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Telemetry Chart */}
              <div className="col-span-1 lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-slate-100">Live ML Telemetry</h3>
                    <select 
                      value={activeCompressor} 
                      onChange={(e) => setActiveCompressor(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded px-3 py-1 focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="C-001">Unit C-001</option>
                      <option value="C-002">Unit C-002</option>
                    </select>
                  </div>
                  {compressorTelemetry.length > 0 && compressorTelemetry[compressorTelemetry.length-1].is_anomaly ? (
                    <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded animate-pulse">Isolation Forest: Anomaly Found</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">Model State: Nominal</span>
                  )}
                </div>
                
                {/* Visualizing Pressure vs Vibration */}
                <div className="space-y-4 mb-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Discharge Pressure (PSI)</span>
                        <span>{compressorTelemetry.length > 0 ? compressorTelemetry[compressorTelemetry.length-1].discharge_psi.toFixed(1) : '--'} / 1500</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${compressorTelemetry.length > 0 && compressorTelemetry[compressorTelemetry.length-1].discharge_psi < 1100 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${compressorTelemetry.length > 0 ? Math.min((compressorTelemetry[compressorTelemetry.length-1].discharge_psi / 1500) * 100, 100) : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Vibration (in/sec)</span>
                        <span>{compressorTelemetry.length > 0 ? compressorTelemetry[compressorTelemetry.length-1].vibration_in_sec.toFixed(2) : '--'} / 0.8</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${compressorTelemetry.length > 0 && compressorTelemetry[compressorTelemetry.length-1].vibration_in_sec > 0.25 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-400'}`} style={{ width: `${compressorTelemetry.length > 0 ? Math.min((compressorTelemetry[compressorTelemetry.length-1].vibration_in_sec / 0.8) * 100, 100) : 0}%` }}></div>
                      </div>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-4">
                  <div className="min-w-[700px] h-48 relative border-l border-b border-slate-800 flex items-end justify-between px-2 pt-4">
                    {compressorTelemetry.map((pt, i) => (
                      <div key={i} className="flex flex-col items-center justify-end group cursor-crosshair flex-1 mx-1 h-full relative">
                        {pt.is_anomaly && <div className={`absolute top-0 w-full h-full rounded ${pt.anomaly_type.includes('Surge') ? 'bg-red-500/20' : 'bg-amber-500/10'}`}></div>}
                        <div 
                          className={`w-full max-w-[24px] transition-all duration-500 rounded-t-sm relative ${pt.is_anomaly ? 'bg-gradient-to-t from-red-600 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-t from-emerald-600 to-teal-400'}`}
                          style={{ height: `${(pt.vibration_in_sec / 0.6) * 100}%` }}
                        ></div>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 bg-slate-800 border border-slate-700 text-xs rounded p-2 z-20 shadow-xl pointer-events-none">
                            <p className={`font-bold ${pt.is_anomaly ? 'text-red-400' : 'text-emerald-400'}`}>{pt.anomaly_type}</p>
                            <hr className="my-1 border-slate-600"/>
                            <p>Discharge: {pt.discharge_psi.toFixed(1)} PSI</p>
                            <p>Vibration: {pt.vibration_in_sec.toFixed(2)} in/s</p>
                            <p>Oil Temp: {pt.oil_temp_f.toFixed(1)} °F</p>
                            <p className="text-[10px] text-slate-500 mt-1">{pt.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Agent Briefing Panel */}
              <div className="col-span-1 rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col shadow-lg">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Diagnostic Brief
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 text-sm">
                  {compressorTelemetry.length > 0 && compressorTelemetry[compressorTelemetry.length-1].is_anomaly ? (
                    <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-200 shadow-inner">
                      <strong className="block text-red-400 mb-2">Critical Alert: {activeCompressor}</strong>
                      <div className="mb-3">
                        <span className="text-red-300 font-semibold block">Detected Root Cause:</span>
                        <span className="font-mono bg-red-900/50 px-2 py-1 rounded text-xs border border-red-500/30 inline-block mt-1">
                          {compressorTelemetry[compressorTelemetry.length-1].anomaly_type}
                        </span>
                      </div>
                      
                      <div className="mb-4 text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 block mb-1">Trigger Telemetry:</span>
                        Discharge: {compressorTelemetry[compressorTelemetry.length-1].discharge_psi.toFixed(1)} PSI<br/>
                        Vibration: {compressorTelemetry[compressorTelemetry.length-1].vibration_in_sec.toFixed(2)} in/s<br/>
                        Oil Temp: {compressorTelemetry[compressorTelemetry.length-1].oil_temp_f.toFixed(1)} °F
                      </div>

                      <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                        <span className="text-blue-400 font-semibold block mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Prescriptive Solution:
                        </span>
                        <p className="text-blue-200 italic mb-3">"{compressorTelemetry[compressorTelemetry.length-1].recommended_solution}"</p>
                        
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center border border-blue-400">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          Execute Autonomous Solution
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                      <strong className="block text-emerald-400 mb-1">System Nominal</strong>
                      Unit {activeCompressor} is operating within predicted aerodynamic and mechanical envelopes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ESPs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Telemetry Chart moved here */}
              <div className="col-span-1 lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-slate-100">Live ML Telemetry</h3>
                    <select 
                      value={activeEsp} 
                      onChange={(e) => setActiveEsp(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded px-3 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="ESP-001">Unit ESP-001</option>
                      <option value="ESP-002">Unit ESP-002</option>
                      <option value="ESP-003">Unit ESP-003</option>
                      <option value="ESP-004">Unit ESP-004</option>
                    </select>
                  </div>
                  {telemetry.some(t => t.is_anomaly) ? (
                    <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded animate-pulse">Isolation Forest: Anomaly Found</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">Model State: Normal</span>
                  )}
                </div>
                <div className="w-full overflow-x-auto pb-4">
                  <div className="min-w-[700px] h-64 relative border-l border-b border-slate-800 flex items-end justify-between px-2 pt-4">
                    {telemetry.map((pt, i) => (
                      <div key={i} className="flex flex-col items-center justify-end group cursor-crosshair flex-1 mx-1 h-full">
                        <div 
                          className={`w-full max-w-[24px] transition-all duration-500 rounded-t-sm relative ${pt.is_anomaly ? 'bg-gradient-to-t from-red-600 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-t from-blue-600 to-teal-400'}`}
                          style={{ height: `${(pt.torque_nm / 80) * 100}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-32 bg-slate-800 border border-slate-700 text-xs rounded p-2 z-20 shadow-xl">
                            <p><strong>ML Analysis: {pt.is_anomaly ? 'ANOMALY' : 'NORMAL'}</strong></p>
                            <hr className="my-1 border-slate-600"/>
                            <p>Torque: {pt.torque_nm.toFixed(1)} Nm</p>
                            <p>RPM: {pt.rpm}</p>
                            <p>Tool Wear: {pt.tool_wear_min} min</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 rotate-45 transform origin-left whitespace-nowrap">{pt.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Agent Briefing Panel moved here */}
              <div className="col-span-1 rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col shadow-lg">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Diagnostic Brief
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 text-sm">
                  {telemetry.length > 0 && telemetry.some(t => t.is_anomaly) ? (
                    <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-200 shadow-inner">
                      <strong className="block text-red-400 mb-2">Critical Alert: {activeEsp}</strong>
                      <div className="mb-3">
                        <span className="text-red-300 font-semibold block">Detected Root Cause:</span>
                        <span className="font-mono bg-red-900/50 px-2 py-1 rounded text-xs border border-red-500/30 inline-block mt-1">
                          {telemetry.filter(t => t.is_anomaly).pop()?.anomaly_type || 'Unknown Anomaly'}
                        </span>
                      </div>
                      
                      <div className="mb-4 text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 block mb-1">Trigger Telemetry:</span>
                        Torque: {telemetry.filter(t => t.is_anomaly).pop()?.torque_nm.toFixed(1)} Nm<br/>
                        RPM: {telemetry.filter(t => t.is_anomaly).pop()?.rpm}<br/>
                        Process Temp: {telemetry.filter(t => t.is_anomaly).pop()?.process_temp_k.toFixed(1)} K
                      </div>

                      <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                        <span className="text-blue-400 font-semibold block mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Prescriptive Solution:
                        </span>
                        <p className="text-blue-200 italic mb-3">"{telemetry.filter(t => t.is_anomaly).pop()?.recommended_solution || 'Inspect manually.'}"</p>
                        
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center border border-blue-400">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          Execute Autonomous Solution
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                      <strong className="block text-emerald-400 mb-1">System Nominal</strong>
                      All ESP units are operating within predicted efficiency envelopes. ML Engine is actively monitoring for root-cause signatures.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Pipeline Integrity' && (
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-xl font-semibold text-slate-100">Pipeline Segment</h3>
                    <select 
                      value={activePipeline} 
                      onChange={(e) => setActivePipeline(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded px-3 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="P-01">P-01 (Umugini Line)</option>
                      <option value="P-02">P-02 (Trans-Forcados)</option>
                    </select>
                  </div>
                  <p className="text-sm text-slate-400">Model: SCADA/DAS Sensor Fusion Engine</p>
                </div>
                <div className="flex space-x-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded border border-slate-700">
                    <span className="text-xs text-slate-500 block">SCADA Status</span>
                    {pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length - 1].pressure_psi < 1180 ? 
                      <span className="text-amber-400 font-bold">Pressure Drop</span> : 
                      <span className="text-emerald-400 font-bold">Stable</span>}
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded border border-slate-700">
                    <span className="text-xs text-slate-500 block">DAS Status</span>
                    {pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length - 1].acoustic_amplitude_db > 60 ? 
                      <span className="text-amber-400 font-bold">Noise Spike</span> : 
                      <span className="text-emerald-400 font-bold">Quiet</span>}
                  </div>
                  <div className={`text-center p-3 rounded border ${pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length - 1].anomaly_type === 'Critical Leak' ? 'bg-red-500/20 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    <span className="text-xs text-slate-300 block">AI Fusion State</span>
                    <span className={`font-bold ${pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length - 1].anomaly_type === 'Critical Leak' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {pipelineTelemetry.length > 0 ? (pipelineTelemetry[pipelineTelemetry.length - 1].anomaly_type === 'Critical Leak' ? 'LEAK DETECTED' : 'Nominal') : 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Pipeline Representation */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Continuous DAS Tracking (150km Trunkline)
                </h3>
                <div className="relative h-12 bg-slate-800 rounded-full overflow-visible border border-slate-700 mt-10 mb-6 shadow-inner">
                  {/* Pipeline flow animation */}
                  <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-500/10 via-teal-500/20 to-blue-500/10 animate-[pulse_3s_infinite] rounded-full"></div>
                  
                  {/* Anomaly Location Pinpoint */}
                  {pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length-1].location_km > 0 && (
                    <div 
                      className={`absolute -top-2 -bottom-2 w-3 rounded-full transition-all duration-700 z-10 ${pipelineTelemetry[pipelineTelemetry.length-1].anomaly_type === 'Critical Leak' ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-amber-400 shadow-[0_0_20px_#fbbf24]'}`}
                      style={{ left: `${(pipelineTelemetry[pipelineTelemetry.length-1].location_km / 150) * 100}%` }}
                    >
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-3 py-1.5 rounded border border-slate-600 whitespace-nowrap shadow-xl flex flex-col items-center min-w-[120px]">
                        <span className="font-bold text-slate-200">Event Detected</span>
                        <span className={pipelineTelemetry[pipelineTelemetry.length-1].anomaly_type === 'Critical Leak' ? 'text-red-400 font-mono mt-1' : 'text-amber-400 font-mono mt-1'}>
                          KM Marker: {pipelineTelemetry[pipelineTelemetry.length-1].location_km.toFixed(1)}
                        </span>
                        {/* Down pointing triangle */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-600"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* SCADA Checkpoints */}
                  {[0, 25, 50, 75, 100].map((percent, idx) => (
                    <div key={idx} className="absolute top-0 h-full w-1 bg-slate-600/50" style={{ left: `${percent}%` }}>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">
                        {percent === 0 ? 'Pump Stn A (0km)' : percent === 100 ? 'Terminal B (150km)' : `Block Valve`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Visualizing SCADA vs DAS */}
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Multi-Modal Sensor Feed</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>SCADA Pressure (PSI)</span>
                        <span>{pipelineTelemetry.length > 0 ? pipelineTelemetry[pipelineTelemetry.length-1].pressure_psi.toFixed(1) : '--'} / 1200</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length-1].pressure_psi < 1180 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${pipelineTelemetry.length > 0 ? Math.min((pipelineTelemetry[pipelineTelemetry.length-1].pressure_psi / 1300) * 100, 100) : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>DAS Acoustic Amplitude (dB)</span>
                        <span>{pipelineTelemetry.length > 0 ? pipelineTelemetry[pipelineTelemetry.length-1].acoustic_amplitude_db.toFixed(1) : '--'} / 100</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length-1].acoustic_amplitude_db > 60 ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width: `${pipelineTelemetry.length > 0 ? Math.min((pipelineTelemetry[pipelineTelemetry.length-1].acoustic_amplitude_db / 100) * 100, 100) : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Streaming Chart */}
                  <div className="mt-6 h-40 flex items-end justify-between border-b border-slate-800 px-1 relative">
                    {pipelineTelemetry.map((pt, i) => (
                       <div key={i} className="flex-1 mx-[1px] relative group flex flex-col justify-end items-center h-full">
                         {pt.is_anomaly && <div className={`absolute top-0 w-full h-full rounded ${pt.anomaly_type === 'Critical Leak' ? 'bg-red-500/20' : 'bg-amber-500/10'}`}></div>}
                         <div className={`w-full max-w-[12px] rounded-t-sm transition-all ${pt.anomaly_type === 'Critical Leak' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : (pt.anomaly_type.includes('Noise') ? 'bg-amber-400' : 'bg-teal-400')}`} style={{ height: `${Math.min((pt.acoustic_amplitude_db / 100) * 100, 100)}%` }}></div>
                         
                         {/* Tooltip */}
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 bg-slate-800 border border-slate-700 text-xs rounded p-2 z-20 shadow-xl pointer-events-none">
                            <p className={`font-bold ${pt.anomaly_type === 'Critical Leak' ? 'text-red-400' : (pt.anomaly_type.includes('Noise') ? 'text-amber-400' : 'text-emerald-400')}`}>{pt.anomaly_type}</p>
                            <hr className="my-1 border-slate-600"/>
                            <p>Pressure: {pt.pressure_psi.toFixed(1)} PSI</p>
                            <p>Acoustic: {pt.acoustic_amplitude_db.toFixed(1)} dB</p>
                            <p className="text-[10px] text-slate-500 mt-1">{pt.timestamp}</p>
                         </div>
                       </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span>T-300s</span>
                    <span>Live</span>
                  </div>
                </div>

                {/* AI Briefing & Comparison */}
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    AI Diagnostic Agent
                  </h3>
                  
                  <div className="flex-1 bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 mb-6 overflow-y-auto">
                    {pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length-1].anomaly_type === 'Critical Leak' ? (
                      <div className="text-red-200 text-sm">
                        <span className="text-red-400 font-bold block mb-2">URGENT: LEAK CONFIRMED</span>
                        <p>Simultaneous SCADA pressure drop and DAS acoustic spike detected. This is a highly corroborated event.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                          <li>Pressure: {pipelineTelemetry[pipelineTelemetry.length-1].pressure_psi.toFixed(1)} PSI</li>
                          <li>Acoustic: {pipelineTelemetry[pipelineTelemetry.length-1].acoustic_amplitude_db.toFixed(1)} dB</li>
                        </ul>
                        <button className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs transition-colors shadow-lg shadow-red-500/20">Trigger Emergency Shutdown</button>
                      </div>
                    ) : pipelineTelemetry.length > 0 && pipelineTelemetry[pipelineTelemetry.length-1].anomaly_type === 'Background Noise (False Alarm Avoided)' ? (
                      <div className="text-amber-200 text-sm">
                        <span className="text-amber-400 font-bold block mb-2">AI INTERVENTION: FALSE ALARM AVERTED</span>
                        <p>DAS detected a massive acoustic spike ({pipelineTelemetry[pipelineTelemetry.length-1].acoustic_amplitude_db.toFixed(1)} dB). Legacy systems would have triggered a shutdown. However, PetroSight Sensor Fusion verified SCADA pressure is nominal ({pipelineTelemetry[pipelineTelemetry.length-1].pressure_psi.toFixed(1)} PSI).</p>
                        <p className="mt-2 text-xs text-amber-500">Classification: Unauthorized digging or heavy machinery near pipeline. No leak present.</p>
                      </div>
                    ) : (
                      <div className="text-emerald-200 text-sm">
                        <span className="text-emerald-400 font-bold block mb-2">SYSTEM NOMINAL</span>
                        <p>Sensor Fusion model is actively monitoring SCADA and DAS streams.</p>
                        <p className="mt-2 text-xs text-emerald-500">Awaiting transient events...</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Model Confidence Comparison</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Traditional SCADA Accuracy', val: pipelineTelemetry.length > 0 ? pipelineTelemetry[pipelineTelemetry.length-1].scada_confidence : 0, color: 'bg-blue-400' },
                        { label: 'Legacy DAS Accuracy', val: pipelineTelemetry.length > 0 ? pipelineTelemetry[pipelineTelemetry.length-1].das_confidence : 0, color: 'bg-teal-400' },
                        { label: 'PetroSight Sensor Fusion', val: pipelineTelemetry.length > 0 ? pipelineTelemetry[pipelineTelemetry.length-1].fusion_confidence : 0, color: 'bg-gradient-to-r from-emerald-400 to-blue-500' }
                      ].map((bar, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs text-slate-300 mb-1">
                            <span>{bar.label}</span>
                            <span>{bar.val.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${bar.color} transition-all duration-700`} style={{ width: `${bar.val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Agentic Briefings' && (
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-2xl font-semibold text-slate-100 flex items-center">
                  <svg className="w-7 h-7 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  Agentic Briefings Hub
                </h3>
                {briefing && (
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-lg ${briefing.overall_status === 'NOMINAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse shadow-amber-500/10'}`}>
                    FLEET STATUS: {briefing.overall_status}
                  </span>
                )}
              </div>
              
              {briefing ? (
                <div className="space-y-6 relative z-10">
                  <div className="p-6 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700 shadow-inner">
                    <h4 className="text-lg font-semibold text-blue-300 mb-4 border-b border-slate-700/50 pb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      08:00 AM Shift Handover
                    </h4>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: briefing.shift_handover.replace(/\n/g, '<br/>').replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100">$1</strong>').replace(/\* /g, '<span class="text-blue-400 mr-2">&#8226;</span> ') }} />
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700 shadow-inner">
                    <h4 className="text-lg font-semibold text-teal-300 mb-4 border-b border-slate-700/50 pb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      Weekly Fleet Optimization Report
                    </h4>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: briefing.weekly_report.replace(/\n/g, '<br/>').replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100">$1</strong>').replace(/\* /g, '<span class="text-teal-400 mr-2">&#8226;</span> ') }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mt-4 px-2">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                      Synchronized with live SCADA & ML streams
                    </div>
                    <div>
                      Report generated autonomously by PetroSight Intelligence Engine at {new Date(briefing.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 relative z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400 mx-auto mb-6"></div>
                  <p className="text-slate-400 font-medium">Aggregating fleet telemetry & synthesizing NLP reports...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
