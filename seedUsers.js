// seedUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const therapists = [
  { name: "Aanchal Harjai", username: "aanchalharjai", email: "aanchal@example.com" },
  { name: "Meenakshi Moorjani", username: "meenakshim", email: "meenakshi@example.com" },
  { name: "Kavya Arora", username: "kavyaarora", email: "kavya@example.com" },
  { name: "Kripanidh Kaur", username: "kripanidhk", email: "kripanidh@example.com" },
  { name: "Ambika Chawla", username: "ambikachawla", email: "ambika@example.com" },
  { name: "Jasar Khan", username: "jasarkhan", email: "jasar@example.com" },
  { name: "AJ", username: "ajtherapist", email: "aj@example.com" },
  { name: "Kratika Gupta", username: "kratikagupta", email: "kratika@example.com" },
  { name: "Rimple Darra", username: "rimpledarra", email: "rimple@example.com" },
  { name: "Sanjana Shyam", username: "sanjanashyam", email: "sanjana@example.com" },
  { name: "Nuzhat Basheer", username: "nuzhatbasheer", email: "nuzhat@example.com" },
  { name: "Neetu Thomas", username: "neetuthomas", email: "neetu@example.com" },
  { name: "Bhavya Verma", username: "bhavyaverma", email: "bhavya@example.com" },
  { name: "Muskan Jaggi", username: "muskanjaggi", email: "muskanj@example.com" },
  { name: "Nandini Garg", username: "nandiniga", email: "nandini@example.com" },
  { name: "Shemida Rayan", username: "shemidarayan", email: "shemida@example.com" },
  { name: "Ashriya Malik", username: "ashriyamalik", email: "ashriya@example.com" },
  { name: "Sannidhi Surop", username: "sannidhisurop", email: "sannidhi@example.com" },
  { name: "Janvi Kapur", username: "janvikapur", email: "janvi@example.com" },
  { name: "Shouvik Sarkar", username: "shouviksarkar", email: "shouvik@example.com" },
  { name: "Kedar Sharma", username: "kedarsharma", email: "kedar@example.com" },
  { name: "Saachi Arora", username: "saachiarora", email: "saachi@example.com" },
  { name: "Simar Dang", username: "simardang", email: "simar@example.com" },
  { name: "Muskan Mehta", username: "muskanmehta", email: "muskanmehta@example.com" },
  { name: "Ashna Prahlad", username: "ashnaprahlad", email: "ashna@example.com" },
];

const supervisors = [
  { name: "Dr. S. R. Deepa", username: "deepasuper", email: "sdeepa@example.com" },
  { name: "Dr. Sangeetha Albin", username: "albinsuper", email: "salbin@example.com" },
  { name: "Dr. D. Rajasekar", username: "rajasekarsuper", email: "drajasekar@example.com" },
  { name: "Dr. A. Shameem", username: "shameemsuper", email: "ashameem@example.com" },
  { name: "Dr. J. Rengamani", username: "rengamanisuper", email: "jrengamani@example.com" },
  { name: "Dr. S. Poongavanan", username: "poongavanansuper", email: "spoongavanan@example.com" },
  { name: "Dr. R. Srinivasan", username: "srinivasansuper", email: "rsrinivasan@example.com" },
  { name: "Dr. R. Vettriselvan", username: "vettriselvansuper", email: "rvettriselvan@example.com" },
  { name: "Dr. D. Arivazhagan", username: "arivazhagansuper", email: "darivazhagan@example.com" },
  { name: "Dr. I. Haroon Basha", username: "basha", email: "bharoonbasha@example.com" },
  { name: "Dr. S. Srinivasan", username: "ssrinivasan", email: "ssrinivasan@example.com" },
  { name: "Dr. D. Sivakumar", username: "sivakumarsuper", email: "dsivakumar@example.com" },
  { name: "Dr. K. Sampath Kumar", username: "sampathsuper", email: "ksampathkumar@example.com" },
  { name: "Dr. C. Vairavan", username: "vairavansuper", email: "cvairavan@example.com" },
  { name: "Dr. M. Subha", username: "subhasuper", email: "msubha@example.com" },
];

// Default password for all seeded users
const DEFAULT_PASSWORD = 'test1234';

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // Combine all users with their roles
    const users = [
      ...therapists.map(user => ({ ...user, role: 'Therapist' })),
      ...supervisors.map(user => ({ ...user, role: 'Supervisor' })),
    ];

    // Clear existing therapists and supervisors to prevent duplicates
    await User.deleteMany({ role: { $in: ['Therapist', 'Supervisor'] } });

    // Seed users with hashed passwords
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      try {
        await User.create({
          ...user,
          password: hashedPassword,
        });
        console.log(`Added user: ${user.name} (${user.role})`);
      } catch (err) {
        console.error(`Failed to add user ${user.name}:`, err.message);
      }
    }

    console.log('Seeded all therapists and supervisors successfully!');
  } catch (error) {
    console.error('Seeding encountered an error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
