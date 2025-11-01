import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Zap, TrendingUp, Users, Copy, Heart, RefreshCw, X, Filter, Loader2, FileDown, Clock, Mic, Image, Video, FileText, Mail } from 'lucide-react';

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
  const [usageCount, setUsageCount] = useState(0);
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

  // tier limits
  const tierLimits = {
    free: 10,
    basic: 50,
    pro: 200,
    business: Infinity
  };

  const maxIdeas = tierLimits[currentTier];

  useEffect(() => {
    const storedTier = localStorage.getItem('incdrops_tier');
    if (storedTier) setCurrentTier(storedTier);

    const storedUsage = localStorage.getItem('incdrops_usage');
    if (storedUsage) setUsageCount(parseInt(storedUsage, 10) || 0);

    const savedStored = localStorage.getItem('incdrops_saved');
    if (savedStored) {
      try {
        setSavedIdeas(JSON.parse(savedStored));
      } catch (e) {
        console.error('Error loading saved ideas:', e);
      }
    }
    
    const historyStored = localStorage.getItem('incdrops_history');
    if (historyStored) {
      try {
        setGenerationHistory(JSON.parse(historyStored));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  // Calculate stats
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
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Change this if using direct key
    const model = 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = [
      `You are a marketing strategist. Generate 8 creative ${formData.contentType} content ideas.`,
      `Industry: ${formData.industry || 'General'}`,
      `Target audience: ${formData.targetAudience || 'General audience'}`,
      `Services: ${formData.services || 'Various'}`,
      `Return JSON array with fields: id (uuid-ish), title, description, platforms (array), hashtags (array), type (string).`
    ].join('\n');

    const body = {
      contents: [{ parts: [{ text: prompt }]}]
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();

      // Extract text safely
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ||
        '';

      // Try parse JSON array within response
      let parsed = [];
      try {
        const match = text.match(/\[[\s\S]*\]/);
        parsed = match ? JSON.parse(match[0]) : [];
      } catch (e) {
        // fallback: make some basic ideas if parse fails
        parsed = Array.from({ length: 8 }).map((_, i) => ({
          id: `${Date.now()}-${i}`,
          title: `Idea ${i + 1} for ${formData.industry || 'your brand'}`,
          description: `A quick concept targeting ${formData.targetAudience || 'your audience'}.`,
          platforms: ['Instagram', 'TikTok', 'LinkedIn'].slice(0, (i % 3) + 1),
          hashtags: ['#growth', '#brand', '#content'].slice(0, (i % 3) + 1),
          type: formData.contentType || 'social',
        }));
      }

      const withIds = parsed.map((it, i) => ({
        ...it,
        id: it.id || `${Date.now()}-${i}`
      }));

      return { success: true, ideas: withIds };
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { success: false, error: error.message };
    }
  };

  const generateIdeas = async () => {
    if (usageCount >= maxIdeas) {
      alert(`You've reached your ${currentTier} tier limit! Upgrade to continue generating ideas.`);
      return;
    }
    if (!formData.industry || !formData.targetAudience) {
      alert('Please fill in at least your industry and target audience.');
      return;
    }

    setLoading(true);
    const result = await callGeminiAPI(formData);
    setLoading(false);

    if (!result.success) {
      alert(`Generation failed: ${result.error || 'Unknown error'}`);
      return;
    }

    const nextIdeas = result.ideas || [];
    setIdeas(nextIdeas);

    const nextUsage = usageCount + 1;
    setUsageCount(nextUsage);
    localStorage.setItem('incdrops_usage', String(nextUsage));

    const historyEntry = {
      ts: Date.now(),
      formData,
      ideas: nextIdeas,
    };
    const nextHistory = [historyEntry, ...generationHistory].slice(0, 50);
    setGenerationHistory(nextHistory);
    localStorage.setItem('incdrops_history', JSON.stringify(nextHistory));
  };

  const copyToClipboard = async (idea) => {
    try {
      await navigator.clipboard.writeText(`${idea.title}\n\n${idea.description}`);
      setCopiedId(idea.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const saveIdea = (idea) => {
    const already = savedIdeas.some(s => s.id === idea.id);
    const next = already ? savedIdeas : [idea, ...savedIdeas];
    setSavedIdeas(next);
    localStorage.setItem('incdrops_saved', JSON.stringify(next));
  };

  const removeSavedIdea = (id) => {
    const next = savedIdeas.filter(s => s.id !== id);
    setSavedIdeas(next);
    localStorage.setItem('incdrops_saved', JSON.stringify(next));
  };

  const filteredAndSortedIdeas = useMemo(() => {
    let list = [...ideas];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    }

    if (platformFilter !== 'all') {
      list = list.filter(i => (i.platforms || []).includes(platformFilter));
    }

    if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'platform') {
      list.sort((a, b) => (a.platforms?.[0] || '').localeCompare(b.platforms?.[0] || ''));
    } else {
      // recent (no-op because most recent generation already on screen)
    }

    return list;
  }, [ideas, searchTerm, platformFilter, sortBy]);

  const allPlatforms = useMemo(() => {
    const set = new Set();
    ideas.forEach(i => (i.platforms || []).forEach(p => set.add(p)));
    return ['all', ...Array.from(set)];
  }, [ideas]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-yellow-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Idea Generator</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(true)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center space-x-2"
              title="Stats"
            >
              <Users size={18} />
              <span className="hidden sm:inline">Stats</span>
            </button>
            <button
              onClick={() => setShowSavedModal(true)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center space-x-2"
              title="Saved"
            >
              <Heart size={18} className="text-pink-400" />
              <span className="hidden sm:inline">Saved</span>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center space-x-2"
              title="History"
            >
              <Clock size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-300 mb-1">Industry</label>
            <input
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Beauty, SaaS, Fitness"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
            />

            <label className="block text-sm font-semibold text-gray-300 mt-4 mb-1">Target Audience</label>
            <input
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              placeholder="e.g., Gen Z creators, busy moms, B2B founders"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
            />

            <label className="block text-sm font-semibold text-gray-300 mt-4 mb-1">Services / Focus</label>
            <input
              name="services"
              value={formData.services}
              onChange={handleInputChange}
              placeholder="e.g., coaching, copywriting, templates"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Filter size={16} />
                <span>Content Type</span>
              </div>
              <button
                onClick={() => setFiltersOpen(v => !v)}
                className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg hover:bg-white/10"
              >
                {filtersOpen ? 'Hide' : 'Show'} Filters
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData(prev => ({ ...prev, contentType: type.id }))}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center justify-center transition-all duration-300 ${formData.contentType === type.id ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <type.icon size={20} className="mx-auto mb-1" />
                  <div className="text-xs">{type.name}</div>
                </button>
              ))}
            </div>

            {filtersOpen && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Search ideas</label>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by keywords…"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Platform</label>
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                    >
                      {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                    >
                      <option value="recent">Most recent</option>
                      <option value="title">Title (A–Z)</option>
                      <option value="platform">Platform</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-400">
            Tier: <span className="font-semibold">{currentTier}</span> • Usage: {usageCount}/{maxIdeas === Infinity ? '∞' : maxIdeas}
          </div>
          <button
            onClick={generateIdeas}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-white/10 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 hover:from-indigo-500/30 hover:to-fuchsia-500/30 disabled:opacity-60 flex items-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            <span>{loading ? 'Generating…' : 'Generate Ideas'}</span>
          </button>
        </div>

        {/* Results */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {ideas.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles size={48} className="mx-auto mb-4 text-yellow-300/80" />
              <p className="text-gray-400">No ideas yet. Fill the form and click <span className="text-white font-semibold">Generate Ideas</span>.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredAndSortedIdeas.map((idea, index) => {
                const platforms = Array.isArray(idea.platforms) ? idea.platforms : [];
                const hashtags = Array.isArray(idea.hashtags) ? idea.hashtags : [];
                const isSaved = savedIdeas.some(s => s.id === idea.id);
                
                return (
                  <div key={idea.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all duration-300 slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-100">{idea.title}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(idea)}
                          className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy size={18} className="text-gray-400 hover:text-gray-200" />
                          {copiedId === idea.id && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap success-pop">
                              Copied!
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => isSaved ? removeSavedIdea(idea.id) : saveIdea(idea)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title={isSaved ? 'Remove from saved' : 'Save idea'}
                        >
                          <Heart size={18} className={isSaved ? 'text-pink-400' : 'text-gray-400 hover:text-gray-200'} />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4">{idea.description}</p>

                    {platforms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs text-gray-400 font-semibold">Platforms:</span>
                        {platforms.map((p, i) => (
                          <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">{p}</span>
                        ))}
                      </div>
                    )}

                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {hashtags.map((tag, i) => (
                          <span key={i} className="text-sm text-blue-400">{tag}</span>
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

      {/* Saved Modal (guarded) */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowSavedModal(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">Saved Ideas ({savedIdeas.length})</h2>
              <button onClick={() => setShowSavedModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
                    <div key={idea.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-100">{idea.title}</h3>
                        <div className="flex space-x-2">
                          <button onClick={() => removeSavedIdea(idea.id)} className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110" title="Remove from saved">
                            <X size={18} className="text-red-400" />
                          </button>
                          <button onClick={() => copyToClipboard(idea)} className="relative p-2 hover:bg-white/10 rounded-lg transition-colors" title="Copy to clipboard">
                            <Copy size={18} className="text-gray-400 hover:text-gray-200" />
                            {copiedId === idea.id && (
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap success-pop">
                                Copied!
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4">{idea.description}</p>
                      {idea.platforms && idea.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs text-gray-400 font-semibold">Platforms:</span>
                          {idea.platforms.map((platform, i) => (
                            <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">{platform}</span>
                          ))}
                        </div>
                      )}
                      {idea.hashtags && idea.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {idea.hashtags.map((tag, i) => (
                            <span key={i} className="text-sm text-blue-400">{tag}</span>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">Generation History ({generationHistory.length})</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {generationHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No history yet.</div>
              ) : generationHistory.map((h) => (
                <div key={h.ts} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      <span className="font-semibold">Session:</span> {new Date(h.ts).toLocaleString()}
                    </div>
                    <button
                      onClick={() => {
                        setIdeas(h.ideas || []);
                        setShowHistory(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                    >
                      Load ideas
                    </button>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    {(h.ideas || []).slice(0, 4).map((idea) => (
                      <div key={idea.id} className="bg-black/30 border border-white/10 rounded-lg p-3">
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
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">Usage Stats</h2>
              <button onClick={() => setShowStats(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">Total Ideas Generated</div>
                <div className="text-2xl font-bold text-gray-100">{stats.totalGenerated}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">Total Sessions</div>
                <div className="text-2xl font-bold text-gray-100">{stats.totalSessions}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">Top Platform</div>
                <div className="text-2xl font-bold text-gray-100">{stats.topPlatform}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">Most Used Type</div>
                <div className="text-xl font-bold text-gray-100 capitalize">{stats.mostUsedType}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
