import React from 'react';
import { ShieldCheck, Activity, Sparkles, UploadCloud, Stethoscope, ArrowRight, Brain, AlertTriangle } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-card bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-600 rounded-lg text-white">
              <Activity className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Derma<span className="text-teal-600">Triage</span>
            </span>
            <span className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full font-medium border border-teal-200">
              AI Support
            </span>
          </div>
          <div>
            <button 
              onClick={onGetStarted}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              Access System <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative overflow-hidden py-20 bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_40%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Hero Left */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-full text-teal-400 text-xs font-semibold">
                  <Sparkles className="h-3 w-3" />
                  <span>Next-Gen Dermatological Decision Support</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                  AI-Powered Skin Disease <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Triage & Referral</span> System
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl">
                  Analyze skin lesions instantly. Our system uses advanced CNNs for disease classification, Grad-CAM for explainability, and LLMs for patient-friendly reports.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button 
                    onClick={onGetStarted}
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-900/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Start Triage Assessment <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                  <a 
                    href="#how-it-works"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all"
                  >
                    How it Works
                  </a>
                </div>
              </div>

              {/* Hero Right / Visual Card Preview */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-sm rounded-2xl border border-slate-700/50 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">analysis_output.json</span>
                  </div>
                  
                  {/* Mock UI elements simulating active diagnosis */}
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                      <div className="absolute inset-0 bg-cover opacity-70 bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1584617508493-21b2c4825902?w=400&auto=format&fit=crop&q=60')" }} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.5),transparent_70%)]" />
                      <div className="scanning-line" />
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 text-[10px] text-teal-400 px-2 py-0.5 rounded font-mono border border-teal-500/20">
                        Grad-CAM Overlay
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Predicted Condition:</span>
                        <span className="text-teal-400 font-semibold">Psoriasis Vulgaris</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '84%' }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Confidence: 84.5%</span>
                        <span>Severity: Moderate</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-mono">
                      <span className="text-teal-500 font-bold block mb-1">💡 LLM Insight:</span>
                      "Plaque-like formation identified. Autoimmune markers recommended. Immediate emergency intervention not indicated."
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Clinical Disclaimer Alert Banner */}
        <div className="bg-yellow-50 border-y border-yellow-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">Clinical Decision Support Disclaimer</h4>
              <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                DermaTriage is an experimental AI decision-support platform designed for educational and informational purposes. It is <strong>not a medical diagnostic tool</strong>. Predictions, severity estimates, and LLM explanations are simulated findings. All medical conditions must be verified by a board-certified dermatologist or healthcare professional.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Advanced Features Built for Healthcare Triage
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                A multi-layered AI triage engine providing transparent, understandable, and actionable patient routing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500 transition-all group">
                <div className="p-3 bg-teal-100 text-teal-700 rounded-xl inline-block mb-4 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">CNN Classification</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Deep learning models (EfficientNet/ResNet) classify 10+ skin disease categories with high accuracy.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500 transition-all group">
                <div className="p-3 bg-teal-100 text-teal-700 rounded-xl inline-block mb-4 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Explainable AI (XAI)</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Grad-CAM maps overlay heatmaps on skin images to show the visual regions influencing the AI prediction.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500 transition-all group">
                <div className="p-3 bg-teal-100 text-teal-700 rounded-xl inline-block mb-4 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Dermatology Referral</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Heuristic referral system routes patients based on AI severity outputs, directing them to correct care pathways.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500 transition-all group">
                <div className="p-3 bg-teal-100 text-teal-700 rounded-xl inline-block mb-4 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Doctor Validation</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Dermatologist verification loop logs case reviews, providing secure clinical double-checks.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Three Simple Steps to Safe Triage
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 hidden lg:block -translate-y-1/2 z-0" />
              
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative z-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900">Upload Image</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Provide a clear close-up photo of the affected skin region and submit it to the secure portal.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative z-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900">Describe Symptoms</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Answer basic clinical questions regarding itch, pain levels, and onset duration for context.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative z-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900">Receive Assessment</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  View your diagnostic predictions, download reports, or automatically request doctor review.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-teal-600 rounded text-white">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              DermaTriage
            </span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} DermaTriage. Developed for Final Year CS Capstone Project.
          </p>
          <div className="flex space-x-6 text-xs">
            <button onClick={onGetStarted} className="hover:text-teal-400">Patient Dashboard</button>
            <button onClick={onGetStarted} className="hover:text-teal-400">Doctor Portal</button>
            <button onClick={onGetStarted} className="hover:text-teal-400">Admin Console</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
