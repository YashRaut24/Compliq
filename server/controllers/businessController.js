const mongoose = require("mongoose");
const { z, ZodError } = require("zod");
const Business = require("../models/Business");

const BusinessInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  industry: z.string().trim().max(120).default(""),
});

const BusinessUpdateSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120).optional(),
    industry: z.string().trim().max(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one business field is required",
  });

exports.getBusinesses = (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

exports.getBusiness = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid business ID" });
  }

  try {
    const business = await Business.findById(req.params.id).lean();

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json({ business });
  } catch (error) {
    console.error("Failed to fetch business:", error);
    res.status(500).json({ message: "Failed to fetch business" });
  }
};

exports.createBusiness = async (req, res) => {
  try {
    const input = BusinessInputSchema.parse(req.body);
    const business = await Business.create(input);
    res.status(201).json({ business });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid business profile",
        errors: error.issues,
      });
    }

    console.error("Failed to create business:", error);
    res.status(500).json({ message: "Failed to create business" });
  }
};

exports.updateBusiness = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid business ID" });
  }

  let input;
  try {
    input = BusinessUpdateSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid business profile",
        errors: error.issues,
      });
    }
    throw error;
  }

  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { $set: input },
      { new: true, runValidators: true },
    ).lean();

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json({ business });
  } catch (error) {
    console.error("Failed to update business:", error);
    res.status(500).json({ message: "Failed to update business" });
  }
};