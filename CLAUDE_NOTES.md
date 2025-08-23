# 📝 CLAUDE NOTES - Mentalità App

## 🗑️ Raccolte INUTILI (da ignorare):
- `appVideos` - ❌ Raccolta vecchia, NON usarla mai
- `onboardingPages` - ❌ Non serve più
- `onboardingSettings` - ❌ Non serve più
- `onboardingSteps` - ❌ Non serve più (diverso dagli esercizi onboarding)

## ✅ Raccolte PRINCIPALI (quelle vere):
- `videos` - 🎥 Video YouTube (usa `youtubeId`, `isActive`, `embedUrl`)
- `exercises` - 🏋️ Esercizi (category="onboarding" per onboarding, hanno `selectedVideos`)
- `articles` - 📄 Articoli 
- `questionnaires` - 📋 TUTTE le risposte questionari (type: "initial"|"premium"|custom)
- `questionnaireTemplates` - 📝 Template questionari creati da admin
- `premiumRequests` - 👑 Richieste Premium (solo status approvazione)

## 🎯 ARCHITETTURA QUESTIONARI:
- `questionnaireTemplates` = Admin crea questionari personalizzati
- `questionnaires` = Risposte degli atleti a TUTTI i questionari  
- Profilo atleta = Tab "I miei questionari" con storico + possibilità rifare

## 🎯 CHIARIMENTO ONBOARDING:
- `OnboardingExercisesPage` = mostra esercizi da raccolta `exercises` con `category="onboarding"`
- `onboardingSteps` = step configurabili del flusso (altra cosa!)

## 🔧 Problemi RISOLTI:
- ✅ Video YouTube: ora usa raccolta `videos` invece di `appVideos`  
- ✅ EmailJS: integrato per Premium requests con auto-invio
- ✅ Questionario Premium: completamente configurabile da admin
- ✅ Logout durante onboarding: aggiunto

## 🚨 Problemi ATTUALI:
- ✅ Onboarding: SISTEMATO - ora filtra per category="onboarding" 
- ✅ Video: SISTEMATO - errore indexOf risolto

## 🧹 PULIZIA FATTA:
- ✅ Rimossa pagina admin "Flusso Onboarding" 
- ✅ Problema cache risolto: https://be-water-2eb26.web.app/clear-storage.html

## 🧹 PULIZIA DA FARE:
- 🔄 Analisi raccolte database inutili (prossimo step)

## 📋 Strutture IMPORTANTI:

### Video (raccolta `videos`):
```
youtubeId: "2-S1trMpNec"
embedUrl: "https://www.youtube.com/embed/2-S1trMpNec" 
isActive: true
title: "..."
```

### Esercizio (raccolta `exercises`):
```
selectedVideos: ["video_id_1", "video_id_2"]
category: "onboarding" 
title: "..."
```

## 🎯 TODO NEXT:
1. Controllare OnboardingExercisesPage - perché non filtra per category="onboarding"
2. Identificare altre raccolte inutili
3. Testare video fix