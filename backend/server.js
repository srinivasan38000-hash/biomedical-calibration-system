require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Robust CORS supporting local dev and deployed frontend URLs
const rawOrigin = process.env.CLIENT_URL || '*';
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || rawOrigin === '*') return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      const allowedList = rawOrigin.split(',').map((u) => u.trim().replace(/\/$/, ''));
      if (allowedList.includes(cleanOrigin) || cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Uploaded certificates are served from /uploads/<filename>
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/calibrations', require('./routes/calibrations'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Error handler (also catches upload errors)
app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
});

