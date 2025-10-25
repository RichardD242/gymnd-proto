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

### 1️⃣ MongoDB Atlas einrichten (5 Minuten)

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

### 2️⃣ Gmail SMTP einrichten (5 Minuten)

1. **2-Faktor-Authentifizierung aktivieren:**
   - Gehe zu [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Aktiviere "2-Step Verification"

2. **App-Passwort erstellen:**
   - Gehe zu [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Wähle "Mail" als App
   - Wähle "Windows Computer" (oder beliebiges Gerät)
   - Klicke "Generate"
   - **Kopiere das 16-stellige Passwort** (Format: `xxxx xxxx xxxx xxxx`)

### 3️⃣ Backend konfigurieren (2 Minuten)

1. **Öffne die Datei:** `server/.env`

2. **Ersetze die Platzhalter:**

```bash
# Server Configuration
PORT=8787
CORS_ORIGIN=*
JWT_SECRET=bitte-hier-random-string-einfügen-mindestens-32-zeichen

# Admin Login (WICHTIG: Ändere diese Werte!)
ADMIN_USERNAME=dein_admin_name
ADMIN_PASSWORD=sicheres_admin_passwort_hier

# MongoDB Atlas Connection
# Ersetze <password> mit dem Datenbank-Passwort von Schritt 1
MONGODB_URI=mongodb+srv://gymnd_admin:<password>@cluster0.xxxxx.mongodb.net/ideenboerse?retryWrites=true&w=majority

# Gmail SMTP (mit App-Passwort von Schritt 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=deine.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Ideenbörse Gymnasium Neusiedl
SMTP_FROM_EMAIL=deine.email@gmail.com
```

**Wichtige Hinweise:**
- `JWT_SECRET`: Generiere einen langen zufälligen String (z.B. mit [https://randomkeygen.com/](https://randomkeygen.com/))
- `MONGODB_URI`: Ersetze `<password>` mit deinem echten Passwort (keine <>-Klammern!)
- `SMTP_PASS`: Das App-Passwort von Gmail (mit oder ohne Leerzeichen funktioniert)

### 4️⃣ Backend starten

```bash
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

### 5️⃣ Frontend konfigurieren (1 Minute)

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

### 6️⃣ Testen

1. **Backend testen:**
   ```bash
   curl http://localhost:8787/api/health
   ```
   Sollte antworten: `{"ok":true}`

2. **Frontend öffnen:**
   - Öffne `index.html` in einem Browser
   - Oder starte einen lokalen Server:
   ```bash
   # PowerShell (im Hauptordner, nicht server/)
   python -m http.server 8080
   ```
   - Öffne: http://localhost:8080

3. **Test-Workflow:**
   - Fülle das Ideen-Formular aus
   - Klicke "Verifizieren & Absenden"
   - Gib deine @gym-nd.at E-Mail ein
   - Du solltest eine E-Mail mit dem Code erhalten
   - Gib den Code ein → Idee wird gespeichert!

4. **Admin-Panel testen:**
   - Gehe zu `admin.html`
   - Login mit deinen Credentials aus `.env`
   - Du solltest alle eingereichten Ideen sehen

## 🚀 Deployment (Produktion)

### Backend auf Railway/Render deployen

**Railway (empfohlen):**
1. Gehe zu [https://railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Wähle dein Repository
4. Root Directory: `/server`
5. Füge alle Environment Variables aus `.env` hinzu
6. Deploy!

**Render:**
1. Gehe zu [https://render.com](https://render.com)
2. "New Web Service"
3. Connect Repository
4. Root Directory: `server`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Füge Environment Variables hinzu
8. Create Web Service

### Frontend auf Netlify/Vercel deployen

**Netlify:**
1. Gehe zu [https://www.netlify.com](https://www.netlify.com)
2. "Add new site" → "Import an existing project"
3. Wähle dein Repository
4. Base directory: `/` (root)
5. Build command: (leer lassen)
6. Publish directory: `/` (root)
7. **WICHTIG:** Update `api.config.js` mit deiner Backend-URL:
   ```javascript
   window.API_CONFIG = {
     baseUrl: 'https://your-backend.railway.app/api'
   };
   ```
8. Deploy!

**Nach dem Deployment:**
- Update `CORS_ORIGIN` in der Backend `.env` mit deiner Frontend-URL
- Teste die komplette Integration

## 📊 Datenbank-Struktur

### Ideas Collection
```javascript
{
  _id: ObjectId("..."),
  id: "idee_1234567890_abc123",
  title: "Längere Mittagspause",
  description: "Beschreibung...",
  category: "Anliegen",
  submitterEmail: "max.mustermann@gym-nd.at",
  visibility: "private",
  timestamp: ISODate("2025-10-25T10:30:00.000Z"),
  createdAt: ISODate("2025-10-25T10:30:00.000Z"),
  updatedAt: ISODate("2025-10-25T10:30:00.000Z")
}
```

### Verification Codes Collection
```javascript
{
  _id: ObjectId("..."),
  email: "max.mustermann@gym-nd.at",
  code: "123456",
  expiresAt: ISODate("2025-10-25T10:40:00.000Z"),
  createdAt: ISODate("2025-10-25T10:30:00.000Z")
}
```
**Hinweis:** Codes werden automatisch nach 10 Minuten gelöscht (TTL-Index)

## 🔒 Sicherheit

### Implementierte Sicherheitsmaßnahmen:
- ✅ Rate Limiting (100 Requests/15 Minuten)
- ✅ JWT-Token mit Ablaufzeit
- ✅ E-Mail-Domain-Validierung (@gym-nd.at only)
- ✅ MongoDB TTL-Index für Auto-Cleanup
- ✅ CORS-Konfiguration
- ✅ Input-Validierung (max. Längen)
- ✅ Admin-Authentifizierung

### Best Practices für Produktion:
1. **Starke Secrets**: Verwende lange, zufällige Strings für JWT_SECRET
2. **Admin-Passwort**: Ändere unbedingt das Standard-Passwort!
3. **CORS**: Setze CORS_ORIGIN auf deine spezifische Domain
4. **MongoDB**: Beschränke Network Access auf Server-IPs
5. **HTTPS**: Verwende immer HTTPS in Produktion
6. **Environment Variables**: Teile niemals deine `.env` Datei!

## 🛠️ Häufige Probleme

### Problem: "MongoDB connection error"
**Lösung:**
1. Überprüfe MONGODB_URI in `.env` (kein `<>` im Passwort!)
2. IP-Adresse in MongoDB Atlas → Network Access hinzufügen
3. Datenbank-User hat Rechte (Atlas admin)

### Problem: E-Mail wird nicht gesendet
**Lösung:**
1. 2FA bei Gmail aktiviert?
2. App-Passwort (nicht normales Passwort!) verwendet?
3. SMTP_USER und SMTP_FROM_EMAIL sind identisch?
4. Port 587 nicht blockiert (Firewall)?

### Problem: Frontend kann Backend nicht erreichen
**Lösung:**
1. Backend läuft? (Check: http://localhost:8787/api/health)
2. CORS_ORIGIN in Backend `.env` korrekt?
3. API_CONFIG in `api.config.js` korrekt?
4. Browser-Konsole (F12) für Fehler prüfen

### Problem: Admin-Login funktioniert nicht
**Lösung:**
1. ADMIN_USERNAME und ADMIN_PASSWORD in `.env` gesetzt?
2. Server nach Änderung neu gestartet?
3. Richtiger Username/Passwort eingegeben?

## 📝 API-Dokumentation

Siehe `server/README.md` für detaillierte API-Dokumentation.

## 🎓 Nächste Schritte

1. ✅ Backend implementiert und getestet
2. ✅ Frontend mit Backend verbunden
3. ⬜ Auf Hosting-Plattform deployen
4. ⬜ Domain konfigurieren
5. ⬜ SSL/HTTPS aktivieren
6. ⬜ Admin-Zugangsdaten an Verantwortliche verteilen

## 💡 Weitere Features (optional)

Mögliche Erweiterungen:
- 📧 E-Mail-Benachrichtigungen für Admins bei neuen Ideen
- 📊 Erweiterte Statistiken im Admin-Panel
- 👍 Voting-System für Ideen
- 💬 Kommentar-Funktion
- 🔍 Suchfunktion
- 📱 Mobile App
- 🌐 Mehrsprachigkeit

## 📞 Support

Bei Fragen:
1. Lies die Dokumentation (`server/README.md`)
2. Überprüfe die Browser-Konsole (F12)
3. Überprüfe Server-Logs im Terminal
4. Überprüfe MongoDB Atlas Dashboard

Viel Erfolg! 🎉
