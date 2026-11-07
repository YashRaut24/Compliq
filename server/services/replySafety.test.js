const test = require("node:test");
const assert = require("node:assert/strict");
const checkReplySafety = require("./replySafety");

test("allows a neutral reply that promises a review", () => {
  assert.doesNotThrow(() =>
    checkReplySafety("We're sorry. Our team will review your request.")
  );
});

test("rejects a claim that a refund was approved", () => {
  assert.throws(
    () => checkReplySafety("Your refund has been approved."),
    { statusCode: 502 }
  );
});

test("rejects a promise to refund the customer", () => {
  assert.throws(
    () => checkReplySafety("We will refund you tomorrow."),
    { statusCode: 502 }
  );
});