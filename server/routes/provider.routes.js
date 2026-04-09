const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// POST /api/provider/signup
router.post('/signup', requireAuth, (req, res) => {
  try {
    const data = req.body;
    const userId = req.user.id;

    // Check if profile already exists
    const existing = db.prepare('SELECT id FROM provider_details WHERE user_id = ?').get(userId);
    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO provider_details (
        id, user_id, full_name, email, phone, address, service_type,
        experience_years, skills, govt_id_url, license_url, profile_picture,
        languages, id_type, id_number, driving_license_number, vehicle_type,
        license_expiry_date, working_hours_from, working_hours_to,
        bank_account_name, bank_account_number, ifsc_code, upi_id,
        resume_url, status, is_online
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)
    `).run(
      id, userId, data.full_name, data.email, data.phone, data.address,
      data.service_type, data.experience_years, 
      Array.isArray(data.skills) ? data.skills.join(',') : data.skills,
      data.govt_id_url, data.license_url, data.profile_picture,
      Array.isArray(data.languages) ? data.languages.join(',') : data.languages,
      data.id_type, data.id_number, data.driving_license_number,
      data.vehicle_type, data.license_expiry_date, data.working_hours_from,
      data.working_hours_to, data.bank_account_name, data.bank_account_number,
      data.ifsc_code, data.upi_id, data.resume_url
    );

    const inserted = db.prepare('SELECT * FROM provider_details WHERE id = ?').get(id);
    res.json({ success: true, data: inserted });
  } catch (err) {
    console.error('Provider signup error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/provider/details/:userId
router.get('/details/:userId', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM provider_details WHERE user_id = ?').get(req.params.userId);
    if (!row) {
      return res.json({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });
    }
    // Convert integer booleans to actual booleans
    row.is_online = !!row.is_online;
    row.is_approved = !!row.is_approved;
    res.json({ data: row, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/provider/status/:userId
router.get('/status/:userId', (req, res) => {
  try {
    const row = db.prepare('SELECT status, is_online FROM provider_details WHERE user_id = ?').get(req.params.userId);
    if (!row) {
      return res.json({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });
    }
    row.is_online = !!row.is_online;
    res.json({ data: row, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/provider/details/:userId
router.put('/details/:userId', requireAuth, (req, res) => {
  try {
    const updates = req.body;
    delete updates.id;
    delete updates.user_id;
    updates.updated_at = new Date().toISOString();

    // Convert boolean to integer for SQLite
    if ('is_online' in updates) updates.is_online = updates.is_online ? 1 : 0;
    if ('is_approved' in updates) updates.is_approved = updates.is_approved ? 1 : 0;

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.json({ data: null, error: { message: 'No fields to update' } });
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    db.prepare(`UPDATE provider_details SET ${setClause} WHERE user_id = ?`).run(...values, req.params.userId);
    
    const updated = db.prepare('SELECT * FROM provider_details WHERE user_id = ?').get(req.params.userId);
    if (updated) {
      updated.is_online = !!updated.is_online;
      updated.is_approved = !!updated.is_approved;
    }
    res.json({ data: updated, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/providers/pending
router.get('/list/pending', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM provider_details WHERE status = ? ORDER BY created_at DESC').all('pending');
    rows.forEach(r => { r.is_online = !!r.is_online; r.is_approved = !!r.is_approved; });
    res.json({ data: rows, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/provider/approve/:userId
router.put('/approve/:userId', requireAuth, (req, res) => {
  try {
    const { approved } = req.body;
    const status = approved ? 'approved' : 'rejected';
    db.prepare('UPDATE provider_details SET status = ?, updated_at = datetime("now") WHERE user_id = ?')
      .run(status, req.params.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
