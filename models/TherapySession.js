import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schema for Attendance so we keep remarks structured & auditable
const AttendanceSchema = new Schema({
  present: { type: Boolean, default: true },
  remarks: { type: String, trim: true, default: '' },
}, { _id: false });

// Sub-schema for Supervisor Feedback with audit trail and approval
const SupervisorFeedbackSchema = new Schema({
  feedback: { type: String, trim: true, default: '' },
  approved: { type: Boolean, default: false },
  reviewedAt: Date,
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // track who reviewed
}, { _id: false });

// Sub-schema for audit logs on session level (for future proof, sign-offs, logs)
const SessionAuditLogSchema = new Schema({
  action: String, // e.g. 'created', 'updated', 'feedback_added', 'attendance_marked'
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
  details: Schema.Types.Mixed,
}, { _id: false });

const TherapySessionSchema = new Schema({
  therapyCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapyCase',
    required: true,
    index: true,
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  goalsAddressed: [{
    type: String,
    trim: true,
  }],
  activitiesConducted: [{
    type: String,
    trim: true,
  }],
  moodObservations: {
    type: String,
    trim: true,
    default: '',
  },
  attendance: {
    type: AttendanceSchema,
    default: () => ({}),
  },
  supervisorFeedback: {
    type: SupervisorFeedbackSchema,
    default: () => ({}),
  },

  // Audit trail on session changes
  auditLog: [SessionAuditLogSchema],

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: Date
}, {
  timestamps: false, // manually managed timestamps
});

// Middleware to always set updatedAt on save and update
TherapySessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

TherapySessionSchema.pre('updateOne', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Patent-ready audit log method
TherapySessionSchema.methods.logAction = function(action, byUser, details = {}) {
  this.auditLog = this.auditLog || [];
  this.auditLog.push({
    action,
    by: byUser,
    at: new Date(),
    details,
  });
};

const TherapySession = mongoose.model('TherapySession', TherapySessionSchema);

export default TherapySession;
