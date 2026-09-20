const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Use multer memory storage so we can buffer it directly to Supabase
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.use(authenticate);

// Citizens upload docs
router.post('/families/:familyId/documents', requireRole('CITIZEN'), upload.single('file'), documentController.uploadDocument);

// Both Citizens and Officers can view docs
router.get('/families/:familyId/documents', documentController.getFamilyDocuments);

// Citizens delete docs
router.delete('/documents/:docId', requireRole('CITIZEN'), documentController.deleteDocument);

module.exports = router;
