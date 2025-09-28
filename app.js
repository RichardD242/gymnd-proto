let currentIdea = null;
let isAdmin = false;

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'gymnasium2024'
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

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
    const category = document.getElementById('idea-category').value;
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
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('verificationCode', code);
    localStorage.setItem('verificationEmail', email);
    document.getElementById('email-step').style.display = 'none';
    document.getElementById('code-step').style.display = 'block';
    console.log(`Verifizierungscode für ${email}: ${code}`);
    showMessage(`Code wurde an ${email} gesendet. (Demo: ${code})`, 'success');
}

function verifyCode() {
    const enteredCode = document.getElementById('verification-code').value.trim();
    const storedCode = localStorage.getItem('verificationCode');
    const email = localStorage.getItem('verificationEmail');
    if (enteredCode !== storedCode) {
        showMessage('Ungültiger Verifizierungscode.', 'error');
        return;
    }
    currentIdea.submitterEmail = email;
    saveIdea(currentIdea);
    localStorage.removeItem('verificationCode');
    localStorage.removeItem('verificationEmail');
    closeModal();
    document.getElementById('idea-form').reset();
    currentIdea = null;
    showMessage('Deine Idee wurde erfolgreich eingereicht!', 'success');
    triggerSuccessAnimation();
    updateStepUI(3);
    if (isAdmin) {
        loadAdminIdeas();
        updateAdminStats();
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
    const ideas = loadIdeas();
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
    const adminInfo = adminView ? `<div class="admin-info" style="margin-top:10px;padding:10px;background:var(--color-surface);border-radius:6px;font-size:12px;"><strong>Absender:</strong> ${idea.submitterEmail}<br><strong>ID:</strong> ${idea.id}</div>` : '';
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
    } else {
        showMessage('Ungültige Anmeldedaten.', 'error');
    }
}

function checkAdminStatus() {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        isAdmin = true;
    }
}

function updateAdminStats() {
    if (!isAdmin) return;
    const ideas = loadIdeas();
    const t = document.getElementById('total-ideas');
    if (t) t.textContent = ideas.length;
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

function clearData() {
    if (confirm('Wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        localStorage.removeItem('ideas');
        if (isAdmin) {
            loadAdminIdeas();
            updateAdminStats();
        }
        showMessage('Alle Daten wurden gelöscht.', 'success');
    }
}

function closeModal() {
    document.getElementById('email-modal').classList.remove('active');
    document.getElementById('email-step').style.display = 'block';
    document.getElementById('code-step').style.display = 'none';
    document.getElementById('user-email').value = '';
    document.getElementById('verification-code').value = '';
    currentIdea = null;
    updateStepUI(1);
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
    return 'idea_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
