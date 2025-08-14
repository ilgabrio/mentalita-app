#!/bin/bash

# Script per esportare dati da Firebase Firestore
# Crea un backup completo di tutte le collezioni Firestore

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_DIR="$HOME/Desktop/mentalita-app-backup-20250814_172941/firebase-export"
PROJECT_ID="be-water-2eb26"

echo "🔥 Avvio esportazione dati Firebase..."
echo "📁 Directory export: $EXPORT_DIR"
echo "🏗️ Project ID: $PROJECT_ID"

# Crea la directory di export se non exists
mkdir -p "$EXPORT_DIR"

echo "📊 Esportazione delle collezioni principali..."

# Lista delle collezioni da esportare
COLLECTIONS=(
    "users"
    "exercises"
    "articles" 
    "videos"
    "audio"
    "news"
    "motivationalTips"
    "badges"
    "userBadges"
    "premiumPlans"
    "paymentSessions"
    "premiumRequests"
    "podcastShows"
    "podcastEpisodes"
    "newsletters"
    "newsletterSubscribers"
    "questionnaireTemplates"
    "settings"
    "userProfiles"
    "userProgress"
    "questionnaires"
    "responses"
)

echo "📦 Collezioni da esportare:"
for collection in "${COLLECTIONS[@]}"; do
    echo "  - $collection"
done

# Funzione per esportare una singola collezione
export_collection() {
    local collection=$1
    local output_file="$EXPORT_DIR/${collection}_$TIMESTAMP.json"
    
    echo "⬇️ Esportando $collection..."
    
    # Usa firebase CLI per esportare la collezione
    firebase firestore:export "$EXPORT_DIR" --collection-ids "$collection" --project "$PROJECT_ID" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ $collection esportata con successo"
    else
        echo "⚠️ Problemi nell'esportazione di $collection (potrebbe essere vuota)"
    fi
}

# Verifica che Firebase CLI sia installato
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI non trovato. Installazione..."
    npm install -g firebase-tools
fi

# Login Firebase (se necessario)
echo "🔐 Verificando autenticazione Firebase..."
firebase auth:list --project "$PROJECT_ID" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "🔑 Autenticazione richiesta..."
    firebase login
fi

# Esporta tutte le collezioni in un unico backup
echo "📤 Esportando tutto il database Firestore..."
firebase firestore:export "$EXPORT_DIR/complete-db-export-$TIMESTAMP" --project "$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo "✅ Export completo del database completato"
else
    echo "⚠️ Export completo fallito, tentativo con collezioni individuali..."
    
    # Se l'export completo fallisce, esportiamo le collezioni una per una
    for collection in "${COLLECTIONS[@]}"; do
        export_collection "$collection"
    done
fi

echo "📋 Creando report dell'export..."
# Crea un report dell'export
cat > "$EXPORT_DIR/export-report.txt" << EOF
FIREBASE EXPORT REPORT - Mentalità App
======================================
Data export: $(date)
Timestamp: $TIMESTAMP
Project ID: $PROJECT_ID
Directory export: $EXPORT_DIR

COLLEZIONI ESPORTATE:
$(for collection in "${COLLECTIONS[@]}"; do echo "- $collection"; done)

STATISTICHE EXPORT:
- File creati: $(find "$EXPORT_DIR" -name "*.json" | wc -l)
- Dimensione export: $(du -sh "$EXPORT_DIR" | cut -f1)

FILE EXPORT:
$(ls -la "$EXPORT_DIR")

UTILIZZO:
Per importare i dati in un nuovo progetto:
firebase firestore:import [IMPORT_PATH] --project [NEW_PROJECT_ID]

NOTA:
- I dati sono esportati in formato Firebase Firestore
- Gli indici e le regole sono salvati separatamente nel backup principale
- Per sicurezza, verifica l'integrità dei dati prima di eliminarli dall'originale
EOF

echo "✅ Export Firebase completato!"
echo "📁 Dati salvati in: $EXPORT_DIR"
echo "📊 Report: $EXPORT_DIR/export-report.txt"
echo ""
echo "🔄 Per importare i dati:"
echo "firebase firestore:import $EXPORT_DIR/complete-db-export-$TIMESTAMP --project [NEW_PROJECT_ID]"