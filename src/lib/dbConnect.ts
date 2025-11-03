// src/lib/dbConnect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

const resolvedMongoUri = MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

const globalCache = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

if (!globalCache.mongoose) {
  globalCache.mongoose = { conn: null, promise: null };
}

const cached = globalCache.mongoose as MongooseCache;

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(resolvedMongoUri, opts)
      .then((connection) => connection);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
