import React, { useState, useEffect } from 'react';
import { UploadCloud, History, PlusCircle, CheckCircle, AlertCircle, FileText, User, LogOut, ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import { api } from '../services/api';
import { downloadMedicalReport } from './MedicalReportPDF';

export default function PatientDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('new_assessment'); // new_assessment | history | result
  const [history, setHistory] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Form State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('1 week');
  const [itching, setItching] = useState('Mild');
  const [pain, setPain] = useState('None');
  const [spread, setSpread] = useState('Slow');
  const [image, setImage] = useState(null); // base64 representation
  const [imageFile, setImageFile] = useState(null);
  
  // Loading & Result States
  const [submitting, setSubmitting] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: Idle, 1: Preprocessing, 2: CNN Inference, 3: LLM Generation
  const [sliderOpacity, setSliderOpacity] = useState(0.5);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await api.getHistory(user.id);
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerMockAnalysis = async (e) => {
    e.preventDefault();
    if (!image) return;

    setSubmitting(true);
    setScanStep(1); // Preprocessing

    // Step-by-step scanner animation updates
    const timers = [
      setTimeout(() => setScanStep(2), 700),  // CNN Inference
      setTimeout(() => setScanStep(3), 1400), // LLM Generation
    ];

    try {
      const newReport = await api.submitAssessment(user.id, user.name, {
        age, gender, symptoms, duration, itching, pain, spread, image
      });
      
      timers.push(setTimeout(() => {
        setSubmitting(false);
        setSelectedAssessment(newReport);
        setActiveTab('result');
        fetchHistory(); // Refresh history list
        // Reset form
        setImage(null);
        setImageFile(null);
        setSymptoms('');
        setAge('');
      }, 2100));

    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const viewReportDetails = (assessment) => {
    setSelectedAssessment(assessment);
    setSliderOpacity(0.5); // Reset slider
    setActiveTab('result');
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
    if (referral.includes('Emergency')) return 'bg-red-600 text-white shadow-sm';
    if (referral.includes('Dermatologist')) return 'bg-amber-500 text-white shadow-sm';
    return 'bg-green-500 text-white shadow-sm';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-600 rounded-lg text-white">
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              DermaTriage <span className="text-teal-600 font-medium text-sm">Patient Portal</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
              <User className="h-4 w-4 text-slate-500" />
              <span>{user.name}</span>
            </div>
            <button 
              onClick={onLogout}
              className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-3">
          <button
            onClick={() => {
              setActiveTab('new_assessment');
              setSelectedAssessment(null);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
              activeTab === 'new_assessment'
                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/10'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="mr-3 h-5 w-5" />
            New Skin Assessment
          </button>
          
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedAssessment(null);
              fetchHistory();
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/10'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <History className="mr-3 h-5 w-5" />
            Assessment History
            {history.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'history' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                {history.length}
              </span>
            )}
          </button>
        </aside>

        {/* Central Work Content Area */}
        <main className="lg:col-span-9">
          
          {/* TAB: NEW SKIN ASSESSMENT */}
          {activeTab === 'new_assessment' && !submitting && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">New Skin Condition Assessment</h2>
                <p className="text-sm text-slate-500 mt-1">Upload a clear skin photo and enter symptom details for AI analysis.</p>
              </div>

              <form onSubmit={triggerMockAnalysis} className="space-y-6">
                
                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Image Upload Zone */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Upload Affected Skin Area Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-teal-500 transition-colors bg-slate-50/50">
                      {image ? (
                        <div className="space-y-3 text-center">
                          <img 
                            src={image} 
                            alt="Uploaded Preview" 
                            className="mx-auto h-48 w-48 object-cover rounded-lg border border-slate-200 shadow-sm"
                          />
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setImage(null); setImageFile(null); }}
                              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                            >
                              Remove Image
                            </button>
                            <label className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100/80 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer">
                              Change Image
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-center py-4">
                          <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                          <div className="flex text-sm text-slate-600 justify-center font-medium">
                            <label className="relative cursor-pointer bg-transparent rounded-md text-teal-600 hover:text-teal-700 font-bold">
                              <span>Upload skin photo</span>
                              <input type="file" required accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-slate-400">PNG, JPG up to 10MB (Close-up, focused photo with clear lighting)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Age (in years)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="block w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="block w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Onset duration */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Onset Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="block w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                    >
                      <option>Less than 1 week</option>
                      <option>1 week</option>
                      <option>2-4 weeks</option>
                      <option>1-6 months</option>
                      <option>More than 6 months</option>
                    </select>
                  </div>

                  {/* Spread speed */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Rate of Spread</label>
                    <select
                      value={spread}
                      onChange={(e) => setSpread(e.target.value)}
                      className="block w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                    >
                      <option>None</option>
                      <option>Slow</option>
                      <option>Rapid</option>
                    </select>
                  </div>

                  {/* Itching */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Itching Level</label>
                    <select
                      value={itching}
                      onChange={(e) => setItching(e.target.value)}
                      className="block w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                    >
                      <option>None</option>
                      <option>Mild</option>
                      <option>Moderate</option>
                      <option>Severe</option>
                    </select>
                  </div>

                  {/* Pain */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pain Level</label>
                    <select
                      value={pain}
                      onChange={(e) => setPain(e.target.value)}
                      className="block w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                    >
                      <option>None</option>
                      <option>Mild</option>
                      <option>Moderate</option>
                      <option>Severe</option>
                    </select>
                  </div>

                  {/* Symptoms Textarea */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Describe Symptoms / General Concerns</label>
                    <textarea
                      rows={3}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Describe the shape, color, scaling, or any triggers of the skin irritation (e.g. Red scaling patch on my right elbow, started after using a new detergent...)"
                      className="block w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                    />
                  </div>

                </div>

                <div className="flex justify-end border-t border-slate-100 pt-6">
                  <button
                    type="submit"
                    disabled={!image}
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Run AI Diagnostics
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* DYNAMIC ANALYSIS SCANNER PAGE */}
          {submitting && (
            <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl border border-slate-800 text-white flex flex-col items-center justify-center space-y-8 min-h-[480px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1),transparent_70%)]" />
              
              {/* Image Preview with overlay scanning animation */}
              <div className="relative h-44 w-44 rounded-xl overflow-hidden border border-slate-700/60 shadow-lg bg-slate-950 flex items-center justify-center">
                <img src={image} className="absolute inset-0 h-full w-full object-cover opacity-60" alt="Scanning preview" />
                <div className="scanning-line" />
              </div>

              {/* Status Texts */}
              <div className="text-center space-y-2 relative z-10 max-w-md">
                <h3 className="text-2xl font-bold tracking-tight">AI Diagnostic Pipeline Running</h3>
                <p className="text-slate-400 text-sm">Deploying convolutional networks and generative report engines...</p>
              </div>

              {/* Progress Steps Indicators */}
              <div className="w-full max-w-sm space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${scanStep >= 1 ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`} />
                    1. Image Preprocessing (224x224 Norm)
                  </span>
                  <span className="text-[10px] text-teal-400 font-bold">{scanStep > 1 ? 'OK' : scanStep === 1 ? 'ACTIVE' : 'WAIT'}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${scanStep >= 2 ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`} />
                    2. CNN Classification Inference
                  </span>
                  <span className="text-[10px] text-teal-400 font-bold">{scanStep > 2 ? 'OK' : scanStep === 2 ? 'ACTIVE' : 'WAIT'}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${scanStep >= 3 ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`} />
                    3. Generative AI Patient Explanation
                  </span>
                  <span className="text-[10px] text-teal-400 font-bold">{scanStep === 3 ? 'ACTIVE' : 'WAIT'}</span>
                </div>
              </div>

              <div className="flex items-center text-xs text-teal-400 space-x-2 animate-pulse">
                <RefreshCw className="animate-spin h-3 w-3" />
                <span>Computing Grad-CAM segmentation...</span>
              </div>
            </div>
          )}

          {/* TAB: DIAGNOSIS RESULT PAGE */}
          {activeTab === 'result' && selectedAssessment && (
            <div className="space-y-6">
              
              {/* Back to top selector */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setActiveTab(history.length > 0 ? 'history' : 'new_assessment');
                    setSelectedAssessment(null);
                  }}
                  className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </button>
                <button
                  onClick={() => downloadMedicalReport(selectedAssessment)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg text-xs font-bold transition-all"
                >
                  <FileText className="h-4 w-4 mr-2" /> Download Report PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Result Column Left: Grad-CAM Overlay Visualizer */}
                <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Grad-CAM Heatmap Analysis
                  </span>
                  
                  {/* Slider Image viewer container */}
                  <div className="relative w-full aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                    {/* Original image */}
                    <img 
                      src={selectedAssessment.image} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      alt="Skin Lesion Original" 
                    />
                    {/* Grad-CAM Heatmap image overlayed with dynamic opacity */}
                    <img 
                      src={selectedAssessment.heatmap} 
                      className="absolute inset-0 w-full h-full object-cover transition-opacity" 
                      style={{ opacity: sliderOpacity }} 
                      alt="Grad-CAM Segmentation" 
                    />
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Original Image</span>
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
                      className="w-full h-1.5 bg-teal-100 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
                    />
                    <span className="block text-[10px] text-center text-slate-400 font-medium">
                      Drag slider to check AI segmentation highlight zones.
                    </span>
                  </div>
                </div>

                {/* Result Column Right: AI Metrics & LLM Report */}
                <div className="md:col-span-7 space-y-6">
                  
                  {/* AI Diagnosis Metrics Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI Classification</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{selectedAssessment.diseaseName}</h3>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold border rounded-md ${getSeverityBadgeColor(selectedAssessment.severity)}`}>
                        {selectedAssessment.severity} Severity
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Classification Confidence Probability:</span>
                        <span className="text-teal-600 font-bold">{selectedAssessment.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${selectedAssessment.confidence}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Referral Decision Action Card */}
                  <div className={`p-5 rounded-2xl flex items-center justify-between text-white ${getReferralBadgeColor(selectedAssessment.referral)}`}>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 block">Triage Route Recommendation</span>
                      <span className="text-lg font-extrabold">{selectedAssessment.referral}</span>
                    </div>
                    <AlertCircle className="h-10 w-10 opacity-40 shrink-0" />
                  </div>

                  {/* LLM Patient friendly explanation */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <div className="p-1 bg-teal-50 border border-teal-200 rounded-lg text-teal-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">AI Medical Report & Breakdown (Gemini)</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-sans italic">
                      "{selectedAssessment.llmExplanation}"
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Suggested Care Instructions:</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedAssessment.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Doctor Verification details */}
                  {selectedAssessment.doctorReplied ? (
                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Dermatologist Verified Response</span>
                        <span className="text-[10px] text-teal-600 font-bold">{new Date(selectedAssessment.doctorRepliedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic font-medium">
                        "{selectedAssessment.doctorFeedback}"
                      </p>
                      <div className="text-xs text-slate-500 text-right font-bold mt-2">
                        — Dr. Anjali Mehta, MD (Dermatology)
                      </div>
                    </div>
                  ) : selectedAssessment.referral !== 'Stay at Home' ? (
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                      <span className="text-xs font-bold text-slate-500">
                        🔄 Case submitted to clinical specialist review queue. Check history tab for updates.
                      </span>
                    </div>
                  ) : null}

                </div>
              </div>
            </div>
          )}

          {/* TAB: ASSESSMENT HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assessment History Logs</h2>
                <p className="text-sm text-slate-500 mt-1">Review all your previous skin diagnostic history and doctor replies.</p>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-50 rounded-xl border border-slate-150">
                  <History className="mx-auto h-12 w-12 text-slate-400" />
                  <h4 className="text-base font-bold text-slate-700">No Assessment History Found</h4>
                  <p className="text-xs text-slate-500">Submit your first skin scan using the "New Skin Assessment" panel.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-6 py-4 text-left">Lesion Image</th>
                        <th className="px-6 py-4 text-left">Predicted Condition</th>
                        <th className="px-6 py-4 text-left">Severity</th>
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-left">Specialist Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm text-slate-700 bg-white">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img src={item.image} className="h-12 w-12 rounded-lg object-cover border border-slate-200" alt="Lesion thumbnail" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                            {item.diseaseName}
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">Confidence: {item.confidence}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-xs font-semibold border rounded-full ${getSeverityBadgeColor(item.severity)}`}>
                              {item.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.doctorReplied ? (
                              <span className="inline-flex items-center text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                                Verified
                              </span>
                            ) : item.referral !== 'Stay at Home' ? (
                              <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded animate-pulse">
                                Pending Doctor
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs text-slate-400 font-bold">
                                Not Required
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => viewReportDetails(item)}
                                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => downloadMedicalReport(item)}
                                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Download Report"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            </div>
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
    </div>
  );
}
