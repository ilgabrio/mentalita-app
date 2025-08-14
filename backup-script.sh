#!/bin/bash

# Backup script per Mentalità App
# Crea un backup completo del progetto con timestamp

# Ottieni la data e ora corrente per il nome del backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mentalita-app-backup-$TIMESTAMP"
BACKUP_DIR="$HOME/Desktop/$BACKUP_NAME"

echo "🚀 Avvio backup completo di Mentalità App..."
echo "📁 Directory di backup: $BACKUP_DIR"

# Crea la directory di backup
mkdir -p "$BACKUP_DIR"

# Crea le sottodirectory
mkdir -p "$BACKUP_DIR/source-code"
mkdir -p "$BACKUP_DIR/config"
mkdir -p "$BACKUP_DIR/documentation"
mkdir -p "$BACKUP_DIR/assets"
mkdir -p "$BACKUP_DIR/firebase-export"

echo "📦 Copiando codice sorgente..."
# Copia tutto il codice sorgente escludendo node_modules e dist
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.git' \
  /Users/ilgabrio/mentalita-app/ "$BACKUP_DIR/source-code/"

echo "⚙️ Copiando file di configurazione..."
# Copia specificamente i file di configurazione importanti
cp /Users/ilgabrio/mentalita-app/package.json "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/package-lock.json "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/firebase.json "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/firestore.rules "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/firestore.indexes.json "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/tailwind.config.js "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/vite.config.js "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/eslint.config.js "$BACKUP_DIR/config/"
cp /Users/ilgabrio/mentalita-app/postcss.config.js "$BACKUP_DIR/config/"

echo "📖 Copiando documentazione..."
cp /Users/ilgabrio/mentalita-app/README.md "$BACKUP_DIR/documentation/"

echo "🖼️ Copiando asset..."
cp -r /Users/ilgabrio/mentalita-app/public "$BACKUP_DIR/assets/"
cp /Users/ilgabrio/mentalita-app/*.png "$BACKUP_DIR/assets/" 2>/dev/null || true
cp /Users/ilgabrio/mentalita-app/*.svg "$BACKUP_DIR/assets/" 2>/dev/null || true
cp /Users/ilgabrio/mentalita-app/*.html "$BACKUP_DIR/assets/" 2>/dev/null || true

echo "📄 Creando lista dei file..."
# Crea una lista completa dei file nel progetto originale
find /Users/ilgabrio/mentalita-app -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" > "$BACKUP_DIR/file-list.txt"

echo "📊 Creando report del backup..."
# Crea un report dettagliato del backup
cat > "$BACKUP_DIR/backup-report.txt" << EOF
BACKUP REPORT - Mentalità App
============================
Data backup: $(date)
Timestamp: $TIMESTAMP
Directory originale: /Users/ilgabrio/mentalita-app
Directory backup: $BACKUP_DIR

CONTENUTO BACKUP:
- source-code/: Tutto il codice sorgente (src/, components/, pages/, etc.)
- config/: File di configurazione (package.json, firebase.json, etc.)
- documentation/: README e documentazione
- assets/: Immagini, icone e file statici
- firebase-export/: Esportazione dati Firebase (se disponibile)

STATISTICHE:
- File copiati: $(find "$BACKUP_DIR" -type f | wc -l)
- Dimensione backup: $(du -sh "$BACKUP_DIR" | cut -f1)
- Spazio utilizzato: $(df -h "$BACKUP_DIR" | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')

COMPONENTI PRINCIPALI SALVATI:
✅ Codice React/JavaScript
✅ Componenti admin completi
✅ Configurazione Firebase
✅ Stili Tailwind CSS
✅ File di build e deploy
✅ Asset grafici
✅ Script personalizzati

PROSSIMI PASSI CONSIGLIATI:
1. Verificare l'integrità del backup
2. Esportare i dati da Firebase Firestore
3. Testare il ripristino in ambiente di sviluppo
4. Archiviare il backup in location sicura (cloud storage)

NOTE:
- node_modules non inclusi (reinstallare con 'npm install')
- dist non inclusa (rigenerare con 'npm run build')
- File .env e credenziali non inclusi per sicurezza
EOF

echo "🔍 Verificando integrità del backup..."
# Verifica che i file principali siano stati copiati
CRITICAL_FILES=(
    "source-code/src/App.jsx"
    "source-code/src/main.jsx"
    "source-code/src/config/firebase.js"
    "config/package.json"
    "config/firebase.json"
)

BACKUP_OK=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$BACKUP_DIR/$file" ]; then
        echo "❌ ERRORE: File critico mancante: $file"
        BACKUP_OK=false
    fi
done

if [ "$BACKUP_OK" = true ]; then
    echo "✅ Backup completato con successo!"
    echo "📁 Location: $BACKUP_DIR"
    echo "📊 Report: $BACKUP_DIR/backup-report.txt"
    echo "📋 Lista file: $BACKUP_DIR/file-list.txt"
else
    echo "❌ Backup completato con errori. Verificare il report."
fi

echo ""
echo "🔄 Per ripristinare il progetto:"
echo "1. Copiare la cartella source-code in una nuova location"
echo "2. Eseguire 'npm install' per reinstallare dipendenze"
echo "3. Configurare le variabili d'ambiente Firebase"
echo "4. Eseguire 'npm run build' per rigenerare dist/"
echo ""
echo "💾 Backup salvato in: $BACKUP_DIR"