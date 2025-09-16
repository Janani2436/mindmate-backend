import mongoose from 'mongoose';
const { Schema } = mongoose;

// Audit log sub-schema for feedback lifecycle actions
const FeedbackAuditLogSchema = new Schema({
  action: {
    type: String, // e.g. 'created', 'updated', 'approved'
    required: true,
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
  details: Schema.Types.Mixed, // flexible field for extra info
}, { _id: false });

const SupervisorFeedbackSchema = new Schema({
  therapySession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapySession',
    required: true,
    index: true,
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  feedbackText: {
    type: String,
    trim: true,
    required: true,
  },
  clinicalRating: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  feedbackDate: {
    type: Date,
    default: Date.now,
  },
  improvementSuggestions: {
    type: String,
    trim: true,
    default: '',
  },
  // Versioning (optional): increment each update to track changes
  version: {
    type: Number,
    default: 1,
  },
  // Digital signature placeholders (to be integrated with SignaturePad frontend)
  supervisorSignature: {
    type: String, // could store base64 image, or a reference
    default: null,
  },
  // Auditing lifecycle actions
  auditLog: {
    type: [FeedbackAuditLogSchema],
    default: [],
  },
}, {
  timestamps: true, // adds createdAt and updatedAt automatically
});

// Method: Add a new audit log entry (call this in controllers on create/update)
SupervisorFeedbackSchema.methods.logAction = function(action, byUserId, details = {}) {
  this.auditLog.push({
    action,
    by: byUserId,
    at: new Date(),
    details,
  });
};

// Compound index to speed up lookups (optional but recommended)
SupervisorFeedbackSchema.index({ therapySession: 1, supervisor: 1, therapist: 1, feedbackDate: -1 });

const SupervisorFeedback = mongoose.model('SupervisorFeedback', SupervisorFeedbackSchema);

export default SupervisorFeedback;
