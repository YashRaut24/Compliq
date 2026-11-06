function notImplemented(_req, res) {
  res.status(501).json({ message: "Not implemented" });
}

exports.getComplaints = notImplemented;

const { ZodError } = require("zod");
const { processComplaint } = require("../services/complaintPipeline");

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
    const message =
      statusCode === 500 ? "Failed to process complaint" : error.message;

    res.status(statusCode).json({ message });
  }
};