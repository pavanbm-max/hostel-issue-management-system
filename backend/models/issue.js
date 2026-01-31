const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    category: {
      type: String,
      enum: ["plumbing", "electrical", "cleanliness", "internet", "other"],
      required: true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low"
    },

    status: {
      type: String,
      enum: ["reported", "assigned", "in_progress", "resolved", "closed"],
      default: "reported"
    },

    hostel: String,
    room: String,

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    assignedTo: String,

    // ✅ ADD THESE TWO (THIS IS THE FIX)
    resolutionNote: {
      type: String
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);
