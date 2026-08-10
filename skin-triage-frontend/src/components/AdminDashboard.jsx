import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, FileSpreadsheet, RefreshCw, BarChart3, TrendingUp, AlertOctagon } from 'lucide-react';
import { api } from '../services/api';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const CHART_COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const SEVERITY_COLORS = {
  Mild: '#22c55e',
  Moderate: '#f59e0b',
  Severe: '#ef4444'
};

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'Mild': return 'bg-green-100 text-green-800 border-green-200';
      case 'Moderate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Severe': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-600 rounded-lg text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              DermaTriage <span className="text-teal-600 font-medium text-sm">Admin Console</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
              Admin: {user.name}
            </div>
            <button 
              onClick={onLogout}
              className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-8 space-y-8">
        
        {/* Title and Refresh Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Analytics & Operations Overview</h2>
            <p className="text-sm text-slate-500 mt-0.5">Global monitoring of AI diagnostic assessments, medical triage, and role statistics.</p>
          </div>
          <button 
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
          </button>
        </div>

        {loading && !stats ? (
          <div className="flex justify-center items-center py-32 text-slate-500 text-sm space-x-2">
            <RefreshCw className="animate-spin h-6 w-6 text-teal-600" />
            <span>Compiling aggregate analytics data...</span>
          </div>
        ) : stats ? (
          <>
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-teal-50 border border-teal-150 rounded-xl text-teal-600">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Assessments</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.totalAssessments}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-blue-50 border border-blue-150 rounded-xl text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patients Enrolled</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.totalPatients}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dermatologists</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.totalDoctors}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-slate-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Accounts</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</span>
                </div>
              </div>

            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Daily Activity Area Chart */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Triage Pipeline Load (Last 5 Days)
                </span>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.activityData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontStyle="bold" tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Assessments Run" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Severity Breakdown Bar Chart */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Severity Class Breakdown
                </span>
                <div className="h-64 w-full">
                  {stats.totalAssessments === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.severityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="value" name="Cases">
                          {stats.severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#64748b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Disease Distribution Pie Chart */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Disease Type Distribution
                </span>
                <div className="h-64 w-full flex items-center justify-center">
                  {stats.totalAssessments === 0 ? (
                    <span className="text-xs text-slate-400">No data logged</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.diseaseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.diseaseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Referral Routing Pie Chart */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Clinical Referral Destination Split
                </span>
                <div className="h-64 w-full flex items-center justify-center">
                  {stats.totalAssessments === 0 ? (
                    <span className="text-xs text-slate-400">No data logged</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.referralData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.referralData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* Recent System Logs Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Diagnostic Operations Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time audit log of the skin diagnostic assessments submitted to the system.</p>
              </div>

              {stats.recentAssessments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No logged assessments on system database.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-mono text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5 text-left">Case ID</th>
                        <th className="px-6 py-3.5 text-left">Patient</th>
                        <th className="px-6 py-3.5 text-left">Condition (Confidence)</th>
                        <th className="px-6 py-3.5 text-left">Severity</th>
                        <th className="px-6 py-3.5 text-left">Referral Route</th>
                        <th className="px-6 py-3.5 text-left">Doctor Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs text-slate-700 bg-white">
                      {stats.recentAssessments.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-500 whitespace-nowrap">{log.id.toUpperCase()}</td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-900">{log.patientName}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">{log.age}y / {log.gender}</span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">{log.diseaseName}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">Conf: {log.confidence}%</span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 font-semibold border rounded-full ${getSeverityBadgeColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap font-medium text-slate-800">{log.referral}</td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            {log.doctorReplied ? (
                              <span className="text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
                                Signed off
                              </span>
                            ) : log.referral !== 'Stay at Home' ? (
                              <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold animate-pulse">
                                Pending Doctor
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold">Not required</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}

      </main>
    </div>
  );
}
