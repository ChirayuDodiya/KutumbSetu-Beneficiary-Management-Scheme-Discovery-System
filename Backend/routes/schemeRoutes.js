const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/schemeController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ dest: 'data/scheme_docs/' });

router.use(authenticate); // Both CITIZEN and OFFICER can access these

router.get('/families/:id/schemes', schemeController.getApplicableSchemes);
router.get('/schemes/:id', schemeController.getSchemeById);

// Admin Route
router.post('/schemes', requireRole('ADMIN'), upload.single('file'), schemeController.createScheme);

module.exports = router;
