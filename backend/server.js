const express = require("express");
const cors = require("cors");

require("dotenv").config({ path: __dirname + "/.env" });
console.log("ENV CHECK:", process.env.MONGO_URI);

const connectDB = require("./config/db");

const app = express(); // 🔴 app MUST be created before use

app.use(cors());
app.use(express.json());

// ROUTES AFTER app initialization
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
    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  } catch (err) {
    console.error("Failed to start server due to DB error:", err);

    if (process.env.DEV_LOGIN === 'true') {
      console.warn("DEV_LOGIN enabled — starting server despite DB error (dev only).");
      app.listen(5000, () => {
        console.log("Server running on port 5000 (DEV mode, DB disconnected)");
      });
      return;
    }

    // Exit so the developer can fix environment/config and restart
    process.exit(1);
  }
}

startServer();
