import React, { useState } from 'react';
import { Sparkles, Copy, Heart, Loader2 } from 'lucide-react';

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
    const GEMINI_API_KEY = AIzaSyD5cLxs2Bc6lDylNUd03XzBvJ04B-fYCwY;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Content Ideas Generator</h1>
          <p className="text-slate-400">Free: {usageCount}/{maxFreeIdeas} used</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 sticky top-20">
              <h2 className="text-xl font-semibold text-white mb-4">Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Tech Startup"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
                  <input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., Young Professionals"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Services</label>
                  <input
                    type="text"
                    name="services"
                    value={formData.services}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Content Type</label>
                  <select
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {contentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateIdeas}
                  disabled={loading || usageCount >= maxFreeIdeas}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-md hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {ideas.length === 0 ? 'Fill form and generate' : `${ideas.length} ideas`}
              </h2>

              {ideas.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400">No ideas yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {ideas.map((idea, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-cyan-500 transition">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white">{idea.title}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(idea.title)}
                            className="p-2 hover:bg-slate-600 rounded transition"
                          >
                            <Copy className="w-4 h-4 text-slate-300" />
                          </button>
                          <button
                            onClick={() => saveIdea(idea)}
                            className="p-2 hover:bg-slate-600 rounded transition"
                          >
                            <Heart className="w-4 h-4 text-slate-300" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">{idea.description}</p>
                      {idea.platforms && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {idea.platforms.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-600 text-slate-200 text-xs rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                      {idea.hashtags && <p className="text-cyan-400 text-sm">{idea.hashtags.join(' ')}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}