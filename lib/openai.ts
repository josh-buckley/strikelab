import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'sk-767a2d259878490aadfa4745da386d06',
  baseURL: 'https://api.deepseek.com/v1',
  dangerouslyAllowBrowser: true // Required for React Native
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StrikeCategory {
  name: string;
  category: 'Punches' | 'Kicks' | 'Elbows' | 'Knees' | 'Footwork' | 'Clinch' | 'Defensive' | 'Sweeps' | 'Feints';
  confidence: number;
}

const SYSTEM_PROMPT = `You are an expert Muay Thai and kickboxing coach with decades of experience. 
You have access to the user's training history, including their workout data and coaching notes.

When answering questions:
1. For technique-specific questions, reference relevant notes from their past training and add your expert insights
2. For workout-related questions, analyze their recent training patterns and combinations
3. For general training questions, combine insights from both their workout data and notes

Some examples of how to handle different types of questions:
- "What combos should I use in sparring?" → Look at their recent workouts and suggest combinations they've been practicing
- "How's my training looking?" → Analyze their workout frequency, types of training, and recent feedback
- "How do I improve my teep?" → Check for specific feedback in their notes and add your expertise

Provide clear, concise advice in a conversational tone. Be direct and get straight to the point.
Keep responses under 2-3 short paragraphs. Use technical terminology when appropriate.
If asked about injury, always recommend consulting a medical professional.

Format your responses with these rules:
1. Use plain text without any special formatting
2. When referencing past training, use a simple > prefix
3. Keep all text the same size and style
4. Use simple line breaks between paragraphs
5. Don't use headings, bold, italics, or other text decorations
6. Don't include pro tips or special sections

Example response:
> Workout on June 5th: Heavy bag work with teep-cross-switch kick combinations
> From your training on June 5th: Coach mentioned your teep needs more hip rotation

I see you've been working on your teep-cross combinations. Your coach's feedback about hip rotation is important - this will help you generate more power and create better angles for the cross that follows.

Try varying the timing between your teep and cross. Sometimes throw them together quickly, other times use the teep to create space before launching the cross.`;

const STRIKE_CATEGORIZATION_PROMPT = `You are a Muay Thai and kickboxing technique classifier. Given a list of unknown strikes/techniques, categorize each one into the most appropriate category.

Available categories:
- Punches: Any striking technique using the fists
- Kicks: Any striking technique using the feet or shins
- Elbows: Any striking technique using the elbows
- Knees: Any striking technique using the knees
- Footwork: Any movement or stance-related technique
- Clinch: Any technique related to clinching or clinch control
- Defensive: Any defensive or evasive technique
- Sweeps: Any technique designed to off-balance or trip the opponent
- Feints: Any deceptive or fake movement

For each technique, return:
1. The original name
2. The most appropriate category
3. A confidence score (0-1) indicating how confident you are in the categorization

Return ONLY a JSON array in this format:
[
  {
    "name": "string",
    "category": "one of the categories above",
    "confidence": number between 0 and 1
  }
]

Example input: ["spinning back kick", "liver shot", "catch and sweep"]
Example output: [
  {"name": "spinning back kick", "category": "Kicks", "confidence": 0.95},
  {"name": "liver shot", "category": "Punches", "confidence": 0.8},
  {"name": "catch and sweep", "category": "Sweeps", "confidence": 0.85}
]`;

export async function sendMessage(messages: ChatMessage[]) {
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0]?.message?.content || 'Sorry, I couldn\'t process that request.';
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw new Error('Failed to get response from AI coach');
  }
}

export async function categorizeStrikes(strikes: string[]): Promise<StrikeCategory[]> {
  try {
    const response = await sendMessage([
      {
        role: 'user',
        content: `${STRIKE_CATEGORIZATION_PROMPT}\n\nCategorize these techniques: ${JSON.stringify(strikes)}`
      }
    ]);

    try {
      const parsedResponse = JSON.parse(response);
      return parsedResponse;
    } catch (parseError) {
      console.error('Failed to parse strike categorization response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error categorizing strikes:', error);
    return [];
  }
} 