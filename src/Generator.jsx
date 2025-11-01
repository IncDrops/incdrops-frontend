import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Zap, TrendingUp, Users, Copy, Heart, RefreshCw, X, Filter, Loader2, Clock, Mic, Image, Video, FileText, Mail, ArrowLeft } from 'lucide-react';

export default function ContentGenerator({ onNavigate }) {
  const [formData, setFormData] = useState({
    industry: '',
    targetAudience: '',
    services: '',
    contentType: 'social',
  });

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('free'); // free, basic, pro, business
  const [usage, setUsage] = useState({ month: '', count: 0 }); // monthly usage tracker
  const [generationHistory, setGenerationHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // recent | title | platform
  const [showStats, setShowStats] = useState(false);

  // --- tier limits (free = 5 per month) ---
  const tierLimits = {
    free: 5,
    basic: 50,
    pro: 200,
    business: Infinity
  };
  const maxIdeas = tierLimits[currentTier];

  const monthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  };

  // hydrate state
  useEffect(() => {
    const storedTier = localStorage.getItem('incdrops_tier');
    if (storedTier) setCurrentTier(storedTier);

    // Saved ideas & history
    const savedStored = localStorage.getItem('incdrops_saved');
    if (savedStored) {
      try { setSavedIdeas(JSON.parse(savedStored)); } catch {}
    }
    const historyStored = localStorage.getItem('incdrops_history');
    if (historyStored) {
      try { setGenerationHistory(JSON.parse(historyStored)); } catch {}
    }

    // Usage v2: monthly
    const v2 = localStorage.getItem('incdrops_usage_v2');
    const mk = monthKey();
    if (v2) {
      try {
        const parsed = JSON.parse(v2);
        if (parsed.month !== mk) {
          const reset = { month: mk, count: 0 };
          setUsage(reset);
          localStorage.setItem('incdrops_usage_v2', JSON.stringify(reset));
        } else {
          setUsage(parsed);
        }
      } catch {
        const reset = { month: mk, count: 0 };
        setUsage(reset);
        localStorage.setItem('incdrops_usage_v2', JSON.stringify(reset));
      }
    } else {
      // migrate from legacy single counter if present
      const legacy = localStorage.getItem('incdrops_usage');
      const initial = { month: mk, count: legacy ? parseInt(legacy, 10) || 0 : 0 };
      setUsage(initial);
      localStorage.setItem('incdrops_usage_v2', JSON.stringify(initial));
      // keep legacy for backwards compatibility, but not required
    }
  }, []);

  const stats = useMemo(() => {
    const totalGenerated = generationHistory.reduce((acc, h) => acc + (h.ideas?.length || 0), 0);
    const platformsCount = {};
    const typesCount = {};
    generationHistory.forEach(h => {
      (h.ideas || []).forEach(idea => {
        (idea.platforms || []).forEach(p => {
          platformsCount[p] = (platformsCount[p] || 0) + 1;
        });
        const t = idea.type || 'unknown';
        typesCount[t] = (typesCount[t] || 0) + 1;
      });
    });
    const topPlatform = Object.entries(platformsCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
    const topType = Object.entries(typesCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
    return {
      totalGenerated,
      topPlatform,
      mostUsedType: topType,
      totalSessions: generationHistory.length
    };
  }, [generationHistory]);

  const contentTypes = [
    { id: 'social', name: 'Social Posts', icon: Sparkles },
    { id: 'blog', name: 'Blog Ideas', icon: Zap },
    { id: 'ads', name: 'Ad Copy', icon: TrendingUp },
    { id: 'email', name: 'Email Campaigns', icon: Mail },
    { id: 'video', name: 'Video Scripts', icon: Video },
    { id: 'podcast', name: 'Podcast Topics', icon: Mic },
    { id: 'infographic', name: 'Infographics', icon: Image },
    { id: 'whitepaper', name: 'Whitepapers', icon: FileText },
  ];

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const callGeminiAPI = async (formData) => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const model = 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = [
      `You are a marketing strategist. Generate 8 creative ${formData.contentType} content ideas.`,
      `Industry: ${formData.industry || 'General'}`,
      `Target audience: ${formData.targetAudience || 'General audience'}`,
      `Services: ${formData.services || 'Various'}`,
      `Return JSON array with fields: id (uuid-ish), title, description, platforms (array), hashtags (array), type (string).`
    ].join('\n');

    const body = { contents: [{ parts: [{ text: prompt }]}] };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ||
        '';

      let parsed = [];
      try {
        const match = text.match(/\[[\s\S]*\]/);
        parsed = match ? JSON.parse(match[0]) : [];
      } catch {
        parsed = Array.from({ length: 8 }).map((_, i) => ({
          id: `${Date.now()}-${i}`,
          title: `Idea ${i + 1} for ${formData.industry || 'your brand'}`,
          description: `A quick concept targeting ${formData.targetAudience || 'your audience'}.`,
          platforms: ['Instagram', 'TikTok', 'LinkedIn'].slice(0, (i % 3) + 1),
          hashtags: ['#growth', '#brand', '#content'].slice(0, (i % 3) + 1),
          type: formData.contentType || 'social',
        }));
      }

      const withIds = parsed.map((it, i) => ({ ...it, id: it.id || `${Date.now()}-${i}` }));
      return { success: true, ideas: withIds };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mk = monthKey();
    if (usage.month !== mk) {
      const resetUsage = { month: mk, count: 0 };
      setUsage(resetUsage);
      localStorage.setItem('incdrops_usage_v2', JSON.stringify(resetUsage));
    }

    if (usage.count >= maxIdeas) {
      alert(`You've reached your monthly limit (${maxIdeas}). Upgrade your tier for more generations!`);
      return;
    }

    setLoading(true);
    const result = await callGeminiAPI(formData);
    setLoading(false);

    if (result.success) {
      setIdeas(result.ideas);
      const newUsage = { month: mk, count: usage.count + 1 };
      setUsage(newUsage);
      localStorage.setItem('incdrops_usage_v2', JSON.stringify(newUsage));

      const newHistoryEntry = {
        ts: Date.now(),
        form: { ...formData },
        ideas: result.ideas,
      };
      const updatedHistory = [newHistoryEntry, ...generationHistory].slice(0, 50);
      setGenerationHistory(updatedHistory);
      localStorage.setItem('incdrops_history', JSON.stringify(updatedHistory));
    } else {
      alert('Error generating ideas. Please try again.');
    }
  };

  const copyToClipboard = (idea) => {
    const text = `${idea.title}\n\n${idea.description}\n\nPlatforms: ${(idea.platforms || []).join(', ')}\n\nHashtags: ${(idea.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveIdea = (idea) => {
    const exists = savedIdeas.find(s => s.id === idea.id);
    const updated = exists
      ? savedIdeas.filter(s => s.id !== idea.id)
      : [...savedIdeas, idea];
    setSavedIdeas(updated);
    localStorage.setItem('incdrops_saved', JSON.stringify(updated));
  };

  const removeSavedIdea = (id) => {
    const updated = savedIdeas.filter(s => s.id !== id);
    setSavedIdeas(updated);
    localStorage.setItem('incdrops_saved', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Static Grid Background - matching landing page */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10">
      {/* Header - matching landing page style */}
      <header className="border-b border-gray-800 backdrop-blur-md sticky top-0 z-40 bg-black/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('landing')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-300 hover:scale-110"
              title="Back to home"
            >
              <ArrowLeft size={24} className="text-gray-400 hover:text-gray-200" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 bg-clip-text text-transparent">
              IncDrops
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowStats(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 text-gray-900 font-semibold hover:scale-105 transition-all duration-300 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50"
            >
              Stats
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 text-gray-900 font-semibold hover:scale-105 transition-all duration-300 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50"
            >
              <Clock size={18} className="inline mr-1" />
              History
            </button>
            <button
              onClick={() => setShowSavedModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 text-gray-900 font-semibold hover:scale-105 transition-all duration-300 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50 relative"
            >
              <Heart size={18} className="inline mr-1" />
              Saved ({savedIdeas.length})
            </button>
          </div>
        </div>

        {/* Usage counter */}
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <div className="text-sm text-gray-400">
            Usage this month: <span className="font-semibold text-gray-200">{usage.count}</span> / {maxIdeas === Infinity ? '∞' : maxIdeas}
            {currentTier !== 'business' && (
              <span className="ml-2 text-xs text-gray-500">(Tier: {currentTier})</span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Generate Fresh Ideas
          </h2>
          <p className="text-xl text-gray-400">AI-powered content ideation in seconds</p>
        </div>

        {/* Form - matching landing page card style */}
        <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-2xl p-8 mb-12 shadow-xl shadow-gray-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content Type Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">Content Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.contentType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, contentType: type.id })}
                      className={`p-4 rounded-xl transition-all duration-300 ${
                        isSelected
                          ? 'bg-gray-900 text-white shadow-lg scale-105'
                          : 'bg-white/30 text-gray-800 hover:bg-white/50'
                      }`}
                    >
                      <Icon className="mx-auto mb-2" size={24} />
                      <div className="text-sm font-semibold">{type.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input fields */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="e.g., Tech, Fashion, Food"
                  className="w-full px-4 py-3 rounded-lg bg-white/30 border border-gray-700 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Target Audience</label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="e.g., Gen Z, Professionals"
                  className="w-full px-4 py-3 rounded-lg bg-white/30 border border-gray-700 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Services/Products</label>
                <input
                  type="text"
                  name="services"
                  value={formData.services}
                  onChange={handleInputChange}
                  placeholder="e.g., SaaS, E-commerce"
                  className="w-full px-4 py-3 rounded-lg bg-white/30 border border-gray-700 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || usage.count >= maxIdeas}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate Ideas</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results - matching landing page card style */}
        <div>
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-300">Generating your content ideas...</p>
            </div>
          )}

          {!loading && ideas.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl border border-gray-700">
              <Sparkles size={48} className="mx-auto mb-4 text-gray-500" />
              <p className="text-gray-300">No ideas yet. Fill out the form above and click Generate!</p>
            </div>
          )}

          {!loading && ideas.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Your Ideas ({ideas.length})</h3>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 text-gray-900 font-semibold hover:scale-105 transition-all duration-300 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50 flex items-center space-x-2"
                  disabled={loading || usage.count >= maxIdeas}
                >
                  <RefreshCw size={18} />
                  <span>Regenerate</span>
                </button>
              </div>

              {ideas.map((idea) => {
                const platforms = Array.isArray(idea.platforms) ? idea.platforms : [];
                const hashtags = Array.isArray(idea.hashtags) ? idea.hashtags : [];
                const isSaved = savedIdeas.some(s => s.id === idea.id);

                return (
                  <div
                    key={idea.id}
                    className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-2xl p-6 shadow-xl shadow-gray-700/50 hover:shadow-2xl hover:shadow-gray-600/50 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex-1">{idea.title}</h3>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => copyToClipboard(idea)}
                          className="relative p-2 hover:bg-white/30 rounded-lg transition-all duration-300 hover:scale-110"
                          title="Copy to clipboard"
                        >
                          <Copy size={18} className="text-gray-700 hover:text-gray-900" />
                          {copiedId === idea.id && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              Copied!
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => saveIdea(idea)}
                          className="p-2 hover:bg-white/30 rounded-lg transition-all duration-300 hover:scale-110"
                          title={isSaved ? 'Remove from saved' : 'Save idea'}
                        >
                          <Heart size={18} className={isSaved ? 'text-pink-600 fill-pink-600' : 'text-gray-700 hover:text-gray-900'} />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-800 mb-4">{idea.description}</p>

                    {platforms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs text-gray-700 font-semibold">Platforms:</span>
                        {platforms.map((p, i) => (
                          <span key={i} className="px-3 py-1 bg-white/40 rounded-full text-xs text-gray-900 font-medium">{p}</span>
                        ))}
                      </div>
                    )}

                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {hashtags.map((tag, i) => (
                          <span key={i} className="text-sm text-gray-900 font-semibold">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Saved Modal - matching landing page style */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowSavedModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">Saved Ideas ({savedIdeas.length})</h2>
              <button onClick={() => setShowSavedModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {savedIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Heart size={48} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No saved ideas yet. Click the heart icon on any idea to save it!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedIdeas.map((idea) => (
                    <div key={idea.id} className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{idea.title}</h3>
                        <div className="flex space-x-2">
                          <button onClick={() => removeSavedIdea(idea.id)} className="p-2 hover:bg-white/30 rounded-lg transition-all duration-300 hover:scale-110" title="Remove from saved">
                            <X size={18} className="text-red-600" />
                          </button>
                          <button onClick={() => copyToClipboard(idea)} className="relative p-2 hover:bg-white/30 rounded-lg transition-colors" title="Copy to clipboard">
                            <Copy size={18} className="text-gray-700 hover:text-gray-900" />
                            {copiedId === idea.id && (
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                Copied!
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-800 mb-4">{idea.description}</p>
                      {idea.platforms && idea.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs text-gray-700 font-semibold">Platforms:</span>
                          {idea.platforms.map((platform, i) => (
                            <span key={i} className="px-3 py-1 bg-white/40 rounded-full text-xs text-gray-900 font-medium">{platform}</span>
                          ))}
                        </div>
                      )}
                      {idea.hashtags && idea.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {idea.hashtags.map((tag, i) => (
                            <span key={i} className="text-sm text-gray-900 font-semibold">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowHistory(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">Generation History ({generationHistory.length})</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {generationHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No history yet.</div>
              ) : generationHistory.map((h) => (
                <div key={h.ts} className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      <span className="font-semibold">Session:</span> {new Date(h.ts).toLocaleString()}
                    </div>
                    <button
                      onClick={() => { setIdeas(h.ideas || []); setShowHistory(false); }}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 text-gray-900 font-semibold hover:scale-105 transition-all duration-300 text-sm"
                    >
                      Load ideas
                    </button>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    {(h.ideas || []).slice(0, 4).map((idea) => (
                      <div key={idea.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                        <div className="font-semibold text-gray-100">{idea.title}</div>
                        <div className="text-xs text-gray-400 line-clamp-2">{idea.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowStats(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">Usage Stats</h2>
              <button onClick={() => setShowStats(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-xl p-4">
                <div className="text-sm text-gray-700 font-semibold">Total Ideas Generated</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalGenerated}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-xl p-4">
                <div className="text-sm text-gray-700 font-semibold">Total Sessions</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-xl p-4">
                <div className="text-sm text-gray-700 font-semibold">Top Platform</div>
                <div className="text-2xl font-bold text-gray-900">{stats.topPlatform}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 rounded-xl p-4">
                <div className="text-sm text-gray-700 font-semibold">Most Used Type</div>
                <div className="text-xl font-bold text-gray-900 capitalize">{stats.mostUsedType}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
