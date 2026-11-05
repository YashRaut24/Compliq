const path = require("node:path");
const { createRequire } = require("node:module");


const serverRequire = createRequire(
  path.join(__dirname, "../server/package.json")
);

serverRequire("dotenv").config({
  path: path.join(__dirname, "../server/.env"),
});

const { analyzeComplaint } = serverRequire("./analysis");
const samples = require("./analysisSamples");

async function main() {
  let validCount = 0;
  let categoryMatches = 0;

  for (const [index, sample] of samples.entries()) {
    try {
      const result = await analyzeComplaint(sample.message);
      validCount += 1;

      const matches = result.issueType === sample.expectedIssueType;
      if (matches) categoryMatches += 1;

      console.log(
        `${index + 1}. schema valid; expected ${sample.expectedIssueType}, got ${result.issueType}${matches ? "" : " — review"}`
      );
      console.log(JSON.stringify(result));
    } catch (error) {
      console.error(`${index + 1}. analysis failed: ${error.message}`);
    }
  }

  console.log(
    `\nValid responses: ${validCount}/${samples.length}; issue-type matches: ${categoryMatches}/${samples.length}`
  );

  if (validCount !== samples.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Evaluation failed:", error.message);
  process.exitCode = 1;
});