const db = require('../config/db');
const { evaluate } = require('../utils/ruleEngine');

// Get applicable schemes for a specific family
exports.getApplicableSchemes = async (req, res) => {
  const familyId = req.params.id;
  const userId = req.user.userId;
  const userRole = req.user.role; // CITIZEN or OFFICER

  try {
    // 1. Fetch Family
    const famRes = await db.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found', code: 'NOT_FOUND' });
    
    const family = famRes.rows[0];

    // Access control: Citizen can only see own. Officer must have jurisdiction.
    if (userRole === 'CITIZEN' && family.created_by !== userId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden', code: 'FORBIDDEN' });
    }
    if (userRole === 'OFFICER' && (family.village !== req.user.village || family.district !== req.user.district)) {
      return res.status(403).json({ status: 'error', message: 'Family outside jurisdiction', code: 'OUT_OF_JURISDICTION' });
    }

    // 2. Family must be VERIFIED
    if (family.status !== 'VERIFIED') {
      return res.status(400).json({ status: 'error', message: 'Family must be VERIFIED to evaluate schemes', code: 'UNVERIFIED_FAMILY' });
    }

    // 3. Fetch Members
    const memRes = await db.query('SELECT * FROM family_members WHERE family_id = $1', [familyId]);
    const members = memRes.rows;

    // 4. Fetch all Schemes
    const schemeRes = await db.query('SELECT * FROM schemes');
    const schemes = schemeRes.rows;

    // 5. Evaluate
    const evaluatedSchemes = schemes.map(scheme => {
      const evaluation = evaluate(family, members, scheme);
      return {
        ...scheme,
        evaluation,
        disclaimer: "Final eligibility is subject to official verification."
      };
    });

    res.status(200).json({ status: 'success', data: evaluatedSchemes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

// Get single scheme details
exports.getSchemeById = async (req, res) => {
  const schemeId = req.params.id;
  try {
    const schemeRes = await db.query('SELECT * FROM schemes WHERE id = $1', [schemeId]);
    if (schemeRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Scheme not found', code: 'NOT_FOUND' });
    
    res.status(200).json({ status: 'success', data: schemeRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
  
// Create new Scheme (Admin)
const { ingestSingleFile } = require('../utils/ragEngine');
exports.createScheme = async (req, res) => {
  const { name, description, criteria, required_documents } = req.body;
  const created_by = req.user.userId;
  const file = req.file;

  try {
    const result = await db.query(
      'INSERT INTO schemes (name, description, criteria, required_documents, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, criteria || '{}', required_documents || '[]', created_by]
    );

    if (file) {
      await ingestSingleFile(file.path, name);
      const fs = require('fs');
      fs.unlinkSync(file.path); // Delete the temporary multer file
    }

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
  
// Delete Scheme
exports.deleteScheme = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM schemes WHERE id = $1 RETURNING name', [req.params.id]);
    if (result.rows.length > 0) {
      const { deleteVectorsByScheme } = require('../utils/ragEngine');
      await deleteVectorsByScheme(result.rows[0].name);
    }
    res.json({status: 'success'});
  } catch (e) {
    res.status(500).json({error: e.message});
  }
};
  
// Get all schemes  
exports.getAllSchemes = async (req, res) => {  
  try {  
    const result = await db.query('SELECT id, name, description FROM schemes');  
    res.json({status: 'success', data: result.rows});  
  } catch (e) { res.status(500).json({error: e.message}); }  
}; 
