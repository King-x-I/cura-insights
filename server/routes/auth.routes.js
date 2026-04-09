const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateToken } = require('../auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, userType } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered' });
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const metadata = JSON.stringify({ full_name: fullName, user_type: userType || 'consumer' });

    db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, user_type, user_metadata) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, email, passwordHash, fullName || email.split('@')[0], userType || 'consumer', metadata);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const token = generateToken(user);

    // Auto-create consumer profile if consumer
    if (userType === 'consumer' || !userType) {
      db.prepare(
        `INSERT OR IGNORE INTO consumer_details (id, user_id, full_name, email) VALUES (?, ?, ?, ?)`
      ).run(uuidv4(), userId, fullName || email.split('@')[0], email);
    }

    res.json({
      data: {
        user: {
          id: userId,
          email: user.email,
          user_metadata: JSON.parse(user.user_metadata || '{}'),
          created_at: user.created_at
        },
        session: {
          access_token: token,
          user: {
            id: userId,
            email: user.email,
            user_metadata: JSON.parse(user.user_metadata || '{}')
          }
        }
      },
      error: null
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const token = generateToken(user);

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: JSON.parse(user.user_metadata || '{}'),
          created_at: user.created_at
        },
        session: {
          access_token: token,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: JSON.parse(user.user_metadata || '{}')
          }
        }
      },
      error: null
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.json({ data: { user: null }, error: null });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.json({ data: { user: null }, error: null });
  }

  res.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: JSON.parse(user.user_metadata || '{}'),
        created_at: user.created_at
      }
    },
    error: null
  });
});

// GET /api/auth/session
router.get('/session', (req, res) => {
  if (!req.user) {
    return res.json({ data: { session: null }, error: null });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.json({ data: { session: null }, error: null });
  }

  const token = generateToken(user);
  res.json({
    data: {
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: JSON.parse(user.user_metadata || '{}')
        }
      }
    },
    error: null
  });
});

// PUT /api/auth/update
router.put('/update', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data } = req.body;
    if (data) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      const currentMeta = JSON.parse(user.user_metadata || '{}');
      const newMeta = { ...currentMeta, ...data };
      
      // If user_type is in the metadata update, also update the user_type column
      if (data.user_type) {
        db.prepare('UPDATE users SET user_metadata = ?, user_type = ?, updated_at = datetime("now") WHERE id = ?')
          .run(JSON.stringify(newMeta), data.user_type, req.user.id);
      } else {
        db.prepare('UPDATE users SET user_metadata = ?, updated_at = datetime("now") WHERE id = ?')
          .run(JSON.stringify(newMeta), req.user.id);
      }
    }

    res.json({ data: {}, error: null });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
