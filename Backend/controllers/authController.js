const db = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const mockRegistry = require('../data/mock_registry.json');

// Citizen Signup
exports.signupCitizen = async (req, res) => {
  const { name, mobile, email, password } = req.body;
  if (!name || !mobile || !password) {
    return res.status(400).json({ status: 'error', message: 'Name, mobile, and password are required', code: 'MISSING_FIELDS' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    
    // Insert with hardcoded 'CITIZEN' role
    const result = await db.query(`
      INSERT INTO users (name, email, mobile, password_hash, role) 
      VALUES ($1, $2, $3, $4, 'CITIZEN') RETURNING id, role
    `, [name, email || null, mobile, hashedPassword]);

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ status: 'success', data: { token, user: { id: user.id, role: user.role } } });
  } catch (err) {
    if (err.code === '23505') { // Postgres unique violation
      return res.status(400).json({ status: 'error', message: 'Mobile or email already exists', code: 'USER_EXISTS' });
    }
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// Officer Signup
exports.signupOfficer = async (req, res) => {
  const { employee_id, email, mobile, password } = req.body;
  if (!employee_id || !mobile || !password) {
    return res.status(400).json({ status: 'error', message: 'Employee ID, mobile, and password are required', code: 'MISSING_FIELDS' });
  }

  // 1. Registry Check
  const registryMatch = mockRegistry.find(emp => emp.employee_id === employee_id);
  if (!registryMatch) {
    return res.status(400).json({ status: 'error', message: 'Employee ID not found in registry', code: 'REGISTRY_MISMATCH' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const hashedPassword = await hashPassword(password);

    // 2. Insert into users with 'OFFICER' role
    const userRes = await client.query(`
      INSERT INTO users (name, email, mobile, password_hash, role) 
      VALUES ($1, $2, $3, $4, 'OFFICER') RETURNING id, role
    `, [registryMatch.name, email || null, mobile, hashedPassword]);
    const user = userRes.rows[0];

    // 3. Insert into officers
    await client.query(`
      INSERT INTO officers (user_id, employee_id, department, designation, village, taluka, district, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
    `, [user.id, registryMatch.employee_id, registryMatch.department, registryMatch.designation, registryMatch.village, registryMatch.taluka, registryMatch.district]);

    await client.query('COMMIT');

    const token = generateToken(user, registryMatch);
    res.status(201).json({ status: 'success', data: { token, user: { id: user.id, role: user.role } } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'Mobile, email, or employee ID already exists', code: 'USER_EXISTS' });
    }
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  } finally {
    client.release();
  }
};

// Unified Login
exports.login = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be mobile or email
  if (!identifier || !password) {
    return res.status(400).json({ status: 'error', message: 'Identifier and password are required', code: 'MISSING_FIELDS' });
  }

  try {
    const userRes = await db.query(`
      SELECT * FROM users WHERE mobile = $1 OR email = $1
    `, [identifier]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const user = userRes.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    let officerDetails = null;
    if (user.role === 'OFFICER') {
      const offRes = await db.query('SELECT village, district FROM officers WHERE user_id = $1', [user.id]);
      if (offRes.rows.length > 0) {
        officerDetails = offRes.rows[0];
      }
    }

    const token = generateToken(user, officerDetails);
    res.status(200).json({ status: 'success', data: { token, user: { id: user.id, role: user.role, name: user.name } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
