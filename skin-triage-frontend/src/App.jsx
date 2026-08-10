import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // home | auth | dashboard

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  const handleGetStarted = () => {
    setView('auth');
  };

  return (
    <div className="min-h-screen font-sans antialiased text-slate-900 bg-slate-50">
      {view === 'home' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      
      {view === 'auth' && (
        <Auth 
          onLoginSuccess={handleLoginSuccess} 
          onBackToHome={() => setView('home')} 
        />
      )}

      {view === 'dashboard' && user && (
        <>
          {user.role === 'patient' && (
            <PatientDashboard user={user} onLogout={handleLogout} />
          )}
          {user.role === 'doctor' && (
            <DoctorDashboard user={user} onLogout={handleLogout} />
          )}
          {user.role === 'admin' && (
            <AdminDashboard user={user} onLogout={handleLogout} />
          )}
        </>
      )}
    </div>
  );
}
