const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// GET /api/requests/pending
router.get('/pending', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM requests WHERE status = ? ORDER BY created_at DESC'
    ).all('pending');

    rows.forEach(r => {
      if (r.details) {
        try { r.details = JSON.parse(r.details); } catch {}
      }
    });
    
    res.json({ data: rows, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// POST /api/requests
router.post('/', requireAuth, (req, res) => {
  try {
    const data = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO requests (id, customer_id, service_type, location, status, details)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(
      id, data.customer_id, data.service_type, data.location || null,
      typeof data.details === 'object' ? JSON.stringify(data.details) : data.details || null
    );

    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    res.json({ data: request, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/requests/:id/accept
router.put('/:id/accept', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE requests SET status = ?, provider_id = ? WHERE id = ?')
      .run('accepted', req.user.id, req.params.id);
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/requests/:id/decline
router.put('/:id/decline', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE requests SET status = ? WHERE id = ?').run('declined', req.params.id);
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

module.exports = router;
