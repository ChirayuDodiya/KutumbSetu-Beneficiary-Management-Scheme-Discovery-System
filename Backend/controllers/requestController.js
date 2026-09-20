const db = require('../config/db');
const { evaluate } = require('../utils/ruleEngine');

// E1: Create a Benefit Request (Citizen)
exports.createRequest = async (req, res) => {
  const { family_id, scheme_id, attached_documents } = req.body;
  const userId = req.user.userId;

  if (!family_id || !scheme_id) {
    return res.status(400).json({ status: 'error', message: 'family_id and scheme_id are required', code: 'MISSING_FIELDS' });
  }

  try {
    // Check family ownership and status
    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [family_id]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    if (famRes.rows[0].created_by !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden', code: 'FORBIDDEN' });
    if (famRes.rows[0].status !== 'VERIFIED') return res.status(400).json({ status: 'error', message: 'Family must be VERIFIED to request benefits', code: 'UNVERIFIED_FAMILY' });

    // Fetch members and scheme
    const memRes = await db.query('SELECT * FROM family_members WHERE family_id = $1', [family_id]);
    const schemeRes = await db.query('SELECT * FROM schemes WHERE id = $1', [scheme_id]);
    if (schemeRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Scheme not found', code: 'NOT_FOUND' });

    // Check applicability
    const evaluation = evaluate(famRes.rows[0], memRes.rows, schemeRes.rows[0]);
    if (!evaluation.potentiallyApplicable) {
      return res.status(400).json({ status: 'error', message: 'Family does not meet the criteria for this scheme', code: 'NOT_APPLICABLE' });
    }

    // Check for existing request
    const existingReqRes = await db.query('SELECT * FROM benefit_requests WHERE family_id = $1 AND scheme_id = $2', [family_id, scheme_id]);
    if (existingReqRes.rows.length > 0) {
      const existingReq = existingReqRes.rows[0];
      if (existingReq.status === 'UNDER_REVIEW' || existingReq.status === 'APPROVED') {
        return res.status(400).json({ status: 'error', message: 'A request for this scheme already exists', code: 'DUPLICATE_REQUEST' });
      }
      
      // If rejected, update the existing row
      const result = await db.query(`
        UPDATE benefit_requests 
        SET status = 'UNDER_REVIEW', attached_documents = $1, requested_at = CURRENT_TIMESTAMP, rejection_reason = NULL
        WHERE id = $2 RETURNING *
      `, [JSON.stringify(attached_documents || []), existingReq.id]);
      return res.status(200).json({ status: 'success', data: result.rows[0] });
    }

    // Insert new request
    const result = await db.query(`
      INSERT INTO benefit_requests (family_id, scheme_id, status, attached_documents)
      VALUES ($1, $2, 'UNDER_REVIEW', $3) RETURNING *
    `, [family_id, scheme_id, JSON.stringify(attached_documents || [])]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ status: 'error', message: 'A request for this scheme already exists for this family', code: 'DUPLICATE_REQUEST' });
    }
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// E2: Get Citizen Requests
exports.getCitizenRequests = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(`
      SELECT br.*, s.name as scheme_name, f.family_id as family_code 
      FROM benefit_requests br
      JOIN families f ON br.family_id = f.id
      JOIN schemes s ON br.scheme_id = s.id
      WHERE f.created_by = $1
      ORDER BY br.requested_at DESC
    `, [userId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// E2: Get Officer Requests (Jurisdiction filtered)
exports.getOfficerRequests = async (req, res) => {
  const { village, district } = req.user;

  try {
    const result = await db.query(`
      SELECT br.*, s.name as scheme_name, s.required_documents, f.family_id as family_code, f.annual_income, f.caste 
      FROM benefit_requests br
      JOIN families f ON br.family_id = f.id
      JOIN schemes s ON br.scheme_id = s.id
      WHERE f.village = $1 AND f.district = $2
      ORDER BY br.requested_at DESC
    `, [village, district]);

    // For officer view, dynamically re-evaluate the rules to show the checklist
    for (let req of result.rows) {
      const famRes = await db.query('SELECT * FROM families WHERE id = $1', [req.family_id]);
      const memRes = await db.query('SELECT * FROM family_members WHERE family_id = $1', [req.family_id]);
      const schemeRes = await db.query('SELECT * FROM schemes WHERE id = $1', [req.scheme_id]);
      
      req.evaluation = evaluate(famRes.rows[0], memRes.rows, schemeRes.rows[0]);
    }

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// E3: Approve Request
exports.approveRequest = async (req, res) => {
  const requestId = req.params.id;
  const officerId = req.user.userId;
  const { village, district } = req.user;

  try {
    // Verify jurisdiction and status
    const reqRes = await db.query(`
      SELECT br.status, f.village, f.district 
      FROM benefit_requests br
      JOIN families f ON br.family_id = f.id
      WHERE br.id = $1
    `, [requestId]);

    if (reqRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Request not found', code: 'NOT_FOUND' });
    const request = reqRes.rows[0];

    if (request.village !== village || request.district !== district) {
      return res.status(403).json({ status: 'error', message: 'Outside jurisdiction', code: 'OUT_OF_JURISDICTION' });
    }
    if (request.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ status: 'error', message: 'Request is not under review', code: 'INVALID_STATUS' });
    }

    const result = await db.query(`
      UPDATE benefit_requests 
      SET status = 'APPROVED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [officerId, requestId]);

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// E3: Reject Request
exports.rejectRequest = async (req, res) => {
  const requestId = req.params.id;
  const officerId = req.user.userId;
  const { village, district } = req.user;
  const { rejection_reason } = req.body;

  if (!rejection_reason) return res.status(400).json({ status: 'error', message: 'Rejection reason required', code: 'MISSING_REASON' });

  try {
    const reqRes = await db.query(`
      SELECT br.status, f.village, f.district 
      FROM benefit_requests br
      JOIN families f ON br.family_id = f.id
      WHERE br.id = $1
    `, [requestId]);

    if (reqRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Request not found', code: 'NOT_FOUND' });
    const request = reqRes.rows[0];

    if (request.village !== village || request.district !== district) {
      return res.status(403).json({ status: 'error', message: 'Outside jurisdiction', code: 'OUT_OF_JURISDICTION' });
    }
    if (request.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ status: 'error', message: 'Request is not under review', code: 'INVALID_STATUS' });
    }

    const result = await db.query(`
      UPDATE benefit_requests 
      SET status = 'REJECTED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $2
      WHERE id = $3 RETURNING *
    `, [officerId, rejection_reason, requestId]);

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
