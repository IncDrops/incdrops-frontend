import cors from 'cors';

const corsHandler = cors({ origin: '*' });

export default async function handler(req, res) {
  await new Promise((resolve, reject) => {
    corsHandler(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { industry, targetAudience, services, contentType } = req.body;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' +
        process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate 10 ${contentType} content ideas for a ${industry} business targeting ${targetAudience}. ${
                    services ? `They offer: ${services}.` : ''
                  }\n\nFormat each idea as JSON with: title, description, platforms (array), hashtags (array).\n\nReturn as a JSON array.`
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const generatedText = data.candidates[0].content.parts[0].text;
    const parsedIdeas = JSON.parse(generatedText);

    res.status(200).json({ ideas: parsedIdeas });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
