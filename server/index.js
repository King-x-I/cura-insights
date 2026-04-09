const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('./auth');

// Initialize database (creates tables)
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// Generic query endpoint (mimics Supabase PostgREST)
// This handles the api.from(table).select().eq().etc chain
// ============================================
app.post('/api/query', (req, res) => {
  try {
    const { table, operation, data, filters, select, order, limit: queryLimit, single, maybeSingle } = req.body;

    // Validate table name (whitelist)
    const allowedTables = [
      'consumer_details', 'provider_details', 'bookings', 
      'notifications', 'requests', 'payments', 'location_tracking',
      'driver_booking_requests'
    ];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ data: null, error: { message: `Table '${table}' not allowed` } });
    }

    if (operation === 'SELECT') {
      // Clean Supabase-style join syntax from select (e.g. "*, table:column(fields)")
      // SQLite doesn't support PostgREST foreign key joins
      let cleanSelect = (select || '*').replace(/,?\s*\w+:\w+\([^)]*\)/g, '').trim();
      if (!cleanSelect || cleanSelect === ',') cleanSelect = '*';
      // Remove trailing/leading commas
      cleanSelect = cleanSelect.replace(/^,\s*/, '').replace(/,\s*$/, '');
      
      let query = `SELECT ${cleanSelect} FROM ${table}`;
      const params = [];

      // Build WHERE clause from filters
      if (filters && filters.length > 0) {
        const conditions = filters.map(f => {
          if (f.operator === 'eq') {
            params.push(f.value);
            return `${f.column} = ?`;
          } else if (f.operator === 'in') {
            const placeholders = f.value.map(() => '?').join(', ');
            params.push(...f.value);
            return `${f.column} IN (${placeholders})`;
          } else if (f.operator === 'neq') {
            params.push(f.value);
            return `${f.column} != ?`;
          } else if (f.operator === 'gt') {
            params.push(f.value);
            return `${f.column} > ?`;
          } else if (f.operator === 'lt') {
            params.push(f.value);
            return `${f.column} < ?`;
          }
          return null;
        }).filter(Boolean);
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      // ORDER
      if (order) {
        query += ` ORDER BY ${order.column} ${order.ascending ? 'ASC' : 'DESC'}`;
      }

      // LIMIT
      if (queryLimit) {
        query += ` LIMIT ${parseInt(queryLimit)}`;
      }

      let result;
      if (single || maybeSingle) {
        result = db.prepare(query).get(...params);
        // Convert booleans for provider_details
        if (result && table === 'provider_details') {
          result.is_online = !!result.is_online;
          result.is_approved = !!result.is_approved;
        }
        // Parse JSON fields
        if (result) {
          ['service_details', 'details'].forEach(field => {
            if (result[field] && typeof result[field] === 'string') {
              try { result[field] = JSON.parse(result[field]); } catch {}
            }
          });
          // Convert seen to boolean for notifications
          if (table === 'notifications' && 'seen' in result) {
            result.seen = !!result.seen;
          }
        }
        
        if (!result && single) {
          return res.json({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });
        }
        return res.json({ data: result || null, error: null });
      } else {
        result = db.prepare(query).all(...params);
        // Convert booleans and parse JSON for arrays
        result.forEach(row => {
          if (table === 'provider_details') {
            row.is_online = !!row.is_online;
            row.is_approved = !!row.is_approved;
          }
          if (table === 'notifications' && 'seen' in row) {
            row.seen = !!row.seen;
          }
          ['service_details', 'details'].forEach(field => {
            if (row[field] && typeof row[field] === 'string') {
              try { row[field] = JSON.parse(row[field]); } catch {}
            }
          });
        });
        return res.json({ data: result, error: null });
      }

    } else if (operation === 'INSERT') {
      const items = Array.isArray(data) ? data : [data];
      const results = [];

      for (const item of items) {
        const id = item.id || uuidv4();
        item.id = id;

        // Serialize JSON fields
        ['service_details', 'details', 'user_metadata'].forEach(field => {
          if (item[field] && typeof item[field] === 'object') {
            item[field] = JSON.stringify(item[field]);
          }
        });

        const columns = Object.keys(item);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(c => {
          const v = item[c];
          if (typeof v === 'boolean') return v ? 1 : 0;
          return v;
        });

        db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
        const inserted = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
        if (inserted) {
          if (table === 'provider_details') {
            inserted.is_online = !!inserted.is_online;
            inserted.is_approved = !!inserted.is_approved;
          }
          ['service_details', 'details'].forEach(field => {
            if (inserted[field] && typeof inserted[field] === 'string') {
              try { inserted[field] = JSON.parse(inserted[field]); } catch {}
            }
          });
        }
        results.push(inserted);
      }

      if (single || maybeSingle) {
        return res.json({ data: results[0] || null, error: null });
      }
      return res.json({ data: results, error: null });

    } else if (operation === 'UPDATE') {
      const updates = { ...data };
      
      // Serialize JSON fields
      ['service_details', 'details', 'user_metadata'].forEach(field => {
        if (updates[field] && typeof updates[field] === 'object') {
          updates[field] = JSON.stringify(updates[field]);
        }
      });

      // Convert booleans to integers for SQLite
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'boolean') {
          updates[key] = updates[key] ? 1 : 0;
        }
      });

      const fields = Object.keys(updates);
      if (fields.length === 0) {
        return res.json({ data: null, error: { message: 'No fields to update' } });
      }

      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => updates[f]);

      // Build WHERE from filters
      let whereClause = '';
      const whereParams = [];
      if (filters && filters.length > 0) {
        const conditions = filters.map(f => {
          if (f.operator === 'eq') {
            whereParams.push(f.value);
            return `${f.column} = ?`;
          } else if (f.operator === 'in') {
            const placeholders = f.value.map(() => '?').join(', ');
            whereParams.push(...f.value);
            return `${f.column} IN (${placeholders})`;
          }
          return null;
        }).filter(Boolean);
        whereClause = ' WHERE ' + conditions.join(' AND ');
      }

      db.prepare(`UPDATE ${table} SET ${setClause}${whereClause}`).run(...values, ...whereParams);

      // Return updated rows
      if (single || maybeSingle) {
        let selectQ = `SELECT * FROM ${table}${whereClause}`;
        const row = db.prepare(selectQ).get(...whereParams);
        if (row) {
          if (table === 'provider_details') {
            row.is_online = !!row.is_online;
            row.is_approved = !!row.is_approved;
          }
          ['service_details', 'details'].forEach(field => {
            if (row[field] && typeof row[field] === 'string') {
              try { row[field] = JSON.parse(row[field]); } catch {}
            }
          });
        }
        return res.json({ data: row || null, error: null });
      }
      return res.json({ data: null, error: null });

    } else if (operation === 'DELETE') {
      let whereClause = '';
      const whereParams = [];
      if (filters && filters.length > 0) {
        const conditions = filters.map(f => {
          if (f.operator === 'eq') {
            whereParams.push(f.value);
            return `${f.column} = ?`;
          }
          return null;
        }).filter(Boolean);
        whereClause = ' WHERE ' + conditions.join(' AND ');
      }

      db.prepare(`DELETE FROM ${table}${whereClause}`).run(...whereParams);
      return res.json({ data: null, error: null });

    } else if (operation === 'UPSERT') {
      const item = Array.isArray(data) ? data[0] : data;
      const conflictColumn = req.body.onConflict || 'id';
      
      // Serialize JSON fields
      ['service_details', 'details'].forEach(field => {
        if (item[field] && typeof item[field] === 'object') {
          item[field] = JSON.stringify(item[field]);
        }
      });

      const columns = Object.keys(item);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(c => {
        const v = item[c];
        if (typeof v === 'boolean') return v ? 1 : 0;
        return v;
      });

      // Use INSERT OR REPLACE
      const updateCols = columns.filter(c => c !== conflictColumn && !conflictColumn.split(',').includes(c));
      const onConflictClause = updateCols.map(c => `${c} = excluded.${c}`).join(', ');

      if (item.id === undefined) item.id = uuidv4();

      db.prepare(`
        INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
        ON CONFLICT(${conflictColumn}) DO UPDATE SET ${onConflictClause}
      `).run(...values);

      return res.json({ data: null, error: null });
    }

    return res.status(400).json({ error: 'Invalid operation' });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ data: null, error: { message: err.message, code: err.code } });
  }
});

// ============================================
// Stripe Checkout Session Endpoint
// ============================================
app.post('/create-checkout-session', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_dev_only');
    const { amount, currency, productName } = req.body;

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'inr',
            product_data: {
              name: productName || 'CURA Service',
            },
            unit_amount: amount || 10000, // Default to 10000 paise (₹100)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:8080/success',
      cancel_url: 'http://localhost:8080/cancel',
    });

    res.json({ data: { sessionId: session.id }, error: null });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});
// ============================================
app.post('/api/functions/:name', async (req, res) => {
  const { name } = req.params;
  
  switch (name) {
    case 'send-email':
      console.log('Email stub called:', req.body.body?.subject || 'no subject');
      return res.json({ data: { success: true, message: 'Email stub - logged to console' }, error: null });
    
    case 'create-payment-intent':
      try {
        // Import stripe inside the function so we use it only if needed
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_dev_only');
        const { amount, currency } = req.body.body || {};
        
        // Stripe expects amounts in the smallest currency unit (e.g. cents for USD, paise for INR)
        const amountInSmallestUnit = Math.round((amount || 10) * 100);
        
        console.log(`Creating Stripe PaymentIntent for amount: ${amountInSmallestUnit} ${currency || 'inr'}`);
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInSmallestUnit,
          currency: currency || 'inr',
          // Use pm_card_visa as the default payment method for testing if we skip PaymentElement
          payment_method_types: ['card']
        });
        
        return res.json({ 
          data: { 
            clientSecret: paymentIntent.client_secret 
          }, 
          error: null 
        });
      } catch (err) {
        console.error('Stripe error:', err);
        return res.json({ 
          data: null, 
          error: { message: err.message } 
        });
      }
    
    case 'get-google-maps-key':
      return res.json({ 
        data: { apiKey: process.env.GOOGLE_MAPS_API_KEY || '' }, 
        error: null 
      });
    
    default:
      return res.json({ data: null, error: { message: `Unknown function: ${name}` } });
  }
});

// ============================================
// Mount specific routes
// ============================================
const authRoutes = require('./routes/auth.routes');
const consumerRoutes = require('./routes/consumer.routes');
const providerRoutes = require('./routes/provider.routes');
const bookingRoutes = require('./routes/booking.routes');
const notificationRoutes = require('./routes/notification.routes');
const requestRoutes = require('./routes/request.routes');
const uploadRoutes = require('./routes/upload.routes');
const locationRoutes = require('./routes/location.routes');

app.use('/api/auth', authRoutes);
app.use('/api/consumer', consumerRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/location', locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Cura Backend Server running at http://localhost:${PORT}`);
  console.log(`📦 Database: ${path.join(__dirname, 'cura.db')}`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`\n   Admin login: admin@admin.com / admin123\n`);
});
