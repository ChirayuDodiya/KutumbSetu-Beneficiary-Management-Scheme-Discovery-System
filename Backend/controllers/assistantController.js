const { askQuestion, ingestDocuments } = require('../utils/ragEngine');

exports.askAssistant = async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ status: 'error', message: 'Question is required' });
  }

  try {
    const result = await askQuestion(question);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    console.error("RAG Error:", err);
    res.status(500).json({ status: 'error', message: 'Failed to process question with the assistant.' });
  }
};

// Admin/System endpoint to trigger ingestion
exports.triggerIngestion = async (req, res) => {
  try {
    await ingestDocuments();
    res.status(200).json({ status: 'success', message: 'Documents successfully ingested into Pinecone.' });
  } catch (err) {
    console.error("Ingestion Error:", err);
    res.status(500).json({ status: 'error', message: 'Failed to ingest documents.' });
  }
};
