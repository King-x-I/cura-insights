const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// POST /api/location - upsert location
router.post('/', requireAuth, (req, res) => {
  try {
    const { user_id, booking_id, latitude, longitude, accuracy } = req.body;

    const existing = db.prepare(
      'SELECT id FROM location_tracking WHERE user_id = ? AND booking_id = ?'
    ).get(user_id, booking_id);

    if (existing) {
      db.prepare(`
        UPDATE location_tracking SET latitude = ?, longitude = ?, accuracy = ?, updated_at = datetime('now')
        WHERE user_id = ? AND booking_id = ?
      `).run(latitude, longitude, accuracy || null, user_id, booking_id);
    } else {
      db.prepare(`
        INSERT INTO location_tracking (id, user_id, booking_id, latitude, longitude, accuracy)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), user_id, booking_id, latitude, longitude, accuracy || null);
    }

    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/location/:userId/:bookingId
router.get('/:userId/:bookingId', requireAuth, (req, res) => {
  try {
    const row = db.prepare(
      'SELECT * FROM location_tracking WHERE user_id = ? AND booking_id = ?'
    ).get(req.params.userId, req.params.bookingId);

    res.json({ data: row || null, error: row ? null : { message: 'Not found' } });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

module.exports = router;
