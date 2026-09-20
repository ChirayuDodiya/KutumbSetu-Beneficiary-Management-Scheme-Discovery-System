const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();

// Database connection test
const db = require('./config/db');
db.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error connecting to the database:', err.stack);
  else console.log('Database time:', res.rows[0].now);
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Family Routes
const familyRoutes = require('./routes/familyRoutes');
app.use('/api/families', familyRoutes);

// Officer Routes
const officerRoutes = require('./routes/officerRoutes');
app.use('/api/officer', officerRoutes);

// Scheme Routes
const schemeRoutes = require('./routes/schemeRoutes');
app.use('/api', schemeRoutes);

// Request Routes
const requestRoutes = require('./routes/requestRoutes');
app.use('/api', requestRoutes);

// Assistant Routes
const assistantRoutes = require('./routes/assistantRoutes');
app.use('/api/assistant', assistantRoutes);

// Document Routes
const documentRoutes = require('./routes/documentRoutes');
app.use('/api', documentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
