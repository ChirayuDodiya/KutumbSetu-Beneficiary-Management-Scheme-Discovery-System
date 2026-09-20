const db = require('../config/db');

// Create a new Family (DRAFT)
exports.createFamily = async (req, res) => {
  const { annual_income, caste, address, village, taluka, district } = req.body;
  const created_by = req.user.userId;

  if (annual_income === undefined || !caste || !address || !village || !taluka || !district) {
    return res.status(400).json({ status: 'error', message: 'All family details are required', code: 'MISSING_FIELDS' });
  }

  try {
    // Generate unique Family ID: GJ-FAM-{YEAR}-{SEQUENCE}
    const year = new Date().getFullYear();
    const seqRes = await db.query("SELECT nextval('family_id_seq') AS seq");
    const seq = seqRes.rows[0].seq.padStart(6, '0');
    const family_id_str = `GJ-FAM-${year}-${seq}`;

    const result = await db.query(`
      INSERT INTO families (family_id, annual_income, caste, address, village, taluka, district, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT', $8)
      RETURNING id, family_id, status
    `, [family_id_str, annual_income, caste, address, village, taluka, district, created_by]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'You have already created a family', code: 'FAMILY_EXISTS' });
    }
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// Add a Member to a Family
exports.addMember = async (req, res) => {
  const familyId = req.params.id;
  const userId = req.user.userId;
  const { name, age, gender, relationship, occupation, is_student, is_parent_alive } = req.body;

  if (!name || age === undefined || !gender || !relationship) {
    return res.status(400).json({ status: 'error', message: 'Name, age, gender, and relationship are required', code: 'MISSING_FIELDS' });
  }

  try {
    // Check ownership
    const famRes = await db.query('SELECT created_by, status FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    if (famRes.rows[0].created_by !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden', code: 'FORBIDDEN' });
    if (famRes.rows[0].status !== 'DRAFT') return res.status(400).json({ status: 'error', message: 'Can only add members to DRAFT families', code: 'INVALID_STATUS' });

    const result = await db.query(`
      INSERT INTO family_members (family_id, name, age, gender, relationship, occupation, is_student, is_parent_alive)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [familyId, name, age, gender, relationship, occupation, is_student || false, is_parent_alive || null]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// Submit Family for Verification
exports.submitFamily = async (req, res) => {
  const familyId = req.params.id;
  const userId = req.user.userId;
  const { head_member_id } = req.body;

  if (!head_member_id) {
    return res.status(400).json({ status: 'error', message: 'head_member_id is required', code: 'MISSING_FIELDS' });
  }

  try {
    // Check ownership
    const famRes = await db.query('SELECT created_by, status FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    if (famRes.rows[0].created_by !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden', code: 'FORBIDDEN' });
    
    // Check if family has members
    const memRes = await db.query('SELECT COUNT(*) FROM family_members WHERE family_id = $1', [familyId]);
    if (parseInt(memRes.rows[0].count) === 0) {
      return res.status(400).json({ status: 'error', message: 'Cannot submit a family with no members', code: 'NO_MEMBERS' });
    }

    // Update head member and status
    const result = await db.query(`
      UPDATE families 
      SET head_member_id = $1, status = 'PENDING_VERIFICATION' 
      WHERE id = $2 RETURNING id, status, head_member_id
    `, [head_member_id, familyId]);

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// Get Family Details
exports.getFamily = async (req, res) => {
  const familyId = req.params.id;
  const userId = req.user.userId;

  try {
    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    if (famRes.rows[0].created_by !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden', code: 'FORBIDDEN' });

    res.status(200).json({ status: 'success', data: famRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// Get Family Members
exports.getMembers = async (req, res) => {
  const familyId = req.params.id;
  const userId = req.user.userId;

  try {
    const famRes = await db.query('SELECT created_by FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    if (famRes.rows[0].created_by !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden', code: 'FORBIDDEN' });

    const memRes = await db.query('SELECT * FROM family_members WHERE family_id = $1', [familyId]);
    res.status(200).json({ status: 'success', data: memRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
  
// Get My Family (Citizen)  
exports.getMyFamily = async (req, res) => {  
  const userId = req.user.userId;  
  
  try {  
    const famRes = await db.query('SELECT * FROM families WHERE created_by = $1', [userId]);  
    if (famRes.rows.length === 0) return res.status(200).json({ status: 'success', data: null });  
  
    const family = famRes.rows[0];  
    const memRes = await db.query('SELECT * FROM family_members WHERE family_id = $1', [family.id]);  
    family.members = memRes.rows;  
  
    res.status(200).json({ status: 'success', data: family });  
  } catch (err) {  
    console.error(err);  
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });  
  }  
};
