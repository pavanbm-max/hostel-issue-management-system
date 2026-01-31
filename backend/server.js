const express = require("express");
const cors = require("cors");

require("dotenv").config({ path: __dirname + "/.env" });
console.log("ENV CHECK:", process.env.MONGO_URI);

const connectDB = require("./config/db");
connectDB();

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

