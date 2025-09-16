// seedClinicalData.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import TherapyCase from './models/TherapyCase.js';
import TherapySession from './models/TherapySession.js';
import SupervisorFeedback from './models/SupervisorFeedback.js';
import User from './models/User.js';

dotenv.config();

async function seedClinicalData() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI);

    // Fetch therapists and supervisors from DB
    const therapists = await User.find({ role: 'Therapist' });
    const supervisors = await User.find({ role: 'Supervisor' });

    if (therapists.length === 0 || supervisors.length === 0) {
      throw new Error('Please seed therapists and supervisors users before running this script.');
    }

    // Clear existing clinical data
    await TherapyCase.deleteMany({});
    await TherapySession.deleteMany({});
    await SupervisorFeedback.deleteMany({});

    // Create a sample therapy case
    const newCase = await TherapyCase.create({
      patientName: 'John Doe',
      patientId: 'patient-001', // Optional, can be any string or linked to a user
      diagnosis: 'General Anxiety Disorder',
      allocatedTherapist: therapists[0]._id,
      supervisor: supervisors[0]._id,
      therapyPlan: {
        goals: ['Reduce anxiety', 'Improve sleep quality'],
        activities: ['Cognitive Behavioral Therapy', 'Relaxation Exercises'],
        notes: 'Initial plan setup for patient',
        status: 'Draft',
        dateCreated: new Date(),
      },
      progressReports: [],
      sessions: [],
      caseStatus: 'Active',
    });

    // Create a therapy session linked to above case
    const newSession = await TherapySession.create({
      therapyCase: newCase._id,
      therapist: therapists[0]._id,
      supervisor: supervisors[0]._id,
      sessionDate: new Date(),
      notes: 'First therapy session notes',
      goalsAddressed: ['Reduce anxiety'],
      activitiesConducted: ['Cognitive Behavioral Therapy'],
      moodObservations: 'Patient was motivated and attentive',
      attendance: { present: true, remarks: 'On time' },
      supervisorFeedback: {
        feedback: 'Good start with patient engagement.',
        approved: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Link the session into the therapy case and save
    newCase.sessions.push(newSession._id);
    await newCase.save();

    // Create supervisor feedback for this session
    await SupervisorFeedback.create({
      therapySession: newSession._id,
      supervisor: supervisors[0]._id,
      therapist: therapists[0]._id,
      feedbackText: 'Excellent engagement from the therapist, patient shows good progress.',
      clinicalRating: 8,
      improvementSuggestions: 'Encourage patient to practice breathing exercises daily.',
      feedbackDate: new Date(),
    });

    console.log('✅ Sample clinical data seeded successfully.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error seeding clinical data:', err);
    process.exit(1);
  }
}

seedClinicalData();
