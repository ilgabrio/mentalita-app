// This function should be called from the admin panel when logged in as admin
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function initializeOnboardingSettings() {
  const onboardingData = {
    enabled: true,
    welcomeMessage: "Benvenuto in Mentalità! Il tuo viaggio verso la forza mentale nel tuo sport inizia ora. Ho preparato un percorso per aiutarti a scoprire tutte le tue potenzialità. Nel tuo profilo trovi sempre un bottone per chiedermi via messaggio quello che vuoi e per essere sempre assistito nel tuo viaggio.",
    completionMessage: "Congratulazioni! Hai completato il tuo percorso di onboarding. Ora sei pronto per esplorare tutti i contenuti premium di Be Water+.",
    days: [
      {
        day: 1,
        title: "Giorno 1",
        description: "Inizia con un risveglio da campione",
        articles: ["MHDah0IlPczQKZMQ4hWs"],
        exercises: ["FsgiitPo62hjCwXf0ZVC"],
        videos: [],
        premiumTease: {
          title: "Giorno 1",
          description: "Risvegliati come un campione"
        }
      },
      {
        day: 2,
        title: "Giorno 2",
        description: "La mappa del tuo valore. Come prepararti all'allenamento",
        articles: ["KX3mpCOW1kwh1rXMvhzb"],
        exercises: ["UsQHM3pyRJs4P7obhnNP"],
        videos: [],
        premiumTease: {
          title: "Giorno 2",
          description: "Conosci te stesso"
        }
      },
      {
        day: 3,
        title: "Giorno 3",
        description: "Respira e migliora ogni giorno con consapevolezza",
        articles: ["4CExoNDJE8ep4oaPUOUh"],
        exercises: ["HnOzWAGXFqfz356JtSM1"],
        videos: ["RhQB2TaHAn83cfZo9EcK"]
      },
      {
        day: 4,
        title: "Giorno 4",
        description: "Gestisci l'errore e preparati al meglio per le prossime sfide",
        articles: ["NDtKHcP8qm6h90LO6zHK"],
        exercises: ["1k9nFuSOR3hg8hK29dUC"],
        videos: []
      },
      {
        day: 5,
        title: "Giorno 5",
        description: "Scopri la tecnica di rilassamento dei campioni",
        articles: ["j7XG2tq1WKdW4zlYb5sx"],
        exercises: ["KXziQhiK9FrqpgC3mEqZ"],
        videos: []
      },
      {
        day: 6,
        title: "Giorno 6",
        description: "Cambia come guardi le cose. Solo così puoi scoprire quello che di bello puoi fare in gara",
        articles: ["RTNEuuxe35SNpPyjSG2o"],
        exercises: ["2zsIK5FyrQCPewgMrk6e"],
        videos: []
      },
      {
        day: 7,
        title: "Giorno 7",
        description: "Crea il tuo sogno",
        articles: ["yHa6vA7UpRBnOv7WofdO"],
        exercises: ["0nfgDUkBRXhoJmvuX5wu"],
        videos: []
      }
    ],
    achievements: [
      {
        name: "Primo Passo",
        description: "Completa il tuo primo esercizio",
        requirement: "complete_day_1",
        reward: "Badge Principiante"
      },
      {
        name: "Costanza",
        description: "Completa 3 giorni consecutivi",
        requirement: "streak_3_days",
        reward: "Badge Costanza"
      },
      {
        name: "Settimana di Successo",
        description: "Completa la prima settimana",
        requirement: "complete_day_7",
        reward: "Badge Settimana"
      },
      {
        name: "Maestro di Mindfulness",
        description: "Completa tutti i 15 giorni",
        requirement: "complete_day_15",
        reward: "Badge Maestro + 1 mese Premium gratis"
      }
    ],
    notifications: {
      enabled: true,
      dailyReminder: true,
      encouragementMessages: [
        "Ricorda di prenderti cura del tuo benessere oggi!",
        "Un piccolo passo ogni giorno porta a grandi cambiamenti",
        "La tua mente merita attenzione e cura quotidiana",
        "Anche solo 5 minuti possono fare la differenza"
      ]
    },
    premiumOffers: [
      {
        day: 5,
        discount: 20,
        subject: "Sblocca il tuo potenziale completo",
        message: "Hai dimostrato dedizione nei primi giorni. Premium ti offre strumenti avanzati per accelerare i tuoi progressi."
      },
      {
        day: 10,
        discount: 30,
        subject: "Offerta limitata Premium",
        message: "Sei a metà del tuo percorso! Approfitta del 30% di sconto su Premium per continuare con contenuti esclusivi."
      },
      {
        day: 14,
        discount: 40,
        subject: "Ultimo giorno di prova - Non perdere l'occasione!",
        message: "Domani completi il percorso gratuito. Passa a Premium oggi e ottieni il 40% di sconto!"
      }
    ],
    premiumPrompts: [
      {
        day: 3,
        type: "soft",
        title: "Scopri di più",
        message: "Stai facendo progressi fantastici! I nostri contenuti premium possono accelerare il tuo percorso di crescita.",
        ctaText: "Esplora Premium"
      },
      {
        day: 7,
        type: "medium",
        title: "Porta il benessere al livello successivo",
        message: "Dopo una settimana di pratica, sei pronto per contenuti più avanzati. Premium ti offre percorsi personalizzati e tracciamento dettagliato.",
        ctaText: "Inizia Premium"
      },
      {
        day: 12,
        type: "hard",
        title: "Offerta Speciale!",
        message: "Sei quasi alla fine del percorso gratuito. Attiva Premium oggi e ottieni il 30% di sconto sul primo mese!",
        ctaText: "Attiva con Sconto"
      }
    ],
    premiumConversionGoal: "Aiutare gli utenti a scoprire il valore del premium attraverso contenuti progressivi e funzionalità esclusive."
  };

  try {
    await setDoc(doc(db, 'onboardingSettings', 'default'), onboardingData);
    console.log('✅ onboardingSettings/default created successfully!');
    console.log('📊 Added', onboardingData.days.length, 'days to the onboarding flow');
    alert('✅ Dati onboarding inizializzati con successo! Ricarica la pagina.');
    return true;
  } catch (error) {
    console.error('❌ Error creating onboardingSettings:', error);
    alert('❌ Errore: ' + error.message);
    return false;
  }
}