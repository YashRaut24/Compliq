const prohibitedRefundClaims = [
  /\b(?:we|i)\s+(?:will|can|have)\s+(?:issue|process|approve|deny|reject)\s+(?:your\s+|a\s+|the\s+)?refund\b/i,
  /\bwe(?:'ll| will)\s+refund\s+you\b/i,
  /\b(?:your refund|refund)\s+(?:has been|was|is)\s+(?:issued|processed|approved|denied|rejected)\b/i,
  /\b(?:you are|you're)\s+(?:eligible|entitled)\s+to\s+(?:a\s+)?refund\b/i,
];

function checkReplySafety(replyDraft) {
  const violatesPolicy = prohibitedRefundClaims.some((pattern) =>
    pattern.test(replyDraft)
  );

  if (violatesPolicy) {
    const error = new Error("Generated reply failed the safety check");
    error.statusCode = 502;
    throw error;
  }
}

module.exports = checkReplySafety;