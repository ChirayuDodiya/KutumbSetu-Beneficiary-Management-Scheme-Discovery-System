const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const db = require('../config/db');

// Initialize S3 Client targeting Supabase Storage S3 endpoint
let s3 = null;
if (process.env.SUPABASE_API_URL && process.env.ACCESS_KEY && process.env.SECRET_ACCESS_KEY) {
  // Extract region and endpoint from SUPABASE_API_URL if needed, but AWS SDK v3 allows custom endpoints easily
  s3 = new S3Client({
    forcePathStyle: true,
    region: 'ap-south-1', // Generic region placeholder, Supabase S3 often ignores it but requires it to be set
    endpoint: process.env.SUPABASE_API_URL,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    }
  });
}

exports.uploadDocument = async (req, res) => {
  const familyId = req.params.familyId;
  const userId = req.user.userId;
  const { document_type } = req.body;
  const file = req.file;

  if (!document_type || !file) {
    return res.status(400).json({ status: 'error', message: 'Document type and file are required' });
  }

  if (!s3) {
    return res.status(500).json({ status: 'error', message: 'Supabase S3 storage is not configured (Missing Keys)' });
  }

  try {
    // Check family ownership
    const famRes = await db.query('SELECT created_by FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found' });
    if (famRes.rows[0].created_by !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden' });

    // Upload to Supabase Storage Bucket named "documents" via S3 protocol
    const fileExt = file.originalname.split('.').pop();
    const filePath = `family-${familyId}/${Date.now()}_${document_type.replace(/\s+/g, '_')}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: 'documents',
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await s3.send(command);

    // Get public URL (Supabase pattern: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<key>)
    // The SUPABASE_API_URL is https://<project>.storage.supabase.co/storage/v1/s3
    const projectUrl = process.env.SUPABASE_API_URL.replace('.storage.supabase.co/storage/v1/s3', '.supabase.co');
    const fileUrl = `${projectUrl}/storage/v1/object/public/documents/${filePath}`;

    // Insert into DB
    const result = await db.query(`
      INSERT INTO documents (family_id, document_type, file_path, status)
      VALUES ($1, $2, $3, 'SUBMITTED') RETURNING *
    `, [familyId, document_type, fileUrl]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error("S3 Upload Error:", err);
    res.status(500).json({ status: 'error', message: 'Failed to upload file to storage' });
  }
};

exports.getFamilyDocuments = async (req, res) => {
  const familyId = req.params.familyId;
  const user = req.user;

  try {
    const famRes = await db.query('SELECT created_by, village, district FROM families WHERE id = $1', [familyId]);
    if (famRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Family not found' });
    
    // Access Control: Citizen must own, Officer must be in jurisdiction
    if (user.role === 'CITIZEN' && famRes.rows[0].created_by !== user.userId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }
    if (user.role === 'OFFICER' && (famRes.rows[0].village !== user.village || famRes.rows[0].district !== user.district)) {
      return res.status(403).json({ status: 'error', message: 'Outside jurisdiction' });
    }

    const docRes = await db.query('SELECT * FROM documents WHERE family_id = $1', [familyId]);
    res.status(200).json({ status: 'success', data: docRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
