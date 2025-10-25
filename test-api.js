// Test Script für Backend API
// Führe diesen mit: node test-api.js aus

const API_BASE = 'http://localhost:8787/api';

async function testAPI() {
    console.log('🧪 Testing Backend API...\n');
    
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('✅ Health Check:', data);
    } catch (error) {
        console.error('❌ Health Check failed:', error.message);
        console.log('\n⚠️  Stelle sicher, dass der Backend-Server läuft (npm start im server/ Ordner)');
        return;
    }
    
    console.log('\n2️⃣ Testing Verification Request...');
    try {
        const response = await fetch(`${API_BASE}/verification/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@gym-nd.at' })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Verification Request:', data);
            console.log('📧 Überprüfe dein E-Mail-Postfach für den Code!');
        } else {
            console.log('ℹ️  Verification Request Response:', data);
        }
    } catch (error) {
        console.error('❌ Verification Request failed:', error.message);
    }
    
    console.log('\n3️⃣ Testing Ideas Endpoint...');
    try {
        const response = await fetch(`${API_BASE}/ideas`);
        const data = await response.json();
        console.log('✅ Ideas Endpoint:', data);
        console.log(`   Anzahl Ideen: ${data.ideas?.length || 0}`);
    } catch (error) {
        console.error('❌ Ideas Endpoint failed:', error.message);
    }
    
    console.log('\n✨ API Tests abgeschlossen!\n');
    console.log('Nächste Schritte:');
    console.log('1. Öffne index.html im Browser');
    console.log('2. Teste das Formular mit deiner @gym-nd.at E-Mail');
    console.log('3. Überprüfe das Admin-Panel unter admin.html');
}

// Node.js fetch polyfill für ältere Versionen
if (typeof fetch === 'undefined') {
    console.log('⚠️  Installiere node-fetch: npm install node-fetch');
    console.log('   Oder verwende Node.js 18+');
} else {
    testAPI().catch(console.error);
}
