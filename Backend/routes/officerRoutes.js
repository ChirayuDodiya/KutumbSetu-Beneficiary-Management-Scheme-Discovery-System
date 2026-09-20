const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All officer routes require authentication and the OFFICER role
router.use(authenticate);
router.use(requireRole('OFFICER'));

router.get('/families', officerController.getFamilies);
router.get('/families/:id', officerController.getFamilyDetails);
router.patch('/families/:id/approve', officerController.approveFamily);
router.patch('/families/:id/reject', officerController.rejectFamily);
router.get('/stats', officerController.getStats);

module.exports = router;
