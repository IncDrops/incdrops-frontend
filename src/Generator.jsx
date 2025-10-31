import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Zap, TrendingUp, Users, Copy, Heart, RefreshCw, Loader2,
  FileDown, X, Filter, Clock, Mic, Image, Video, FileText, Mail
} from 'lucide-react';

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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const callGeminiAPI = async (formData) => {
    // Note: In production, store API key securely (backend)
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      alert('Please add your Gemini API key to use this feature. Check the callGeminiAPI function in the code.');
      return { success: false, error: 'API key not configured' };
    }

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
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      console.log('Raw response:', text);

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
          contentType: contentType,
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
      filtered = filtered.filter(idea => idea.platforms.some(p => p.toLowerCase().includes(filterPlatform.toLowerCase())));
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
      idea.hashtags.join('; '),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
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
    <div>
      {/* UI code for form inputs and buttons goes here */}
      {/* Example form inputs */}
      <input
        type="text"
        name="industry"
        placeholder="Industry"
        value={formData.industry}
        onChange={handleInputChange}
      />
      <input
        type="text"
        name="targetAudience"
        placeholder="Target Audience"
        value={formData.targetAudience}
        onChange={handleInputChange}
      />
      <input
        type="text"
        name="services"
        placeholder="Services/Products"
        value={formData.services}
        onChange={handleInputChange}
      />
      {/* Content type selection UI */}
      <select
        name="contentType"
        value={formData.contentType}
        onChange={handleInputChange}
      >
        {contentTypes.map(ct => (
          <option key={ct.id} value={ct.id}>
            {ct.name}
          </option>
        ))}
      </select>
      <button onClick={generateIdeas} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Ideas'}
      </button>

      {/* Display generated ideas */}
      <div>
        {ideas.length === 0 ? (
          <p>No ideas yet. Start generating!</p>
        ) : (
          filteredAndSortedIdeas.map(idea => (
            <div key={idea.id}>
              <h3>{idea.title}</h3>
              <p>{idea.description}</p>
              <p>Platforms: {idea.platforms.join(', ')}</p>
              <p>Hashtags: {idea.hashtags.join(' ')}</p>
              <button onClick={() => saveIdea(idea)}>Save</button>
              <button onClick={() => copyToClipboard(`${idea.title}\n${idea.description}`)}>Copy</button>
            </div>
          ))
        )}
      </div>

      {/* Export buttons */}
      <button onClick={handleExportCSV}>Export as CSV</button>
      <button onClick={handleExportText}>Export as Text</button>
    </div>
  );
}
