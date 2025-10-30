import React, { useState } from 'react';
import { Sparkles, Copy, Heart, Loader2, ArrowRight } from 'lucide-react';

export default function ContentGenerator() {
  const [formData, setFormData] = useState({
    industry: '',
    targetAudience: '',
    services: '',
    contentType: 'social'
  });
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [savedIdeas, setSavedIdeas] = useState([]);

  const maxFreeIdeas = 5;

  const contentTypes = [
    { id: 'social', name: 'Social Posts' },
    { id: 'blog', name: 'Blog Ideas' },
    { id: 'ads', name: 'Ad Copy' },
    { id: 'email', name: 'Email Campaigns' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const callGeminiAPI = async (formData) => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const MODEL = 'gemini-2.0-flash-exp';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const { industry, targetAudience, services, contentType } = formData;

    const prompt = `Generate 10 ${contentType} content ideas for a ${industry} business targeting ${targetAudience}. ${services ? `Products/services: ${services}` : ''} Return ONLY a valid JSON array: [{"id":1,"title":"...","description":"...","platforms":["..."],"hashtags":["#..."]}] Keep titles under 50 chars, descriptions under 150 chars.`;

    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 750, temperature: 0.8 }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const ideas = JSON.parse(cleaned);
      return { success: true, ideas };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const generateIdeas = async () => {
    if (usageCount >= maxFreeIdeas) {
      alert('You\'ve reached your free tier limit!');
      return;
    }

    if (!formData.industry || !formData.targetAudience) {
      alert('Please fill in industry and target audience');
      return;
    }

    setLoading(true);
    try {
      const result = await callGeminiAPI(formData);
      if (result.success) {
        setIdeas(result.ideas);
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('incdrops_usage', newCount.toString());
      } else {
        alert('Failed to generate ideas. Try again.');
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = (idea) => {
    if (!savedIdeas.find(saved => saved.id === idea.id)) {
      setSavedIdeas([...savedIdeas, idea]);
      alert('Idea saved!');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied!');
  };

  React.useEffect(() => {
    const stored = localStorage.getItem('incdrops_usage');
    if (stored) setUsageCount(parseInt(stored));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="fixed top-0 w-full backdrop-blur-md bg-slate-900/80 border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">IncDrops</span>
            </div>
            <div className="text-sm text-slate-400">
              Free: <span className="text-cyan-400 font-semibold">{usageCount}/{maxFreeIdeas}</span> used
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent mb-4">
            Generate Content Ideas
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Describe your business. Get unlimited content ideas powered by AI.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600/50 transition">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                Your Details
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="E-commerce, SaaS, Coaching..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
                  <input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="Young professionals, Parents..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Services (Optional)</label>
                  <input
                    type="text"
                    name="services"
                    value={formData.services}
                    onChange={handleInputChange}
                    placeholder="Describe what you offer..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Content Type</label>
                  <select
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
                  >
                    {contentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateIdeas}
                  disabled={loading || usageCount >= maxFreeIdeas}
                  className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Ideas
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600/50 transition">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                {ideas.length === 0 ? (
                  <>
                    <ArrowRight className="w-6 h-6 text-cyan-400" />
                    Fill the form to get started
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                    {ideas.length} Ideas Generated
                  </>
                )}
              </h2>

              {ideas.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">Your ideas will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {ideas.map((idea, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-white pr-4 group-hover:text-cyan-300 transition">
                          {idea.title}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(idea.title)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4 text-slate-400 hover:text-cyan-400 transition" />
                          </button>
                          <button
                            onClick={() => saveIdea(idea)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition"
                            title="Save"
                          >
                            <Heart className="w-4 h-4 text-slate-400 hover:text-red-400 transition" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-slate-300 text-sm mb-4 leading-relaxed">{idea.description}</p>
                      
                      {idea.platforms && idea.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {idea.platforms.map((p, i) => (
                            <span 
                              key={i} 
                              className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs font-medium rounded-full border border-cyan-500/30"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {idea.hashtags && idea.hashtags.length > 0 && (
                        <p className="text-cyan-400/80 text-sm font-medium">{idea.hashtags.join(' ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
}