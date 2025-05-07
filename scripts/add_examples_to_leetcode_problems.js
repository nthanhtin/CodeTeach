// Script to add example_input and example_output fields to each problem in leetcode_problems.json
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../assets/leetcode_problems.json');
const problems = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

function extractAllExamples(description) {
  // Find all Input: ... Output: ... pairs
  // Output: should only include the value, not explanations or extra lines
  const inputRegex = /Input:([^\n]*)/g;
  // Output: value is up to linebreak, Explanation, or Note
  const outputRegex = /Output:([^\n\r]*)/g;
  const explanationRegex = /(Explanation:|Note:).*/;

  const inputs = [];
  const outputs = [];
  let m;
  while ((m = inputRegex.exec(description))) {
    inputs.push(m[1].trim());
  }
  while ((m = outputRegex.exec(description))) {
    let out = m[1].trim();
    // Remove trailing Explanation or Note if present
    out = out.replace(explanationRegex, '').trim();
    outputs.push(out);
  }
  // Pair inputs and outputs
  const examples = [];
  for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
    examples.push({ input: inputs[i], output: outputs[i] });
  }
  return examples;
}

for (const problem of problems) {
  if (problem.description) {
    const examples = extractAllExamples(problem.description);
    problem.examples = examples;
    // Remove old single-example fields if present
    delete problem.example_input;
    delete problem.example_output;
  }
}

fs.writeFileSync(filePath, JSON.stringify(problems, null, 2));
console.log('Updated leetcode_problems.json with all examples extracted as arrays.');
