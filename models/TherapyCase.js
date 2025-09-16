import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schemas for future-proofing and clarity

const TherapyPlanSchema = new Schema({
  goals: [{ type: String, trim: true }],
  activities: [{ type: String, trim: true }],
  notes: { type: String, trim: true },
  dateCreated: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Submitted', 'Approved', 'Rejected'], default: 'Draft' },
  supervisorFeedback: { type: String, trim: true },
  supervisorApprovalDate: Date,
}, { _id: false });

const ProgressReportSchema = new Schema({
  report: { type: String, trim: true, required: true },
  sessionCount: { type: Number, min: 1 },
  submittedAt: { type: Date, default: Date.now },
  evaluated: { type: Boolean, default: false },
  supervisorRemarks: { type: String, trim: true },
  clinicalRating: { type: Number, min: 1, max: 5 }, // For supervisor scoring (1–5/10, etc.)
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Traceability
}, { _id: true });

// For full audit and future digital signatures (patent leverage)
const CaseAuditLogSchema = new Schema({
  action: String, // e.g., 'created', 'plan_approved', 'progress_report_submitted'
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
  details: Schema.Types.Mixed,
}, { _id: false });

const TherapyCaseSchema = new Schema({
  // --- Patient Info ---
  patientName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  patientId: {
    type: String,
    required: false,
    index: true,
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true,
  },
  languagePreference: {
    type: String,
    enum: ['English', 'Hindi', 'Other'],
    default: 'English',
  },

  // --- Assignment ---
  allocatedTherapist: {
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

  // --- Clinical Plan & Progress ---
  therapyPlan: { type: TherapyPlanSchema, default: {} },
  progressReports: [ProgressReportSchema],

  // --- Sessions ---
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapySession'
  }],

  // --- Statuses ---
  caseStatus: {
    type: String,
    enum: ['Open', 'Active', 'Closed', 'Discontinued'],
    default: 'Active',
    index: true,
  },

  // --- Ratings & Closure ---
  clinicalRating: { type: Number, min: 1, max: 5 }, // Final overall rating, for audits

  // --- Audit Trail & Extensions ---
  auditLog: [CaseAuditLogSchema],

  // --- Meta ---
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: false, // we use createdAt & updatedAt fields explicitly
});

// Always update updatedAt on modification (robustness for patent/audit)
TherapyCaseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

TherapyCaseSchema.pre('updateOne', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Patentable: log life events in auditLog
TherapyCaseSchema.methods.logAction = function (action, byUser, details = {}) {
  this.auditLog = this.auditLog || [];
  this.auditLog.push({
    action,
    by: byUser,
    at: new Date(),
    details,
  });
};

// For advanced search/indexing in the future (startup-grade)
TherapyCaseSchema.index({ patientName: 1, diagnosis: 1, caseStatus: 1 });

const TherapyCase = mongoose.model('TherapyCase', TherapyCaseSchema);

export default TherapyCase;
