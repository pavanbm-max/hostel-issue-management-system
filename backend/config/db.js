const mongoose = require("mongoose");

// Opt-in to strict query parsing (recommended for Mongoose 6+)
mongoose.set('strictQuery', true);

const connectDB = async () => {
  console.log("connectDB function CALLED");

  if (!process.env.MONGO_URI) {
    const msg = "Missing MONGO_URI in environment. Add it to backend/.env or environment variables.";
    console.error(msg);
    throw new Error(msg);
  }

  try {
    // Mongoose 6+ manages parser and topology options internally; don't pass deprecated options
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    // Re-throw so caller can decide to exit or retry
    throw err;
  }
};

module.exports = connectDB;
