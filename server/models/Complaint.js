const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["whatsapp", "email", "other"],
      default: "other",
    },
    issueType: {
      type: String,
      enum: ["refund", "delay", "abuse", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    replyDraft: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in_review", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);