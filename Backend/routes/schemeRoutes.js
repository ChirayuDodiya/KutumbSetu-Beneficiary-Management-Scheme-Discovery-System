const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/schemeController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate); // Both CITIZEN and OFFICER can access these

router.get('/families/:id/schemes', schemeController.getApplicableSchemes);
router.get('/schemes/:id', schemeController.getSchemeById);

module.exports = router;
