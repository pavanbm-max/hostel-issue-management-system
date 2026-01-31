const express = require("express");
const mongoose = require("mongoose");
const Issue = require("../models/issue");
const { protect, isManagement } = require("../middleware/auth");

const router = express.Router();

// --- Development fallback dataset (used only if DB is disconnected and DEV_LOGIN=true)
let devIssues = [
  {
    _id: "dev-1",
    title: "Leaky faucet",
    category: "plumbing",
    hostel: "H1",
    room: "101",
    priority: "high",
    status: "reported",
    description: "Sink leaking",
    createdAt: new Date(Date.now() - 60 * 60 * 1000)
  },
  {
    _id: "dev-2",
    title: "Light not working",
    category: "electrical",
    hostel: "H1",
    room: "102",
    priority: "low",
    status: "reported",
    description: "Bulb burned",
    createdAt: new Date()
  }
];

const dbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

/* ===============================
   CREATE ISSUE (Student)
================================ */
router.post("/", protect, async (req, res) => {
  try {
    if (!dbConnected() && process.env.DEV_LOGIN === 'true') {
      // Append to devIssues and return
      const newIssue = { _id: `dev-${Date.now()}`, ...req.body, status: 'reported', createdAt: new Date() };
      devIssues.unshift(newIssue);
      return res.status(201).json(newIssue);
    }

    const { title, category, hostel, room } = req.body;

    const recentDuplicate = await Issue.findOne({
      title,
      category,
      hostel,
      room,
      createdAt: {
        $gte: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    });

    if (recentDuplicate) {
      return res.status(409).json({
        message: "Similar issue already reported recently"
      });
    }

    const issue = await Issue.create(req.body);
    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   DASHBOARD SUMMARY (Management)
================================ */
router.get("/stats/summary", protect, isManagement, async (req, res) => {
  try {
    if (!dbConnected() && process.env.DEV_LOGIN === 'true') {
      const totalIssues = devIssues.length;
      const pendingIssues = devIssues.filter(i => i.status !== 'resolved').length;
      const resolvedIssues = devIssues.filter(i => i.status === 'resolved').length;
      const highPriorityIssues = devIssues.filter(i => i.priority === 'high').length;

      return res.json({ totalIssues, pendingIssues, resolvedIssues, highPriorityIssues });
    }

    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({
      status: { $ne: "resolved" }
    });
    const resolvedIssues = await Issue.countDocuments({
      status: "resolved"
    });
    const highPriorityIssues = await Issue.countDocuments({
      priority: "high"
    });

    res.json({
      totalIssues,
      pendingIssues,
      resolvedIssues,
      highPriorityIssues
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   PRIORITY ESCALATION (WIN 2)
================================ */
router.get("/escalated", protect, isManagement, async (req, res) => {
  try {
    if (!dbConnected() && process.env.DEV_LOGIN === 'true') {
      const threshold = new Date(Date.now() - 1 * 60 * 1000); // demo: 1 min
      const escalatedIssues = devIssues.filter(i => i.priority === 'high' && i.status !== 'resolved' && i.createdAt <= threshold).sort((a,b) => a.createdAt - b.createdAt);
      return res.json(escalatedIssues);
    }

    const threshold = new Date(Date.now() - 1 * 60 * 1000); // demo: 1 min

    const escalatedIssues = await Issue.find({
      priority: "high",
      status: { $ne: "resolved" },
      createdAt: { $lte: threshold }
    }).sort({ createdAt: 1 });

    res.json(escalatedIssues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   GET ALL ISSUES (Management)
================================ */
router.get("/", protect, isManagement, async (req, res) => {
  try {
    if (!dbConnected() && process.env.DEV_LOGIN === 'true') {
      return res.json(devIssues);
    }

    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   UPDATE ISSUE (Management)
================================ */
// UPDATE ISSUE STATUS (Management)
router.put("/:id", protect, isManagement, async (req, res) => {
  console.log("PUT /api/issues/:id called", { id: req.params.id, body: req.body, dbConnected: dbConnected(), isValidObjectId: mongoose.Types.ObjectId.isValid(req.params.id) });
  try {
    // If DB not ready OR the provided id is not a valid ObjectId, and DEV_LOGIN is enabled,
    // operate against the in-memory dev dataset to avoid ObjectId cast errors for dev ids.
    if (( !dbConnected() || !mongoose.Types.ObjectId.isValid(req.params.id) ) && process.env.DEV_LOGIN === 'true') {
      // Update in-memory devIssues
      const idx = devIssues.findIndex(i => i._id === req.params.id);
      if (idx === -1) {
        console.log("Dev dataset: issue not found", req.params.id);
        return res.status(404).json({ message: 'Issue not found (dev dataset)' });
      }
      devIssues[idx] = { ...devIssues[idx], status: 'resolved', resolutionNote: req.body.resolutionNote || '', resolvedAt: new Date() };
      console.log("Dev dataset: issue updated", devIssues[idx]);
      return res.json(devIssues[idx]);
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolutionNote: req.body.resolutionNote,
        resolvedAt: new Date()
      },
      { new: true }
    );

    console.log("DB update result:", issue);
    res.json(issue);
  } catch (err) {
    console.error("Update issue error", err, { id: req.params.id, body: req.body });
    res.status(500).json({ error: err.message });
  }
});


// GET SINGLE ISSUE (Management)
router.get("/:id", protect, isManagement, async (req, res) => {
  try {
    if (!dbConnected() && process.env.DEV_LOGIN === 'true') {
      const issue = devIssues.find(i => i._id === req.params.id);
      if (!issue) return res.status(404).json({ message: 'Issue not found (dev dataset)' });
      return res.json(issue);
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
