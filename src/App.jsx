import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import Generator from './Generator';

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'generator'

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lightweight hash-based routing so refresh/back/forward work
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'generator' || hash === 'landing') setPage(hash);
    };
    onHashChange(); // initialize from current hash
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    // keep the URL in sync so you can deep-link to #generator
    if (page) window.location.hash = page;
  }, [page]);

  return (
    <div className="relative">
      {page === 'landing' && <LandingPage onNavigate={handleNavigate} />}
      {page === 'generator' && <Generator onNavigate={handleNavigate} />}
    </div>
  );
}
