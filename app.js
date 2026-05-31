import { loadUser, saveUser, loadSettings, saveSettings, loadRooms, saveRooms, loadTasks, saveTasks, loadReminders, saveReminders, createRoom } from './storage-service.js';
import { createBotResponse, getFollowUpSuggestions } from './chatbot.js';
import { renderRoomList, renderMessages, renderSuggestions, renderProfile, renderSettings, renderTasks, renderReminders, showToast } from './ui-service.js';
import { registerServiceWorker } from './pwa.js';

const elements = {
  roomsList: document.getElementById('roomsList'),
  activeRoomTitle: document.getElementById('activeRoomTitle'),
  profileName: document.getElementById('profileName'),
  profileEmail: document.getElementById('profileEmail'),
  profileStatus: document.getElementById('profileStatus'),
  profileNameInput: document.getElementById('profileNameInput'),
  profileEmailInput: document.getElementById('profileEmailInput'),
  themeSelect: document.getElementById('themeSelect'),
  aiProviderSelect: document.getElementById('aiProviderSelect'),
  aiModelInput: document.getElementById('aiModelInput'),
  aiApiKeyInput: document.getElementById('aiApiKeyInput'),
  enableSpeech: document.getElementById('enableSpeech'),
  enableEmoji: document.getElementById('enableEmoji'),
  roomSearch: document.getElementById('roomSearch'),
  messageSearch: document.getElementById('messageSearch'),
  chatWindow: document.getElementById('chatWindow'),
  typingIndicator: document.getElementById('typingIndicator'),
  suggestions: document.getElementById('suggestions'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  newRoomBtn: document.getElementById('newRoomBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  exportTxtBtn: document.getElementById('exportTxtBtn'),
  exportPdfBtn: document.getElementById('exportPdfBtn'),
  micBtn: document.getElementById('micBtn'),
  speechStatus: document.getElementById('speechStatus'),
  emojiBtn: document.getElementById('emojiBtn'),
  emojiPanel: document.getElementById('emojiPanel'),
  taskList: document.getElementById('taskList'),
  taskInput: document.getElementById('taskInput'),
  taskAddBtn: document.getElementById('taskAddBtn'),
  reminderList: document.getElementById('reminderList'),
  reminderText: document.getElementById('reminderText'),
  reminderDate: document.getElementById('reminderDate'),
  reminderAddBtn: document.getElementById('reminderAddBtn'),
  loginOverlay: document.getElementById('loginOverlay'),
  loginForm: document.getElementById('loginForm'),
  loginName: document.getElementById('loginName'),
  loginEmail: document.getElementById('loginEmail')
};

const state = {
  user: loadUser(),
  settings: loadSettings(),
  rooms: loadRooms(),
  tasks: loadTasks(),
  reminders: loadReminders(),
  activeRoomId: null,
  messageFilter: '',
  roomFilter: '',
  recognition: null,
  recognitionActive: false
};

state.activeRoomId = state.rooms[0]?.id || null;

function getActiveRoom() {
  return state.rooms.find(room => room.id === state.activeRoomId) || state.rooms[0];
}

function saveAll() {
  saveRooms(state.rooms);
  saveSettings(state.settings);
  saveTasks(state.tasks);
  saveReminders(state.reminders);
  saveUser(state.user);
}

function updateUI() {
  const room = getActiveRoom();
  if (!room) return;
  elements.activeRoomTitle.textContent = room.title;
  renderRoomList(state.rooms, room.id);
  renderMessages(room.messages, state.messageFilter);
  renderSuggestions(getFollowUpSuggestions('general'));
  renderProfile(state.user);
  renderSettings(state.settings);
  renderTasks(state.tasks);
  renderReminders(state.reminders);
  if (state.settings.theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
}

function selectRoom(roomId) {
  state.activeRoomId = roomId;
  state.messageFilter = '';
  elements.messageSearch.value = '';
  saveRooms(state.rooms);
  updateUI();
}

function addMessage(role, text) {
  const room = getActiveRoom();
  if (!room) return;
  room.messages.push({ id: `msg-${Date.now()}`, role, text, timestamp: new Date().toISOString() });
  saveRooms(state.rooms);
  renderMessages(room.messages, state.messageFilter);
}

function setTyping(visible) {
  elements.typingIndicator.classList.toggle('hidden', !visible);
}

function speakText(text) {
  if (!state.settings.speech || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  addMessage('user', trimmed);
  elements.messageInput.value = '';
  setTyping(true);
  elements.messageInput.disabled = true;
  elements.sendBtn.disabled = true;

  try {
    const response = await createBotResponse(trimmed, getActiveRoom().messages.slice(-6), state.settings);
    setTimeout(() => {
      setTyping(false);
      addMessage('bot', response.text);
      renderSuggestions(getFollowUpSuggestions(response.intent.type));
      speakText(response.text);
    }, 700);
  } catch (error) {
    console.error('Chat response failed:', error);
    setTyping(false);
    addMessage('bot', 'Oops — something went wrong. Please try again later.');
  } finally {
    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.messageInput.focus();
  }
}

function exportTxt() {
  const room = getActiveRoom();
  const content = room.messages.map(entry => `${entry.role === 'bot' ? 'Jarvis' : 'You'}: ${entry.text}`).join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${room.title.replace(/\s+/g, '-')}-chat.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function exportPdf() {
  if (!window.jspdf?.jsPDF) {
    showToast('PDF export requires browser support.');
    return;
  }
  const room = getActiveRoom();
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  let y = 40;
  doc.setFontSize(16);
  doc.text(room.title, 40, y);
  y += 26;
  doc.setFontSize(11);
  room.messages.forEach(message => {
    const label = message.role === 'bot' ? 'Jarvis' : 'You';
    const text = `${label} (${new Date(message.timestamp).toLocaleTimeString()}): ${message.text}`;
    const split = doc.splitTextToSize(text, 520);
    doc.text(split, 40, y);
    y += split.length * 16;
    if (y > 740) {
      doc.addPage();
      y = 40;
    }
  });
  doc.save(`${room.title.replace(/\s+/g, '-')}-chat.pdf`);
}

function createNewRoom() {
  const room = createRoom('New Chat Room');
  state.rooms.unshift(room);
  selectRoom(room.id);
  showToast('New chat room created.');
}

function updateProfile(event) {
  event.preventDefault();
  state.user.name = elements.profileNameInput.value.trim() || state.user.name;
  state.user.email = elements.profileEmailInput.value.trim() || state.user.email;
  state.user.signedIn = true;
  saveUser(state.user);
  renderProfile(state.user);
  showToast('Profile saved locally.');
}

function updateSettings(event) {
  event.preventDefault();
  state.settings.theme = elements.themeSelect.value;
  state.settings.aiProvider = elements.aiProviderSelect.value;
  state.settings.aiModel = elements.aiModelInput.value.trim() || state.settings.aiModel;
  state.settings.aiApiKey = elements.aiApiKeyInput.value.trim();
  state.settings.speech = elements.enableSpeech.checked;
  state.settings.emojiPicker = elements.enableEmoji.checked;
  saveSettings(state.settings);
  renderSettings(state.settings);
  showToast('Settings updated.');
}

function addTask() {
  const text = elements.taskInput.value.trim();
  if (!text) return;
  state.tasks.unshift({ id: `task-${Date.now()}`, text, done: false });
  saveTasks(state.tasks);
  renderTasks(state.tasks);
  elements.taskInput.value = '';
  showToast('Task added.');
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map(task => task.id === taskId ? { ...task, done: !task.done } : task);
  saveTasks(state.tasks);
  renderTasks(state.tasks);
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter(task => task.id !== taskId);
  saveTasks(state.tasks);
  renderTasks(state.tasks);
}

function addReminder() {
  const text = elements.reminderText.value.trim();
  const date = elements.reminderDate.value;
  if (!text || !date) return;
  state.reminders.unshift({ id: `reminder-${Date.now()}`, text, date });
  saveReminders(state.reminders);
  renderReminders(state.reminders);
  elements.reminderText.value = '';
  elements.reminderDate.value = '';
  showToast('Reminder saved.');
}

function filterRooms(event) {
  state.roomFilter = event.target.value.toLowerCase();
  const filtered = state.rooms.filter(room => room.title.toLowerCase().includes(state.roomFilter));
  renderRoomList(filtered, state.activeRoomId);
}

function filterMessages(event) {
  state.messageFilter = event.target.value;
  renderMessages(getActiveRoom().messages, state.messageFilter);
}

function toggleEmojiPanel() {
  elements.emojiPanel.classList.toggle('hidden');
  if (!elements.emojiPanel.classList.contains('hidden')) {
    const emojis = ['😀', '🤖', '🧠', '✨', '📌', '✅', '📅', '💡', '📌', '🚀'];
    elements.emojiPanel.innerHTML = emojis.map(emoji => `<button type="button" class="emoji-button">${emoji}</button>`).join('');
  }
}

function handleEmojiSelection(event) {
  if (!event.target.classList.contains('emoji-button')) return;
  elements.messageInput.value += event.target.textContent;
  elements.messageInput.focus();
}

function startSpeechRecognition() {
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    showToast('Speech recognition is not supported in this browser.');
    elements.speechStatus.textContent = 'Voice not available';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.recognition = new SpeechRecognition();
  state.recognition.lang = 'en-US';
  state.recognition.interimResults = false;
  state.recognition.maxAlternatives = 1;

  state.recognition.onstart = () => {
    state.recognitionActive = true;
    elements.micBtn.classList.add('active');
    elements.speechStatus.textContent = 'Listening...';
  };

  state.recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    sendMessage(transcript);
  };

  state.recognition.onerror = () => {
    elements.speechStatus.textContent = 'Voice recognition error';
  };

  state.recognition.onend = () => {
    state.recognitionActive = false;
    elements.micBtn.classList.remove('active');
    elements.speechStatus.textContent = 'Online · Voice ready';
  };

  if (state.recognitionActive) {
    state.recognition.stop();
  } else {
    state.recognition.start();
  }
}

function openLogin() {
  elements.loginOverlay.classList.remove('hidden');
}

function closeLogin() {
  elements.loginOverlay.classList.add('hidden');
}

function submitLogin(event) {
  event.preventDefault();
  const name = elements.loginName.value.trim();
  const email = elements.loginEmail.value.trim();
  if (!name || !email) {
    showToast('Please enter a name and email.');
    return;
  }
  state.user = { name, email, signedIn: true };
  saveUser(state.user);
  closeLogin();
  updateUI();
  showToast('Signed in successfully.');
}

function signOut() {
  state.user = { name: 'Guest', email: 'guest@chatmate.local', signedIn: false };
  saveUser(state.user);
  openLogin();
  updateUI();
}

function initEventListeners() {
  elements.sendBtn.addEventListener('click', () => sendMessage(elements.messageInput.value));
  elements.messageInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(elements.messageInput.value);
    }
  });
  elements.roomSearch.addEventListener('input', filterRooms);
  elements.messageSearch.addEventListener('input', filterMessages);
  elements.newRoomBtn.addEventListener('click', createNewRoom);
  elements.logoutBtn.addEventListener('click', signOut);
  elements.clearChatBtn.addEventListener('click', () => {
    const room = getActiveRoom();
    room.messages = [];
    saveRooms(state.rooms);
    renderMessages(room.messages, state.messageFilter);
    showToast('Current chat cleared.');
  });
  elements.exportTxtBtn.addEventListener('click', exportTxt);
  elements.exportPdfBtn.addEventListener('click', exportPdf);
  elements.micBtn.addEventListener('click', startSpeechRecognition);
  elements.emojiBtn.addEventListener('click', toggleEmojiPanel);
  elements.emojiPanel.addEventListener('click', handleEmojiSelection);
  elements.taskAddBtn.addEventListener('click', addTask);
  elements.taskList.addEventListener('click', event => {
    const taskId = event.target.dataset.taskId;
    if (!taskId) return;
    if (event.target.closest('.task-delete')) deleteTask(taskId);
    else if (event.target.type === 'checkbox') toggleTask(taskId);
  });
  elements.reminderAddBtn.addEventListener('click', addReminder);
  elements.loginForm.addEventListener('submit', submitLogin);
  document.getElementById('profileForm').addEventListener('submit', updateProfile);
  document.getElementById('settingsForm').addEventListener('submit', updateSettings);
  elements.roomsList.addEventListener('click', event => {
    const roomId = event.target.closest('[data-room-id]')?.dataset.roomId;
    if (roomId) selectRoom(roomId);
  });
  elements.suggestions.addEventListener('click', event => {
    if (!event.target.matches('.suggestion-chip')) return;
    sendMessage(event.target.textContent);
  });
}

function init() {
  if (!state.user.signedIn) {
    openLogin();
  }
  updateUI();
  initEventListeners();

  if (state.settings.speech) {
    elements.speechStatus.textContent = 'Online · Voice ready';
  } else {
    elements.speechStatus.textContent = 'Voice disabled in settings';
  }

  registerServiceWorker();
}

init();
