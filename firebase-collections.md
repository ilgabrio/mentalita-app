# Firebase Collections nel progetto Mentalità

## Lista completa delle collezioni:

- appVideos
- articleCategories  
- articles
- athleteProfiles
- athleteStats
- audioCategories
- audioContent
- audioProgress
- badges
- categories
- configuration
- emails
- exerciseResponses
- exerciseSessions ← **Questa è quella che uso per lo storico esercizi**
- exercises
- goldPlanRequests
- motivationalTips
- notifications
- onboardingSettings
- podcastEpisodes
- podcastShows
- podcasts
- premiumRequests
- siteSettings
- userBadges
- userProgress
- userStats
- users
- videoCategories
- welcomePageSettings
- welcomePages

## Come richiamo lo storico esercizi:

Nel ProfilePage.jsx uso questa query:

```javascript
const historyQuery = query(
  collection(db, 'exerciseSessions'),
  where('userId', '==', currentUser.uid),
  where('completed', '==', true),
  orderBy('startTime', 'desc'),
  limit(50)
);
```

**Problema possibile:**
- La collezione `exerciseSessions` potrebbe non avere i dati degli esercizi degli utenti
- O i documenti potrebbero avere una struttura diversa da quella che mi aspetto

**Struttura che mi aspetto:**
```javascript
{
  id: "sessionId",
  userId: "userId",
  exerciseId: "exerciseId", 
  exerciseTitle: "Nome Esercizio",
  startTime: timestamp,
  endTime: timestamp,
  completed: true,
  progress: 100
}
```