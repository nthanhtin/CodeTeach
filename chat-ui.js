/**
 * Chat UI Module
 * Handles chat interface components and messaging actions
 */

import { sendMessage } from './llm-service.js';
import { getCurrentProblem } from './problem-service.js';

// Track hint count
let hintCount = 0;

/**
 * Handles hint button click - generates progressively more detailed hints
 * @returns {Promise<void>}
 */
async function handleHintClick() {
  hintCount++;
  let hintRequest;
  
  switch(hintCount) {
    case 1:
      hintRequest = "Give me a basic conceptual hint about how to approach this problem. Label it as 'Hint 1' and keep it high-level without specific implementation details.";
      break;
    case 2:
      hintRequest = "Give me a more specific hint building on Hint 1, focusing on the key data structure or algorithm to use. Label it as 'Hint 2'.";
      break;
    case 3:
      hintRequest = "Give me a detailed hint about the implementation approach, but still without giving away the complete solution. Label it as 'Hint 3'.";
      break;
    default:
      hintRequest = `Give me hint number ${hintCount}, focusing on optimization or edge cases we haven't covered yet. Make it build upon previous hints.`;
  }

  const currentProblem = getCurrentProblem();
  await sendMessage(hintRequest, true, currentProblem);
}

/**
 * Handles approach button click - asks for a solution approach
 * @returns {Promise<void>}
 */
async function handleApproachClick() {
  const approachRequest = "What's a good approach to solve this problem? Explain the strategy but don't give me the full code.";
  const currentProblem = getCurrentProblem();
  await sendMessage(approachRequest, true, currentProblem);
}

/**
 * Handles explain button click - asks for explanation of current code
 * @returns {Promise<void>}
 */
async function handleExplainClick() {
  const codeEditor = document.getElementById('code-editor');
  const code = codeEditor.value || "# No code to explain";
  const explainRequest = `Can you explain what this code does and if it correctly solves the problem?\n\n\`\`\`python\n${code}\n\`\`\``;
  const currentProblem = getCurrentProblem();
  await sendMessage(explainRequest, true, currentProblem);
}

/**
 * Handles optimize button click - asks for code optimization
 * @returns {Promise<void>}
 */
async function handleOptimizeClick() {
  const codeEditor = document.getElementById('code-editor');
  const code = codeEditor.value || "# No code to optimize";
  const optimizeRequest = `Can you help me optimize this code for better time/space complexity?\n\n\`\`\`\n${code}\n\`\`\``;
  const currentProblem = getCurrentProblem();
  await sendMessage(optimizeRequest, true, currentProblem);
}

/**
 * Handles user input submission from the chat input area
 * @returns {Promise<void>}
 */
async function handleUserInputSubmission() {
  const userInput = document.getElementById('user-input');
  const message = userInput.value.trim();
  
  if (!message) return;
  
  // Clear input field
  userInput.value = '';
  
  // Send message to LLM
  const currentProblem = getCurrentProblem();
  await sendMessage(message, false, currentProblem);
}

/**
 * Initialize chat UI event listeners
 */
function initChatEventListeners() {
  // Chat input submission
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  
  if (userInput) {
    userInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleUserInputSubmission();
      }
    });
  }
  
  if (sendBtn) {
    sendBtn.addEventListener('click', handleUserInputSubmission);
  }
  
  // Action buttons
  const hintBtn = document.getElementById('hint-btn');
  const approachBtn = document.getElementById('approach-btn');
  const explainBtn = document.getElementById('explain-btn');
  const optimizeBtn = document.getElementById('optimize-btn');
  
  if (hintBtn) {
    hintBtn.addEventListener('click', handleHintClick);
  }
  
  if (approachBtn) {
    approachBtn.addEventListener('click', handleApproachClick);
  }
  
  if (explainBtn) {
    explainBtn.addEventListener('click', handleExplainClick);
  }
  
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', handleOptimizeClick);
  }
}

/**
 * Reset the hint counter (used when changing problems)
 */
function resetHintCount() {
  hintCount = 0;
}

/**
 * Get current hint count
 * @returns {number} Current hint count
 */
function getHintCount() {
  return hintCount;
}

// Export the module's public API
export {
  handleHintClick,
  handleApproachClick,
  handleExplainClick,
  handleOptimizeClick,
  handleUserInputSubmission,
  initChatEventListeners,
  resetHintCount,
  getHintCount
};
