import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Ensure DNS SRV queries resolve reliably across all node environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectMongo = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('Successfully connected to MongoDB.');
      return m;
    }).catch((err) => {
      console.error('Error connecting to MongoDB:', err);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
};

const tutorHistorySchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  messages: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export const TutorHistory = mongoose.models.TutorHistory || mongoose.model('TutorHistory', tutorHistorySchema);
