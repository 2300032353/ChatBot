# ChatMate AI Assistant

A modern ChatGPT-style chatbot interface built with HTML, CSS, and JavaScript. It includes intelligent conversation handling, voice support, productivity tools, multiple chat rooms, and PWA features.

## Resume-Worthy Features

- Voice assistant support using Speech Recognition and Text-to-Speech
- Multiple chat rooms with saved history in Local Storage
- PWA-ready with offline service worker and manifest
- Productivity tools: calculator mode, to-do list, reminders, weather query, and date/time
- Settings and profile pages for personalization
- Theme customization with dark/light mode
- Chat search and quick follow-up suggestions
- Accessible UI with keyboard-friendly controls and ARIA labels

## What's Included

- Natural language intent recognition
- FAQ response handling
- Sentiment analysis for incoming messages
- Context-aware bot replies
- Local Storage persistence for rooms, settings, tasks, and reminders
- Export chat history as TXT or PDF
- Responsive mobile-first design

## Technologies Used

- HTML - Structured page layout
- CSS - Responsive styling, animations, and theme support
- JavaScript modules - Modular app architecture
- Web APIs - Speech Recognition, Speech Synthesis, Fetch, Local Storage, Service Worker
- jsPDF - PDF export support

## Project Structure

- `index.htm` - Main chat interface
- `style.css` - App styling and responsive layout
- `script.js` - Entry point that loads the app module
- `app.js` - Application logic and state management
- `chatbot.js` - NLP, intent detection, weather fetch, and response generation
- `storage-service.js` - Local Storage helpers for rooms, settings, tasks, and reminders
- `ui-service.js` - Rendering helpers and UI utilities
- `manifest.json` - PWA manifest metadata
- `service-worker.js` - Offline caching strategy
- `icon.svg` - PWA icon

## Local Setup

1. Open `index.htm` in a browser.
2. Sign in using the local profile overlay.
3. Start chatting, create rooms, add tasks, and set reminders.

## GitHub Pages Deployment

1. Commit the project files to a GitHub repository.
2. Go to repository settings and select Pages.
3. Choose the `main` branch and `/` root folder.
4. Save and visit the generated GitHub Pages URL.

## Screenshots

Add screenshots of the chat interface, profile panel, task cards, and export actions here.

## Tips

- Use `weather in London` or `weather in Tokyo` to test weather integration.
- Type `= 22 * 3` to try calculator mode.
- Add reminders and watch them persist across reloads.
