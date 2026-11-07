const { z, ZodError } = require("zod");
const Complaint = require("../models/Complaint");
const { processComplaint } = require("../services/complaintPipeline");

const ComplaintFiltersSchema = z.strictObject({
  category: z.enum(["refund", "delay", "abuse", "other"]).optional(),
  urgency: z.enum(["low", "normal", "high", "urgent"]).optional(),
  status: z.enum(["new", "in_review", "resolved"]).optional(),
});

exports.getComplaints = async (req, res) => {
  try {
    const filters = ComplaintFiltersSchema.parse(req.query);
    const mongoFilter = {};

    if (filters.category) mongoFilter.issueType = filters.category;
    if (filters.urgency) mongoFilter.priority = filters.urgency;
    if (filters.status) mongoFilter.status = filters.status;

    const complaints = await Complaint.find(mongoFilter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ complaints });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid complaint filters",
        errors: error.issues,
      });
    }

    console.error("Failed to fetch complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

exports.createComplaint = async (req, res) => {
  try {
    const complaint = await processComplaint(req.body);
    res.status(201).json({ complaint });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid complaint data",
        errors: error.issues,
      });
    }

    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("Failed to process complaint:", error);
    }

    res.status(statusCode).json({
      message:
        statusCode === 500 ? "Failed to process complaint" : error.message,
    });
  }
};