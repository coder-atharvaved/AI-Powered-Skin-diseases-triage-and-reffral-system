import React, { useState, useEffect } from 'react';
import { Stethoscope, Inbox, FileText, CheckCircle, Clock, AlertTriangle, ArrowLeft, RefreshCw, Send, Eye } from 'lucide-react';
import { api } from '../services/api';

export default function DoctorDashboard({ user, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [sliderOpacity, setSliderOpacity] = useState(0.5);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await api.getDoctorQueue();
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleCaseSelect = (item) => {
    setSelectedCase(item);
    setFeedbackText(item.doctorFeedback || '');
    setSliderOpacity(0.5);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setSubmittingFeedback(true);
    try {
      const updatedCase = await api.submitDoctorFeedback(selectedCase.id, feedbackText);
      setSelectedCase(updatedCase);
      fetchQueue(); // Refresh queue list
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
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

  const getReferralBadgeColor = (referral) => {
    if (referral.includes('Emergency')) return 'bg-red-500 text-white';
    if (referral.includes('Dermatologist')) return 'bg-amber-500 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-600 rounded-lg text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              DermaTriage <span className="text-teal-600 font-medium text-sm">Doctor Console</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 text-xs font-semibold text-teal-800">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span>{user.name} ({user.specialization})</span>
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

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-8">
        
        {/* CASE DETAIL VIEW */}
        {selectedCase ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedCase(null)}
                className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Referral Queue
              </button>
              <div className="text-xs text-slate-400 font-mono">CASE ID: {selectedCase.id.toUpperCase()}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Image, Heatmap and patient history details */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Grad-CAM Lesion Segmentation
                </span>
                
                {/* Opacity slider visualizer */}
                <div className="relative w-full aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                  <img src={selectedCase.image} className="absolute inset-0 w-full h-full object-cover" alt="Patient Skin Original" />
                  <img 
                    src={selectedCase.heatmap} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity" 
                    style={{ opacity: sliderOpacity }} 
                    alt="Grad-CAM Hotspot" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <span>Original</span>
                    <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                      Heatmap Overlay: {Math.round(sliderOpacity * 100)}%
                    </span>
                    <span>Grad-CAM</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={sliderOpacity} 
                    onChange={(e) => setSliderOpacity(parseFloat(e.target.value))} 
                    className="w-full h-1.5 bg-teal-100 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none" 
                  />
                </div>

                {/* Patient details */}
                <div className="border-t border-slate-150 pt-4 space-y-3 text-xs text-slate-700">
                  <span className="block font-bold text-slate-500 uppercase tracking-wider">Patient Information</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wide text-[10px]">Name:</span>
                      <span className="font-semibold text-slate-900">{selectedCase.patientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wide text-[10px]">Age / Gender:</span>
                      <span className="font-semibold text-slate-900">{selectedCase.age} yrs / {selectedCase.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wide text-[10px]">Timeline:</span>
                      <span className="font-semibold text-slate-900">{selectedCase.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wide text-[10px]">Itching / Pain:</span>
                      <span className="font-semibold text-slate-900">{selectedCase.itching} / {selectedCase.pain}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wide text-[10px]">Symptoms Description:</span>
                    <p className="mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[11px] text-slate-600 font-medium">
                      {selectedCase.symptoms}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: AI predictions, LLM analysis, and Verification form */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* AI classification summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    AI Classifier Inference
                  </span>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900">{selectedCase.diseaseName}</h4>
                      <span className="text-xs text-slate-500 font-medium">CNN confidence: {selectedCase.confidence}%</span>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold border rounded-md ${getSeverityBadgeColor(selectedCase.severity)}`}>
                      {selectedCase.severity} Severity
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl flex items-center justify-between text-white ${getReferralBadgeColor(selectedCase.referral)}`}>
                    <div className="text-xs">
                      <span className="opacity-80 block uppercase font-bold tracking-wide">Suggested Triage Action</span>
                      <span className="text-base font-bold">{selectedCase.referral}</span>
                    </div>
                    <AlertTriangle className="h-6 w-6 opacity-30" />
                  </div>
                </div>

                {/* LLM Report description */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    AI Clinical Explanation (LLM Output)
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans italic">
                    "{selectedCase.llmExplanation}"
                  </p>
                </div>

                {/* Doctor feedback submission card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-150 pb-3">
                    <CheckCircle className="h-5 w-5 text-teal-600" />
                    <span className="text-sm font-bold text-slate-900">Clinical Verification & Review Note</span>
                  </div>

                  {selectedCase.doctorReplied ? (
                    <div className="space-y-4">
                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs text-teal-800">
                        <span className="block font-bold uppercase tracking-wider mb-1">Your Filed Recommendation</span>
                        <p className="italic">"{selectedCase.doctorFeedback}"</p>
                        <span className="block text-[10px] text-teal-600 font-semibold mt-2 text-right">
                          Submitted on: {new Date(selectedCase.doctorRepliedAt).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCase(null)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                      >
                        Return to Referral Queue
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                          Your Clinical Impression / Prescription Notes
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Provide diagnosis feedback, suggested ointment/cream, test advice, or specify if they must visit you at the hospital..."
                          className="block w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(null)}
                          className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingFeedback || !feedbackText.trim()}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-bold rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all shadow-md disabled:opacity-50"
                        >
                          {submittingFeedback ? 'Submitting...' : 'File Verification'}
                          <Send className="ml-1.5 h-3.5 w-3.5" />
                        </button>
                      </div>
                    </form>
                  )}

                </div>

              </div>

            </div>
          </div>
        ) : (
          /* WORK QUEUE LIST VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Referred Patient Queue</h2>
                <p className="text-sm text-slate-500 mt-1">Review skin conditions categorized as Moderate/Severe by AI triage.</p>
              </div>
              <button 
                onClick={fetchQueue}
                disabled={loadingQueue}
                className="inline-flex items-center text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingQueue ? 'animate-spin' : ''}`} /> Refresh Queue
              </button>
            </div>

            {loadingQueue ? (
              <div className="flex justify-center items-center py-20 text-slate-500 text-sm space-x-2">
                <RefreshCw className="animate-spin h-5 w-5 text-teal-600" />
                <span>Fetching referred cases...</span>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-20 space-y-3 bg-slate-50 rounded-xl border border-slate-150">
                <Inbox className="mx-auto h-12 w-12 text-slate-400" />
                <h4 className="text-base font-bold text-slate-700">All Cases Clear</h4>
                <p className="text-xs text-slate-500">There are no pending referred patient diagnostics at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Lesion</th>
                      <th className="px-6 py-4 text-left">Patient Name</th>
                      <th className="px-6 py-4 text-left">AI Indication</th>
                      <th className="px-6 py-4 text-left">Triage Level</th>
                      <th className="px-6 py-4 text-left">Date Referred</th>
                      <th className="px-6 py-4 text-left">Action Status</th>
                      <th className="px-6 py-4 text-center">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700 bg-white">
                    {queue.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img src={item.image} className="h-10 w-10 rounded-lg object-cover border border-slate-200" alt="Lesion small thumbnail" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{item.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.age} yrs / {item.gender}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{item.diseaseName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Confidence: {item.confidence}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-xs font-semibold border rounded-full ${getSeverityBadgeColor(item.severity)}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.doctorReplied ? (
                            <span className="inline-flex items-center text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                              Reviewed
                            </span>
                          ) : item.referral.includes('Emergency') ? (
                            <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded animate-pulse">
                              Urgent Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              Needs Signoff
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleCaseSelect(item)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Verify Case"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
