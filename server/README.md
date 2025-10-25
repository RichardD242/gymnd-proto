# Ideenbörse - Backend Setup

## Übersicht

Das Backend wurde mit Node.js, Express, MongoDB Atlas und Nodemailer implementiert. Es bietet:

- ✅ E-Mail-Verifizierung mit Nodemailer (6-stelliger Code)
- ✅ MongoDB Atlas Integration für persistente Datenspeicherung
- ✅ JWT-basierte Authentifizierung
- ✅ Admin-Panel mit vollständigen CRUD-Operationen
- ✅ Rate Limiting zum Schutz vor Spam
- ✅ CORS-Unterstützung

## Voraussetzungen

1. Node.js (Version 18 oder höher)
2. MongoDB Atlas Account (kostenlos)
3. SMTP-Server (z.B. Gmail mit App-Passwort)

## Installation

### 1. Dependencies installieren

```bash
cd server
npm install
```

Dies installiert:
- `express` - Web-Framework
- `mongoose` - MongoDB ODM
- `nodemailer` - E-Mail-Versand
- `jsonwebtoken` - JWT-Authentifizierung
- `cors` - Cross-Origin Resource Sharing
- `express-rate-limit` - Rate Limiting
- `dotenv` - Umgebungsvariablen

### 2. MongoDB Atlas einrichten

1. Gehe zu [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Erstelle einen kostenlosen Account
3. Erstelle einen neuen Cluster (M0 Sandbox ist kostenlos)
4. Erstelle einen Datenbank-Benutzer:
   - Gehe zu "Database Access"
   - Klicke "Add New Database User"
   - Wähle "Password" als Authentifizierungsmethode
   - Speichere Benutzername und Passwort
5. Füge deine IP-Adresse hinzu:
   - Gehe zu "Network Access"
   - Klicke "Add IP Address"
   - Für Entwicklung: "Allow Access from Anywhere" (0.0.0.0/0)
   - Für Produktion: Nur spezifische IPs
6. Hole den Connection String:
   - Gehe zu "Database" → "Connect" → "Connect your application"
   - Kopiere den Connection String
   - Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/ideenboerse?retryWrites=true&w=majority`

### 3. SMTP (Gmail) einrichten

#### Option A: Gmail mit App-Passwort (empfohlen)

1. Aktiviere 2-Faktor-Authentifizierung in deinem Google-Konto
2. Gehe zu [App-Passwörter](https://myaccount.google.com/apppasswords)
3. Erstelle ein neues App-Passwort für "Mail"
4. Kopiere das generierte 16-stellige Passwort

#### Option B: Anderer SMTP-Server

Du kannst auch andere SMTP-Server verwenden (z.B. SendGrid, Mailgun, eigener Server).

### 4. Umgebungsvariablen konfigurieren

Bearbeite `server/.env`:

```bash
# Server
PORT=8787
CORS_ORIGIN=*  # Für Produktion: https://deine-domain.com
JWT_SECRET=dein-geheimes-secret-bitte-ändern

# Admin Credentials (BITTE ÄNDERN!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sicheres-passwort-hier

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ideenboerse?retryWrites=true&w=majority

# SMTP (Gmail mit App-Passwort)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=deine.email@gmail.com
SMTP_PASS=dein-app-passwort-hier
SMTP_FROM_NAME=Ideenbörse Gymnasium
SMTP_FROM_EMAIL=deine.email@gmail.com
```

**Wichtig:** Ersetze alle Platzhalter mit deinen echten Daten!

### 5. Server starten

```bash
# Entwicklung
npm run dev

# Produktion
npm start
```

Der Server läuft nun auf `http://localhost:8787`

## API Endpoints

### Öffentliche Endpoints

#### POST `/api/verification/request`
Sendet Verifizierungscode per E-Mail
```json
{
  "email": "vorname.nachname@gym-nd.at"
}
```

#### POST `/api/verification/verify`
Verifiziert Code und gibt JWT-Token zurück
```json
{
  "email": "vorname.nachname@gym-nd.at",
  "code": "123456"
}
```

#### POST `/api/ideas`
Reicht neue Idee ein (benötigt JWT-Token)
```json
{
  "title": "Titel der Idee",
  "description": "Beschreibung...",
  "category": "Anliegen"
}
```
Header: `Authorization: Bearer <token>`

#### GET `/api/ideas?category=Anliegen`
Listet alle Ideen (optional gefiltert nach Kategorie)

### Admin Endpoints

#### POST `/api/admin/login`
Admin-Login
```json
{
  "username": "admin",
  "password": "password"
}
```

#### GET `/api/admin/ideas?category=alle`
Alle Ideen abrufen (mit Admin-Token)

#### GET `/api/admin/stats`
Statistiken abrufen

#### DELETE `/api/admin/ideas`
Alle Ideen löschen (VORSICHT!)

#### DELETE `/api/admin/ideas/:id`
Einzelne Idee löschen

Alle Admin-Endpoints benötigen: `Authorization: Bearer <admin-token>`

## Frontend Konfiguration

Bearbeite `api.config.js`:

```javascript
window.API_CONFIG = {
  baseUrl: 'http://localhost:8787/api'  // Für Produktion: https://api.deine-domain.com/api
};
```

## Datenbank-Modelle

### Idea Schema
```javascript
{
  id: String (unique),
  title: String (max 100 chars),
  description: String (max 1000 chars),
  category: String (enum),
  submitterEmail: String (@gym-nd.at),
  visibility: String (default: 'private'),
  timestamp: Date
}
```

### VerificationCode Schema
```javascript
{
  email: String (@gym-nd.at, unique),
  code: String,
  expiresAt: Date,
  createdAt: Date (TTL: 10 Minuten)
}
```

## Sicherheit

- ✅ Rate Limiting (100 Requests pro 15 Minuten)
- ✅ JWT-Token mit Ablaufzeit
- ✅ E-Mail-Domain-Validierung (@gym-nd.at)
- ✅ MongoDB TTL-Index für automatische Code-Löschung
- ✅ CORS-Konfiguration
- ✅ Input-Validierung

## Troubleshooting

### "MongoDB connection error"
- Überprüfe MONGODB_URI in `.env`
- Stelle sicher, dass deine IP-Adresse in MongoDB Atlas zugelassen ist
- Überprüfe Benutzername und Passwort

### "Failed to send code"
- Überprüfe SMTP-Einstellungen in `.env`
- Bei Gmail: Stelle sicher, dass 2FA aktiviert ist und App-Passwort verwendet wird
- Überprüfe, ob Port 587 nicht blockiert ist

### "Unauthorized" beim Admin-Login
- Überprüfe ADMIN_USERNAME und ADMIN_PASSWORD in `.env`
- Stelle sicher, dass das Token korrekt gespeichert wird

### Frontend kann Backend nicht erreichen
- Überprüfe CORS_ORIGIN in `.env`
- Stelle sicher, dass der Server läuft
- Überprüfe `api.config.js` im Frontend

## Deployment

### Backend (z.B. auf Railway, Render, Heroku)

1. Erstelle ein Konto bei einem Hosting-Anbieter
2. Verbinde dein Git-Repository
3. Setze Umgebungsvariablen in der Hosting-Plattform
4. Deploy!

### Frontend (z.B. auf Netlify, Vercel)

1. Update `api.config.js` mit der Backend-URL
2. Deploy Frontend
3. Update CORS_ORIGIN im Backend mit der Frontend-URL

## Entwicklung

```bash
# Dependencies installieren
npm install

# Server im Dev-Modus starten
npm run dev

# Logs beobachten
# Der Server gibt aus:
# ✓ MongoDB connected
# API listening on :8787
```

## Support

Bei Fragen oder Problemen:
1. Überprüfe die Logs im Terminal
2. Überprüfe die Browser-Konsole (F12)
3. Stelle sicher, dass alle Umgebungsvariablen korrekt gesetzt sind
