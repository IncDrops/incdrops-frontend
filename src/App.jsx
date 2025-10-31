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
      {page === 'landing' ? (
        <LandingPage onNavigate={handleNavigate} />
      ) : (
        <Generator onNavigate={handleNavigate} />
      )}
    </div>
  );
}