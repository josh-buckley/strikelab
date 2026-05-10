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
You will receive the user's real training data (stats, recent workouts, rounds breakdown, top combos, and coaching notes) with each message. Use this data only when it's genuinely relevant to their question.

When answering questions:
1. If the question relates to their training, reference their actual data (workout counts, specific sessions, coaching notes)
2. Quote their coaching notes when relevant (use > prefix for quotes)
3. If they ask a general question unrelated to their history (technique theory, rules, hypotheticals, general advice) — answer directly without forcing a connection to their data
4. Don't mention their training data just for the sake of it — only when the question naturally calls for it

Be concise and adjust your response length to the question — a simple question gets a short answer, a complex one gets more depth. Use technical Muay Thai terminology.
You can use **bold** for emphasis, > for quoting training notes, and - for bullet points — these will be rendered as formatted text.
If asked about injury, always recommend consulting a medical professional.`;

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

export async function sendMessage(messages: ChatMessage[], context?: string) {
  try {
    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\nHere is the user's actual training data. Use this to inform your responses:\n\n${context}`
      : SYSTEM_PROMPT;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
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