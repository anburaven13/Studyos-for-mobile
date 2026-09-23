import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import sql, { initializeDb, dbContext, dbConnections } from './db.js';
import { auth as firebaseAuth, firestore, storage as firebaseStorage } from './firebase-admin.js';
import { v2 as cloudinary } from 'cloudinary';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import * as ics from 'ics';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getTransporters = () => {
  const transporters = [];
  if (process.env.GMAIL_USER_1 && process.env.GMAIL_PASS_1) {
    transporters.push(nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER_1, pass: process.env.GMAIL_PASS_1 } }));
  }
  if (process.env.GMAIL_USER_2 && process.env.GMAIL_PASS_2) {
    transporters.push(nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER_2, pass: process.env.GMAIL_PASS_2 } }));
  }
  if (process.env.GMAIL_USER_3 && process.env.GMAIL_PASS_3) {
    transporters.push(nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER_3, pass: process.env.GMAIL_PASS_3 } }));
  }
  return transporters;
};

const sendEmailWithFallback = async (mailOptions: nodemailer.SendMailOptions) => {
  const transporters = getTransporters();
  if (transporters.length === 0) {
    console.error('No email transporters configured.');
    return;
  }
  
  let lastError = null;
  for (let i = 0; i < transporters.length; i++) {
    try {
      mailOptions.from = `"StudyOS" <${process.env[`GMAIL_USER_${i+1}`]}>`;
      await transporters[i].sendMail(mailOptions);
      return true;
    } catch (err) {
      console.error(`Email failed with transporter ${i + 1}:`, err);
      lastError = err;
    }
  }
  
  console.error('All email fallback transporters failed. Last error:', lastError);
  // Don't throw to prevent crashing cron
  return false;
};

// --- Security: Strict API key loading ---

const geminiAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || (() => { console.warn('WARNING: GEMINI_API_KEY not set'); return 'MISSING_KEY'; })()
});

const app = express();

// Required when deploying to Vercel/proxies so rate limiters use the correct client IP
app.set('trust proxy', 1);

// JWT handled by Firebase Admin SDK

// SEC-06: Hardened security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://*.neondb.tech"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hidePoweredBy: true,
}));

// CRIT-1: Strict CORS — no wildcard in production
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://studyos-snowy.vercel.app',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'ionic://localhost'
];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : '*',
  credentials: true,
}));

// MED-4: Reduce default body size limit
app.use(express.json({ limit: '5mb' }));

// HIGH-2: Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 minutes
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Rate limiter for AI endpoints (prevent API bill abuse)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { error: 'AI rate limit reached. Please wait a moment.' },
});

// --- Zod Validation Schemas ---
// Auth schemas managed by Firebase

const examSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.string().min(1).max(20),
  confidence: z.number().int().min(0).max(100).optional().default(50),
});

const homeworkSchema = z.object({
  title: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  due_date: z.string().min(1).max(20),
});

const noteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(100000).optional().default(''),
  folder: z.string().max(255).optional().default('General'),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

const plannerSchema = z.object({
  name: z.string().min(1).max(255),
  start_time: z.string().min(1).max(20),
  end_time: z.string().min(1).max(20),
});

const aiChatSchema = z.object({
  prompt: z.string().min(1).optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system', 'tool', 'ai']),
    content: z.string().nullable().optional(),
    tool_calls: z.any().optional(),
    tool_call_id: z.string().optional(),
  })).optional(),
  customSystemPrompt: z.string().optional(),
  userContext: z.string().optional(),
  providerInfo: z.object({
    provider: z.enum(['groq', 'openrouter', 'nvidia', 'google']),
    apiKey: z.string().max(256).optional(),
    model: z.string().max(128).optional(),
  }).optional(),
}).refine(data => data.prompt || data.messages, {
  message: "Either prompt or messages must be provided"
});

// SEC-02: Validation for routine schedule
const routineBlockSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1).max(255),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  type: z.enum(['study', 'break', 'school', 'class', 'sleep', 'meal', 'exercise', 'other']).optional().default('study'),
});

const weeklyRoutineSchema = z.object({
  Monday: z.array(routineBlockSchema).max(20).optional(),
  Tuesday: z.array(routineBlockSchema).max(20).optional(),
  Wednesday: z.array(routineBlockSchema).max(20).optional(),
  Thursday: z.array(routineBlockSchema).max(20).optional(),
  Friday: z.array(routineBlockSchema).max(20).optional(),
  Saturday: z.array(routineBlockSchema).max(20).optional(),
  Sunday: z.array(routineBlockSchema).max(20).optional(),
}).strict();

const noteUpdateSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(100000).optional().default(''),
  folder: z.string().max(255).optional().default('General'),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

const studySessionSchema = z.object({
  duration_minutes: z.number().int().min(1).max(1440),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
});

// --- Manual DB Migration Endpoint ---
// Trigger this manually via POST /api/admin/migrate with x-admin-secret header
app.post('/api/admin/migrate', async (req: any, res: any) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await initializeDb();
    res.json({ success: true, message: 'All database schemas initialized successfully' });
  } catch (e) {
    console.error('Migration failed:', e);
    res.status(500).json({ error: 'Migration failed', details: String(e) });
  }
});

// --- Authentication Routes ---

app.post('/api/auth/reset-password', authLimiter, async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Always return the same response to prevent email enumeration
    try {
      const link = await firebaseAuth.generatePasswordResetLink(email);
      await sendEmailWithFallback({
        to: email,
        subject: 'StudyOS - Reset Your Password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #4f46e5; margin-top: 0;">Reset Your Password</h2>
              <p style="color: #374151; font-size: 16px;">Hello,</p>
              <p style="color: #374151; font-size: 16px;">We received a request to reset your password for your StudyOS account.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
              </div>
              <p style="color: #374151; font-size: 14px;">If you didn't ask to reset your password, you can safely ignore this email.</p>
            </div>
          </div>
        `
      });
    } catch (innerError) {
      // Log but don't expose whether the email exists
      console.error('Reset password inner error (may be invalid email):', innerError);
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Password reset request failed. Please try again later.' });
  }
});

const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    if (!decodedToken.email) return res.status(403).json({ error: 'Forbidden: No email in token' });
    
    let userDbIndex = -1;
    let existingUser = null;
    
    // 1. OPTIMIZED PATH: Check if the token already contains the DB Index
    if (decodedToken.dbIndex !== undefined) {
      userDbIndex = decodedToken.dbIndex;
      try {
        // Query ONLY the single database shard!
        const users = await dbConnections[userDbIndex]`SELECT id, email, is_2fa_enabled, verified_auth_times FROM users WHERE email = ${decodedToken.email}`;
        if (users.length > 0) {
          existingUser = users[0];
        }
      } catch (e) {
        console.error('Error fetching user from assigned shard', e);
      }
    } 
    
    // 2. FALLBACK PATH: Broadcast search for legacy logins or new signups
    if (userDbIndex === -1) {
      let healthyDbIndices: number[] = [];
      
      for (let i = 0; i < dbConnections.length; i++) {
        try {
          const users = await dbConnections[i]`SELECT id, email, is_2fa_enabled, verified_auth_times FROM users WHERE email = ${decodedToken.email}`;
          if (users.length > 0) {
            existingUser = users[0];
            userDbIndex = i;
            break;
          }
          healthyDbIndices.push(i);
        } catch (e) {
          console.error('Error checking DB shard', i, e);
        }
      }

      // If brand new user, assign to a healthy DB based on consistent hashing
      if (userDbIndex === -1) {
        if (healthyDbIndices.length === 0) {
          return res.status(503).json({ error: 'All database shards are currently unavailable or out of quota.' });
        }
        const hash = crypto.createHash('md5').update(decodedToken.email).digest('hex');
        const hashInt = parseInt(hash.substring(0, 8), 16);
        userDbIndex = healthyDbIndices[hashInt % healthyDbIndices.length];
      }
      
      // Save this assignment to Firebase so future logins use the Optimized Path!
      try {
        await firebaseAuth.setCustomUserClaims(decodedToken.uid, { ...decodedToken, dbIndex: userDbIndex });
      } catch (claimErr) {
        console.error('Failed to save dbIndex custom claim', claimErr);
      }
    }

    // Wrap database operations in dbContext to route to the correct shard
    await dbContext.run({ email: decodedToken.email, dbIndex: userDbIndex }, async () => {
      let users = existingUser ? [existingUser] : [];
      
      // Auto-create user in Postgres if they just signed up via Firebase
      if (users.length === 0) {
        const result = await sql`
          INSERT INTO users (email, password_hash) 
          VALUES (${decodedToken.email}, 'firebase_auth_managed') 
          RETURNING id, email, is_2fa_enabled, verified_auth_times
        `;
        users = result;
      }
      
      const user = users[0];

      // Check 2FA
      if (user.is_2fa_enabled) {
        // Allow 2fa/verify to bypass the block so they can actually submit the code
        if (req.path !== '/api/2fa/verify' && req.path !== '/api/user/me') {
          const authTime = decodedToken.auth_time;
          const verifiedTimes = user.verified_auth_times || [];
          if (!verifiedTimes.includes(authTime)) {
            return res.status(403).json({ error: '2fa_required' });
          }
        }
      }
      
      req.user = { userId: user.id, uid: decodedToken.uid, email: user.email, auth_time: decodedToken.auth_time, is_2fa_enabled: user.is_2fa_enabled, verified_auth_times: user.verified_auth_times || [] };
      next();
    });
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(403).json({ error: 'Forbidden: Auth verification failed or token expired' });
  }
};

app.get('/api/cloudinary/sign', authenticateToken, (req: any, res: any) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'studyos_chat',
    }, process.env.CLOUDINARY_API_SECRET!);

    res.json({ timestamp, signature, cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY });
  } catch (err: any) {
    console.error('Cloudinary Sign Error:', err);
    res.status(500).json({ error: 'Failed to sign cloudinary upload' });
  }
});

app.post('/api/user/username', authenticateToken, async (req: any, res: any) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  
  try {
    const usernameDoc = await firestore.collection('usernames').doc(username.toLowerCase()).get();
    if (usernameDoc.exists) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    const userDoc = await firestore.collection('users').doc(req.user.uid).get();
    if (userDoc.exists && userDoc.data()?.username) {
      return res.status(400).json({ error: 'User already has a username' });
    }

    const batch = firestore.batch();
    batch.set(firestore.collection('usernames').doc(username.toLowerCase()), {
      uid: req.user.uid,
      createdAt: new Date().toISOString()
    });
    
    batch.set(firestore.collection('users').doc(req.user.uid), {
      username: username,
      usernameLower: username.toLowerCase(),
      email: req.user.email,
      postgresId: req.user.userId,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    await batch.commit();
    res.json({ success: true, username });
  } catch (error: any) {
    console.error('Username claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/friends/request', authenticateToken, async (req: any, res: any) => {
  const { targetUsername } = req.body;
  if (!targetUsername) return res.status(400).json({ error: 'targetUsername required' });
  
  try {
    const targetDoc = await firestore.collection('usernames').doc(targetUsername.toLowerCase()).get();
    if (!targetDoc.exists) return res.status(404).json({ error: 'User not found' });
    
    const targetUid = targetDoc.data()?.uid;
    if (targetUid === req.user.uid) return res.status(400).json({ error: 'Cannot add yourself' });

    const friendshipId = [req.user.uid, targetUid].sort().join('_');
    const friendDoc = await firestore.collection('friendships').doc(friendshipId).get();
    
    if (friendDoc.exists) {
      return res.status(400).json({ error: 'Friendship or request already exists' });
    }

    await firestore.collection('friendships').doc(friendshipId).set({
      users: [req.user.uid, targetUid],
      status: 'pending',
      requester: req.user.uid,
      createdAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/friends/accept', authenticateToken, async (req: any, res: any) => {
  const { friendshipId } = req.body;
  if (!friendshipId) return res.status(400).json({ error: 'friendshipId required' });
  
  try {
    const friendDoc = await firestore.collection('friendships').doc(friendshipId).get();
    if (!friendDoc.exists) return res.status(404).json({ error: 'Request not found' });
    
    const data = friendDoc.data()!;
    if (data.status !== 'pending') return res.status(400).json({ error: 'Not pending' });
    if (data.requester === req.user.uid) return res.status(400).json({ error: 'Cannot accept your own request' });
    if (!data.users.includes(req.user.uid)) return res.status(403).json({ error: 'Forbidden' });

    await firestore.collection('friendships').doc(friendshipId).update({
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/search', authenticateToken, async (req: any, res: any) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string') return res.json({ users: [] });
  
  try {
    const snapshot = await firestore.collection('users')
      .where('usernameLower', '>=', query.toLowerCase())
      .where('usernameLower', '<=', query.toLowerCase() + '\uf8ff')
      .limit(10)
      .get();
      
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        username: data.username,
      };
    }).filter(u => u.uid !== req.user.uid);
    
    res.json({ users });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/onboarding', authenticateToken, async (req: any, res: any) => {
  try {
    const { class_level, board } = req.body;
    await sql`
      UPDATE users 
      SET class_level = ${class_level}, board = ${board} 
      WHERE id = ${req.user.userId}
    `;
    
    const updatedUsers = await sql`SELECT id, email, class_level, board FROM users WHERE id = ${req.user.userId}`;
    
    // Send Welcome Email
    try {
      await sendEmailWithFallback({
        to: updatedUsers[0].email,
        subject: 'Welcome to StudyOS! 🚀',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #4f46e5;">Welcome to StudyOS!</h1>
              <p style="color: #374151; font-size: 16px;">
                Hi there, we're thrilled to have you! StudyOS is designed to help you stay organized, focused, and stress-free.
              </p>
              <p style="color: #374151; font-size: 16px;">
                <strong>Here is how to get started:</strong><br>
                1. Set up your weekly routine.<br>
                2. Add your upcoming exams.<br>
                3. Start checking off your study blocks!
              </p>
              <p style="color: #6b7280; margin-top: 30px;">Happy studying,<br>The StudyOS Team</p>
            </div>
          </div>
        `
      });
    } catch (e) {
      console.error('Failed to send welcome email:', e);
    }

    res.json({ message: 'Onboarding completed', user: updatedUsers[0] });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to save onboarding data' });
  }
});

app.get('/api/user/me', authenticateToken, async (req: any, res: any) => {
  try {
    const users = await sql`SELECT id, email, class_level, board, is_2fa_enabled, verified_auth_times FROM users WHERE id = ${req.user.userId}`;
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = users[0] as any;
    let requires2FA = false;
    if (user.is_2fa_enabled) {
      const verifiedTimes = user.verified_auth_times || [];
      if (!verifiedTimes.includes(req.user.auth_time)) {
        requires2FA = true;
      }
    }
    
    // Fetch username from Firestore
    try {
      const userDoc = await firestore.collection('users').doc(req.user.uid).get();
      if (userDoc.exists) {
        user.username = userDoc.data()?.username;
      }
    } catch (fsErr) {
      console.error('Error fetching username from firestore:', fsErr);
    }
    
    res.json({ user, requires2FA });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// --- 2FA Endpoints ---
app.post('/api/2fa/generate', authenticateToken, authLimiter, async (req: any, res: any) => {
  try {
    const secret = speakeasy.generateSecret({ name: `StudyOS (${req.user.email})` });
    
    // Store temporarily in DB
    await sql`UPDATE users SET totp_secret = ${secret.base32} WHERE id = ${req.user.userId}`;
    
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    res.json({ qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    console.error('2FA generate error:', error);
    res.status(500).json({ error: 'Failed to generate 2FA secret' });
  }
});

app.post('/api/2fa/enable', authenticateToken, authLimiter, async (req: any, res: any) => {
  try {
    const { token } = req.body;
    const users = await sql`SELECT totp_secret FROM users WHERE id = ${req.user.userId}`;
    const secret = users[0].totp_secret;
    
    if (!secret) return res.status(400).json({ error: '2FA secret not generated' });

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow +/- 30 seconds
    });

    if (verified) {
      // Enable 2FA and trust this current device immediately
      const verifiedTimes = req.user.verified_auth_times || [];
      if (!verifiedTimes.includes(req.user.auth_time)) {
        verifiedTimes.push(req.user.auth_time);
      }
      
      await sql`
        UPDATE users 
        SET is_2fa_enabled = true, verified_auth_times = ${verifiedTimes}
        WHERE id = ${req.user.userId}
      `;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid 2FA code' });
    }
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

app.post('/api/2fa/verify', authenticateToken, authLimiter, async (req: any, res: any) => {
  try {
    const { token } = req.body;
    const users = await sql`SELECT totp_secret, verified_auth_times, last_used_totp FROM users WHERE id = ${req.user.userId}`;
    const secret = users[0].totp_secret;
    
    if (!secret) return res.status(400).json({ error: '2FA is not enabled' });

    // Anti-replay: reject if this exact token was already used
    if (users[0].last_used_totp && users[0].last_used_totp === token) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (verified) {
      const verifiedTimes = users[0].verified_auth_times || [];
      if (!verifiedTimes.includes(req.user.auth_time)) {
        verifiedTimes.push(req.user.auth_time);
        await sql`
          UPDATE users 
          SET verified_auth_times = ${verifiedTimes}, last_used_totp = ${token}
          WHERE id = ${req.user.userId}
        `;
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid 2FA code' });
    }
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA code' });
  }
});

// --- Exams Routes ---
app.get('/api/exams', authenticateToken, async (req: any, res: any) => {
  try {
    const exams = await sql`SELECT * FROM exams WHERE user_id = ${req.user.userId} ORDER BY date ASC`;
    res.json(exams);
  } catch (error) {
    console.error('Fetch exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});
// MED-4: Allow larger body for image uploads only
app.post('/api/exams/extract', express.json({ limit: '5mb' }), authenticateToken, aiLimiter, async (req: any, res: any) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'No image provided' });
    }
    // Limit image size to 4MB base64
    if (imageBase64.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large. Max 4MB.' });
    }

    const base64DataMatch = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    let inlineData;
    if (base64DataMatch) {
       inlineData = { mimeType: base64DataMatch[1], data: base64DataMatch[2] };
    } else {
       inlineData = { mimeType: 'image/jpeg', data: imageBase64 };
    }

    const response = await generateWithGeminiFallback({
      contents: [
        { 
          role: 'user', 
          parts: [
            { text: 'Extract the exams list from this image. Return a JSON array of objects with "name" (string) and "date" in YYYY-MM-DD format (string). Do not include any markdown, just the raw JSON array.' },
            { inlineData }
          ]
        }
      ],
      responseMimeType: "application/json"
    });
    
    const resultText = response.text || '[]';
    
    const startIndex = resultText.indexOf('[');
    const endIndex = resultText.lastIndexOf(']');
    
    let jsonStr = '[]';
    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      jsonStr = resultText.substring(startIndex, endIndex + 1);
    } else {
      jsonStr = resultText.replace(/^\s*```json/m, '').replace(/```\s*$/m, '').trim();
    }

    try {
      const exams = JSON.parse(jsonStr);
      res.json(exams);
    } catch (parseError) {
      console.error("JSON Parse Error. AI returned:", resultText);
      res.status(422).json({ error: 'AI returned invalid format. Please try a clearer image.' });
    }
  } catch (error: any) {
    // HIGH-4: Don't leak error.message to client
    console.error('Extract exams error:', error);
    res.status(500).json({ error: 'Failed to extract exams' });
  }
});

app.post('/api/exams', authenticateToken, async (req: any, res: any) => {
  try {
    const parsed = examSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { name, date, confidence } = parsed.data;
    const result = await sql`
      INSERT INTO exams (user_id, name, date, confidence) 
      VALUES (${req.user.userId}, ${name}, ${date}, ${confidence})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

app.put('/api/exams/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { confidence } = req.body;
    const result = await sql`
      UPDATE exams SET confidence = ${confidence} 
      WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

app.delete('/api/exams/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await sql`DELETE FROM exams WHERE id = ${req.params.id} AND user_id = ${req.user.userId}`;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// --- Homework Routes ---
app.get('/api/homework', authenticateToken, async (req: any, res: any) => {
  try {
    const homework = await sql`SELECT * FROM homework WHERE user_id = ${req.user.userId} ORDER BY due_date ASC`;
    res.json(homework);
  } catch (error) {
    console.error('Fetch homework error:', error);
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
});

app.post('/api/homework', authenticateToken, async (req: any, res: any) => {
  try {
    const parsed = homeworkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { title, subject, due_date } = parsed.data;
    const result = await sql`
      INSERT INTO homework (user_id, title, subject, due_date) 
      VALUES (${req.user.userId}, ${title}, ${subject}, ${due_date})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ error: 'Failed to create homework' });
  }
});

app.put('/api/homework/:id/toggle', authenticateToken, async (req: any, res: any) => {
  try {
    const { completed } = req.body;
    const result = await sql`
      UPDATE homework SET completed = ${completed} 
      WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Toggle homework error:', error);
    res.status(500).json({ error: 'Failed to update homework' });
  }
});

app.delete('/api/homework/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await sql`DELETE FROM homework WHERE id = ${req.params.id} AND user_id = ${req.user.userId}`;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ error: 'Failed to delete homework' });
  }
});

// --- Planner Routes ---
app.get('/api/planner', authenticateToken, async (req: any, res: any) => {
  try {
    const events = await sql`SELECT * FROM planner_events WHERE user_id = ${req.user.userId} ORDER BY start_time ASC`;
    res.json(events);
  } catch (error) {
    console.error('Fetch planner error:', error);
    res.status(500).json({ error: 'Failed to fetch planner events' });
  }
});

app.post('/api/planner', authenticateToken, async (req: any, res: any) => {
  try {
    const parsed = plannerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { name, start_time, end_time } = parsed.data;
    const result = await sql`
      INSERT INTO planner_events (user_id, name, start_time, end_time) 
      VALUES (${req.user.userId}, ${name}, ${start_time}, ${end_time})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create planner event error:', error);
    res.status(500).json({ error: 'Failed to create planner event' });
  }
});

app.delete('/api/planner/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await sql`DELETE FROM planner_events WHERE id = ${req.params.id} AND user_id = ${req.user.userId}`;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete planner event error:', error);
    res.status(500).json({ error: 'Failed to delete planner event' });
  }
});

// --- Merged Planner + Routine Endpoint ---
app.get('/api/planner/merged', authenticateToken, async (req: any, res: any) => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    // Fetch manual planner events
    const plannerEvents = await sql`SELECT * FROM planner_events WHERE user_id = ${req.user.userId} AND source = 'manual' ORDER BY start_time ASC`;

    // Fetch today's routine blocks
    const routines = await sql`SELECT schedule FROM routines WHERE user_id = ${req.user.userId}`;
    let routineBlocks: any[] = [];
    if (routines.length > 0 && routines[0].schedule && routines[0].schedule[todayName]) {
      routineBlocks = routines[0].schedule[todayName].map((block: any) => ({
        id: `routine-${block.id}`,
        name: block.title,
        start_time: block.start,
        end_time: block.end,
        source: 'routine',
        routine_type: block.type
      }));
    }

    // Merge and sort by start_time
    const merged = [...plannerEvents.map((e: any) => ({ ...e, source: e.source || 'manual' })), ...routineBlocks];
    merged.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

    res.json(merged);
  } catch (error) {
    console.error('Fetch merged planner error:', error);
    res.status(500).json({ error: 'Failed to fetch merged planner' });
  }
});

// --- Sync Routine → Planner ---
app.post('/api/routines/sync-planner', authenticateToken, async (req: any, res: any) => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    const routines = await sql`SELECT schedule FROM routines WHERE user_id = ${req.user.userId}`;
    if (routines.length === 0) {
      return res.json({ synced: 0 });
    }

    const schedule = routines[0].schedule;
    const todayBlocks = schedule[todayName] || [];

    // Only sync school and class type blocks
    const syncableBlocks = todayBlocks.filter((b: any) => b.type === 'school' || b.type === 'class');

    // Remove old routine-synced events for this user
    await sql`DELETE FROM planner_events WHERE user_id = ${req.user.userId} AND source = 'routine'`;

    // Insert fresh synced blocks
    let synced = 0;
    for (const block of syncableBlocks) {
      await sql`
        INSERT INTO planner_events (user_id, name, start_time, end_time, source) 
        VALUES (${req.user.userId}, ${block.title}, ${block.start}, ${block.end}, 'routine')
      `;
      synced++;
    }

    res.json({ synced, day: todayName });
  } catch (error) {
    console.error('Sync routine to planner error:', error);
    res.status(500).json({ error: 'Failed to sync routine to planner' });
  }
});

// --- Routines Routes ---
const defaultRoutine = {
  "Monday": [],
  "Tuesday": [],
  "Wednesday": [],
  "Thursday": [],
  "Friday": [],
  "Saturday": [],
  "Sunday": []
};

app.get('/api/routines', authenticateToken, async (req: any, res: any) => {
  try {
    const routines = await sql`SELECT schedule FROM routines WHERE user_id = ${req.user.userId}`;
    if (routines.length > 0) {
      res.json(routines[0].schedule);
    } else {
      res.json(defaultRoutine);
    }
  } catch (error) {
    console.error('Fetch routines error:', error);
    res.status(500).json({ error: 'Failed to fetch routines' });
  }
});

app.post('/api/routines', authenticateToken, async (req: any, res: any) => {
  try {
    const parsed = weeklyRoutineSchema.safeParse(req.body.schedule || req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const schedule = parsed.data;
    const result = await sql`
      INSERT INTO routines (user_id, schedule) 
      VALUES (${req.user.userId}, ${schedule})
      ON CONFLICT (user_id) DO UPDATE SET schedule = EXCLUDED.schedule
      RETURNING schedule
    `;
    res.json(result[0].schedule);
  } catch (error) {
    console.error('Save routines error:', error);
    res.status(500).json({ error: 'Failed to save routines' });
  }
});

app.get('/api/routines/progress', authenticateToken, async (req: any, res: any) => {
  try {
    const { date } = req.query;
    const progress = await sql`SELECT progress, notified_blocks FROM routine_progress WHERE user_id = ${req.user.userId} AND date = ${date}`;
    if (progress.length > 0) {
      res.json(progress[0].progress);
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Fetch routine progress error:', error);
    res.status(500).json({ error: 'Failed to fetch routine progress' });
  }
});

app.post('/api/routines/progress', authenticateToken, async (req: any, res: any) => {
  try {
    const { date, progress } = req.body;
    const result = await sql`
      INSERT INTO routine_progress (user_id, date, progress, notified_blocks) 
      VALUES (${req.user.userId}, ${date}, ${progress}, '[]')
      ON CONFLICT (user_id, date) DO UPDATE SET progress = EXCLUDED.progress
      RETURNING progress
    `;
    res.json(result[0].progress);
  } catch (error) {
    console.error('Save routine progress error:', error);
    res.status(500).json({ error: 'Failed to save routine progress' });
  }
});

// --- Automated Cron Emails (Missed Routines) ---
function generateICS(dateStr: string, blocks: any[], homework: any[]): string {
  const dateStrNoDash = dateStr.replace(/-/g, '');
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyOS//Agenda//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const block of blocks) {
    if (!block.start || !block.end) continue;
    const localStart = dateStrNoDash + 'T' + block.start.replace(':', '') + '00';
    const localEnd = dateStrNoDash + 'T' + block.end.replace(':', '') + '00';
    
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${Math.random().toString(36).substring(2)}@studyos.app`);
    ics.push(`DTSTAMP:${now}`);
    ics.push(`DTSTART;TZID=Asia/Kolkata:${localStart}`);
    ics.push(`DTEND;TZID=Asia/Kolkata:${localEnd}`);
    ics.push(`SUMMARY:${block.title || block.type}`);
    ics.push('END:VEVENT');
  }

  for (const hw of homework) {
    const hwDate = (hw.due_date || dateStr).replace(/-/g, '');
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${Math.random().toString(36).substring(2)}@studyos.app`);
    ics.push(`DTSTAMP:${now}`);
    ics.push(`DTSTART;VALUE=DATE:${hwDate}`);
    ics.push(`SUMMARY:Homework Due: ${hw.subject} - ${hw.title}`);
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

app.get('/api/cron/routines', async (req: any, res: any) => {
  // 1. Verify Vercel Cron Secret (constant-time comparison to prevent timing attacks)
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }
  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  try {
    const timeZone = 'Asia/Kolkata'; // Force Indian Standard Time
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone });
    
    // format YYYY-MM-DD
    const todayDate = new Date().toLocaleDateString('en-CA', { timeZone });
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone });
    const nowTimeDate = new Date(new Date().toLocaleString('en-US', { timeZone }));

    let emailsSent = 0;

    for (let i = 0; i < dbConnections.length; i++) {
      const dbInstance = dbConnections[i];
      if (!dbInstance) continue;

      try {
        // Fetch all users and their routines for this specific database shard
        const routines = await dbInstance`
          SELECT r.user_id, r.schedule, u.email 
          FROM routines r
          JOIN users u ON u.id = r.user_id
        `;

        for (const routine of routines) {
          // Process each routine inside the dbContext so that inner sql queries hit the right DB
          await dbContext.run({ email: routine.email, dbIndex: i }, async () => {
            const todayBlocks = routine.schedule[todayName] || [];
            
            // --- Morning Agenda Logic ---
            const currentHour = nowTimeDate.getHours();
            if (currentHour >= 6 && currentHour < 8) {
              const todayProgressRes = await sql`SELECT agenda_sent FROM routine_progress WHERE user_id = ${routine.user_id} AND date = ${todayDate}`;
              const agendaSent = todayProgressRes.length > 0 ? todayProgressRes[0].agenda_sent : false;

              if (!agendaSent) {
                const pendingHomework = await sql`SELECT title, subject, due_date FROM homework WHERE user_id = ${routine.user_id} AND completed = false AND due_date <= ${todayDate} ORDER BY due_date ASC`;

                if (todayBlocks.length > 0 || pendingHomework.length > 0) {
                  let homeworkHtml = '';
                  if (pendingHomework.length > 0) {
                     homeworkHtml = `
                       <h2 style="color: #4f46e5; margin-top: 24px; font-size: 18px;">📚 Pending Homework Reminder</h2>
                       <ul style="color: #374151; font-size: 16px; line-height: 1.5; padding-left: 20px;">
                         ${pendingHomework.map((h: any) => `<li style="margin-bottom: 8px;"><strong>${h.subject}:</strong> ${h.title} (Due: ${h.due_date})</li>`).join('')}
                       </ul>
                     `;
                  }

                  const blockListHtml = todayBlocks.length > 0 
                      ? `<p style="color: #374151; font-size: 16px;">Here is your schedule for today:</p>
                         <ul style="color: #374151; font-size: 16px; line-height: 1.5; padding-left: 20px;">
                           ${todayBlocks.map((b: any) => `<li style="margin-bottom: 8px;"><strong>${b.start} - ${b.end}</strong>: ${b.title}</li>`).join('')}
                         </ul>`
                      : `<p style="color: #374151; font-size: 16px;">You don't have a specific routine scheduled for today, but don't forget your pending tasks!</p>`;

                  const icsContent = generateICS(todayDate, todayBlocks, pendingHomework);

                  await sendEmailWithFallback({
                    to: routine.email,
                    subject: `☀️ Your StudyOS Agenda for Today`,
                    html: `
                      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                          <h1 style="color: #4f46e5; margin-top: 0;">Good Morning! ☀️</h1>
                          ${blockListHtml}
                          ${homeworkHtml}
                          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">Have a super productive day!<br>— The StudyOS Automation Team</p>
                        </div>
                      </div>
                    `,
                    attachments: [
                      {
                        filename: `StudyOS_Agenda_${todayDate}.ics`,
                        content: icsContent,
                        contentType: 'text/calendar'
                      }
                    ]
                  });
                  
                  if (todayProgressRes.length === 0) {
                    await sql`
                      INSERT INTO routine_progress (user_id, date, progress, notified_blocks, upcoming_notified_blocks, agenda_sent) 
                      VALUES (${routine.user_id}, ${todayDate}, '{}', '[]', '[]', true)
                      ON CONFLICT DO NOTHING
                    `;
                  } else {
                    await sql`UPDATE routine_progress SET agenda_sent = true WHERE user_id = ${routine.user_id} AND date = ${todayDate}`;
                  }
                  emailsSent++;
                }
              }
            }

            // Calculate yesterday's date & name for overnight blocks
            const yesterday = new Date();
            // Adjust yesterday using the timezone
            const formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' });
            // To get yesterday safely, just subtract 24 hours
            const yesterdayDateObj = new Date(new Date().toLocaleString('en-US', { timeZone }));
            yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
            const yesterdayName = yesterdayDateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const yesterdayDateStr = yesterdayDateObj.toLocaleDateString('en-CA');
            const yesterdayBlocks = routine.schedule[yesterdayName] || [];

            // Filter for blocks that have already ended TODAY
            const missedBlocks = todayBlocks.filter((block: any) => {
              // If overnight block (starts today, ends tomorrow), it hasn't ended today!
              if (block.start > block.end) return false;
              return block.end < nowTime;
            }).map((b: any) => ({ ...b, targetDate: todayDate })); // Tag with the date it belongs to

            // Filter for blocks starting within the next 10 minutes TODAY
            const upcomingBlocks = todayBlocks.filter((block: any) => {
              const [hours, minutes] = block.start.split(':').map(Number);
              const blockStartDate = new Date(nowTimeDate);
              blockStartDate.setHours(hours, minutes, 0, 0);
              
              const diffMs = blockStartDate.getTime() - nowTimeDate.getTime();
              const diffMins = diffMs / 60000;
              
              return diffMins > 0 && diffMins <= 10;
            });

            // Filter for overnight blocks that started YESTERDAY and ended TODAY
            const yesterdayMissedBlocks = yesterdayBlocks.filter((block: any) => {
              // Only care about overnight blocks from yesterday
              if (block.start > block.end) {
                return block.end < nowTime;
              }
              return false;
            }).map((b: any) => ({ ...b, targetDate: yesterdayDateStr })); // Belongs to yesterday's progress

            const allMissedBlocks = [...missedBlocks, ...yesterdayMissedBlocks];

            if (allMissedBlocks.length > 0 || upcomingBlocks.length > 0) {
              // Get the progress and notified blocks for this user for today and yesterday
              const todayProgressRes = await sql`SELECT progress, notified_blocks, upcoming_notified_blocks FROM routine_progress WHERE user_id = ${routine.user_id} AND date = ${todayDate}`;
              const yesterdayProgressRes = await sql`SELECT progress, notified_blocks, upcoming_notified_blocks FROM routine_progress WHERE user_id = ${routine.user_id} AND date = ${yesterdayDateStr}`;
              
              let progressMapToday = todayProgressRes.length > 0 ? (todayProgressRes[0].progress || {}) : {};
              let notifiedListToday = todayProgressRes.length > 0 ? (todayProgressRes[0].notified_blocks || []) : [];
              let upcomingNotifiedListToday = todayProgressRes.length > 0 ? (todayProgressRes[0].upcoming_notified_blocks || []) : [];
              
              let progressMapYesterday = yesterdayProgressRes.length > 0 ? (yesterdayProgressRes[0].progress || {}) : {};
              let notifiedListYesterday = yesterdayProgressRes.length > 0 ? (yesterdayProgressRes[0].notified_blocks || []) : [];

              if (todayProgressRes.length === 0 && todayBlocks.length > 0) {
                // Create empty progress row for today so we can track notifications
                await sql`
                  INSERT INTO routine_progress (user_id, date, progress, notified_blocks, upcoming_notified_blocks) 
                  VALUES (${routine.user_id}, ${todayDate}, '{}', '[]', '[]')
                  ON CONFLICT DO NOTHING
                `;
              }

              if (yesterdayProgressRes.length === 0 && yesterdayBlocks.length > 0) {
                // Create empty progress row for yesterday so we can track notifications
                await sql`
                  INSERT INTO routine_progress (user_id, date, progress, notified_blocks, upcoming_notified_blocks) 
                  VALUES (${routine.user_id}, ${yesterdayDateStr}, '{}', '[]', '[]')
                  ON CONFLICT DO NOTHING
                `;
              }

              let updatedToday = false;
              let updatedYesterday = false;

              for (const block of allMissedBlocks) {
                const isYesterday = block.targetDate === yesterdayDateStr;
                const progressMap = isYesterday ? progressMapYesterday : progressMapToday;
                const notifiedList = isYesterday ? notifiedListYesterday : notifiedListToday;

                // If block is not checked off AND we haven't notified them yet
                if (!progressMap[block.id] && !notifiedList.includes(block.id)) {
                  // Send email
                  await sendEmailWithFallback({
                    to: routine.email,
                    subject: `Missed Study Block: ${block.title}`,
                    html: `
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                          <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">StudyOS Reminder</h1>
                          </div>
                          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
                            Hi there,
                          </p>
                          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                            Your scheduled study block <strong>${block.title}</strong> (${block.start} - ${block.end}) just finished, but you haven't checked it off in StudyOS.
                          </p>
                          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                            <p style="color: #1e3a8a; margin: 0; font-weight: 500;">
                              Did you complete it? If so, don't forget to tick it off to keep your streak going!
                            </p>
                          </div>
                          <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">
                            Keep up the great work!<br>
                            — The StudyOS Automation Team
                          </p>
                        </div>
                      </div>
                    `
                  });
                  emailsSent++;
                  notifiedList.push(block.id);
                  if (isYesterday) updatedYesterday = true;
                  else updatedToday = true;
                }
              }

              // Handle upcoming block emails
              for (const block of upcomingBlocks) {
                if (!upcomingNotifiedListToday.includes(block.id)) {
                  // Generate ICS file
                  const [sHour, sMin] = block.start.split(':').map(Number);
                  const [eHour, eMin] = block.end.split(':').map(Number);
                  const startArr: ics.DateArray = [nowTimeDate.getFullYear(), nowTimeDate.getMonth() + 1, nowTimeDate.getDate(), sHour, sMin];
                  const endArr: ics.DateArray = [nowTimeDate.getFullYear(), nowTimeDate.getMonth() + 1, nowTimeDate.getDate(), eHour, eMin];
                  
                  const { error: icsError, value: icsValue } = ics.createEvent({
                    title: block.title,
                    description: 'StudyOS Scheduled Block',
                    start: startArr,
                    end: endArr,
                  });

                  // Send upcoming reminder email
                  await sendEmailWithFallback({
                    to: routine.email,
                    subject: `Upcoming: ${block.title} starts soon!`,
                    html: `
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                          <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">StudyOS Reminder</h1>
                          </div>
                          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
                            Hi there,
                          </p>
                          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                            Get ready! Your study block <strong>${block.title}</strong> is starting soon (${block.start} - ${block.end}).
                          </p>
                          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                            <p style="color: #1e3a8a; margin: 0; font-weight: 500;">
                              Grab some water, clear your desk, and get ready to crush this session!
                            </p>
                          </div>
                          <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">
                            You got this!<br>
                            — The StudyOS Automation Team
                          </p>
                        </div>
                   </div>
                    `,
                    attachments: icsValue ? [
                      {
                        filename: 'studyos-block.ics',
                        content: icsValue,
                        contentType: 'text/calendar'
                      }
                    ] : []
                  });
                  emailsSent++;
                  upcomingNotifiedListToday.push(block.id);
                  updatedToday = true;
                }
              }

              // Update the DB arrays
              if (updatedToday) {
                await sql`
                  UPDATE routine_progress 
                  SET notified_blocks = ${JSON.stringify(notifiedListToday)},
                      upcoming_notified_blocks = ${JSON.stringify(upcomingNotifiedListToday)}
                  WHERE user_id = ${routine.user_id} AND date = ${todayDate}
                `;
              }
              if (updatedYesterday) {
                await sql`
                  UPDATE routine_progress 
                  SET notified_blocks = ${JSON.stringify(notifiedListYesterday)}
                  WHERE user_id = ${routine.user_id} AND date = ${yesterdayDateStr}
                `;
              }
            }
          });
        }
      } catch (dbErr) {
        console.error("Cron skipped a db instance (possibly suspended):", dbErr);
      }
    }

    res.json({ success: true, emailsSent });
  } catch (error: any) {
    console.error('Cron Error:', error);
    res.status(500).json({ error: 'Cron job failed' });
  }
});

// --- Notes Routes ---
app.get('/api/notes', authenticateToken, async (req: any, res: any) => {
  try {
    const notes = await sql`SELECT * FROM notes WHERE user_id = ${req.user.userId} ORDER BY updated_at DESC`;
    res.json(notes);
  } catch (error) {
    console.error('Fetch notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', authenticateToken, async (req: any, res: any) => {
  try {
    const parsed = noteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { title, content, folder, tags } = parsed.data;
    const result = await sql`
      INSERT INTO notes (user_id, title, content, folder, tags) 
      VALUES (${req.user.userId}, ${title}, ${content}, ${folder}, ${JSON.stringify(tags)})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const parsed = noteUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { title, content, folder, tags } = parsed.data;
    const result = await sql`
      UPDATE notes SET title = ${title}, content = ${content}, folder = ${folder || 'General'}, tags = ${tags ? JSON.stringify(tags) : '[]'}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await sql`DELETE FROM notes WHERE id = ${req.params.id} AND user_id = ${req.user.userId}`;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// --- Analytics Routes ---
app.get('/api/analytics', authenticateToken, async (req: any, res: any) => {
  try {
    // Get last 7 days of study sessions
    const sessions = await sql`
      SELECT date, SUM(duration_minutes) as total_minutes 
      FROM study_sessions 
      WHERE user_id = ${req.user.userId}
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `;
    res.json(sessions);
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.post('/api/study_sessions', authenticateToken, async (req: any, res: any) => {
  try {
    const parsed = studySessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { duration_minutes, date } = parsed.data;
    const result = await sql`
      INSERT INTO study_sessions (user_id, duration_minutes, date) 
      VALUES (${req.user.userId}, ${duration_minutes}, ${date})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create study session error:', error);
    res.status(500).json({ error: 'Failed to log study session' });
  }
});

// --- AI Routes ---

const modelsToTry = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
  'gemma-4-4b-it'
];

async function generateWithGeminiFallback(options: {
  systemInstruction?: string,
  contents: any[],
  tools?: any[],
  responseMimeType?: string,
  specificModel?: string
}) {
  let lastError;
  const models = options.specificModel && options.specificModel !== 'auto' 
    ? [options.specificModel] 
    : modelsToTry;

  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}...`);
      
      const isGemma = model.toLowerCase().includes('gemma');
      const config: any = {
        temperature: 0.3
      };
      
      let finalContents = [...options.contents];

      if (!isGemma) {
        config.systemInstruction = options.systemInstruction;
        config.tools = options.tools;
        config.responseMimeType = options.responseMimeType;
      } else if (options.systemInstruction) {
        // Gemma models often do not support systemInstruction or tools directly
        finalContents.unshift({ role: 'model', parts: [{ text: 'Understood.' }] });
        finalContents.unshift({ role: 'user', parts: [{ text: `[System Instruction: ${options.systemInstruction}]` }] });
      }

      const response = await geminiAi.models.generateContent({
        model: model,
        contents: finalContents,
        config: config
      });
      console.log(`Success with ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini fallback models failed.");
}

const aiVisionSchema = z.object({
  imageBase64: z.string().min(1)
});

app.post('/api/ai/vision', authenticateToken, aiLimiter, async (req: any, res: any) => {
  try {
    const parsed = aiVisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { imageBase64 } = parsed.data;

    const response = await generateWithGeminiFallback({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Extract all text from this image precisely. If there are diagrams, describe them. Do not add conversational filler.' },
          {
            inlineData: {
              data: imageBase64.replace(/^data:.*?;base64,/, ''),
              mimeType: 'image/jpeg'
            }
          }
        ]
      }]
    });

    res.json({ result: response.text || 'No text extracted.' });
  } catch (error: any) {
    console.error('AI Vision Error:', error);
    res.status(500).json({ error: 'Failed to extract text from image.' });
  }
});

app.post('/api/ai/chat', authenticateToken, aiLimiter, async (req: any, res: any) => {
  try {
    const parsed = aiChatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { prompt, customSystemPrompt, userContext, providerInfo } = parsed.data;

    const baseSystemPrompt = customSystemPrompt || "You are StudyOS AI Tutor, a highly capable, versatile AI academic assistant and tutor. You can explain concepts, solve homework problems, test knowledge, and organize schedules. You have direct database tools to view and update the user's weekly routine schedule, exams, homework, planner events, study sessions, and notes. When the user asks you to split, rebalance, adjust, or edit their routine/timetable, ALWAYS use 'get_routine' to read their active routine and 'update_routine' to save the split/edited blocks directly into their database so the changes show immediately on the website.";
    const fullSystemPrompt = userContext 
      ? `${baseSystemPrompt}\n\nIf the user asks an educational or study-related question, consider that they are a student in: ${userContext}.`
      : baseSystemPrompt;

    let apiMessages: any[] = [];
    if (parsed.data.messages && parsed.data.messages.length > 0) {
      const recentMessages = parsed.data.messages.slice(-20);
      let totalChars = 0;
      const MAX_TOTAL_CHARS = 20000;
      const keptMessages = [];
      for (let i = recentMessages.length - 1; i >= 0; i--) {
        const m = recentMessages[i];
        const contentStr = m.content || "";
        if (totalChars + contentStr.length > MAX_TOTAL_CHARS) {
          const remaining = MAX_TOTAL_CHARS - totalChars;
          if (remaining > 0) {
            keptMessages.unshift({
              role: m.role === 'ai' ? 'model' : 'user',
              parts: [{ text: contentStr.slice(-remaining) }]
            });
          }
          break;
        }
        keptMessages.unshift({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: contentStr }]
        });
        totalChars += contentStr.length;
      }
      let sanitizedMessages: any[] = [];
      let currentRole = null;
      let currentParts: any[] = [];

      for (const msg of keptMessages) {
        if (!msg.parts[0]?.text || msg.parts[0].text.trim() === '') continue; // Skip empty messages

        if (msg.role === currentRole) {
          // Combine with previous message of the same role
          currentParts[0].text += '\n\n' + msg.parts[0].text;
        } else {
          if (currentRole !== null) {
            sanitizedMessages.push({ role: currentRole, parts: currentParts });
          }
          currentRole = msg.role;
          currentParts = [{ text: msg.parts[0].text }];
        }
      }
      
      if (currentRole !== null) {
        sanitizedMessages.push({ role: currentRole, parts: currentParts });
      }

      // Gemini requires the first message to be from 'user'
      if (sanitizedMessages.length > 0 && sanitizedMessages[0].role !== 'user') {
        sanitizedMessages.shift();
      }

      apiMessages = sanitizedMessages;
    } else if (prompt) {
      apiMessages.push({ role: 'user', parts: [{ text: prompt }] });
    }

    if (apiMessages.length === 0) {
      apiMessages.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    if (providerInfo && providerInfo.provider === 'nvidia') {
      const apiKey = providerInfo.apiKey;
      const model = providerInfo.model || 'nvidia/nemotron-4-340b-instruct';
      if (!apiKey) return res.status(400).json({ error: 'NVIDIA API Key required' });
      // Let's adapt Nvidia to generic OpenAI messages since it's hardcoded to integration API
      const nVidiaMessages = [{role: 'system', content: fullSystemPrompt}];
      for (const m of apiMessages) {
          nVidiaMessages.push({
             role: m.role === 'model' ? 'assistant' : 'user',
             content: m.parts[0]?.text || ''
          });
      }

      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: nVidiaMessages
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'NVIDIA NIM API Error');
      return res.json({ result: data.choices[0]?.message?.content || 'No response generated.' });
    }

    const tools = [{
      functionDeclarations: [
        {
          name: "create_note",
          description: "Creates a new study note in the user's workspace",
          parameters: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING", description: "Title of the note" },
              content: { type: "STRING", description: "Content of the note" },
              folder: { type: "STRING", description: "Folder name" },
              tags: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["title", "content"]
          }
        },
        {
          name: "create_homework",
          description: "Adds a homework assignment to the user's list",
          parameters: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING", description: "Task description" },
              subject: { type: "STRING", description: "Subject name" },
              due_date: { type: "STRING", description: "YYYY-MM-DD format" }
            },
            required: ["title", "subject", "due_date"]
          }
        },
        {
          name: "create_planner_event",
          description: "Adds an event to the user's planner/schedule",
          parameters: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Name of the event" },
              start_time: { type: "STRING", description: "HH:MM format in 24hr time" },
              end_time: { type: "STRING", description: "HH:MM format in 24hr time" }
            },
            required: ["name", "start_time", "end_time"]
          }
        },
        {
          name: "get_homework",
          description: "Gets the user's pending homework assignments",
          parameters: {
            type: "OBJECT",
            properties: {}
          }
        },
        {
          name: "get_planner_events",
          description: "Gets the user's upcoming planner events",
          parameters: {
            type: "OBJECT",
            properties: {}
          }
        },
        {
          name: "get_recent_notes",
          description: "Gets a list of the user's most recent notes",
          parameters: {
            type: "OBJECT",
            properties: {}
          }
        },
        {
          name: "update_homework_status",
          description: "Marks a homework assignment as completed or not completed",
          parameters: {
            type: "OBJECT",
            properties: {
              homework_id: { type: "NUMBER", description: "The ID of the homework to update" },
              completed: { type: "BOOLEAN", description: "True if completed, false if not" }
            },
            required: ["homework_id", "completed"]
          }
        },
        {
          name: "get_exams",
          description: "Gets the user's upcoming exams and their confidence levels",
          parameters: { type: "OBJECT", properties: {} }
        },
        {
          name: "create_exam",
          description: "Adds a new exam to the user's tracker",
          parameters: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Name/subject of the exam" },
              date: { type: "STRING", description: "YYYY-MM-DD format" },
              confidence: { type: "NUMBER", description: "Confidence level from 0 to 100" }
            },
            required: ["name", "date"]
          }
        },
        {
          name: "update_exam_confidence",
          description: "Updates the user's confidence level for an exam",
          parameters: {
            type: "OBJECT",
            properties: {
              exam_id: { type: "NUMBER", description: "The ID of the exam" },
              confidence: { type: "NUMBER", description: "New confidence level from 0 to 100" }
            },
            required: ["exam_id", "confidence"]
          }
        },
        {
          name: "log_study_session",
          description: "Logs a completed study session with its duration in minutes",
          parameters: {
            type: "OBJECT",
            properties: {
              duration_minutes: { type: "NUMBER", description: "Duration in minutes" }
            },
            required: ["duration_minutes"]
          }
        },
        {
          name: "get_weak_topics",
          description: "Gets the user's weakest topics from their Knowledge DNA (topics with low mastery)",
          parameters: { type: "OBJECT", properties: {} }
        },
        {
          name: "get_routine",
          description: "Gets the user's weekly routine schedule timetable containing all activities, school, tuitions, study sessions, breaks, and sleep blocks with their start and end times for all days or a specific day.",
          parameters: {
            type: "OBJECT",
            properties: {
              day: { type: "STRING", description: "Optional day of the week ('Monday', 'Tuesday', etc.). If omitted, returns all 7 days." }
            }
          }
        },
        {
          name: "update_routine",
          description: "Updates, splits, or rebalances blocks in the user's weekly routine schedule directly in their database. Can update one or more days. Each day is an array of blocks: { id, title, start (HH:MM), end (HH:MM), type ('school'|'study'|'class'|'break'|'sleep') }.",
          parameters: {
            type: "OBJECT",
            properties: {
              schedule: {
                type: "OBJECT",
                description: "Object where keys are days of the week ('Monday', 'Tuesday', ...) and values are arrays of blocks [{ id, title, start, end, type }]."
              }
            },
            required: ["schedule"]
          }
        }
      ]
    }];

    let response = await generateWithGeminiFallback({
      systemInstruction: fullSystemPrompt,
      contents: apiMessages,
      tools: tools,
      specificModel: providerInfo?.model
    });

    let maxToolTurns = 5;
    let turnCount = 0;
    const executedTools: string[] = [];

    while (turnCount < maxToolTurns) {
      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        break;
      }
      turnCount++;

      // Add the model's response to history
      apiMessages.push({
        role: "model",
        parts: response.candidates?.[0]?.content?.parts || []
      });

      const functionResponses: any[] = [];
      
      for (const toolCall of functionCalls) {
        executedTools.push(toolCall.name);
        try {
          const args: any = toolCall.args || {};
          if (toolCall.name === 'create_note') {
            await sql`INSERT INTO notes (user_id, title, content, folder, tags) VALUES (${req.user.userId}, ${args.title as string}, ${args.content as string}, ${(args.folder as string) || 'General'}, ${JSON.stringify(args.tags || [])})`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { message: "Note created successfully." } }
            });
          } else if (toolCall.name === 'create_homework') {
            await sql`INSERT INTO homework (user_id, title, subject, due_date) VALUES (${req.user.userId}, ${args.title as string}, ${args.subject as string}, ${args.due_date as string})`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { message: "Homework added successfully." } }
            });
          } else if (toolCall.name === 'create_planner_event') {
            await sql`INSERT INTO planner_events (user_id, name, start_time, end_time, source) VALUES (${req.user.userId}, ${args.name as string}, ${args.start_time as string}, ${args.end_time as string}, 'ai')`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { message: "Planner event added successfully." } }
            });
          } else if (toolCall.name === 'get_homework') {
            const hw = await sql`SELECT id, title, subject, due_date FROM homework WHERE user_id = ${req.user.userId} AND completed = false ORDER BY due_date ASC LIMIT 10`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { homework: hw } }
            });
          } else if (toolCall.name === 'get_planner_events') {
            const events = await sql`SELECT id, name, start_time, end_time FROM planner_events WHERE user_id = ${req.user.userId} ORDER BY start_time ASC LIMIT 10`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { events: events } }
            });
          } else if (toolCall.name === 'get_recent_notes') {
            const notes = await sql`SELECT id, title, folder, created_at FROM notes WHERE user_id = ${req.user.userId} ORDER BY created_at DESC LIMIT 5`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { notes: notes } }
            });
          } else if (toolCall.name === 'update_homework_status') {
            await sql`UPDATE homework SET completed = ${args.completed as boolean} WHERE id = ${args.homework_id as number} AND user_id = ${req.user.userId}`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { message: "Homework status updated." } }
            });
          } else if (toolCall.name === 'get_exams') {
            const exams = await sql`SELECT id, name, date, confidence FROM exams WHERE user_id = ${req.user.userId} ORDER BY date ASC LIMIT 10`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { exams: exams } }
            });
          } else if (toolCall.name === 'create_exam') {
            await sql`INSERT INTO exams (user_id, name, date, confidence) VALUES (${req.user.userId}, ${args.name as string}, ${args.date as string}, ${args.confidence as number || 50})`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { message: "Exam created successfully." } }
            });
          } else if (toolCall.name === 'update_exam_confidence') {
            await sql`UPDATE exams SET confidence = ${args.confidence as number} WHERE id = ${args.exam_id as number} AND user_id = ${req.user.userId}`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { message: "Exam confidence updated." } }
            });
          } else if (toolCall.name === 'log_study_session') {
            const dateStr = new Date().toISOString().split('T')[0];
            await sql`INSERT INTO study_sessions (user_id, duration_minutes, date) VALUES (${req.user.userId}, ${args.duration_minutes as number}, ${dateStr})`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { message: "Study session logged successfully." } }
            });
          } else if (toolCall.name === 'get_weak_topics') {
            const weakTopics = await sql`SELECT id, concept_name, mastery_level FROM knowledge_dna WHERE user_id = ${req.user.userId} ORDER BY mastery_level ASC LIMIT 5`;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { weak_topics: weakTopics } }
            });
          } else if (toolCall.name === 'get_routine') {
            const routines = await sql`SELECT schedule FROM routines WHERE user_id = ${req.user.userId}`;
            const userSchedule = (routines.length > 0 && routines[0].schedule) ? routines[0].schedule : defaultRoutine;
            const dayArg = args.day ? (args.day.charAt(0).toUpperCase() + args.day.slice(1).toLowerCase()) : null;
            const resultData = dayArg && userSchedule[dayArg] ? { [dayArg]: userSchedule[dayArg] } : userSchedule;
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { routine: resultData } }
            });
          } else if (toolCall.name === 'update_routine') {
            const currentRoutines = await sql`SELECT schedule FROM routines WHERE user_id = ${req.user.userId}`;
            let baseSchedule = (currentRoutines.length > 0 && currentRoutines[0].schedule) ? { ...currentRoutines[0].schedule } : { ...defaultRoutine };

            const incomingSchedule = args.schedule || {};
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const updatedDays: string[] = [];

            for (const key of Object.keys(incomingSchedule)) {
              const capitalizedDay = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
              if (validDays.includes(capitalizedDay) && Array.isArray(incomingSchedule[key])) {
                baseSchedule[capitalizedDay] = incomingSchedule[key].map((block: any, idx: number) => ({
                  id: block.id || `${capitalizedDay.toLowerCase().slice(0, 3)}-${Date.now()}-${idx}`,
                  title: String(block.title || 'Study Block'),
                  start: String(block.start || '00:00'),
                  end: String(block.end || '00:00'),
                  type: String(block.type || 'study')
                })).sort((a: any, b: any) => a.start.localeCompare(b.start));
                updatedDays.push(capitalizedDay);
              }
            }

            await sql`
              INSERT INTO routines (user_id, schedule) 
              VALUES (${req.user.userId}, ${baseSchedule})
              ON CONFLICT (user_id) DO UPDATE SET schedule = EXCLUDED.schedule
            `;

            // Automatically sync school/class blocks for today to planner
            try {
              const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const todayName = daysOfWeek[new Date().getDay()];
              const todayBlocks = baseSchedule[todayName] || [];
              const syncableBlocks = todayBlocks.filter((b: any) => b.type === 'school' || b.type === 'class');
              await sql`DELETE FROM planner_events WHERE user_id = ${req.user.userId} AND source = 'routine'`;
              for (const block of syncableBlocks) {
                await sql`
                  INSERT INTO planner_events (user_id, name, start_time, end_time, source) 
                  VALUES (${req.user.userId}, ${block.title}, ${block.start}, ${block.end}, 'routine')
                `;
              }
            } catch (syncErr) {
              console.warn('Sync routine to planner warning:', syncErr);
            }

            functionResponses.push({
              functionResponse: {
                name: toolCall.name,
                response: {
                  success: true,
                  message: "Routine updated in database and synced to planner successfully.",
                  updatedDays
                }
              }
            });
          } else {
            functionResponses.push({
              functionResponse: { name: toolCall.name, response: { error: "Unknown tool." } }
            });
          }
        } catch (e: any) {
          console.error('Tool execution error:', e);
          functionResponses.push({
             functionResponse: { name: toolCall.name, response: { error: "Tool execution failed." } }
          });
        }
      }
      
      apiMessages.push({
          role: "user",
          parts: functionResponses
      });
      
      response = await generateWithGeminiFallback({
        systemInstruction: fullSystemPrompt,
        contents: apiMessages,
        tools: tools,
        specificModel: providerInfo?.model
      });
    }

    let finalAnswer = response.text?.trim();
    if (!finalAnswer && response.candidates?.[0]?.content?.parts) {
      finalAnswer = response.candidates[0].content.parts
        .filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join('\n')
        .trim();
    }

    if (!finalAnswer) {
      if (executedTools.length > 0) {
        finalAnswer = `I have completed your request (${executedTools.join(', ')}). Your routine and schedule have been updated in your account.`;
      } else {
        finalAnswer = 'How can I assist you with your studies or schedule today?';
      }
    }

    res.json({ result: finalAnswer });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to connect to AI service. Please try again.' });
  }
});

app.post('/api/ai/flashcards', authenticateToken, aiLimiter, async (req: any, res: any) => {
  try {
    const { content, userContext } = req.body;
    const prompt = `Generate 3-5 flashcards based on these notes:\n\n${content}`;
    const fullSystemPrompt = userContext 
      ? `You are an AI that generates educational flashcards from study notes. The user is in: ${userContext}. Ensure flashcards are appropriate for this grade level. Return ONLY a valid JSON array of objects with "front" and "back" string properties.`
      : `You are an AI that generates educational flashcards from study notes. Return ONLY a valid JSON array of objects with "front" and "back" string properties.`;

    const response = await generateWithGeminiFallback({
      systemInstruction: fullSystemPrompt,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      responseMimeType: "application/json"
    });

    const resultText = response.text || '[]';
    res.json(JSON.parse(resultText));
  } catch (error) {
    console.error("Gemini API Error during flashcard generation:", error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

app.post('/api/ai/quiz', authenticateToken, aiLimiter, async (req: any, res: any) => {
  try {
    const { content, userContext } = req.body;
    const prompt = `Generate a 5-question multiple-choice quiz based on these notes:\n\n${content}`;
    const fullSystemPrompt = userContext 
      ? `You are an AI that generates multiple-choice quizzes from study notes. The user is in: ${userContext}. Ensure the quiz is appropriate for this grade level. Return ONLY a valid JSON array of objects. Each object must have: "question" (string), "options" (array of 4 strings), "correctAnswer" (string, exact match to one of the options), and "explanation" (string).`
      : `You are an AI that generates multiple-choice quizzes from study notes. Return ONLY a valid JSON array of objects. Each object must have: "question" (string), "options" (array of 4 strings), "correctAnswer" (string, exact match to one of the options), and "explanation" (string).`;

    const response = await generateWithGeminiFallback({
      systemInstruction: fullSystemPrompt,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      responseMimeType: "application/json"
    });

    const resultText = response.text || '[]';
    res.json(JSON.parse(resultText));
  } catch (error) {
    console.error("Gemini API Error during quiz generation:", error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

app.post('/api/ai/gemini-vision', authenticateToken, aiLimiter, async (req: any, res: any) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const parts: any[] = [
      { text: "Extract all the visible text from this document accurately. IMPORTANT: This document may contain a corrupted text layer or repeated watermarks (e.g., 'PARVEJ MALLIK'). YOU MUST COMPLETELY IGNORE the embedded text layer and watermarks. Rely ONLY on the visual image of the pages to extract the actual meaningful content (like questions, answers, headers). Maintain formatting if possible. Do not include watermarks in the output." }
    ];

    for (const img of images) {
      if (img.base64Data && img.mimeType) {
        parts.push({
          inlineData: {
            data: img.base64Data.replace(/^data:.*?;base64,/, ''),
            mimeType: img.mimeType
          }
        });
      }
    }

    const response = await generateWithGeminiFallback({
      contents: [{ role: 'user', parts: parts }]
    });

    res.json({ result: response.text || 'No text could be extracted.' });
  } catch (error: any) {
    console.error("Gemini Vision API Error:", error);
    res.status(500).json({ error: 'Failed to process document/image', details: error.message });
  }
});

app.post('/api/ai/extract-routine', authenticateToken, aiLimiter, async (req: any, res: any) => {
  try {
    const { rawData } = req.body;
    if (!rawData || typeof rawData !== 'string' || rawData.trim().length === 0) {
      return res.status(400).json({ error: 'No data provided to extract from.' });
    }

    const systemPrompt = `You are a schedule extraction engine. The user will paste raw data in any format — it could be:
- A JSON object or array (possibly from a database query)
- A SQL query result or INSERT statements
- A CSV or table
- A plain text description like "I wake up at 7am, go to school at 8, study from 3-5pm..."
- Or any other format

Your job: Extract a weekly routine schedule from this data and return it as a strict JSON object.

OUTPUT FORMAT (return ONLY this JSON, no markdown, no explanation):
{
  "Monday": [
    { "id": "mon-1", "title": "Activity Name", "start": "HH:MM", "end": "HH:MM", "type": "study" }
  ],
  "Tuesday": [...],
  "Wednesday": [...],
  "Thursday": [...],
  "Friday": [...],
  "Saturday": [...],
  "Sunday": [...]
}

RULES:
- "type" should broadly categorize the activity. Use any relevant category: "school", "study", "class", "break", "sleep", "meal", "travel", "hobbies", "exercise", "chill", "chores", "work", "morning-routine", "night-routine", etc.
- "start" and "end" must be in 24-hour HH:MM format
- "id" should be a unique string per block (e.g. "mon-1", "tue-2")
- Sort blocks by start time within each day
- Keep durations realistic. For example, "Wake Up" should be a short event or bundled into a "morning-routine", don't make a single "Wake up" block last for 2 hours!
- Break up large, vague chunks of time into logical, distinct blocks.
- If data only describes some days, leave other days as empty arrays []
- If the data describes a single day's pattern, replicate it across all weekdays unless context says otherwise
- If the input is already valid routine JSON, clean it up and return it in the correct format`;

    const response = await generateWithGeminiFallback({
      systemInstruction: systemPrompt,
      contents: [{ role: 'user', parts: [{ text: rawData }] }],
      responseMimeType: "application/json"
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hasDays = validDays.some(day => Array.isArray(parsed[day]));
    if (!hasDays) {
      return res.status(422).json({ error: 'AI could not extract a valid routine from the provided data. Try providing more structured input.' });
    }

    const schedule: Record<string, any[]> = {};
    for (const day of validDays) {
      schedule[day] = Array.isArray(parsed[day]) ? parsed[day] : [];
    }

    res.json({ schedule });
  } catch (error: any) {
    console.error("AI Routine Extraction Error:", error);
    if (error instanceof SyntaxError) {
      return res.status(422).json({ error: 'AI returned an invalid response. Please try again with clearer data.' });
    }
    res.status(500).json({ error: 'Failed to extract routine. Please try again.' });
  }
});

// --- Knowledge DNA Routes ---
app.get('/api/dna', authenticateToken, async (req: any, res: any) => {
  try {
    const dna = await sql`SELECT * FROM knowledge_dna WHERE user_id = ${req.user.userId}`;
    res.json(dna);
  } catch (error) {
    console.error('Fetch DNA error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge DNA' });
  }
});

app.delete('/api/dna/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const result = await sql`
      DELETE FROM knowledge_dna 
      WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: 'DNA gene not found' });
    }
    res.json({ message: 'Gene deleted successfully' });
  } catch (error) {
    console.error('Delete DNA error:', error);
    res.status(500).json({ error: 'Failed to delete knowledge DNA' });
  }
});

app.post('/api/dna/compile', authenticateToken, async (req: any, res: any) => {
  try {
    const { content, source_id } = req.body;
    
    const prompt = `Extract the core educational concepts from this text and map their "Knowledge DNA". 
Each object MUST have these EXACT keys and types:
- "concept_name" (string)
- "requires" (array of strings: names of prerequisite concepts)
- "leads_to" (array of strings: concepts this enables)
- "abstractness" (number 0.0 to 1.0: how abstract it is)
- "calculation_load" (number 0.0 to 1.0: how much math/logic is needed)
- "visualization_need" (number 0.0 to 1.0: how much visual spatial thinking is needed)
- "memory_difficulty" (number 0.0 to 1.0: how hard it is to memorize)
- "misconceptions" (array of strings: common pitfalls)
- "real_world_uses" (array of strings: practical applications)

Text to compile:
${content}`;

    const response = await generateWithGeminiFallback({
      systemInstruction: 'You are a Cognitive Compiler. Extract genetic knowledge concepts purely as JSON.',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      responseMimeType: "application/json"
    });

    const resultText = response.text || '[]';
    const concepts = JSON.parse(resultText);

    const insertedConcepts = [];
    for (const concept of concepts) {
      const result = await sql`
        INSERT INTO knowledge_dna (
          user_id, source_id, concept_name, requires, leads_to, 
          abstractness, calculation_load, visualization_need, memory_difficulty, 
          misconceptions, real_world_uses
        ) VALUES (
          ${req.user.userId}, ${source_id || null}, ${concept.concept_name}, 
          ${JSON.stringify(concept.requires || [])}, ${JSON.stringify(concept.leads_to || [])},
          ${concept.abstractness || 0.5}, ${concept.calculation_load || 0.5}, 
          ${concept.visualization_need || 0.5}, ${concept.memory_difficulty || 0.5},
          ${JSON.stringify(concept.misconceptions || [])}, ${JSON.stringify(concept.real_world_uses || [])}
        )
        RETURNING *
      `;
      insertedConcepts.push(result[0]);
    }

    res.status(201).json(insertedConcepts);
  } catch (error) {
    console.error("Gemini DNA Compile Error:", error);
    res.status(500).json({ error: 'Failed to compile Knowledge DNA' });
  }
});


// Do not listen on a port when running on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
  // Keep the event loop alive in development
  setInterval(() => {}, 1000 * 60 * 60);
}

// Export the app for Vercel serverless function
export default app;
