import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export const connectMongo = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

const tutorHistorySchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  messages: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export const TutorHistory = mongoose.model('TutorHistory', tutorHistorySchema);
