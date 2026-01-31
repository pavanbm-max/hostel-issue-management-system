const express = require("express");
const Issue = require("../models/issue");
const { protect, isManagement } = require("../middleware/auth");

const router = express.Router();

/* ===============================
   CREATE ISSUE (Student)
================================ */
router.post("/", protect, async (req, res) => {
  try {
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
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolutionNote: req.body.resolutionNote,
        resolvedAt: new Date()
      },
      { new: true }
    );

    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET SINGLE ISSUE (Management)
router.get("/:id", protect, isManagement, async (req, res) => {
  try {
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
