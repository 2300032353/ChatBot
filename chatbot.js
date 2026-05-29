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

export async function createBotResponse(input, contextMessages) {
  const intent = detectIntent(input);
  const sentiment = analyzeSentiment(input);

  if (intent.type === 'calculator') {
    const mathReply = computeMath(input);
    return {
      text: mathReply || 'I could not compute that expression. Try a simpler math expression like "= 20 / 4".',
      intent,
      sentiment
    };
  }

  if (intent.type === 'weather') {
    const weatherReply = await fetchWeather(intent.subject);
    return { text: weatherReply, intent, sentiment };
  }

  if (intent.type === 'datetime') {
    const now = new Date();
    return {
      text: `Today is ${now.toLocaleDateString()} and the current time is ${now.toLocaleTimeString()}.`, intent, sentiment
    };
  }

  if (intent.type === 'productivity') {
    if (/\b(add|create)\b.*\b(task|todo)\b/.test(input)) {
      return { text: 'Sure — I can add that task for you. Type it in the task widget or ask me to add a new todo.', intent, sentiment };
    }
    if (/\b(remind|reminder|remember)\b/.test(input)) {
      return { text: 'I can create a reminder. Tell me what to remember and when, for example "remind me to drink water at 6pm".', intent, sentiment };
    }
  }

  if (intent.type === 'faq') {
    return { text: generateFaqResponse(input), intent, sentiment };
  }

  if (/\b(joke|funny|laugh)\b/.test(normalizeText(input))) {
    return { text: 'Why did the chatbot cross the road? To reach the other user on the other side.', intent, sentiment };
  }

  if (/\b(weather|temperature|forecast)\b/.test(normalizeText(input))) {
    const city = intent.subject || 'London';
    const weatherReply = await fetchWeather(city);
    return { text: weatherReply, intent, sentiment };
  }

  if (/\b(hello|hi|hey|good morning|good evening)\b/.test(normalizeText(input))) {
    return { text: 'Hello! I am here to help. Ask me about calculator mode, weather, reminders, or chat rooms.', intent, sentiment };
  }

  return {
    text: "I heard you. Can I help with a task, weather lookup, reminder, or another question?",
    intent,
    sentiment
  };
}