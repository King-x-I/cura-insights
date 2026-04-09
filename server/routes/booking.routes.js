const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// POST /api/bookings
router.post('/', requireAuth, (req, res) => {
  try {
    const data = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO bookings (id, consumer_id, provider_id, service_type, booking_status, payment_status,
        payment_method, location_pickup, location_drop, price_estimate, date_time, service_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.consumer_id, data.provider_id || null, data.service_type,
      data.booking_status || 'finding_provider', data.payment_status || 'pending',
      data.payment_method || null, data.location_pickup || null, data.location_drop || null,
      data.price_estimate || null, data.date_time, 
      typeof data.service_details === 'object' ? JSON.stringify(data.service_details) : data.service_details
    );

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    // Parse service_details back
    if (booking.service_details) {
      try { booking.service_details = JSON.parse(booking.service_details); } catch {}
    }
    res.json({ data: booking, error: null });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/bookings/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (booking && booking.service_details) {
      try { booking.service_details = JSON.parse(booking.service_details); } catch {}
    }
    res.json({ data: booking || null, error: booking ? null : { message: 'Not found' } });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/bookings/active/:userId
router.get('/active/:userId', requireAuth, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, pd.full_name as provider_name, pd.phone as provider_phone, pd.profile_picture as provider_picture
      FROM bookings b
      LEFT JOIN provider_details pd ON b.provider_id = pd.id
      WHERE b.consumer_id = ? AND b.booking_status IN ('finding_provider', 'provider_assigned')
      ORDER BY b.date_time ASC
    `).all(req.params.userId);

    bookings.forEach(b => {
      if (b.service_details) {
        try { b.service_details = JSON.parse(b.service_details); } catch {}
      }
      // Attach provider_details in same shape as Supabase join
      if (b.provider_name) {
        b.provider_details = {
          full_name: b.provider_name,
          phone: b.provider_phone,
          profile_picture: b.provider_picture
        };
      }
      delete b.provider_name; delete b.provider_phone; delete b.provider_picture;
    });

    res.json({ data: bookings, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/bookings/recent/:userId
router.get('/recent/:userId', requireAuth, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM bookings 
      WHERE consumer_id = ? AND booking_status IN ('completed', 'cancelled')
      ORDER BY date_time DESC LIMIT 5
    `).all(req.params.userId);

    bookings.forEach(b => {
      if (b.service_details) {
        try { b.service_details = JSON.parse(b.service_details); } catch {}
      }
    });

    res.json({ data: bookings, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/bookings/provider/:userId - bookings for a provider
router.get('/provider/:userId', requireAuth, (req, res) => {
  try {
    // Get provider's provider_details.id first
    const provider = db.prepare('SELECT id FROM provider_details WHERE user_id = ?').get(req.params.userId);
    if (!provider) {
      return res.json({ data: [], error: null });
    }

    const bookings = db.prepare(`
      SELECT b.*, cd.full_name as consumer_name, cd.phone as consumer_phone
      FROM bookings b
      LEFT JOIN consumer_details cd ON b.consumer_id = cd.user_id
      WHERE b.provider_id = ?
      ORDER BY b.created_at DESC
    `).all(provider.id);

    bookings.forEach(b => {
      if (b.service_details) {
        try { b.service_details = JSON.parse(b.service_details); } catch {}
      }
    });

    res.json({ data: bookings, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/bookings/:id/accept
router.put('/:id/accept', requireAuth, (req, res) => {
  try {
    const provider = db.prepare('SELECT * FROM provider_details WHERE user_id = ?').get(req.user.id);
    if (!provider) {
      return res.status(400).json({ error: 'Provider profile not found' });
    }

    const result = db.prepare(`
      UPDATE bookings SET provider_id = ?, booking_status = 'provider_assigned'
      WHERE id = ? AND booking_status = 'finding_provider'
    `).run(provider.id, req.params.id);

    if (result.changes === 0) {
      return res.status(400).json({ error: 'Booking not found or already accepted' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (booking && booking.service_details) {
      try { booking.service_details = JSON.parse(booking.service_details); } catch {}
    }
    res.json({ data: booking, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/bookings/:id/complete
router.put('/:id/complete', requireAuth, (req, res) => {
  try {
    db.prepare(`
      UPDATE bookings SET booking_status = 'completed', payment_status = 'pending'
      WHERE id = ? AND booking_status = 'provider_assigned'
    `).run(req.params.id);

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json({ data: booking, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', requireAuth, (req, res) => {
  try {
    db.prepare(`UPDATE bookings SET booking_status = 'cancelled' WHERE id = ?`).run(req.params.id);
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json({ data: booking, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

module.exports = router;
