import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import TherapyCase from '../models/TherapyCase.js';
import TherapySession from '../models/TherapySession.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- ADVANCED ROLE CHECKS ---
async function validateUserRole(id, role) {
  if (!isValidObjectId(id)) return false;
  const user = await User.findById(id).lean();
  return user && user.role === role;
}

// --- CREATE Therapy Case ---
router.post(
  '/',
  protect,
  [
    body('patientName').notEmpty().withMessage('Patient name required.'),
    body('diagnosis').notEmpty().withMessage('Diagnosis required.'),
    body('allocatedTherapist')
      .notEmpty().withMessage('Therapist required.')
      .custom(isValidObjectId).withMessage('Invalid therapist ID.'),
    body('supervisor')
      .notEmpty().withMessage('Supervisor required.')
      .custom(isValidObjectId).withMessage('Invalid supervisor ID.'),
  ],
  async (req, res) => {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Check therapist and supervisor exist and correct role
      const [isValidTherapist, isValidSupervisor] = await Promise.all([
        validateUserRole(req.body.allocatedTherapist, 'Therapist'),
        validateUserRole(req.body.supervisor, 'Supervisor'),
      ]);
      if (!isValidTherapist)
        return res.status(400).json({ error: 'Allocated therapist not found or invalid role.' });
      if (!isValidSupervisor)
        return res.status(400).json({ error: 'Supervisor not found or invalid role.' });

      // Create the therapy case
      const data = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        caseStatus: 'Active',
        progressReports: [],
      };
      const therapyCase = await TherapyCase.create(data);

      // Respond with full populated data
      const populatedCase = await TherapyCase.findById(therapyCase._id)
        .populate('allocatedTherapist', 'name email role')
        .populate('supervisor', 'name email role')
        .lean();

      res.status(201).json(populatedCase);
    } catch (err) {
      console.error('[TherapyCase][Create]', err);
      res.status(500).json({ error: 'Error creating therapy case.' });
    }
  }
);

// --- GET All Therapy Cases (POPULATED) ---
router.get('/', protect, async (req, res) => {
  try {
    const cases = await TherapyCase.find()
      .populate('allocatedTherapist', 'name email role')
      .populate('supervisor', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
    res.json(cases);
  } catch (err) {
    console.error('[TherapyCase][GET All]', err);
    res.status(500).json({ error: 'Unable to fetch therapy cases.' });
  }
});

// --- GET Therapy Case by ID (DEEP POPULATED) ---
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ error: 'Invalid therapy case ID.' });

  try {
    const therapyCase = await TherapyCase.findById(id)
      .populate('allocatedTherapist', 'name email role')
      .populate('supervisor', 'name email role')
      .populate({
        path: 'sessions',
        populate: { path: 'therapist supervisor', select: 'name' },
      })
      .lean();

    if (!therapyCase) return res.status(404).json({ error: 'Therapy case not found.' });
    res.json(therapyCase);
  } catch (err) {
    console.error('[TherapyCase][GET by ID]', err);
    res.status(500).json({ error: 'Unable to fetch therapy case.' });
  }
});

// --- UPDATE Therapy Case (Plan, Status, etc.) ---
router.put(
  '/:id',
  protect,
  [
    body('therapyPlan.goals').optional().isArray(),
    body('therapyPlan.activities').optional().isArray(),
    body('therapyPlan.status').optional().isIn(['Draft', 'Submitted', 'Approved', 'Rejected']),
    body('caseStatus').optional().isIn(['Open', 'Active', 'Closed', 'Discontinued']),
  ],
  async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: 'Invalid therapy case ID.' });

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const therapyCase = await TherapyCase.findById(id);
      if (!therapyCase) return res.status(404).json({ error: 'Therapy case not found.' });

      // Only allow white-listed fields
      const allowedUpdates = ['therapyPlan', 'caseStatus', 'updatedAt'];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) therapyCase[field] = req.body[field];
      });
      therapyCase.updatedAt = new Date();

      await therapyCase.save();

      // Return updated with population for frontend needs
      const updatedCase = await TherapyCase.findById(id)
        .populate('allocatedTherapist', 'name email role')
        .populate('supervisor', 'name email role')
        .populate({
          path: 'sessions',
          populate: { path: 'therapist supervisor', select: 'name' },
        })
        .lean();

      res.json(updatedCase);
    } catch (err) {
      console.error('[TherapyCase][Update]', err);
      res.status(500).json({ error: 'Update failed.' });
    }
  }
);

// --- ADD Progress Report ---
router.post(
  '/:id/progress-report',
  protect,
  [
    body('report').notEmpty().withMessage('Report content required.'),
    body('sessionCount').isInt().withMessage('Session count must be a number.'),
  ],
  async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: 'Invalid therapy case ID.' });

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const therapyCase = await TherapyCase.findById(id);
      if (!therapyCase) return res.status(404).json({ error: 'Therapy case not found.' });

      therapyCase.progressReports = therapyCase.progressReports || [];
      therapyCase.progressReports.push({
        ...req.body,
        submittedAt: new Date(),
        evaluated: false,
      });

      therapyCase.updatedAt = new Date();
      await therapyCase.save();

      // Optionally return full case (populated) if frontend needs context
      const updatedCase = await TherapyCase.findById(id)
        .populate('allocatedTherapist', 'name email role')
        .populate('supervisor', 'name email role')
        .populate({
          path: 'sessions',
          populate: { path: 'therapist supervisor', select: 'name' },
        })
        .lean();

      res.json({
        message: 'Progress report added.',
        progressReports: updatedCase.progressReports,
      });
    } catch (err) {
      console.error('[TherapyCase][ProgressReport]', err);
      res.status(500).json({ error: 'Failed to add report.' });
    }
  }
);

// --- GET Progress Reports for a Case ---
router.get('/:id/progress-reports', protect, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ error: 'Invalid therapy case ID.' });

  try {
    const therapyCase = await TherapyCase.findById(id, 'progressReports').lean();
    if (!therapyCase) return res.status(404).json({ error: 'Therapy case not found.' });
    res.json(therapyCase.progressReports);
  } catch (err) {
    console.error('[TherapyCase][GET ProgressReports]', err);
    res.status(500).json({ error: 'Failed to fetch progress reports.' });
  }
});

export default router;
