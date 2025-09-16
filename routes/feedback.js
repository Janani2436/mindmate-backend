import express from 'express';
import { body, validationResult, query, param } from 'express-validator';
import mongoose from 'mongoose';
import SupervisorFeedback from '../models/SupervisorFeedback.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const log = (...args) =>
  console.log(`[feedback.js][${new Date().toISOString()}]`, ...args);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const feedbackPopulateFields = [
  { path: 'supervisor', select: 'name email role' },
  { path: 'therapist', select: 'name email role' },
  { path: 'therapySession', select: 'sessionDate notes attendance moodObservations' },
];

/**
 * CREATE feedback
 */
router.post(
  '/',
  protect,
  [
    body('therapySession')
      .notEmpty().withMessage('Therapy session ID required.')
      .custom(isValidObjectId).withMessage('Invalid therapy session ID.'),
    body('supervisor')
      .notEmpty().withMessage('Supervisor ID required.')
      .custom(isValidObjectId).withMessage('Invalid supervisor ID.'),
    body('therapist')
      .notEmpty().withMessage('Therapist ID required.')
      .custom(isValidObjectId).withMessage('Invalid therapist ID.'),
    body('feedbackText').notEmpty().withMessage('Feedback required.'),
    body('clinicalRating')
      .isInt({ min: 1, max: 10 }).withMessage('Clinical rating must be between 1 and 10.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation errors on feedback create:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const feedback = new SupervisorFeedback({
        therapySession: req.body.therapySession,
        supervisor: req.body.supervisor,
        therapist: req.body.therapist,
        feedbackText: req.body.feedbackText,
        clinicalRating: req.body.clinicalRating,
        improvementSuggestions: req.body.improvementSuggestions || '',
        feedbackDate: new Date(),
        version: 1,
        auditLog: [],
      });

      feedback.logAction('created', req.user._id, {
        feedbackText: req.body.feedbackText,
        clinicalRating: req.body.clinicalRating,
      });

      await feedback.save();

      const populated = await SupervisorFeedback.findById(feedback._id)
        .populate(feedbackPopulateFields)
        .lean();

      log('Created feedback entry:', feedback._id.toString());
      res.status(201).json(populated);
    } catch (err) {
      log('Error creating supervisor feedback:', err.stack || err);
      res.status(500).json({ error: 'Error creating supervisor feedback.' });
    }
  }
);

/**
 * UPDATE feedback
 */
router.put(
  '/:id',
  protect,
  [
    body('feedbackText').optional().notEmpty().withMessage('Feedback must not be empty.'),
    body('clinicalRating').optional().isInt({ min: 1, max: 10 }).withMessage('Rating must be 1-10.'),
    body('improvementSuggestions').optional(),
    body('supervisorSignature').optional().isString(),
  ],
  async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid feedback ID.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation errors on feedback update:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const feedback = await SupervisorFeedback.findById(id);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      if (req.user._id.toString() !== feedback.supervisor.toString()) {
        return res.status(403).json({ error: 'Permission denied to update this feedback.' });
      }

      const beforeUpdate = {
        feedbackText: feedback.feedbackText,
        clinicalRating: feedback.clinicalRating,
        improvementSuggestions: feedback.improvementSuggestions,
        supervisorSignature: feedback.supervisorSignature,
      };

      ['feedbackText', 'clinicalRating', 'improvementSuggestions', 'supervisorSignature'].forEach((field) => {
        if (req.body[field] !== undefined) {
          feedback[field] = req.body[field];
        }
      });

      feedback.version += 1;
      feedback.logAction('updated', req.user._id, { beforeUpdate, afterUpdate: req.body });

      await feedback.save();

      const populated = await SupervisorFeedback.findById(feedback._id)
        .populate(feedbackPopulateFields)
        .lean();

      log('Updated feedback:', feedback._id.toString());
      res.json(populated);
    } catch (err) {
      log('Error updating feedback:', err.stack || err);
      res.status(500).json({ error: 'Error updating feedback.' });
    }
  }
);

/**
 * DELETE feedback
 */
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid feedback ID.' });
  }

  try {
    const feedback = await SupervisorFeedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    if (req.user._id.toString() !== feedback.supervisor.toString()) {
      return res.status(403).json({ error: 'Permission denied to delete this feedback.' });
    }

    log(`Feedback deleted by user ${req.user._id}:`, feedback._id.toString());
    await feedback.remove();

    res.json({ message: 'Feedback deleted successfully.' });
  } catch (err) {
    log('Error deleting feedback:', err.stack || err);
    res.status(500).json({ error: 'Error deleting feedback.' });
  }
});

/**
 * NEW: GET feedback by therapistId
 */
/**
 * GET feedback by therapistId with pagination
 * URL: /api/feedback/therapist/:therapistId?page=1&limit=20
 */
router.get(
  '/therapist/:therapistId',
  protect,
  [
    param('therapistId').custom(isValidObjectId).withMessage('Invalid therapist ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation error: GET /feedback/therapist', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { therapistId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Role‑based control
      if (req.user.role === 'Therapist' && req.user._id.toString() !== therapistId) {
        return res.status(403).json({ error: 'Forbidden: access denied' });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filter = { therapist: therapistId };

      const total = await SupervisorFeedback.countDocuments(filter);

      const feedbacks = await SupervisorFeedback.find(filter)
        .populate(feedbackPopulateFields)
        .sort({ feedbackDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      res.json({
        feedbacks,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      log('Error fetching feedback by therapist:', err);
      res.status(500).json({ error: 'Server error fetching feedback by therapist' });
    }
  }
);

/**
 * GET feedback by sessionId with pagination
 * URL: /api/feedback/session/:sessionId?page=1&limit=20
 */
router.get(
  '/session/:sessionId',
  protect,
  [
    param('sessionId').custom(isValidObjectId).withMessage('Invalid session ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation error: GET /feedback/session', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { sessionId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filter = { therapySession: sessionId };

      const total = await SupervisorFeedback.countDocuments(filter);

      const feedbacks = await SupervisorFeedback.find(filter)
        .populate(feedbackPopulateFields)
        .sort({ feedbackDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      res.json({
        feedbacks,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      log('Error fetching feedback by session:', err);
      res.status(500).json({ error: 'Server error fetching feedback by session' });
    }
  }
);

/**
 * GET feedback list with filtering, pagination, and role-based access
 */
router.get(
  '/',
  protect,
  [
    query('session').optional().custom(isValidObjectId).withMessage('Invalid therapy session ID.'),
    query('therapist').optional().custom(isValidObjectId).withMessage('Invalid therapist ID.'),
    query('supervisor').optional().custom(isValidObjectId).withMessage('Invalid supervisor ID.'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log('Validation errors on feedback fetch:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { session, therapist, supervisor, page = 1, limit = 20 } = req.query;

      const filter = {};
      if (session) filter.therapySession = session;
      if (therapist) filter.therapist = therapist;
      if (supervisor) filter.supervisor = supervisor;

      if (req.user.role === 'Therapist') {
        filter.therapist = req.user._id;
      }
      if (req.user.role === 'Supervisor') {
        filter.supervisor = req.user._id;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await SupervisorFeedback.countDocuments(filter);

      const feedbacks = await SupervisorFeedback.find(filter)
        .populate(feedbackPopulateFields)
        .sort({ feedbackDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      res.json({
        feedbacks,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      log('Error fetching feedback list:', err.stack || err);
      res.status(500).json({ error: 'Error fetching feedback list.' });
    }
  }
);

export default router;
