let currentIdea = null;
let isAdmin = false;
let resendCooldownTimer = null;

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'gymnasium2024'
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function checkAdminStatus() {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        isAdmin = true;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('admin-panel').classList.add('active');
        loadAdminIdeas();
        updateAdminStats();
    }
}

function updateAdminStats() {
    if (!isAdmin) return;
    const total = document.getElementById('total-ideas');
    if (total) total.textContent = loadIdeas().length;
}

function initializeApp() {
    const ideaForm = document.getElementById('idea-form');
    if (ideaForm) ideaForm.addEventListener('submit', handleIdeaSubmit);
    if (document.getElementById('admin-form')) {
        document.getElementById('admin-form').addEventListener('submit', handleAdminLogin);
        checkAdminStatus();
        updateAdminStats();
    }
    updateStepUI(1);
}

function updateStepUI(step) {
    const steps = document.querySelectorAll('.progress-steps .step');
    steps.forEach(el => {
        const n = parseInt(el.getAttribute('data-step'));
        if (!n) return;
        el.classList.remove('active', 'completed', 'locked');
        if (n < step) el.classList.add('completed');
        else if (n === step) el.classList.add('active');
        else el.classList.add('locked');
    });
}

function handleIdeaSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('idea-title').value.trim();
    const description = document.getElementById('idea-description').value.trim();
    const categoryEl = document.querySelector('input[name="idea-category"]:checked');
    const category = categoryEl ? categoryEl.value : '';
    if (!title || !description || !category) {
        showMessage('Bitte fülle alle Felder aus.', 'error');
        return;
    }
    currentIdea = {
        id: generateId(),
        title,
        description,
        category,
        visibility: 'private',
        timestamp: new Date().toISOString()
    };
    document.getElementById('email-modal').classList.add('active');
    updateStepUI(2);
}

function sendVerificationCode() {
    const email = document.getElementById('user-email').value.trim();
    if (!email.endsWith('@gym-nd.at')) {
        showMessage('Bitte verwende deine @gym-nd.at E-Mail-Adresse.', 'error');
        return;
    }
    const btn = document.getElementById('send-code-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Senden…'; }
    // Client-seitiger Versand (EmailJS) – alter Weg
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('verificationCode', code);
    localStorage.setItem('verificationEmail', email);
    localStorage.setItem('verificationCodeExpiry', String(Date.now() + 10*60*1000));
    document.getElementById('email-step').style.display = 'none';
    document.getElementById('code-step').style.display = 'block';
    applyResendCooldownState();
    if (window.EmailService && EmailService.isConfigured()) {
        EmailService.sendVerificationEmail(email, code)
            .then(() => showMessage(`Code wurde an ${email} gesendet.`, 'success'))
            .catch(err => {
                const raw = (err && (err.text || err.message)) ? String(err.text || err.message) : '';
                let msg = raw || 'Bitte später erneut versuchen.';
                if (/Gmail_API|insufficient authentication scopes/i.test(raw)) {
                    msg = 'Gmail-Service in EmailJS ohne ausreichende Berechtigungen verbunden. Bitte Gmail in EmailJS erneut verbinden (mit Senderechten) oder auf SMTP (App-Passwort) umstellen.';
                }
                showMessage(`E-Mail-Versand fehlgeschlagen: ${msg}`, 'error');
            })
            .finally(() => { if (btn) { btn.disabled = false; btn.textContent = 'Code senden'; } });
    } else {
        console.log(`[DEV] E-Mail Dienst nicht konfiguriert. Code: ${code}`);
        showMessage(`(Entwickler-Modus) Code: ${code}`, 'success');
        if (btn) { btn.disabled = false; btn.textContent = 'Code senden'; }
    }
}

function resendVerificationCode(){
        const email = localStorage.getItem('verificationEmail') || document.getElementById('user-email')?.value.trim();
        if (!email || !email.endsWith('@gym-nd.at')) {
                showMessage('Bitte verwende deine @gym-nd.at E-Mail-Adresse.', 'error');
                return;
        }
        const btn = document.getElementById('resend-code-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Senden…'; }
        // Starte Cooldown sofort, um Spam zu vermeiden
        startResendCooldown(30);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem('verificationCode', code);
        localStorage.setItem('verificationEmail', email);
        localStorage.setItem('verificationCodeExpiry', String(Date.now() + 10*60*1000));
        if (window.EmailService && EmailService.isConfigured()) {
            EmailService.sendVerificationEmail(email, code)
                .then(()=> showMessage(`Neuer Code wurde an ${email} gesendet.`, 'success'))
                .catch(err=>{
                    const raw = (err && (err.text || err.message)) ? String(err.text || err.message) : '';
                    let msg = raw || 'Bitte später erneut versuchen.';
                    if (/Gmail_API|insufficient authentication scopes/i.test(raw)) {
                        msg = 'Gmail-Service in EmailJS ohne ausreichende Berechtigungen verbunden. Bitte Gmail in EmailJS erneut verbinden (mit Senderechten) oder auf SMTP (App-Passwort) umstellen.';
                    }
                    showMessage(`E-Mail-Versand fehlgeschlagen: ${msg}`, 'error');
                    clearResendCooldown();
                    if (btn) { btn.disabled = false; btn.textContent = 'Code erneut senden'; }
                })
                .finally(()=>{});
        } else {
            console.log('[DEV] Resend – E-Mail Dienst nicht konfiguriert. Code:', code);
            showMessage(`(Entwickler-Modus) Neuer Code: ${code}`, 'success');
            startResendCooldown(10);
        }
}

                function startResendCooldown(seconds){
                    const until = Date.now() + seconds*1000;
                    localStorage.setItem('resendCooldownUntil', String(until));
                    runResendCountdown();
                }

                function runResendCountdown(){
                    const btn = document.getElementById('resend-code-btn');
                    if (!btn) return;
                    const update = () => {
                        const until = parseInt(localStorage.getItem('resendCooldownUntil')||'0',10);
                        const remainingMs = until - Date.now();
                        if (!until || remainingMs <= 0){
                            clearResendCooldown();
                            return;
                        }
                        const s = Math.ceil(remainingMs/1000);
                        btn.disabled = true;
                        btn.textContent = `Code erneut senden (${s}s)`;
                    };
                    update();
                    if (resendCooldownTimer) clearInterval(resendCooldownTimer);
                    resendCooldownTimer = setInterval(update, 1000);
                }

                function clearResendCooldown(){
                    const btn = document.getElementById('resend-code-btn');
                    localStorage.removeItem('resendCooldownUntil');
                    if (resendCooldownTimer){ clearInterval(resendCooldownTimer); resendCooldownTimer = null; }
                    if (btn){ btn.disabled = false; btn.textContent = 'Code erneut senden'; }
                }

                function applyResendCooldownState(){
                    const until = parseInt(localStorage.getItem('resendCooldownUntil')||'0',10);
                    if (until && Date.now() < until){
                        runResendCountdown();
                    } else {
                        clearResendCooldown();
                    }
                }

function verifyCode() {
    try {
        const verifyBtn = document.querySelector('button[onclick="verifyCode()"]');
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Prüfe...';
        }

        const enteredCode = document.getElementById('verification-code').value.trim();
        // Lokale Prüfung
        const email = localStorage.getItem('verificationEmail');
        const storedCode = localStorage.getItem('verificationCode');
        const expiry = parseInt(localStorage.getItem('verificationCodeExpiry')||'0',10);

        if (!storedCode || !email) {
            showMessage('Kein aktiver Code gefunden. Bitte erneut senden.', 'error');
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Idee einreichen';
            }
            return;
        }
        if (expiry && Date.now() > expiry) {
            showMessage('Der Verifizierungscode ist abgelaufen. Bitte fordere einen neuen Code an.', 'error');
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Idee einreichen';
            }
            return;
        }
        if (enteredCode !== storedCode) {
            showMessage('Ungültiger Verifizierungscode.', 'error');
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Idee einreichen';
            }
            return;
        }
        if (!currentIdea) {
            showMessage('Sitzung abgelaufen. Bitte Formular erneut absenden.', 'error');
            closeModal();
            return;
        }

        currentIdea.submitterEmail = email;
        saveIdea(currentIdea);
        localStorage.removeItem('verificationCode');
        localStorage.removeItem('verificationEmail');
        localStorage.removeItem('verificationCodeExpiry');

        // Ensure animation is triggered before closing modal
        triggerSuccessAnimation();
        
        setTimeout(() => {
            closeModal();
            const form = document.getElementById('idea-form');
            if (form) form.reset();
            currentIdea = null;
            showMessage('Deine Idee wurde erfolgreich eingereicht!', 'success');
            updateStepUI(3);
            if (isAdmin) {
                loadAdminIdeas();
                updateAdminStats();
            }
        }, 300); // Small delay to ensure animation is visible
    } catch (err) {
        console.error('verifyCode error:', err);
        showMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.', 'error');
    }
}

function saveIdea(idea) {
    const ideas = loadIdeas();
    ideas.push(idea);
    localStorage.setItem('ideas', JSON.stringify(ideas));
}

function loadIdeas() {
    return JSON.parse(localStorage.getItem('ideas')) || [];
}

function loadAdminIdeas() {
    if (!isAdmin) return;
    const container = document.getElementById('admin-ideas-list');
    if (!container) return;
    let ideas = loadIdeas();
    const activeChip = document.querySelector('.chip-btn.active');
    const filter = activeChip ? activeChip.getAttribute('data-cat') : 'alle';
    if (filter && filter !== 'alle') {
        ideas = ideas.filter(i => i.category === filter);
    }
    if (!ideas.length) {
        container.innerHTML = '<p class="text-center">Noch keine Ideen vorhanden.</p>';
        return;
    }
    container.innerHTML = '';
    ideas.forEach(i => container.appendChild(createIdeaElement(i, true)));
}

function createIdeaElement(idea, adminView) {
    const div = document.createElement('div');
    div.className = 'idea-item';
    const date = new Date(idea.timestamp).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const adminInfo = adminView ? `<div class="admin-info" style="margin-top:10px;padding:10px;background:var(--color-surface);border-radius:6px;font-size:12px;"><strong>Absender:</strong> ${idea.submitterEmail}<br><strong>IDEE:</strong> ${idea.id}</div>` : '';
    div.innerHTML = `<div class="idea-header"><div class="idea-title">${escapeHtml(idea.title)}</div><div style="display:flex;align-items:center;gap:.5rem;"><span class=\"idea-category\">${idea.category}</span></div></div><div class="idea-description">${escapeHtml(idea.description)}</div>${adminInfo}<div class="idea-meta"><span class="idea-date">${date}</span></div>`;
    return div;
}

function handleAdminLogin(e) {
    e.preventDefault();
    const u = document.getElementById('admin-username').value.trim();
    const p = document.getElementById('admin-password').value.trim();
    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
        isAdmin = true;
        localStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('admin-panel').classList.add('active');
        loadAdminIdeas();
        updateAdminStats();
        showMessage('Erfolgreich als Admin angemeldet.', 'success');
        const chips = document.querySelectorAll('.chip-btn');
        chips.forEach(ch => ch.addEventListener('click', () => {
            document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
            ch.classList.add('active');
            loadAdminIdeas();
        }));
    } else {
        showMessage('Ungültige Anmeldedaten.', 'error');
    }
}

function logout() {
    isAdmin = false;
    localStorage.removeItem('adminLoggedIn');
    if (document.getElementById('admin-panel')) {
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('admin-login').style.display = 'block';
        const f = document.getElementById('admin-form');
        if (f) f.reset();
        showMessage('Erfolgreich abgemeldet.', 'success');
    }
}

function exportData() {
    const ideas = loadIdeas();
    const blob = new Blob([JSON.stringify(ideas, null, 2)], {
        type: 'application/json'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ideen_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showMessage('Daten wurden exportiert.', 'success');
}

function closeModal() {
    const modal = document.getElementById('email-modal');
    if (!modal) return;

    // Remove active class first
    modal.classList.remove('active');
    
    // Reset form state
    const emailStep = document.getElementById('email-step');
    const codeStep = document.getElementById('code-step');
    if (emailStep) emailStep.style.display = 'block';
    if (codeStep) codeStep.style.display = 'none';

    // Clear all inputs
    const ue = document.getElementById('user-email');
    const vc = document.getElementById('verification-code');
    if (ue) ue.value = '';
    if (vc) vc.value = '';

    // Reset state
    currentIdea = null;
    updateStepUI(1);
    clearResendCooldown();
    
    // Reset button states
    const sendBtn = document.getElementById('send-code-btn');
    if (sendBtn) { 
        sendBtn.disabled = false;
        sendBtn.textContent = 'Code senden';
    }
    const resendBtn = document.getElementById('resend-code-btn');
    if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Code erneut senden';
    }
}

function showMessage(text, type = 'success') {
    const c = document.getElementById('message-container');
    if (!c) return;
    const m = document.createElement('div');
    m.className = `message ${type}`;
    m.textContent = text;
    c.appendChild(m);
    setTimeout(() => {
        if (m.parentNode) m.remove();
    }, 5000);
}

function generateId() {
    return 'idee_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

document.addEventListener('click', e => {
    const modal = document.getElementById('email-modal');
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

function createDemoData() {
    const demo = [{
        id: 'demo_1',
        title: 'Längere Mittagspause',
        description: 'Die aktuelle Mittagspause ist zu kurz. Wir brauchen mehr Zeit zum Essen und Entspannen.',
        category: 'Schulgebäude',
        visibility: 'private',
        timestamp: new Date(Date.now() - 2 * 864e5).toISOString(),
        submitterEmail: 'demo@gym-nd.at'
    }];
    localStorage.setItem('ideas', JSON.stringify(demo));
}

// Success Animation (Confetti + Pulse)
function triggerSuccessAnimation(){
    try {
        // Pulse Effekt auf Formular-Karte
        const card = document.querySelector('#submit-idea .card');
        if(card){
            card.classList.remove('submission-pulse');
            void card.offsetWidth; // reflow zum Neustart der Animation
            card.classList.add('submission-pulse');
        }
        // Confetti Container einmalig
        let container = document.querySelector('.confetti-container');
        if(!container){
            container = document.createElement('div');
            container.className = 'confetti-container';
            document.body.appendChild(container);
        }
        // Bestehende Stücke entfernen
        container.innerHTML = '';
        const colors = ['#2f6b2f','#318831','#1d4f91','#b9352f','#d39d17'];
        const amount = 40;
        for(let i=0;i<amount;i++){
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            const color = colors[Math.floor(Math.random()*colors.length)];
            piece.style.background = color;
            piece.style.left = Math.random()*100 + 'vw';
            const delay = (Math.random()*0.3).toFixed(2);
            const duration = (1.8 + Math.random()*1.6).toFixed(2);
            const rotate = Math.random()>0.5 ? 360 : -360;
            piece.style.animationDuration = duration+'s';
            piece.style.animationDelay = delay+'s';
            piece.style.transform = `rotate(${Math.random()*rotate}deg)`;
            container.appendChild(piece);
        }
        // Automatisch nach 4s aufräumen
        setTimeout(()=>{ if(container) container.innerHTML=''; },4000);
    } catch(e){
        console.warn('Confetti error:', e);
    }
}
