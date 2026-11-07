const { z } = require("zod");
const mongoose = require("mongoose");
const Business = require("../models/Business");
const Complaint = require("../models/Complaint");
const { analyzeComplaint } = require("../analysis");
const checkReplySafety = require("./replySafety");

const ComplaintInputSchema = z.strictObject({
  businessId: z
    .string()
    .trim()
    .refine((id) => mongoose.isValidObjectId(id), "Invalid businessId"),
  message: z.string().trim().min(1).max(5000),
  source: z.enum(["whatsapp", "email", "other"]).default("other"),
});

function pipelineError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function processComplaint(input) {
  const parsed = ComplaintInputSchema.parse(input);
  const normalizedMessage = parsed.message.replace(/\r\n?/g, "\n").trim();

  const business = await Business.findById(parsed.businessId).select("_id");

  if (!business) {
    throw pipelineError("Business not found", 404);
  }

  // analyzeComplaint drafts the reply and validates the model output with Zod.
  const analysis = await analyzeComplaint(normalizedMessage);
  checkReplySafety(analysis.replyDraft);

  return Complaint.create({
    business: business._id,
    message: normalizedMessage,
    source: parsed.source,
    ...analysis,
    status: "new",
  });
}

module.exports = { processComplaint };