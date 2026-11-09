const Complaint = require("../models/Complaint");

const CATEGORY_VALUES = ["refund", "delay", "abuse", "other"];
const PRIORITY_VALUES = ["low", "normal", "high", "urgent"];
const STATUS_VALUES = ["new", "in_review", "resolved"];
const SENTIMENT_VALUES = ["positive", "neutral", "negative"];

function fillCounts(values, groups) {
  const counts = Object.fromEntries(values.map((value) => [value, 0]));

  for (const group of groups) {
    if (Object.hasOwn(counts, group._id)) {
      counts[group._id] = group.count;
    }
  }

  return counts;
}

exports.getStats = async (_req, res) => {
  try {
    const [stats] = await Complaint.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                unresolved: {
                  $sum: {
                    $cond: [{ $in: ["$status", ["new", "in_review"]] }, 1, 0],
                  },
                },
                urgent: {
                  $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
                },
              },
            },
          ],
          categories: [
            { $group: { _id: "$issueType", count: { $sum: 1 } } },
          ],
          priorities: [
            { $group: { _id: "$priority", count: { $sum: 1 } } },
          ],
          statuses: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          sentiments: [
            { $group: { _id: "$sentiment", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const overview = stats.overview[0] || {
      total: 0,
      unresolved: 0,
      urgent: 0,
    };


    res.status(200).json({
      total: overview.total,
      unresolved: overview.unresolved,
      urgent: overview.urgent,
      byCategory: fillCounts(CATEGORY_VALUES, stats.categories),
      byPriority: fillCounts(PRIORITY_VALUES, stats.priorities),
      byStatus: fillCounts(STATUS_VALUES, stats.statuses),
      bySentiment: fillCounts(SENTIMENT_VALUES, stats.sentiments),
    });
  } catch (error) {
    console.error("Failed to fetch complaint stats:", error);
    res.status(500).json({ message: "Failed to fetch complaint stats" });
  }
};