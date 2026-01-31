const express = require("express");
const cors = require("cors");

// Load environment variables
require("dotenv").config({ path: __dirname + "/.env" });
console.log("ENV mode:", process.env.NODE_ENV || "development");

const connectDB = require("./config/db");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
const issueRoutes = require("./routes/issues");
app.use("/api/issues", issueRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

// Start server only after DB connection succeeds
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB error:", err);
    // Exit so the deployer can fix environment/config and restart
    process.exit(1);
  }
}

startServer();

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Recommended: send to monitoring, then exit
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Recommended: send to monitoring, then exit
  process.exit(1);
});
