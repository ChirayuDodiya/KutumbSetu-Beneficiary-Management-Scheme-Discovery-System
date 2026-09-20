const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All family routes are restricted to citizens managing their own families
router.use(authenticate);
router.use(requireRole('CITIZEN'));

router.post('/', familyController.createFamily);
router.get('/my', familyController.getMyFamily);
router.post('/:id/members', familyController.addMember);
router.post('/:id/submit', familyController.submitFamily);
router.get('/:id', familyController.getFamily);
router.get('/:id/members', familyController.getMembers);

module.exports = router;
