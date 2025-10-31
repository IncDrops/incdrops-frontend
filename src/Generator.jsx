import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Zap, TrendingUp, Users, Copy, Heart, RefreshCw, Loader2, FileDown, X, Filter, Clock, Mic, Image, Video, FileText, Mail } from 'lucide-react';

export default function ContentGenerator({ onNavigate }) {
  const [formData, setFormData] = useState({
    industry: '',
    targetAudience: '',
    services: '',
    contentType: 'social',
  });

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const maxFreeIdeas = 5;

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
    // Note: In production, the API key should be stored securely on a backend
    // For this demo, you'll need to add your key here or set it up properly
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Replace with your actual key
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      alert('Please add your Gemini API key to use this feature. Check the callGeminiAPI function in the code.');
      return { success: false, error: 'API key not configured' };
    }

    // Gemini 2.0 Flash model
    const MODEL = 'gemini-2.0-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const { industry, targetAudience, services, contentType } = formData;

    const prompt = `Generate 10 ${contentType} content ideas for a ${industry} business targeting ${targetAudience}. ${services ? `They offer: ${services}` : ''}

Format each idea EXACTLY like this (one per line):
TITLE: [short title] | DESC: [brief description] | PLATFORMS: [platform1, platform2] | TAGS: [#tag1, #tag2, #tag3]

Generate 10 ideas in this format. Keep titles under 50 characters and descriptions under 150 characters.`;

    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            maxOutputTokens: 2000,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      
      console.log('Raw response:', text);
      
      // Parse the plain text format into JSON
      const lines = text.split('\n').filter(line => line.includes('TITLE:'));
      
      const ideas = lines.map((line, index) => {
        const titleMatch = line.match(/TITLE:\s*(.+?)\s*\|/);
        const descMatch = line.match(/DESC:\s*(.+?)\s*\|/);
        const platformsMatch = line.match(/PLATFORMS:\s*(.+?)\s*\|/);
        const tagsMatch = line.match(/TAGS:\s*(.+?)$/);
        
        return {
          id: Date.now() + index,
          title: titleMatch ? titleMatch[1].trim() : `Idea ${index + 1}`,
          description: descMatch ? descMatch[1].trim() : 'Content idea description',
          platforms: platformsMatch ? platformsMatch[1].split(',').map(p => p.trim()) : ['Social Media'],
          hashtags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : ['#content'],
          timestamp: new Date().toISOString(),
          contentType: contentType
        };
      }).slice(0, 10);
      
      return { success: true, ideas };
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { success: false, error: error.message };
    }
  };

  const generateIdeas = async () => {
    if (usageCount >= maxFreeIdeas) {
      alert("You've reached your free tier limit! Sign up to continue generating ideas.");
      return;
    }
    if (!formData.industry || !formData.targetAudience) {
      alert('Please fill in at least your industry and target audience');
      return;
    }

    setLoading(true);
    try {
      const result = await callGeminiAPI(formData);
      if (result.success) {
        setIdeas(result.ideas);
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('incdrops_usage', String(newCount));
      } else {
        alert('Failed to generate ideas. Please check your API key and try again.');
        console.error(result.error);
      }
    } catch (e) {
      console.error('Error generating ideas:', e);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = (idea) => {
    if (!savedIdeas.find((s) => s.id === idea.id)) {
      const newSaved = [...savedIdeas, idea];
      setSavedIdeas(newSaved);
      localStorage.setItem('incdrops_saved', JSON.stringify(newSaved));
      alert('Idea saved!');
    } else {
      alert('Idea already saved!');
    }
  };

  const removeSavedIdea = (ideaId) => {
    const newSaved = savedIdeas.filter(idea => idea.id !== ideaId);
    setSavedIdeas(newSaved);
    localStorage.setItem('incdrops_saved', JSON.stringify(newSaved));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  useEffect(() => {
    const stored = localStorage.getItem('incdrops_usage');
    if (stored) setUsageCount(parseInt(stored, 10));
    
    const savedStored = localStorage.getItem('incdrops_saved');
    if (savedStored) {
      try {
        setSavedIdeas(JSON.parse(savedStored));
      } catch (e) {
        console.error('Error loading saved ideas:', e);
      }
    }
  }, []);

  // Filter and sort ideas
  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = [...ideas];
    
    if (filterPlatform !== 'all') {
      filtered = filtered.filter(idea => 
        idea.platforms.some(p => p.toLowerCase().includes(filterPlatform.toLowerCase()))
      );
    }
    
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return filtered;
  }, [ideas, filterPlatform, sortBy]);

  // Get unique platforms from ideas
  const uniquePlatforms = useMemo(() => {
    const platforms = new Set();
    ideas.forEach(idea => {
      idea.platforms.forEach(p => platforms.add(p));
    });
    return Array.from(platforms);
  }, [ideas]);

  // Simple CSV export without external library
  const handleExportCSV = () => {
    const headers = ['Title', 'Description', 'Platforms', 'Hashtags'];
    const rows = ideas.map(idea => [
      idea.title,
      idea.description,
      idea.platforms.join('; '),
      idea.hashtags.join('; ')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'incdrops-ideas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple text export as alternative to PDF
  const handleExportText = () => {
    const content = ideas.map((idea, i) => 
      `${i + 1}. ${idea.title}\n\n` +
      `Description: ${idea.description}\n` +
      `Platforms: ${idea.platforms.join(', ')}\n` +
      `Hashtags: ${idea.hashtags.join(' ')}\n` +
      `${'='.repeat(60)}\n\n`
    ).join('');
    
    const fullContent = `IncDrops - Generated Content Ideas\n${'='.repeat(60)}\n\n${content}`;
    
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'incdrops-ideas.txt');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative border-b border-gray-800 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate('landing')} className="text-gray-400 hover:text-gray-200 transition-colors" title="Back to Home">
              ← Back
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 bg-clip-text text-transparent">
              IncDrops Generator
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setShowSavedModal(true)}
              className="relative px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all duration-300"
            >
              <Heart size={18} className="inline-block mr-2" />
              Saved ({savedIdeas.length})
            </button>
            <div className="text-sm">
              <span className="text-gray-400">Free Tier: </span>
              <span className="text-gray-200 font-semibold">{usageCount}/{maxFreeIdeas} used</span>
            </div>
            <button className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-semibold transition-all duration-300">
              Upgrade
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-100">Your Business</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Industry *</label>
                  <input type="text" name="industry" value={formData.industry} onChange={handleInputChange} placeholder="e.g., E-commerce, SaaS, Coaching" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience *</label>
                  <input type="text" name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} placeholder="e.g., Young entrepreneurs, Busy moms" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Services/Products</label>
                  <textarea name="services" value={formData.services} onChange={handleInputChange} placeholder="e.g., Online courses, Consulting services" rows="3" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Content Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {contentTypes.map((type) => (
                      <button key={type.id} onClick={() => setFormData({ ...formData, contentType: type.id })} className={`p-3 rounded-lg border transition-all duration-300 ${formData.contentType === type.id ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                        <type.icon size={20} className="mx-auto mb-1" />
                        <div className="text-xs">{type.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={generateIdeas} disabled={loading || usageCount >= maxFreeIdeas} className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2">
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

                {usageCount >= maxFreeIdeas && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                    Free tier limit reached! Upgrade to continue.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-100">Generated Ideas</h2>
                <p className="text-gray-400 mt-2">
                  {ideas.length === 0 ? 'Fill out the form and click Generate to see your content ideas' : `${filteredAndSortedIdeas.length} of ${ideas.length} ideas`}
                </p>
              </div>
              
              {ideas.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30">
                      <option value="all">All Platforms</option>
                      {uniquePlatforms.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30">
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title">Alphabetical</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {ideas.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="py-2 text-sm text-gray-400">Export:</span>
                <button onClick={handleExportCSV} className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg text-sm font-medium text-gray-300 transition-colors">
                  <FileDown size={16} />
                  <span>CSV</span>
                </button>
                <button onClick={handleExportText} className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg text-sm font-medium text-gray-300 transition-colors">
                  <FileDown size={16} />
                  <span>TXT</span>
                </button>
              </div>
            )}

            {ideas.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <Sparkles size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">No ideas yet. Start generating!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedIdeas.map((idea) => {
                  const platforms = Array.isArray(idea.platforms) ? idea.platforms : [];
                  const hashtags = Array.isArray(idea.hashtags) ? idea.hashtags : [];
                  const isSaved = savedIdeas.some(s => s.id === idea.id);
                  
                  return (
                    <div key={idea.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-100">{idea.title}</h3>
                        <div className="flex space-x-2">
                          <button onClick={() => saveIdea(idea)} className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${isSaved ? 'text-red-400' : 'text-gray-400'}`} title={isSaved ? "Already saved" : "Save idea"}>
                            <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                          </button>
                          <button onClick={() => copyToClipboard(`${idea.title}\n\n${idea.description}`)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Copy to clipboard">
                            <Copy size={18} className="text-gray-400 hover:text-gray-200" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-4">{idea.description}</p>

                      {platforms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs text-gray-400 font-semibold">Platforms:</span>
                          {platforms.map((platform, i) => (
                            <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">{platform}</span>
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

                <button onClick={generateIdeas} disabled={loading || usageCount >= maxFreeIdeas} className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2">
                  <RefreshCw size={20} />
                  <span>Generate More Ideas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSavedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
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
                          <button onClick={() => removeSavedIdea(idea.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Remove from saved">
                            <X size={18} className="text-red-400" />
                          </button>
                          <button onClick={() => copyToClipboard(`${idea.title}\n\n${idea.description}`)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Copy to clipboard">
                            <Copy size={18} className="text-gray-400 hover:text-gray-200" />
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
    </div>
  );
}