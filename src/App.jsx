import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Generator from './Generator';

export default function App() {
  const [page, setPage] = useState('landing');

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Page Switcher - Only show on landing page for dev */}
      {page === 'landing' && (
        <div className="fixed top-4 right-4 z-[100] flex space-x-2">
          <button 
            onClick={() => handleNavigate('landing')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              page === 'landing' 
                ? 'bg-white text-black' 
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Landing
          </button>
          <button 
            onClick={() => handleNavigate('generator')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              page === 'generator' 
                ? 'bg-white text-black' 
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Generator
          </button>
        </div>
      )}

      {/* Page Content */}
      {page === 'landing' ? (
        <LandingPage onNavigate={handleNavigate} />
      ) : (
        <Generator onNavigate={handleNavigate} />
      )}
    </div>
  );
}