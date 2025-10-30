const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash-exp';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function generateContentIdeas(formData) {
  const { industry, targetAudience, services, contentType } = formData;

  // Build the prompt
  const prompt = `You are a professional content strategist. Generate 10 ${contentType} content ideas for a ${industry} business that targets ${targetAudience}.
${services ? `Their products/services include: ${services}` : ''}

For each idea, provide:
- title (max 50 characters)
- description (max 150 characters) 
- platforms (array of 2-3 social platforms)
- hashtags (array of 3-5 relevant hashtags with # symbol)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": 1,
    "title": "...",
    "description": "...",
    "platforms": ["...", "..."],
    "hashtags": ["#...", "#..."]
  }
]

Make ideas specific, actionable, and engaging. Keep total response under 750 tokens.`;

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 750,
          temperature: 0.8,
          topP: 0.95,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the text from Gemini's response
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the response
    // Remove markdown code blocks if present
    const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
    const ideas = JSON.parse(cleanedText);
    
    return { success: true, ideas };
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate ideas' 
    };
  }
}