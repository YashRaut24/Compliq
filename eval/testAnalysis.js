const path = require("node:path");
const { createRequire } = require("node:module");

const serverRequire = createRequire(
  path.join(__dirname, "../server/package.json")
);

serverRequire("dotenv").config({
  path: path.join(__dirname, "../server/.env"),
});

const { z } = serverRequire("zod");
const { analyzeComplaint } = serverRequire("./analysis");
const samples = require("./analysisSamples");

const EvaluationSampleSchema = z.strictObject({
  message: z.string().trim().min(1),
  expectedIssueType: z.enum(["refund", "delay", "abuse", "other"]),
  expectedPriority: z.enum(["low", "normal", "high", "urgent"]),
  expectedSentiment: z.enum(["positive", "neutral", "negative"]),
});

function validateDataset() {
  if (samples.length !== 50) {
    throw new Error(`Expected exactly 50 labeled complaints; found ${samples.length}`);
  }

  samples.forEach((sample, index) => {
    try {
      EvaluationSampleSchema.parse(sample);
    } catch (error) {
      throw new Error(`Invalid evaluation sample ${index + 1}: ${error.message}`);
    }
  });

  return samples;
}

function getLimit(args, sampleCount) {
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  if (!limitArg) return sampleCount;

  const limit = Number(limitArg.slice("--limit=".length));
  if (!Number.isInteger(limit) || limit < 1 || limit > sampleCount) {
    throw new Error(`--limit must be an integer between 1 and ${sampleCount}`);
  }

  return limit;
}

async function main() {
  validateDataset();

  if (process.argv.includes("--validate-only")) {
    console.log(`Dataset valid: ${samples.length} labeled complaints.`);
    return;
  }

  const limit = getLimit(process.argv.slice(2), samples.length);
  const samplesToRun = samples.slice(0, limit);
  const fields = [
    ["issueType", "expectedIssueType"],
    ["priority", "expectedPriority"],
    ["sentiment", "expectedSentiment"],
  ];
  const matches = Object.fromEntries(fields.map(([field]) => [field, 0]));
  const resultsByIndex = [];
  let validCount = 0;
  let failures = 0;

  console.log(`Evaluating ${samplesToRun.length} of ${samples.length} complaints...`);

  for (const [index, sample] of samplesToRun.entries()) {
    try {
      const result = await analyzeComplaint(sample.message);
      resultsByIndex[index] = result;
      validCount += 1;

      const fieldResults = fields.map(([field, expectedField]) => {
        const matched = result[field] === sample[expectedField];
        if (matched) matches[field] += 1;
        return `${field} ${matched ? "OK" : `MISMATCH (expected ${sample[expectedField]}, got ${result[field]})`}`;
      });

      console.log(`${index + 1}. ${fieldResults.join(" | ")}`);
    } catch (error) {
      failures += 1;
      console.error(`${index + 1}. analysis failed: ${error.message}`);
    }

    if (index < samplesToRun.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`\nResults: ${validCount}/${samplesToRun.length} responses validated; ${failures} failures.`);
  for (const [field] of fields) {
    const accuracy = validCount
      ? `${((matches[field] / validCount) * 100).toFixed(1)}%`
      : "N/A";
    console.log(`${field} accuracy: ${matches[field]}/${validCount} (${accuracy})`);
  }

  if (validCount > 0) {
    const exactMatches = samplesToRun.reduce((count, sample, index) => {
      const result = resultsByIndex[index];
      return result &&
        fields.every(([field, expectedField]) => result[field] === sample[expectedField])
        ? count + 1
        : count;
    }, 0);
    console.log(`Exact match across all labels: ${exactMatches}/${validCount}`);
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Evaluation failed: ${error.message}`);
  process.exitCode = 1;
});
