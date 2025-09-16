import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import TherapySession from '../models/TherapySession.js';
import TherapyCase from '../models/TherapyCase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Logging helper with timestamps
const log = (...args) => console.log(`[therapySessions.js][${new Date().toISOString()}]`, ...args);

// --- Utility: Validate user role existence for therapist/supervisor (optional for strictness)
import User from '../models/User.js';
async function validateUserRole(id, expectedRole) {
  if (!isValidObjectId(id)) return false;
  const user = await User.findById(id).lean();
  return user && user.role === expectedRole;
}

// ============================
// GET All Therapy Sessions
// ============================
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await TherapySession.find()
      .populate('therapist', 'name email')
      .populate('supervisor', 'name email')
      .populate('therapyCase', 'patientName diagnosis')
      .sort({ sessionDate: -1 })
      .lean();

    log('Fetched all therapy sessions:', sessions.length);
    res.json(sessions);
  } catch (err) {
    log('Failed fetching all therapy sessions:', err);
    res.status(500).json({ error: 'Unable to fetch sessions.' });
  }
});

// ============================
// CREATE Therapy Session
// ============================
router.post(
  '/',
  protect,
  [
    body('therapyCase')
      .notEmpty().withMessage('Therapy case ID required.')
      .custom(isValidObjectId).withMessage('Invalid therapy case ID.'),
    body('therapist')
      .notEmpty().withMessage('Therapist required.')
      .custom(isValidObjectId).withMessage('Invalid therapist ID.'),
    body('supervisor')
      .notEmpty().withMessage('Supervisor required.')
      .custom(isValidObjectId).withMessage('Invalid supervisor ID.'),
    body('goalsAddressed').optional().isArray(),
    body('activitiesConducted').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation errors on session create:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Optional: Strict role validation - uncomment if desired
      /*
      const [validTherapist, validSupervisor] = await Promise.all([
        validateUserRole(req.body.therapist, 'Therapist'),
        validateUserRole(req.body.supervisor, 'Supervisor'),
      ]);
      if (!validTherapist) return res.status(400).json({ error: 'Therapist not found or invalid role.' });
      if (!validSupervisor) return res.status(400).json({ error: 'Supervisor not found or invalid role.' });
      */

      const therapyCase = await TherapyCase.findById(req.body.therapyCase);
      if (!therapyCase) {
        log('Therapy case not found:', req.body.therapyCase);
        return res.status(404).json({ error: 'Therapy case not found.' });
      }

      // Create session with createdAt and updatedAt timestamps
      const sessionData = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const session = await TherapySession.create(sessionData);

      therapyCase.sessions.push(session._id);
      therapyCase.updatedAt = new Date();
      await therapyCase.save();

      const populatedSession = await TherapySession.findById(session._id)
        .populate('therapist', 'name email')
        .populate('supervisor', 'name email')
        .populate('therapyCase', 'patientName diagnosis')
        .lean();

      log('Created therapy session:', populatedSession._id);
      res.status(201).json(populatedSession);
    } catch (err) {
      log('Error creating therapy session:', err);
      res.status(500).json({ error: 'Error creating session.' });
    }
  }
);

// ============================
// GET Sessions by Therapy Case ID
// ============================
router.get('/case/:therapyCaseId', protect, async (req, res) => {
  const { therapyCaseId } = req.params;
  if (!isValidObjectId(therapyCaseId)) {
    log('Invalid therapy case ID in parameter:', therapyCaseId);
    return res.status(400).json({ error: 'Invalid therapy case ID.' });
  }
  try {
    const sessions = await TherapySession.find({ therapyCase: therapyCaseId })
      .populate('therapist', 'name email')
      .populate('supervisor', 'name email')
      .sort({ sessionDate: -1 })
      .lean();

    log(`Fetched ${sessions.length} sessions for therapy case ${therapyCaseId}`);
    res.json(sessions);
  } catch (err) {
    log('Unable to fetch sessions:', err);
    res.status(500).json({ error: 'Unable to fetch sessions.' });
  }
});

// ============================
// GET Single Session by ID
// ============================
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    log('Invalid session ID in parameter:', id);
    return res.status(400).json({ error: 'Invalid session ID.' });
  }
  try {
    const session = await TherapySession.findById(id)
      .populate('therapist', 'name email role')
      .populate('supervisor', 'name email role')
      .populate('therapyCase', 'patientName diagnosis')
      .lean();

    if (!session) {
      log('Session not found:', id);
      return res.status(404).json({ error: 'Session not found.' });
    }

    log('Fetched session:', id);
    res.json(session);
  } catch (err) {
    log('Unable to fetch session:', err);
    res.status(500).json({ error: 'Unable to fetch session.' });
  }
});

// ============================
// UPDATE a Therapy Session
// ============================
router.put(
  '/:id',
  protect,
  [
    body('goalsAddressed').optional().isArray(),
    body('activitiesConducted').optional().isArray(),
    body('notes').optional().isString(),
    body('moodObservations').optional().isString(),
    body('attendance').optional().isObject(),
    body('supervisorFeedback').optional().isObject(),
  ],
  async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      log('Invalid session ID on update:', id);
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation errors on session update:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const session = await TherapySession.findById(id);
      if (!session) {
        log('Session not found on update:', id);
        return res.status(404).json({ error: 'Session not found.' });
      }

      Object.assign(session, req.body, { updatedAt: new Date() });
      await session.save();

      const updatedSession = await TherapySession.findById(id)
        .populate('therapist', 'name email role')
        .populate('supervisor', 'name email role')
        .populate('therapyCase', 'patientName diagnosis')
        .lean();

      log('Session updated:', id);
      res.json(updatedSession);
    } catch (err) {
      log('Update session failed:', err);
      res.status(500).json({ error: 'Update failed.' });
    }
  }
);

// ============================
// SUPERVISOR: Add/Update Feedback on a Session
// ============================
router.post(
  '/:id/feedback',
  protect,
  [
    body('feedback').notEmpty().withMessage('Feedback text is required.'),
    body('approved').isBoolean().withMessage('Approved must be boolean.'),
  ],
  async (req, res) => {
    const { id } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation errors on supervisor feedback:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    if (!isValidObjectId(id)) {
      log('Invalid session ID on supervisor feedback:', id);
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    try {
      const session = await TherapySession.findById(id);
      if (!session) {
        log('Session not found on supervisor feedback:', id);
        return res.status(404).json({ error: 'Session not found.' });
      }

      session.supervisorFeedback = session.supervisorFeedback || {};
      session.supervisorFeedback.feedback = req.body.feedback;
      session.supervisorFeedback.approved = req.body.approved;
      session.supervisorFeedback.reviewedAt = new Date();
      // Optional: Track supervisor user id who gave feedback (if available in req.user)
      if (req.user && req.user._id) {
        session.supervisorFeedback.supervisorId = req.user._id;
      }

      session.updatedAt = new Date();
      await session.save();

      const updatedSession = await TherapySession.findById(session._id)
        .populate('therapist', 'name email role')
        .populate('supervisor', 'name email role')
        .populate('therapyCase', 'patientName diagnosis')
        .lean();

      log('Supervisor feedback updated for session:', id);
      res.json({ message: 'Supervisor feedback updated.', session: updatedSession });
    } catch (err) {
      log('Failed to update supervisor feedback:', err);
      res.status(500).json({ error: 'Failed to update supervisor feedback.' });
    }
  }
);

export default router;
