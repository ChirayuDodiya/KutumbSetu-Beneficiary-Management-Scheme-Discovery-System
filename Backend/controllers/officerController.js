const db = require('../config/db');

// Helper to check jurisdiction
const checkJurisdiction = async (familyId, officer) => {
  const famRes = await db.query('SELECT village, district FROM families WHERE id = $1', [familyId]);
  if (famRes.rows.length === 0) return null;
  const fam = famRes.rows[0];
  
  if (fam.village === officer.village && fam.district === officer.district) {
    return true;
  }
  return false;
};

// C1: Get Families in Jurisdiction
exports.getFamilies = async (req, res) => {
  const { village, district } = req.user;
  
  try {
    const result = await db.query(`
      SELECT id, family_id, status, annual_income, caste, head_member_id, created_at 
      FROM families 
      WHERE village = $1 AND district = $2
      ORDER BY created_at DESC
    `, [village, district]);
    
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// C1: Get specific family details (if in jurisdiction)
exports.getFamilyDetails = async (req, res) => {
  const familyId = req.params.id;
  const officer = req.user;

  try {
    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    }

    const fam = famRes.rows[0];
    if (fam.village !== officer.village || fam.district !== officer.district) {
      return res.status(403).json({ status: 'error', message: 'Family is outside your jurisdiction', code: 'OUT_OF_JURISDICTION' });
    }

    // Fetch members
    const memRes = await db.query('SELECT * FROM family_members WHERE family_id = $1', [familyId]);
    fam.members = memRes.rows;

    res.status(200).json({ status: 'success', data: fam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// C2: Approve Family
exports.approveFamily = async (req, res) => {
  const familyId = req.params.id;
  const officerId = req.user.userId;

  try {
    const hasJurisdiction = await checkJurisdiction(familyId, req.user);
    if (hasJurisdiction === null) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    if (!hasJurisdiction) return res.status(403).json({ status: 'error', message: 'Family outside jurisdiction', code: 'OUT_OF_JURISDICTION' });

    // Check status is PENDING_VERIFICATION
    const checkRes = await db.query('SELECT status FROM families WHERE id = $1', [familyId]);
    if (checkRes.rows[0].status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ status: 'error', message: 'Family is not pending verification', code: 'INVALID_STATUS' });
    }

    const result = await db.query(`
      UPDATE families 
      SET status = 'VERIFIED', verified_by = $1, verified_at = CURRENT_TIMESTAMP 
      WHERE id = $2 RETURNING id, status, verified_at
    `, [officerId, familyId]);

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// C2: Reject Family
exports.rejectFamily = async (req, res) => {
  const familyId = req.params.id;
  const officerId = req.user.userId;
  const { rejection_reason } = req.body;

  if (!rejection_reason) {
    return res.status(400).json({ status: 'error', message: 'Rejection reason is required', code: 'MISSING_REASON' });
  }

  try {
    const hasJurisdiction = await checkJurisdiction(familyId, req.user);
    if (hasJurisdiction === null) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    if (!hasJurisdiction) return res.status(403).json({ status: 'error', message: 'Family outside jurisdiction', code: 'OUT_OF_JURISDICTION' });

    // Check status is PENDING_VERIFICATION
    const checkRes = await db.query('SELECT status FROM families WHERE id = $1', [familyId]);
    if (checkRes.rows[0].status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ status: 'error', message: 'Family is not pending verification', code: 'INVALID_STATUS' });
    }

    const result = await db.query(`
      UPDATE families 
      SET status = 'REJECTED', verified_by = $1, rejection_reason = $2, verified_at = CURRENT_TIMESTAMP 
      WHERE id = $3 RETURNING id, status, rejection_reason
    `, [officerId, rejection_reason, familyId]);

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// C3: Summary Stats
exports.getStats = async (req, res) => {
  const { village, district } = req.user;

  try {
    const famStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING_VERIFICATION') AS pending_families,
        COUNT(*) FILTER (WHERE status = 'VERIFIED') AS verified_families
      FROM families
      WHERE village = $1 AND district = $2
    `, [village, district]);

    const reqStats = await db.query(`
      SELECT 
        COUNT(br.id) AS total_requests,
        COUNT(br.id) FILTER (WHERE br.status = 'UNDER_REVIEW') AS pending_requests
      FROM benefit_requests br
      JOIN families f ON br.family_id = f.id
      WHERE f.village = $1 AND f.district = $2
    `, [village, district]);

    res.status(200).json({ 
      status: 'success', 
      data: {
        pending_families: parseInt(famStats.rows[0].pending_families || 0),
        verified_families: parseInt(famStats.rows[0].verified_families || 0),
        total_requests: parseInt(reqStats.rows[0].total_requests || 0),
        pending_requests: parseInt(reqStats.rows[0].pending_requests || 0)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
