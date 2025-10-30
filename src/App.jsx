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
      {/* Minimal dev switcher: only show a single button on landing */}
      {page === 'landing' && (
        <div className="fixed top-4 right-4 z-[100]">
          <button
            onClick={() => handleNavigate('generator')}
            className="px-6 py-3 rounded-lg font-semibold transition-all bg-gray-700 text-white hover:bg-gray-600 shadow-lg"
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
