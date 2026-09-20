const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Both Citizen and Officer can ask questions
router.post('/ask', assistantController.askAssistant);

// Only Admin can trigger ingestion
router.post('/ingest', requireRole('ADMIN'), assistantController.triggerIngestion);

module.exports = router;
