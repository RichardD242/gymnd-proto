let currentIdea = null;
let isAdmin = false;
let resendCooldownTimer = null;
let authToken = null;

const API_BASE = window.API_CONFIG?.baseUrl || 'http://localhost:8787/api';

async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }
    return data;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function setupFilterButtons() {
    const chips = document.querySelectorAll('.chip-btn');
    chips.forEach(ch => ch.addEventListener('click', () => {
        document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        ch.classList.add('active');
        loadAdminIdeas();
    }));
}

function checkAdminStatus() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        authToken = token;
        isAdmin = true;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('admin-panel').classList.add('active');
        loadAdminIdeas();
        updateAdminStats();
        setupFilterButtons();
    }
}

async function updateAdminStats() {
    if (!isAdmin) return;
    try {
        const data = await apiCall('/admin/stats');
        const total = document.getElementById('total-ideas');
        if (total) total.textContent = data.stats.total;
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
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
    
    console.log('Sending verification request to:', `${API_BASE}/verification/request`);
    
    apiCall('/verification/request', {
        method: 'POST',
        body: JSON.stringify({ email })
    })
    .then((data) => {
        console.log('Verification response:', data);
        localStorage.setItem('verificationEmail', email);
        document.getElementById('email-step').style.display = 'none';
        document.getElementById('code-step').style.display = 'block';
        applyResendCooldownState();
        showMessage(`Code wurde an ${email} gesendet.`, 'success');
    })
    .catch(err => {
        console.error('Verification error:', err);
        showMessage(`E-Mail-Versand fehlgeschlagen: ${err.message}`, 'error');
    })
    .finally(() => { 
        if (btn) { btn.disabled = false; btn.textContent = 'Code senden'; } 
    });
}

function resendVerificationCode(){
    const email = localStorage.getItem('verificationEmail') || document.getElementById('user-email')?.value.trim();
    if (!email || !email.endsWith('@gym-nd.at')) {
        showMessage('Bitte verwende deine @gym-nd.at E-Mail-Adresse.', 'error');
        return;
    }
    const btn = document.getElementById('resend-code-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Senden…'; }
    
    startResendCooldown(30);
    
    apiCall('/verification/request', {
        method: 'POST',
        body: JSON.stringify({ email })
    })
    .then(() => {
        showMessage(`Neuer Code wurde an ${email} gesendet.`, 'success');
    })
    .catch(err => {
        showMessage(`E-Mail-Versand fehlgeschlagen: ${err.message}`, 'error');
        clearResendCooldown();
        if (btn) { btn.disabled = false; btn.textContent = 'Code erneut senden'; }
    });
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
        const email = localStorage.getItem('verificationEmail');

        if (!email) {
            showMessage('Keine E-Mail gefunden. Bitte erneut senden.', 'error');
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

        apiCall('/verification/verify', {
            method: 'POST',
            body: JSON.stringify({ email, code: enteredCode })
        })
        .then(data => {
            authToken = data.token;
            return apiCall('/ideas', {
                method: 'POST',
                body: JSON.stringify({
                    title: currentIdea.title,
                    description: currentIdea.description,
                    category: currentIdea.category
                })
            });
        })
        .then(() => {
            localStorage.removeItem('verificationEmail');
            triggerSuccessAnimation();
            
            setTimeout(() => {
                closeModal();
                const form = document.getElementById('idea-form');
                if (form) form.reset();
                currentIdea = null;
                authToken = null;
                showMessage('Deine Idee wurde erfolgreich eingereicht!', 'success');
                updateStepUI(3);
                if (isAdmin) {
                    loadAdminIdeas();
                    updateAdminStats();
                }
            }, 300);
        })
        .catch(err => {
            showMessage(`Fehler: ${err.message}`, 'error');
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Idee einreichen';
            }
        });
    } catch (err) {
        console.error('verifyCode error:', err);
        showMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.', 'error');
    }
}


async function loadAdminIdeas() {
    if (!isAdmin) return;
    const container = document.getElementById('admin-ideas-list');
    if (!container) return;
    
    try {
        const activeChip = document.querySelector('.chip-btn.active');
        const filter = activeChip ? activeChip.getAttribute('data-cat') : 'alle';
        const endpoint = filter && filter !== 'alle' ? `/admin/ideas?category=${filter}` : '/admin/ideas';
        
        const data = await apiCall(endpoint);
        const ideas = data.ideas || [];
        
        if (!ideas.length) {
            container.innerHTML = '<p class="text-center">Noch keine Ideen vorhanden.</p>';
            return;
        }
        container.innerHTML = '';
        ideas.forEach(i => container.appendChild(createIdeaElement(i, true)));
    } catch (e) {
        console.error('Failed to load admin ideas:', e);
        container.innerHTML = '<p class="text-center text-error">Fehler beim Laden der Ideen.</p>';
    }
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

async function handleAdminLogin(e) {
    e.preventDefault();
    const u = document.getElementById('admin-username').value.trim();
    const p = document.getElementById('admin-password').value.trim();
    
    try {
        const data = await apiCall('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username: u, password: p })
        });
        
        authToken = data.token;
        isAdmin = true;
        localStorage.setItem('adminToken', authToken);
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('admin-panel').classList.add('active');
        loadAdminIdeas();
        updateAdminStats();
        showMessage('Erfolgreich als Admin angemeldet.', 'success');
        
        setupFilterButtons();
    } catch (e) {
        showMessage('Ungültige Anmeldedaten.', 'error');
    }
}

function logout() {
    isAdmin = false;
    authToken = null;
    localStorage.removeItem('adminToken');
    if (document.getElementById('admin-panel')) {
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('admin-login').style.display = 'block';
        const f = document.getElementById('admin-form');
        if (f) f.reset();
        showMessage('Erfolgreich abgemeldet.', 'success');
    }
}

async function exportData() {
    try {
        const data = await apiCall('/admin/ideas');
        const ideas = data.ideas || [];
        const blob = new Blob([JSON.stringify(ideas, null, 2)], {
            type: 'application/json'
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ideen_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showMessage('Daten wurden exportiert.', 'success');
    } catch (e) {
        showMessage('Fehler beim Exportieren der Daten.', 'error');
    }
}

async function clearData() {
    if (!confirm('Möchtest du wirklich ALLE Ideen löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
        return;
    }
    try {
        await apiCall('/admin/ideas', { method: 'DELETE' });
        showMessage('Alle Ideen wurden gelöscht.', 'success');
        loadAdminIdeas();
        updateAdminStats();
    } catch (e) {
        showMessage('Fehler beim Löschen der Daten.', 'error');
    }
}

function closeModal() {
    const modal = document.getElementById('email-modal');
    if (!modal) return;

    modal.classList.remove('active');
    
    const emailStep = document.getElementById('email-step');
    const codeStep = document.getElementById('code-step');
    if (emailStep) emailStep.style.display = 'block';
    if (codeStep) codeStep.style.display = 'none';

    const ue = document.getElementById('user-email');
    const vc = document.getElementById('verification-code');
    if (ue) ue.value = '';
    if (vc) vc.value = '';

    currentIdea = null;
    updateStepUI(1);
    clearResendCooldown();
    
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

function triggerSuccessAnimation(){
    try {
        const card = document.querySelector('#submit-idea .card');
        if(card){
            card.classList.remove('submission-pulse');
            void card.offsetWidth;
            card.classList.add('submission-pulse');
        }

        let container = document.querySelector('.confetti-container');
        if(!container){
            container = document.createElement('div');
            container.className = 'confetti-container';
            document.body.appendChild(container);
        }

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

        setTimeout(()=>{ if(container) container.innerHTML=''; },4000);
    } catch(e){
        console.warn('Confetti error:', e);
    }
}
