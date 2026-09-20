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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
