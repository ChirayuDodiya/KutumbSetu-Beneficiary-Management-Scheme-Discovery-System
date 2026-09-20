const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Citizen Routes
router.post('/benefit-requests', requireRole('CITIZEN'), requestController.createRequest);
router.get('/benefit-requests', requireRole('CITIZEN'), requestController.getCitizenRequests);

// Officer Routes
router.get('/officer/benefit-requests', requireRole('OFFICER'), requestController.getOfficerRequests);
router.patch('/officer/benefit-requests/:id/approve', requireRole('OFFICER'), requestController.approveRequest);
router.patch('/officer/benefit-requests/:id/reject', requireRole('OFFICER'), requestController.rejectRequest);

module.exports = router;
