export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(registration => {
      console.log('Service Worker registered:', registration.scope);
    }).catch(error => {
      console.warn('Service Worker registration failed:', error);
    });
  }
}