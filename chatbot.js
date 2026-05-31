const cityCoordinates = {
  london: { latitude: 51.5072, longitude: -0.1276 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  'new york': { latitude: 40.7128, longitude: -74.006 },
  berlin: { latitude: 52.52, longitude: 13.405 },
  sydney: { latitude: -33.8688, longitude: 151.2093 }
};

const positiveWords = ['good', 'great', 'awesome', 'happy', 'love', 'fantastic', 'amazing', 'nice'];
const negativeWords = ['bad', 'sad', 'tired', 'angry', 'upset', 'worst', 'problem', 'hate'];

function normalizeText(text) {
  return text.trim().toLowerCase();
}

function parseWeatherCity(text) {
  const match = text.match(/weather(?: in)?\s+([a-zA-Z ]+)/i);
  if (!match) return null;
  return match[1].trim();
}

export function detectIntent(text) {
  const normalized = normalizeText(text);
  const intent = { type: 'general', subject: null };

  if (normalized.startsWith('=' ) || normalized.includes('calculate') || normalized.includes('calculator')) {
    intent.type = 'calculator';
    return intent;
  }

  if (/\b(weather|forecast)\b/.test(normalized)) {
    intent.type = 'weather';
    intent.subject = parseWeatherCity(normalized) || 'current location';
    return intent;
  }

  if (/\b(date|time|today|now)\b/.test(normalized)) {
    intent.type = 'datetime';
    return intent;
  }

  if (/\b(todo|task|reminder|remember|remind)\b/.test(normalized)) {
    intent.type = 'productivity';
    return intent;
  }

  if (/\b(faq|help|how do i|what is|where can i|who can i)\b/.test(normalized)) {
    intent.type = 'faq';
    return intent;
  }

  return intent;
}

export function analyzeSentiment(text) {
  const normalized = normalizeText(text);
  const positiveCount = positiveWords.filter(word => normalized.includes(word)).length;
  const negativeCount = negativeWords.filter(word => normalized.includes(word)).length;
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export function computeMath(text) {
  try {
    const expression = text.replace(/^=|calculate|calculator|what is|compute/gi, '').trim();
    if (!expression) return null;
    const safeExpression = expression.replace(/[^0-9.+\-*/()%\s]/g, '');
    const result = Function(`"use strict"; return (${safeExpression})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return `The result is ${result}.`;
    }
  } catch {
    return null;
  }
  return null;
}

export async function fetchWeather(city) {
  const normalized = normalizeText(city);
  const coords = cityCoordinates[normalized];
  if (!coords) {
    return `I can only fetch weather for a few cities: London, Paris, Tokyo, New York, Berlin, or Sydney.`;
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&temperature_unit=celsius`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather request failed');
    const data = await response.json();
    const current = data.current_weather;
    return `Current weather in ${city}: ${current.temperature}°C, wind ${current.windspeed} km/h, conditions code ${current.weathercode}.`;
  } catch (error) {
    console.warn('Weather API error:', error);
    return `I could not fetch weather right now, but it looks like a nice day in ${city}.`;
  }
}

export function getFollowUpSuggestions(intentType) {
  switch (intentType) {
    case 'calculator':
      return ['Try "= 15 * 3"', 'Ask a percent calculation', 'Compute tip for a bill'];
    case 'weather':
      return ['Ask for weather in Tokyo', 'Check the forecast for Paris', 'Try a different city'];
    case 'datetime':
      return ['What is the date today?', 'Tell me the current time', 'Show me tomorrow’s schedule'];
    case 'productivity':
      return ['Add a task for this evening', 'Set a reminder for tomorrow', 'Show my to-do list'];
    case 'faq':
      return ['How do I use chat rooms?', 'What can you help me with?', 'How do I enable voice input?'];
    default:
      return ['Tell me a joke', 'What can you do?', 'Give me a quick summary'];
  }
}

export function generateFaqResponse(text) {
  const normalized = normalizeText(text);
  if (/\b(help|what can you do|features)\b/.test(normalized)) {
    return 'I can answer questions, manage chat rooms, create reminders, calculate expressions, and fetch basic weather updates.';
  }
  if (/\b(privacy|data|history)\b/.test(normalized)) {
    return 'Your chat history is stored locally in your browser. I do not send your messages to any server.';
  }
  if (/\b(authentication|login|profile)\b/.test(normalized)) {
    return 'You can sign in with a profile locally and customize your settings in the sidebar.';
  }
  return 'I can help with productivities, weather, date/time, chat history, and more. What would you like to try?';
}

function buildAiPrompt(input, contextMessages) {
  const history = contextMessages.map(entry => `${entry.role === 'bot' ? 'Assistant' : 'User'}: ${entry.text}`).join('\n');
  return [
    'You are ChatMate, an AI assistant. Be helpful, concise, and friendly.',
    'You can answer questions, help with coding, summarize content, generate articles, and prepare interview responses.',
    `Current date: ${new Date().toLocaleDateString()}`,
    '',
    'Conversation history:',
    history || 'No prior messages.',
    '',
    `User: ${input}`,
    'Assistant:'
  ].join('\n');
}

function sanitizeAiText(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join(' ');
  return String(value).trim();
}

async function queryOpenAI(prompt, model, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are ChatMate, a helpful AI assistant that answers questions clearly and supports coding, summaries, and interview prep.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 512
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return sanitizeAiText(data?.choices?.[0]?.message?.content);
}

async function queryGroq(prompt, model, apiKey) {
  const response = await fetch('https://api.groq.cloud/v1/outputs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'groq-1',
      input: prompt,
      temperature: 0.7,
      max_output_tokens: 512
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const output = data?.output?.[0]?.content;
  if (Array.isArray(output)) {
    return sanitizeAiText(output.map(item => item?.text || item).join(' '));
  }
  return sanitizeAiText(output);
}

async function queryGemini(prompt, model, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/${model || 'gemini-1.5'}:generate?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: { text: prompt },
      temperature: 0.7,
      maxOutputTokens: 512
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  if (!candidate) return null;
  return sanitizeAiText(candidate.output || candidate.content?.map(chunk => chunk?.text || chunk).join(' '));
}

async function queryModel(provider, prompt, model, apiKey) {
  switch (provider) {
    case 'openai':
      return queryOpenAI(prompt, model, apiKey);
    case 'groq':
      return queryGroq(prompt, model, apiKey);
    case 'google-gemini':
      return queryGemini(prompt, model, apiKey);
    default:
      throw new Error('Unsupported AI provider');
  }
}

function createLocalBotResponse(input, intent) {
  const sentiment = analyzeSentiment(input);

  if (intent.type === 'calculator') {
    const mathReply = computeMath(input);
    return Promise.resolve({
      text: mathReply || 'I could not compute that expression. Try a simpler math expression like "= 20 / 4".',
      intent,
      sentiment
    });
  }

  if (intent.type === 'weather') {
    return fetchWeather(intent.subject).then(text => ({ text, intent, sentiment }));
  }

  if (intent.type === 'datetime') {
    const now = new Date();
    return Promise.resolve({
      text: `Today is ${now.toLocaleDateString()} and the current time is ${now.toLocaleTimeString()}.`, intent, sentiment
    });
  }

  if (intent.type === 'productivity') {
    if (/\b(add|create)\b.*\b(task|todo)\b/.test(input)) {
      return Promise.resolve({ text: 'Sure — I can add that task for you. Type it in the task widget or ask me to add a new todo.', intent, sentiment });
    }
    if (/\b(remind|reminder|remember)\b/.test(input)) {
      return Promise.resolve({ text: 'I can create a reminder. Tell me what to remember and when, for example "remind me to drink water at 6pm".', intent, sentiment });
    }
  }

  if (intent.type === 'faq') {
    return Promise.resolve({ text: generateFaqResponse(input), intent, sentiment });
  }

  if (/\b(joke|funny|laugh)\b/.test(normalizeText(input))) {
    return Promise.resolve({ text: 'Why did the chatbot cross the road? To reach the other user on the other side.', intent, sentiment });
  }

  if (/\b(weather|temperature|forecast)\b/.test(normalizeText(input))) {
    return fetchWeather(intent.subject || 'London').then(text => ({ text, intent, sentiment }));
  }

  if (/\b(hello|hi|hey|good morning|good evening)\b/.test(normalizeText(input))) {
    return Promise.resolve({ text: 'Hello! I am here to help. Ask me about calculator mode, weather, reminders, or chat rooms.', intent, sentiment });
  }

  return Promise.resolve({
    text: "I heard you. Can I help with a task, weather lookup, reminder, or another question?",
    intent,
    sentiment
  });
}

export async function createBotResponse(input, contextMessages, settings = {}) {
  const intent = detectIntent(input);
  const sentiment = analyzeSentiment(input);
  const provider = settings.aiProvider || 'rule-based';
  const model = settings.aiModel || '';
  const apiKey = settings.aiApiKey || '';

  if (provider !== 'rule-based' && apiKey) {
    const prompt = buildAiPrompt(input, contextMessages);
    try {
      const aiText = await queryModel(provider, prompt, model, apiKey);
      if (aiText) {
        return { text: aiText, intent, sentiment };
      }
    } catch (error) {
      console.warn('AI model request failed:', error);
      return {
        text: 'The AI service could not respond. I am using the local assistant fallback.',
        intent,
        sentiment
      };
    }
  }

  return createLocalBotResponse(input, intent);
}
