const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// GET /api/consumer/:userId
router.get('/:userId', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM consumer_details WHERE user_id = ?').get(req.params.userId);
    if (!row) {
      return res.json({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });
    }
    res.json({ data: row, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/consumer/:userId
router.put('/:userId', requireAuth, (req, res) => {
  try {
    const updates = req.body;
    delete updates.id;
    delete updates.user_id;
    updates.updated_at = new Date().toISOString();

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.json({ data: null, error: { message: 'No fields to update' } });
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    db.prepare(`UPDATE consumer_details SET ${setClause} WHERE user_id = ?`).run(...values, req.params.userId);
    
    const updated = db.prepare('SELECT * FROM consumer_details WHERE user_id = ?').get(req.params.userId);
    res.json({ data: updated, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// DELETE /api/consumer/:userId
router.delete('/:userId', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM consumer_details WHERE user_id = ?').run(req.params.userId);
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

module.exports = router;
