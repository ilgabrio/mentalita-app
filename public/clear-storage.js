// Script per pulire localStorage
localStorage.removeItem('onboardingCompleted');
localStorage.removeItem('questionnaireCompleted'); 
localStorage.removeItem('welcomeShown');
console.log('✅ LocalStorage pulito. Ricarica la pagina.');
window.location.reload();
