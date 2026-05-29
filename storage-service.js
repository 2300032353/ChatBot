const STORAGE_KEYS = {
  user: 'chatbotUser',
  rooms: 'chatbotRooms',
  settings: 'chatbotSettings',
  tasks: 'chatbotTasks',
  reminders: 'chatbotReminders'
};

const DEFAULT_USER = {
  name: 'Guest',
  email: 'guest@chatmate.local',
  signedIn: false
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  emojiPicker: true,
  speech: true,
  compactMode: false
};

const DEFAULT_ROOMS = [
  {
    id: 'room-general',
    title: 'General Chat',
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-1',
        role: 'bot',
        text: 'Welcome! Ask me anything, use voice input, or try a productivity command like "weather in London".',
        timestamp: new Date().toISOString()
      }
    ]
  }
];

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return safeParse(value, fallback);
  } catch (error) {
    console.error('Storage read failed:', error);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage write failed:', error);
  }
}

export function loadUser() {
  return read(STORAGE_KEYS.user, DEFAULT_USER);
}

export function saveUser(user) {
  write(STORAGE_KEYS.user, user);
}

export function loadSettings() {
  return read(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  write(STORAGE_KEYS.settings, settings);
}

export function loadRooms() {
  return read(STORAGE_KEYS.rooms, DEFAULT_ROOMS);
}

export function saveRooms(rooms) {
  write(STORAGE_KEYS.rooms, rooms);
}

export function loadTasks() {
  return read(STORAGE_KEYS.tasks, []);
}

export function saveTasks(tasks) {
  write(STORAGE_KEYS.tasks, tasks);
}

export function loadReminders() {
  return read(STORAGE_KEYS.reminders, []);
}

export function saveReminders(reminders) {
  write(STORAGE_KEYS.reminders, reminders);
}

export function createRoom(title) {
  return {
    id: `room-${Date.now()}`,
    title: title || `Chat Room ${new Date().toLocaleTimeString()}`,
    createdAt: new Date().toISOString(),
    messages: []
  };
}
