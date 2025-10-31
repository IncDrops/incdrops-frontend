import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap, TrendingUp, Users, ArrowRight, Check, Target, Rocket, Shield, Clock, Layers, Twitter, Github, Linkedin, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

export default function IncDropsLanding({ onNavigate }) {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sectionRefs = useRef([]);
  const trackRef = useRef(null);
  const frameRef = useRef(null);
  const isHovering = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const startScrollLeft = useRef(0);
  const speedPxPerSec = 40;
  const [canScroll, setCanScroll] = useState(true);
  const longPressTimer = useRef(null);
  const longPressThreshold = 500;
  const dragThreshold = 5;

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.8) {
            setVisibleSections(prev => new Set([...prev, index]));
          }
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const contentTypes = [
    { icon: Sparkles, title: "Social Posts", desc: "Engaging content for all platforms" },
    { icon: Zap, title: "Blog Ideas", desc: "SEO-optimized article concepts" },
    { icon: TrendingUp, title: "Ad Copy", desc: "Converting campaign ideas" },
    { icon: Users, title: "Email Campaigns", desc: "Newsletter topics that click" },
    { icon: Target, title: "Video Scripts", desc: "Compelling storylines" },
    { icon: Rocket, title: "Product Launches", desc: "Announcement strategies" }
  ];
  const duplicated = [...contentTypes, ...contentTypes, ...contentTypes];

  const features = [
    { icon: Zap, title: "AI-powered ideation", desc: "Smart content generation" },
    { icon: Target, title: "Industry-specific insights", desc: "Tailored to your niche" },
    { icon: Rocket, title: "Unlimited generations", desc: "Create without limits" },
    { icon: Shield, title: "Export to any format", desc: "PDF, CSV, and more" },
    { icon: Clock, title: "Content calendar integration", desc: "Plan ahead seamlessly" },
    { icon: Layers, title: "Team collaboration", desc: "Work together efficiently" }
  ];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let last = 0;
    const step = (t) => {
      if (!canScroll || isDragging.current) {
        last = t;
        frameRef.current = requestAnimationFrame(step);
        return;
      }
      if (!last) last = t;
      const dt = (t - last) / 1000;
      last = t;
      el.scrollLeft += speedPxPerSec * dt;
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollLeft = el.scrollLeft - half;
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [canScroll]);

  const onMouseEnter = () => { isHovering.current = true; setCanScroll(false); };
  const onMouseLeave = () => { isHovering.current = false; setCanScroll(true); };

  const onPointerDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
    
    // Only allow dragging with primary button (left click) or touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    isDragging.current = false;
    setCanScroll(false);
    dragStartX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
    if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current) onNavigate('generator');
    }, longPressThreshold);
  };

  const onPointerMove = (e) => {
    const el = trackRef.current;
    if (!el) return;
    
    const x = e.clientX;
    const dx = Math.abs(x - dragStartX.current);
    
    // Only start dragging if we've moved past threshold
    if (dx > dragThreshold && !isDragging.current) {
      isDragging.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    
    // Only move if we're actually dragging
    if (!isDragging.current) return;
    
    const actualDx = x - dragStartX.current;
    el.scrollLeft = startScrollLeft.current - actualDx;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft < 0) el.scrollLeft = half + el.scrollLeft;
    if (el.scrollLeft >= half) el.scrollLeft = el.scrollLeft - half;
  };

  const endDrag = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isDragging.current = false;
    setCanScroll(!isHovering.current);
    const el = trackRef.current;
    if (el && el.releasePointerCapture) el.releasePointerCapture(e.pointerId);
  };

  const nudge = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    setCanScroll(false);
    const half = el.scrollWidth / 2;
    let target = el.scrollLeft + dir * 520;
    if (target < 0) target = half + target;
    if (target >= half) target = target - half;
    el.scrollTo({ left: target, behavior: 'smooth' });
    setTimeout(() => setCanScroll(!isHovering.current), 450);
  };

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">
      <style>{`
        @keyframes scroll-down { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes scroll-up { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        .animate-scroll-down { animation: scroll-down 20s linear infinite; }
        .animate-scroll-up { animation: scroll-up 20s linear infinite; }
        .animate-scroll-down:hover, .animate-scroll-up:hover { animation-play-state: paused; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(156, 163, 175, 0.3); }
          50% { box-shadow: 0 0 30px rgba(156, 163, 175, 0.5); }
        }
        .glow-on-hover:hover {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
        backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
        backgroundColor: scrollY > 50 ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
        borderBottom: scrollY > 50 ? '1px solid rgba(75, 85, 99, 0.3)' : 'none'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 bg-clip-text text-transparent">IncDrops</h2>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate('generator')} className="hidden md:block px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:scale-105">Get Started</button>
            
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-300 hover:text-white transition-colors">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-black/95 backdrop-blur-xl">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-gray-300 hover:text-white transition-colors py-2">Features</a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-gray-300 hover:text-white transition-colors py-2">Pricing</a>
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition-colors py-2">About</a>
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition-colors py-2">Contact</a>
              <button onClick={() => { onNavigate('generator'); setMobileMenuOpen(false); }} className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-semibold transition-all duration-300">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0">
          <img src="/incdrops-hero.jpg" alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        </div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8" style={{ transform: `translateY(${scrollY * 0.2}px)`, opacity: 1 - scrollY / 500 }}>
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-full border border-gray-700">
              <span className="text-sm text-gray-300">Never Run Out of Content Ideas</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 bg-clip-text text-transparent">IncDrops</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI-powered content ideas delivered instantly. <span className="text-gray-200">Drop by drop,</span> your content calendar fills itself.
            </p>
            <button onClick={() => onNavigate('generator')} className="group px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg shadow-gray-900/50 hover:shadow-xl hover:shadow-gray-800/50 hover:scale-105 glow-on-hover">
              Start Generating Ideas
              <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300" size={20} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce z-10 float-animation">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
          </div>
        </div>
      </section>

      <section id="features" ref={el => sectionRefs.current[0] = el} className={`py-32 transition-opacity duration-1000 ${visibleSections.has(0) ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-6 mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">Every Type of Content</h2>
            <p className="text-xl text-gray-400">Auto-scrolls • Swipe to browse • Long-press to start</p>
          </div>
          <div className="hidden md:flex gap-2">
            <button onClick={() => nudge(-1)} className="p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => nudge(1)} className="p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10" />
          <div ref={trackRef} className="overflow-x-scroll overflow-y-hidden px-6 select-none touch-action-pan-y scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
            <div className="flex gap-8 w-max">
              {duplicated.map((item, i) => (
                <div key={i} className="min-w-[500px] h-[450px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 flex flex-col justify-between cursor-grab active:cursor-grabbing">
                  <div>
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-400/20 to-gray-600/20 backdrop-blur-lg rounded-xl flex items-center justify-center mb-8 border border-white/10">
                      <item.icon size={40} className="text-gray-200" />
                    </div>
                    <h3 className="text-4xl font-bold mb-4 text-gray-100">{item.title}</h3>
                    <p className="text-gray-300 text-xl">{item.desc}</p>
                  </div>
                  <div className="text-gray-400 text-base">Generate instantly</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex md:hidden justify-center gap-3 mt-6">
            <button onClick={() => nudge(-1)} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={() => nudge(1)} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>

      <section ref={el => sectionRefs.current[1] = el} className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-6xl font-bold mb-20 text-center bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">Built for Scale</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, i) => (
              <div key={i} ref={el => sectionRefs.current[i + 2] = el} className={`text-center transition-all duration-700 hover:scale-110 ${visibleSections.has(i + 2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <feature.icon size={40} className="text-gray-900" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" ref={el => sectionRefs.current[8] = el} className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">Choose Your Plan</h2>
            <p className="text-xl text-gray-400">Scale as you grow. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-2xl p-8 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50 transition-all duration-300 hover:scale-105">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="text-5xl font-bold text-gray-900 mb-4">Free</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>5 ideas per month</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Social posts only</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Basic templates</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Community support</span></li>
              </ul>
              <button onClick={() => onNavigate('generator')} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105">Get Started</button>
            </div>
            
            <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-2xl p-8 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50 transition-all duration-300 hover:scale-105">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-gray-900">$29</span>
                <span className="text-gray-700 ml-2">/month</span>
              </div>
              <p className="text-gray-700 mb-6">For regular creators</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>50 ideas per month</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>All content types</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Save favorites</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Export to CSV/TXT</span></li>
              </ul>
              <button onClick={() => onNavigate('generator')} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105">Start Basic</button>
            </div>
            
            <div className="bg-gradient-to-br from-gray-300 via-gray-200 to-gray-400 rounded-2xl p-8 relative scale-105 shadow-2xl shadow-gray-600/70">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-1 rounded-full text-sm font-semibold text-white">MOST POPULAR</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-gray-700 ml-2">/month</span>
              </div>
              <p className="text-gray-700 mb-6">For power users</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>200 ideas per month</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Everything in Basic</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Priority email support</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Advanced filters</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Generation history</span></li>
              </ul>
              <button onClick={() => onNavigate('generator')} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105">Start Pro</button>
            </div>
            
            <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-2xl p-8 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50 transition-all duration-300 hover:scale-105">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-gray-900">$99</span>
                <span className="text-gray-700 ml-2">/month</span>
              </div>
              <p className="text-gray-700 mb-6">For teams & agencies</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Unlimited ideas</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Everything in Pro</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>Team collaboration (5 users)</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>API access</span></li>
                <li className="flex items-start text-gray-800"><Check className="mr-2 mt-1 flex-shrink-0 text-gray-700" size={20} /><span>White-label exports</span></li>
              </ul>
              <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 bg-clip-text text-transparent">IncDrops</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">Never run out of content ideas. AI-powered ideation for modern creators.</p>
              <div className="flex space-x-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-200 transition-colors"><Twitter size={24} /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-200 transition-colors"><Github size={24} /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-200 transition-colors"><Linkedin size={24} /></a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gray-400 hover:text-gray-200 transition-colors">Features</a></li>
                <li><a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gray-400 hover:text-gray-200 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">API Access</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Status Page</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">© 2025 IncDrops. All rights reserved.</p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Sitemap</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Accessibility</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Careers</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}