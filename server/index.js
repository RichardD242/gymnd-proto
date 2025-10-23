import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const store = {
  codes: new Map(), // key: email, value: { code, expiresAt }
  ideas: []
};

function createTransporter() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(payload, expiresIn = '15m') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/verification/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.endsWith('@gym-nd.at')) return res.status(400).json({ error: 'Invalid email' });
    const code = generateCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
    store.codes.set(email, { code, expiresAt });

    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'Ideenbörse';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const html = `<p>Dein Verifizierungscode lautet: <strong>${code}</strong></p><p>Dieser Code ist 10 Minuten gültig.</p>`;
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Dein Verifizierungscode',
      html,
    });
    return res.json({ ok: true });
  } catch (e) {
    console.error('send code error', e);
    return res.status(500).json({ error: 'Failed to send code' });
  }
});

app.post('/api/verification/verify', (req, res) => {
  const { email, code } = req.body;
  const rec = store.codes.get(email);
  if (!rec) return res.status(400).json({ error: 'No code requested' });
  if (Date.now() > rec.expiresAt) return res.status(400).json({ error: 'Code expired' });
  if (code !== rec.code) return res.status(400).json({ error: 'Invalid code' });
  store.codes.delete(email);
  const token = signToken({ email }, '1h');
  return res.json({ ok: true, token });
});

app.post('/api/ideas', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { title, description, category } = req.body;
    if (!title || !description || !category) return res.status(400).json({ error: 'Missing fields' });
    const idea = {
      id: 'idee_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
      title,
      description,
      category,
      submitterEmail: decoded.email,
      timestamp: new Date().toISOString(),
    };
    store.ideas.push(idea);
    return res.json({ ok: true, idea });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/ideas', (req, res) => {
  const { category } = req.query;
  let list = store.ideas.slice();
  if (category) list = list.filter(i => i.category === category);
  return res.json({ ok: true, ideas: list });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`API listening on :${port}`));
