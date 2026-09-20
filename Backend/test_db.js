const db = require('./config/db');

async function testConnection() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log('Successfully connected to the database!');
    console.log('Current Database Time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
  } finally {
    db.end();
  }
}

testConnection();
