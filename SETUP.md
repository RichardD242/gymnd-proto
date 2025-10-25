# Ideenbörse - Komplette Setup-Anleitung

## 🎯 Was wurde implementiert?

Das System wurde vollständig auf ein Backend mit Node.js, Express, MongoDB Atlas und Nodemailer umgestellt:

### ✅ Backend Features
- **E-Mail-Verifizierung**: Nodemailer sendet 6-stellige Codes an @gym-nd.at E-Mail-Adressen
- **MongoDB Atlas Integration**: Alle Ideen und Verifizierungscodes werden in der Cloud-Datenbank gespeichert
- **JWT-Authentifizierung**: Sichere Token-basierte Authentifizierung für Users und Admins
- **Admin-Panel**: Vollständige Verwaltung aller eingesandten Ideen
- **Rate Limiting**: Schutz vor Spam und Missbrauch
- **Automatische Code-Löschung**: Verifizierungscodes laufen nach 10 Minuten ab

### ✅ Frontend Updates
- API-Integration anstelle von localStorage
- Backend-Verifizierung für E-Mail-Codes
- Admin-Login über Backend-API
- Datenexport von der Datenbank

## 📋 Schritt-für-Schritt Setup

### MongoDB Atlas einrichten (5 Minuten)

1. Gehe zu [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Klicke "Try Free" und erstelle einen Account
3. **Cluster erstellen:**
   - Wähle "M0 Sandbox" (kostenlos)
   - Wähle eine Region in deiner Nähe (z.B. Frankfurt)
   - Cluster-Name: z.B. "Cluster0"
   - Klicke "Create Cluster"

4. **Database User erstellen:**
   - Linke Sidebar → "Database Access"
   - "Add New Database User"
   - Authentication Method: "Password"
   - Username: z.B. `gymnd_admin`
   - Password: Generiere ein sicheres Passwort (speichern!)
   - Database User Privileges: "Atlas admin"
   - "Add User"

5. **Netzwerkzugriff konfigurieren:**
   - Linke Sidebar → "Network Access"
   - "Add IP Address"
   - **Entwicklung:** "Allow Access from Anywhere" (0.0.0.0/0)
   - **Produktion:** Nur die IP des Hosting-Servers
   - "Confirm"

6. **Connection String holen:**
   - Linke Sidebar → "Database" → "Connect"
   - "Connect your application"
   - Driver: "Node.js", Version: "5.5 or later"
   - Kopiere den Connection String
   - Sieht aus wie: `mongodb+srv://gymnd_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Gmail SMTP einrichten (5 Minuten)

1. **2-Faktor-Authentifizierung aktivieren:**
   - Gehe zu [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Aktiviere "2-Step Verification"

2. **App-Passwort erstellen:**
   - Gehe zu [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Wähle "Mail" als App
   - Wähle "Windows Computer" (oder beliebiges Gerät)
   - Klicke "Generate"
   - **Kopiere das 16-stellige Passwort** (Format: `xxxx xxxx xxxx xxxx`)

### Backend konfigurieren (2 Minuten)

1. **Öffne die Datei:** `server/.env`

2. **Ersetze die Platzhalter:**

```bash
# Server Configuration
PORT=8787
CORS_ORIGIN=*
JWT_SECRET=bitte-hier-random-string-einfügen-mindestens-32-zeichen

# Admin Login
ADMIN_USERNAME=dein_admin_name
ADMIN_PASSWORD=sicheres_admin_passwort_hier

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://gymnd_admin:<password>@cluster0.xxxxx.mongodb.net/ideenboerse?retryWrites=true&w=majority

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=deine.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Ideenbörse Gymnasium Neusiedl
SMTP_FROM_EMAIL=deine.email@gmail.com
```
### Backend starten

```
cd server
npm install
npm start
```

Du solltest sehen:
```
✓ MongoDB connected
API listening on :8787
```

**Troubleshooting:**
- **"MongoDB connection error"**: Überprüfe MONGODB_URI und IP-Adresse in MongoDB Atlas
- **Port bereits belegt**: Ändere PORT in `.env` auf z.B. 8788

### Frontend konfigurieren

Die Frontend-Konfiguration ist bereits fertig! 

Überprüfe `api.config.js`:
```javascript
window.API_CONFIG = {
  baseUrl: 'http://localhost:8787/api'
};
```

**Für Produktion später:**
```javascript
window.API_CONFIG = {
  baseUrl: 'https://deine-api-domain.com/api'
};
```