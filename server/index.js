import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Idea from './models/Idea.js';
import VerificationCode from './models/VerificationCode.js';

const app = express();
app.use(express.json());

app.set('trust proxy', 1);

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const corsOptions = {
  origin: function (origin, callback) {

    if (!origin) return callback(null, true);
    
    if (CORS_ORIGIN === '*') return callback(null, true);
    
    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());
    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gymnasium2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ideenboerse';

// MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));



function createTransporter() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 10000,
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
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10m
    
    await VerificationCode.findOneAndUpdate(
      { email },
      { code, expiresAt: new Date(expiresAt) },
      { upsert: true, new: true }
    );

    const fromName = process.env.SMTP_FROM_NAME || 'Ideenbörse';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Mail bestätigen</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa; color: #132022;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
                    
                    <!-- Header mit grünem Hintergrund -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2f6b2f 0%, #3a8a3a 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">
                                E-Mail bestätigen
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Hauptinhalt -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4a5a5e;">
                                Vielen Dank für deine Einsendung! Um deine Idee zu verifizieren, verwende bitte den folgenden Code:
                            </p>
                            
                            <!-- Code Box -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; background: linear-gradient(135deg, #f0f4f0 0%, #e8f0e8 100%); border: 2px solid #2f6b2f; border-radius: 10px; padding: 20px 40px;">
                                            <div style="font-size: 42px; font-weight: 600; letter-spacing: 10px; color: #2f6b2f; font-family: 'Oswald', Arial, sans-serif;">
                                                ${code}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #4a5a5e;">
                                Gib den obigen Code in der <strong>Ideenbörse</strong> ein, um deine Einsendung zu bestätigen.
                            </p>
                            
                            <div style="background-color: #fff8e6; border-left: 4px solid #d39d17; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b5a0f;">
                                    <strong>Wichtig:</strong> Der Code ist aus Sicherheitsgründen nur <strong>10 Minuten</strong> gültig. Teile ihn nicht mit anderen Personen.
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #758589;">
                                Falls du keine Idee eingereicht hast, kannst du diese E-Mail einfach ignorieren.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f5f7fa; padding: 30px; border-top: 1px solid #e0e5e8;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align: left; vertical-align: middle; width: 70%;">
                                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #758589; font-weight: 500;">
                                            Ideenbörse
                                        </p>
                                        <p style="margin: 0; font-size: 13px; color: #9ba5a9;">
                                            Gymnasium Neusiedl am See
                                        </p>
                                        <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ba5a9;">
                                            © ${new Date().getFullYear()} Alle Rechte vorbehalten
                                        </p>
                                    </td>
                                    <td style="text-align: right; vertical-align: middle; width: 30%;">
                                        <img src="https://raw.githubusercontent.com/RichardD242/Website-test/refs/heads/main/gymlogo.png" alt="Gymnasium Logo" style="max-width: 100px; height: auto; display: block; margin-left: auto;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
    
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Verifiziere deine Idee',
      html,
    });
    
    return res.json({ ok: true });
  } catch (e) {
    console.error('send code error', e);
    return res.status(500).json({ error: 'Failed to send code' });
  }
});

app.post('/api/verification/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const rec = await VerificationCode.findOne({ email });
    if (!rec) return res.status(400).json({ error: 'No code requested' });
    if (Date.now() > rec.expiresAt.getTime()) {
      await VerificationCode.deleteOne({ email });
      return res.status(400).json({ error: 'Code expired' });
    }
    if (code !== rec.code) return res.status(400).json({ error: 'Invalid code' });
    
    await VerificationCode.deleteOne({ email });
    
    const token = signToken({ email }, '1h');
    return res.json({ ok: true, token });
  } catch (e) {
    console.error('verify code error', e);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

app.post('/api/ideas', authMiddleware, async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description || !category) return res.status(400).json({ error: 'Missing fields' });
    
    const idea = new Idea({
      id: 'idee_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
      title,
      description,
      category,
      submitterEmail: req.user.email,
      timestamp: new Date()
    });
    
    await idea.save();
    return res.json({ ok: true, idea });
  } catch (e) {
    console.error('create idea error', e);
    return res.status(500).json({ error: 'Failed to save idea' });
  }
});

app.get('/api/ideas', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const ideas = await Idea.find(filter).sort({ timestamp: -1 });
    return res.json({ ok: true, ideas });
  } catch (e) {
    console.error('get ideas error', e);
    return res.status(500).json({ error: 'Failed to fetch ideas' });
  }
});

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = signToken({ role: 'admin', username }, '24h');
      return res.json({ ok: true, token });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (e) {
    console.error('admin login error', e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

function adminMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/admin/ideas', adminMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== 'alle' ? { category } : {};
    const ideas = await Idea.find(filter).sort({ timestamp: -1 });
    return res.json({ ok: true, ideas });
  } catch (e) {
    console.error('admin get ideas error', e);
    return res.status(500).json({ error: 'Failed to fetch ideas' });
  }
});

app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const total = await Idea.countDocuments();
    const byCategory = await Idea.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    return res.json({ ok: true, stats: { total, byCategory } });
  } catch (e) {
    console.error('admin stats error', e);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.delete('/api/admin/ideas', adminMiddleware, async (req, res) => {
  try {
    await Idea.deleteMany({});
    return res.json({ ok: true, message: 'All ideas deleted' });
  } catch (e) {
    console.error('admin delete all error', e);
    return res.status(500).json({ error: 'Failed to delete ideas' });
  }
});

app.delete('/api/admin/ideas/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Idea.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    return res.json({ ok: true, message: 'Idea deleted' });
  } catch (e) {
    console.error('admin delete idea error', e);
    return res.status(500).json({ error: 'Failed to delete idea' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`API listening on :${port}`));
