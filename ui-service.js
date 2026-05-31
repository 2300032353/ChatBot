export function createElement(tag, classNames = [], attrs = {}) {
  const element = document.createElement(tag);
  classNames.forEach(name => element.classList.add(name));
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

export function renderRoomList(rooms, activeRoomId) {
  const list = document.getElementById('roomsList');
  list.innerHTML = '';
  rooms.forEach(room => {
    const item = createElement('button', ['room-item'], { type: 'button' });
    if (room.id === activeRoomId) item.classList.add('active');
    item.dataset.roomId = room.id;
    item.innerHTML = `<span>${room.title}</span><small>${new Date(room.createdAt).toLocaleDateString()}</small>`;
    list.appendChild(item);
  });
}

export function renderMessages(messages, filter = '') {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.innerHTML = '';
  const normalizedFilter = filter.trim().toLowerCase();

  messages.forEach(message => {
    if (normalizedFilter && !message.text.toLowerCase().includes(normalizedFilter)) return;
    const item = createElement('div', ['message', message.role]);
    const avatar = createElement('div', ['avatar', message.role]);
    avatar.innerHTML = message.role === 'bot' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>';
    const bubble = createElement('div', ['message-content']);
    bubble.textContent = message.text;
    const meta = createElement('div', ['message-meta']);
    meta.textContent = `${message.role === 'bot' ? 'Jarvis' : 'You'} · ${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    bubble.appendChild(meta);
    item.appendChild(avatar);
    item.appendChild(bubble);
    chatWindow.appendChild(item);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

export function renderSuggestions(suggestions) {
  const container = document.getElementById('suggestions');
  container.innerHTML = '';
  suggestions.forEach(suggestion => {
    const button = createElement('button', ['suggestion-chip'], { type: 'button' });
    button.textContent = suggestion;
    container.appendChild(button);
  });
}

export function renderProfile(user) {
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileStatus').textContent = user.signedIn ? 'Signed in' : 'Guest mode';
  document.getElementById('profileNameInput').value = user.name;
  document.getElementById('profileEmailInput').value = user.email;
}

export function renderSettings(settings) {
  document.getElementById('themeSelect').value = settings.theme;
  document.getElementById('aiProviderSelect').value = settings.aiProvider || 'rule-based';
  document.getElementById('aiModelInput').value = settings.aiModel || '';
  document.getElementById('aiApiKeyInput').value = settings.aiApiKey || '';
  document.getElementById('enableSpeech').checked = settings.speech;
  document.getElementById('enableEmoji').checked = settings.emojiPicker;
  document.body.classList.toggle('light', settings.theme === 'light');
}

export function renderTasks(tasks) {
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  if (tasks.length === 0) {
    list.innerHTML = '<div class="empty-state">No tasks yet. Add one from the task card below.</div>';
    return;
  }
  tasks.forEach(task => {
    const line = createElement('div', ['task-item']);
    const label = createElement('label');
    label.innerHTML = `<input type="checkbox" ${task.done ? 'checked' : ''} data-task-id="${task.id}" /> <span>${task.text}</span>`;
    const remove = createElement('button', ['icon-btn', 'task-delete'], { type: 'button' });
    remove.innerHTML = '<i class="fa-solid fa-trash"></i>';
    remove.dataset.taskId = task.id;
    line.appendChild(label);
    line.appendChild(remove);
    list.appendChild(line);
  });
}

export function renderReminders(reminders) {
  const list = document.getElementById('reminderList');
  list.innerHTML = '';
  if (reminders.length === 0) {
    list.innerHTML = '<div class="empty-state">No reminders set yet.</div>';
    return;
  }
  reminders.forEach(reminder => {
    const line = createElement('div', ['reminder-item']);
    line.innerHTML = `<span>${reminder.text}</span><small>${new Date(reminder.date).toLocaleString()}</small>`;
    list.appendChild(line);
  });
}

export function showToast(message) {
  const toast = createElement('div', ['toast']);
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 20);
  setTimeout(() => toast.classList.remove('visible'), 3200);
  setTimeout(() => toast.remove(), 3600);
}