// File: server/routes/aiRecommendations.js

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import TherapyCase from '../models/TherapyCase.js';
import TherapySession from '../models/TherapySession.js';
import SupervisorFeedback from '../models/SupervisorFeedback.js';

const router = express.Router();

// Simulated async AI model inference function — replace with real AI integration later
async function callAIModel(inputData) {
  // Simulate latency of 1 second (e.g., network, processing delay)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Example dynamic recommendations based on input data length
  return {
    treatmentAdjustments: [
      `Adjust articulation exercises based on latest progress report count: ${inputData.progressReports.length}`,
      "Consider adding more visual aids.",
    ],
    riskAlerts: inputData.progressReports.some(pr => pr.clinicalRating <= 3)
      ? ["Critical clinical alert: Low ratings observed, increase supervision."]
      : [],
    microLearning: [
      "Recommend refreshing 'Phonological Disorders' course.",
      "Assign mindfulness training for therapist.",
    ],
    summary: `AI-generated summary based on ${inputData.sessions.length} sessions and feedback.`,
  };
}

// GET AI recommendations for a therapy case by ID
router.get('/:caseId', protect, async (req, res) => {
  const { caseId } = req.params;

  try {
    // Validate caseId - simple ObjectId check
    if (!caseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid therapy case ID' });
    }

    // Fetch therapy case
    const therapyCase = await TherapyCase.findById(caseId).lean();
    if (!therapyCase) {
      return res.status(404).json({ error: 'Therapy case not found' });
    }

    // Fetch sessions linked to the case
    const sessions = await TherapySession.find({ therapyCase: caseId }).lean();

    // Fetch feedback related to sessions
    const sessionIds = sessions.map(s => s._id);
    const feedbacks = await SupervisorFeedback.find({ therapySession: { $in: sessionIds } }).lean();

    // Use progress reports stored inside therapyCase or adjust if stored elsewhere
    const progressReports = therapyCase.progressReports || [];

    // Call AI inference function (async)
    const recommendations = await callAIModel({ therapyCase, sessions, feedbacks, progressReports });

    res.json({ recommendations });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ error: 'Error generating AI recommendations' });
  }
});

export default router;
