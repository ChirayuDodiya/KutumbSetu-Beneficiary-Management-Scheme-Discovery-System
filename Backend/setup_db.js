const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runSchema() {
  const schemaPath = path.join(__dirname, '../schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Running schema.sql on Supabase...');
    await db.query(schemaSQL);
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    db.end();
  }
}

runSchema();
