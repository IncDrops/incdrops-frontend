import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Generator from './Generator';

export default function App() {
  const [page, setPage] = useState('landing');

  return (
    <div className="relative">
      {/* Page Switcher - Higher z-index */}
      <div className="fixed top-4 right-4 z-[100] flex space-x-2">
        <button 
          onClick={() => setPage('landing')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            page === 'landing' 
              ? 'bg-white text-black' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Landing
        </button>
        <button 
          onClick={() => setPage('generator')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            page === 'generator' 
              ? 'bg-white text-black' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Generator
        </button>
      </div>

      {/* Page Content */}
      {page === 'landing' ? <LandingPage /> : <Generator />}
    </div>
  );
}