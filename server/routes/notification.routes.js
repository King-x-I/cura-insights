const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// GET /api/notifications/:userId
router.get('/:userId', requireAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const rows = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(req.params.userId, limit);
    
    rows.forEach(r => { r.seen = !!r.seen; });
    res.json({ data: rows, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// POST /api/notifications
router.post('/', requireAuth, (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, message, type, booking_id, seen)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(uuidv4(), item.user_id, item.message, item.type || null, item.booking_id || null);
      }
    });

    insertMany(items);
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/notifications/:id/seen
router.put('/:id/seen', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET seen = 1 WHERE id = ?').run(req.params.id);
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

module.exports = router;
