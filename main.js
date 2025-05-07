import { MLCEngine } from "@mlc-ai/web-llm";
import { marked } from "marked"; // For markdown rendering

// State variables
let llmModel = null;
let chatHistory = [];
let problemsData = [];
let currentProblem = null;
let hintCount = 0; // Track number of hints requested

async function fetchProblems() {
  const res = await fetch('assets/leetcode_problems.json');
  problemsData = await res.json();
}

function renderProblemList(problems) {
  const problemList = document.getElementById('problem-list');
  problemList.innerHTML = '';
  problems.forEach((problem, idx) => {
    const li = document.createElement('li');
    li.className = 'problem-item' + (idx === 0 ? ' active' : '');
    li.dataset.id = problem.id;
    li.innerHTML = `${problem.id}. ${problem.title} <span class="difficulty ${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>`;
    li.onclick = () => selectProblem(problem.id);
    problemList.appendChild(li);
  });
}

function selectProblem(id) {
  // Reset hint counter and code editor when selecting a new problem
  hintCount = 0;
  const resetBtn = document.getElementById('reset-code-btn');
  if (resetBtn) resetBtn.click();
  const problem = problemsData.find(p => p.id == id);
  if (!problem) return;
  currentProblem = problem;
  // Update active class
  document.querySelectorAll('.problem-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id == id);
  });
  // Update main area
  document.getElementById('problem-title').textContent = `${problem.id}. ${problem.title}`;
  document.querySelector('.problem-header .difficulty').textContent = problem.difficulty;
  document.querySelector('.problem-header .difficulty').className = `difficulty ${problem.difficulty.toLowerCase()}`;
  document.getElementById('problem-content').innerHTML = marked.parse(problem.description);
}


// DOM Elements for AI Teacher Sidebar

// Function to update the progress bar
function updateProgress(progress) {
  if (!progress || !progress.progress) return;
  
  const percent = Math.floor(progress.progress * 100);
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressContainer = document.getElementById('progress-container');
  const modelStatus = document.getElementById('model-status');
  
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}%: ${progress.text || 'Loading model...'}`;
  
  if (percent === 100) {
    setTimeout(() => {
      progressContainer.classList.add('hidden');
      modelStatus.textContent = 'Status: Model loaded and ready!';
      modelStatus.style.color = '#4caf50';
      
      // Enable AI interaction elements
      document.getElementById('user-input').disabled = false;
      document.getElementById('send-btn').disabled = false;
      document.getElementById('hint-btn').disabled = false;
      document.getElementById('approach-btn').disabled = false;
      document.getElementById('explain-btn').disabled = false;
      document.getElementById('optimize-btn').disabled = false;
    }, 1000);
  }
}

// Function to load the selected model
async function loadModel() {
  console.log('Load model button clicked');
  const modelSelect = document.getElementById('model-select');
  // Set default model if not already set
  if (!modelSelect.value) {
    modelSelect.value = 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC';
  }
  const selectedModel = modelSelect.value;
  console.log('Selected model:', selectedModel);
  
  const modelStatus = document.getElementById('model-status');
  const loadModelBtn = document.getElementById('load-model-btn');
  const progressContainer = document.getElementById('progress-container');
  
  modelStatus.textContent = 'Status: Loading model...';
  modelStatus.style.color = '#ff9800';
  loadModelBtn.disabled = true;
  progressContainer.classList.remove('hidden');

  // Grey out all chat and action buttons while loading
  document.getElementById('user-input').disabled = true;
  document.getElementById('send-btn').disabled = true;
  document.getElementById('hint-btn').disabled = true;
  document.getElementById('approach-btn').disabled = true;
  document.getElementById('explain-btn').disabled = true;
  document.getElementById('optimize-btn').disabled = true;
  
  try {
    console.log('Creating MLCEngine instance');
    // Initialize the WebLLM model with progress callback
    llmModel = new MLCEngine({
      initProgressCallback: (report) => {
        console.log('Loading progress:', report);
        // Update progress bar
        updateProgress({
          progress: report.progress || 0,
          text: report.text || `Loading ${report.progress ? Math.floor(report.progress * 100) + '%' : ''}`
        });
      }
    });
    
    console.log('MLCEngine instance created, loading model:', selectedModel);
    
    // Load the selected model
    await llmModel.reload(selectedModel);
    
    console.log('Model initialized successfully');
    // Add a system message to the chat
    addMessage('Model loaded successfully! You can now ask questions about the coding problem.', 'system');
    
  } catch (error) {
    console.error('Error loading the model:', error);
    modelStatus.textContent = `Status: Error loading model - ${error.message}`;
    modelStatus.style.color = '#f44336';
    loadModelBtn.disabled = false;
  }
}

// Function to add a message to the chat
function addMessage(content, sender, isSystemPrompt = false) {
  // Debug information about the content
  console.log(`Adding message from ${sender}:`, {
    contentType: typeof content,
    contentValue: content,
    isNull: content === null,
    isUndefined: content === undefined,
    isSystemPrompt: isSystemPrompt
  });

  // Ensure content is a string to prevent errors
  content = content || '';

  // Only update the DOM if not a system prompt
  if (!isSystemPrompt) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content; // Using innerHTML to support code formatting

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Store in history if it's user or AI/assistant message
  if (sender === 'user' || sender === 'ai' || sender === 'assistant') {
    chatHistory.push({
      role: sender === 'user' ? 'user' : 'assistant',
      content: content
    });
  }
}

// Handle hint button click
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

  await sendMessage(hintRequest, true);
}

// Handle approach button click
async function handleApproachClick() {
  const approachRequest = "What's a good approach to solve this problem? Explain the strategy but don't give me the full code.";
  await sendMessage(approachRequest, true);
}

// Handle explain button click
async function handleExplainClick() {
  const codeEditor = document.getElementById('code-editor');
  const code = codeEditor.value || "# No code to explain";
  const explainRequest = `Can you explain what this code does and if it correctly solves the problem?\n\n\`\`\`python\n${code}\n\`\`\``;
  await sendMessage(explainRequest, true);
}

// Handle optimize button click
async function handleOptimizeClick() {
  const codeEditor = document.getElementById('code-editor');
  const code = codeEditor.value || "# No code to optimize";
  const optimizeRequest = `Can you help me optimize this code for better time/space complexity?\n\n\`\`\`\n${code}\n\`\`\``;
  await sendMessage(optimizeRequest, true);
}

// Function to handle sending a message
// Function to handle sending a message
const SummarizationState = {
  NONE: 0,
  IN_PROGRESS: 1,
  DONE: 2
};
let summarizedHistory = '';
let summarizationState = SummarizationState.NONE;

async function sendMessage(message, isSystemPrompt = false) {
  if (!message || !llmModel) return;

  // Always add user message to chatHistory, but only display in chat if not a system prompt
  addMessage(message, 'user', isSystemPrompt);

  // Disable input while processing
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  userInput.disabled = true;
  sendBtn.disabled = true;

  try {
    // Create message container for streaming (must be defined before any await)
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Summarization logic for long chat history
    // Count user messages
    const userMsgIndexes = chatHistory
      .map((msg, idx) => (msg.role === 'user' ? idx : null))
      .filter(idx => idx !== null);
    if (userMsgIndexes.length > 3 && summarizationState !== SummarizationState.IN_PROGRESS) {
      // Pop the oldest user message and its paired assistant response
      const oldestUserIdx = userMsgIndexes[0];
      // Find the next assistant after this user
      let pairedAssistantIdx = oldestUserIdx + 1;
      while (pairedAssistantIdx < chatHistory.length && chatHistory[pairedAssistantIdx].role !== 'assistant') {
        pairedAssistantIdx++;
      }
      // Remove these from chatHistory
      const toSummarize = [chatHistory[oldestUserIdx]];
      if (pairedAssistantIdx < chatHistory.length) {
        toSummarize.push(chatHistory[pairedAssistantIdx]);
      }
      // Remove from chatHistory (do assistant first to not mess up indexes)
      if (pairedAssistantIdx < chatHistory.length) chatHistory.splice(pairedAssistantIdx, 1);
      chatHistory.splice(oldestUserIdx, 1);

      // Summarize via LLM
      summarizationState = SummarizationState.IN_PROGRESS;
      const summaryPrompt = `Summarize the following user and assistant exchange for future context. Focus on the key question, answer, and learning points.\n\nUSER: ${toSummarize[0].content}\nASSISTANT: ${(toSummarize[1] && toSummarize[1].role === 'assistant') ? toSummarize[1].content : ''}`;
      // Call sendMessage recursively for summarization, but do not display in chat
      const summary = await getLLMSummary(summaryPrompt);
      summarizedHistory = summarizedHistory
        ? summarizedHistory + "\n" + summary
        : summary;
      summarizationState = SummarizationState.DONE;
    }

    // Create a system prompt focused on coding assistance using CO-STAR framework
    let systemPrompt = `# CONTEXT\nYou are an expert software engineer and computer science educator specializing in algorithms and data structures. You're helping a student work through the following LeetCode-style coding problem:\n\n${currentProblem.title} (${currentProblem.difficulty.toUpperCase()}):\n${currentProblem.description}`;
    if (summarizedHistory) {
      systemPrompt += `\n\n# SUMMARIZED PREVIOUS HISTORY\n${summarizedHistory}`;
    }
    systemPrompt += `\n\n# OBJECTIVE\nGuide the student through the problem-solving process with a focus on learning and skill development rather than just providing answers. Your guidance should build their problem-solving abilities and help them understand the underlying concepts.\n\n# STYLE\nYour explanations should be clear, structured, and educational. Use a step-by-step approach when explaining concepts. Include relevant computer science principles and algorithms where appropriate. When sharing code examples, use clean, well-commented, and efficient code.\n\n# TONE\nBe supportive, patient, and encouraging. Treat mistakes as learning opportunities. Be conversational but professional, like an expert mentor working with a motivated student.\n\n# AUDIENCE\nYour student has programming knowledge but may be unfamiliar with some algorithms and data structures concepts. They learn best through guided discovery rather than direct solutions.\n\n# RESPONSE FORMAT\n- For hints: Provide a relevant hint that guides thinking without revealing the full solution\n- For approaches: Explain the reasoning process, possible algorithms, time/space complexity considerations\n- For code explanations: Analyze the code line by line, highlight strengths/weaknesses, suggest improvements\n- For optimization help: Explain both the theoretical and practical optimizations possible\n- Always use markdown formatting with appropriate syntax highlighting for code blocks\n- For complex algorithms, include step-by-step explanations with examples\n\nToday is ${new Date().toLocaleDateString()}.`;

    // Prepare messages array
    let messages = [];
    console.log('[DEBUG] chatHistory before preparing messages:', JSON.stringify(chatHistory, null, 2));
    if (chatHistory.length <= 6) {
      messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory
      ];
      console.log('[DEBUG] Using full chatHistory for messages, length:', messages.length);
    } else {
      // Summarize older messages
      const oldMessages = chatHistory.slice(0, -6);
      const summary = await getLLMSummary(
        oldMessages.map(m => `${m.role}: ${m.content}`).join('\n')
      );
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `Summary of earlier conversation: ${summary}` },
        ...chatHistory.slice(-6)
      ];
      console.log('[DEBUG] Using summarized history. summary:', summary);
      console.log('[DEBUG] Recent chatHistory for messages:', JSON.stringify(chatHistory.slice(-6), null, 2));
      console.log('[DEBUG] messages array length:', messages.length);
    }

    console.log('Sending message with conversation history:', messages);

    let streamedContent = '';

    // Use streaming API
    const stream = await llmModel.chat.completions.create({
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: true // Enable streaming
    });

    // Process the stream
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        streamedContent += chunk.choices[0].delta.content;
        contentDiv.innerHTML = marked.parse(streamedContent); // Render markdown using marked
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }

    // Always add the AI response to chatHistory using addMessage (UI only updates if not system prompt)
    addMessage(streamedContent, 'assistant', isSystemPrompt);

  } catch (error) {
    console.error('Error generating response:', error);
    addMessage(`Sorry, there was an error generating a response: ${error.message}`, 'system');
  } finally {
    // Re-enable input
    userInput.disabled = false;
    sendBtn.disabled = false;
  }
}

// Helper to get LLM summary for summarization prompt
async function getLLMSummary(prompt) {
  if (!llmModel) return '';
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant that summarizes chat history for future context.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
  let summary = '';
  try {
    const stream = await llmModel.chat.completions.create({
      messages: messages,
      temperature: 0.3,
      max_tokens: 200,
      stream: true
    });
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        summary += chunk.choices[0].delta.content;
      }
    }
  } catch (e) {
    console.error('Error summarizing chat history:', e);
  }
  return summary.trim();
}


// Handle user input submission
function handleUserInputSubmission() {
  const userInput = document.getElementById('user-input');
  const message = userInput.value.trim();
  
  if (message) {
    sendMessage(message);
    userInput.value = ''; // Clear input after sending
  }
}

// Initialize event listeners
function initEventListeners() {
  // AI Teacher sidebar
  const loadModelBtn = document.getElementById('load-model-btn');
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const hintBtn = document.getElementById('hint-btn');
  const approachBtn = document.getElementById('approach-btn');
  const explainBtn = document.getElementById('explain-btn');
  const optimizeBtn = document.getElementById('optimize-btn');
  
  // Model loading
  loadModelBtn.addEventListener('click', loadModel);
  
  // Chat interactions
  sendBtn.addEventListener('click', handleUserInputSubmission);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInputSubmission();
    }
  });
  
  // AI Teacher action buttons
  hintBtn.addEventListener('click', handleHintClick);
  approachBtn.addEventListener('click', handleApproachClick);
  explainBtn.addEventListener('click', handleExplainClick);
  optimizeBtn.addEventListener('click', handleOptimizeClick);
  
  // Problem list selection
  const problemItems = document.querySelectorAll('.problem-item');
  problemItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update active problem
      problemItems.forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      
      // For now, just a placeholder for problem switching
      // In a full implementation, this would load the selected problem
      const problemId = item.getAttribute('data-id');
      console.log(`Selected problem ID: ${problemId}`);
    });
  });
  
  // Tab switching for test cases and results
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show selected tab content
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

// Modal dialog logic for problem selection
function setupProblemModal() {
  const modal = document.getElementById('problem-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const changeBtn = document.getElementById('change-problem-btn');
  const problemList = document.getElementById('problem-list');

  function openModal() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  if (changeBtn) changeBtn.onclick = openModal;
  if (closeModalBtn) closeModalBtn.onclick = closeModal;
  // Click outside modal-content closes modal
  window.onclick = function(event) {
    if (event.target === modal) closeModal();
  };
  // Handle problem selection
  problemList.onclick = function(e) {
    let li = e.target.closest('li');
    if (li && li.dataset.id) {
      selectProblem(li.dataset.id);
      closeModal();
    }
  };
}

// Initialize the application
function init() {
  // Set up event listeners
  initEventListeners();
  
  // Fetch problems and initialize UI
  fetchProblems().then(() => {
    renderProblemList(problemsData);
    selectProblem(problemsData[0]?.id);
    setupProblemModal();
    console.log('Problems loaded and UI initialized');
    setupPyodideIntegration();
    // Auto-load the default model
    loadModel().catch(error => {
      console.error('Error auto-loading model:', error);
    });
  });
}

// Global Pyodide instance
let pyodideInstance = null;

// Setup Pyodide integration with our application
async function setupPyodideIntegration() {
  console.log('Setting up Pyodide integration');
  
  try {
    // Load Pyodide
    console.log('Loading Pyodide...');
    pyodideInstance = await loadPyodide();
    console.log('Pyodide loaded successfully!');
    
    // Initialize Python environment
    await pyodideInstance.runPythonAsync(`
      import sys
      print("Python version:", sys.version)
      print("Pyodide initialized and ready to execute code")
    `);
    
    // Enable the run and submit buttons now that Pyodide is ready
    document.getElementById('run-code-btn').disabled = false;
    document.getElementById('submit-code-btn').disabled = false;
    
    // Show ready message
    const outputDiv = document.getElementById('python-output');
    outputDiv.textContent = 'Python environment is ready. You can run your code now.';
  } catch (error) {
    console.error('Error initializing Pyodide:', error);
    const outputDiv = document.getElementById('python-output');
    outputDiv.textContent = `Error initializing Python environment: ${error.message}`;
  }
}

// --- Python code execution logic with Pyodide ---
async function runPythonCode() {
  console.log('Executing Python code with Pyodide');
  const codeEditor = document.getElementById('code-editor');
  const pythonCode = codeEditor.value;
  const outputDiv = document.getElementById('python-output');
  
  // Show loading indicator
  outputDiv.textContent = 'Running code...';
  
  if (!pyodideInstance) {
    console.error('Pyodide instance not initialized');
    outputDiv.textContent = 'Error: Python environment not initialized. Please wait for initialization.';
    return;
  }
  
  try {
    // Redirect stdout to capture output
    let outputBuffer = '';
    pyodideInstance.setStdout({
      batched: (data) => {
        outputBuffer += data + '\n';
      }
    });

    // Execute Python code using Pyodide
    await pyodideInstance.runPythonAsync(pythonCode);
    
    // Capture output
    outputDiv.innerHTML = outputBuffer.replace(/\n/g, '<br>') || 'Code executed successfully';
  } catch (error) {
    console.error('Error executing Python code:', error);
    outputDiv.textContent = `Error: ${error.message}`;
  } finally {
    // Re-enable buttons after execution
    document.getElementById('run-code-btn').disabled = false;
    document.getElementById('submit-code-btn').disabled = false;
  }
}

function setupPythonRunButtons() {
  const runBtn = document.getElementById('run-code-btn');
  const submitBtn = document.getElementById('submit-code-btn');
  const resetBtn = document.getElementById('reset-code-btn');

  if (runBtn) runBtn.onclick = () => {
    console.log('Run button clicked');
    runWithExamples('run');
  };

  if (submitBtn) submitBtn.onclick = () => {
    console.log('Submit button clicked');
    runWithExamples('submit');
  };

  if (resetBtn) resetBtn.onclick = () => {
    const codeEditor = document.getElementById('code-editor');
    const outputDiv = document.getElementById('python-output');

    if (codeEditor && currentProblem) {
      // Generate function name from problem title
      const funcName = currentProblem.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      // Create template with the current problem's function
      codeEditor.value = `# Write your solution for ${currentProblem.title} here
def ${funcName}():
    # TODO: Implement your solution
    pass

# Test your function with example case
print(f"Output: {${funcName}()}")
`;
    }

    if (outputDiv) {
      outputDiv.textContent = '';
    }

    console.log('Code editor reset to default template');
  };
}

// Helper: Parse input string like 'nums = [2,7,11,15], target = 9' to Python assignments
function parseInputAssignments(inputStr) {
  // Split on ',' not inside brackets or quotes
  const assignments = [];
  let curr = '';
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < inputStr.length; i++) {
    const c = inputStr[i];
    if (c === '"' || c === "'") inQuotes = !inQuotes;
    if (!inQuotes && (c === '[' || c === '{' || c === '(')) depth++;
    if (!inQuotes && (c === ']' || c === '}' || c === ')')) depth--;
    if (!inQuotes && depth === 0 && c === ',') {
      assignments.push(curr.trim());
      curr = '';
    } else {
      curr += c;
    }
  }
  if (curr.trim()) assignments.push(curr.trim());
  return assignments.filter(Boolean).join('\n');
}

// Main runner for Run/Submit
async function runWithExamples(mode) {
  const codeEditor = document.getElementById('code-editor');
  const outputDiv = document.getElementById('python-output');
  if (!pyodideInstance) {
    outputDiv.textContent = 'Error: Python environment not initialized.';
    return;
  }
  if (!currentProblem || !currentProblem.examples || currentProblem.examples.length === 0) {
    outputDiv.textContent = 'No examples found for this problem.';
    return;
  }
  const userCode = codeEditor.value;
  const funcName = currentProblem.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  let results = [];
  let examplesToRun = mode === 'run' ? [currentProblem.examples[0]] : currentProblem.examples;

  for (let i = 0; i < examplesToRun.length; i++) {
    const ex = examplesToRun[i];
    // Parse input assignments
    const inputCode = parseInputAssignments(ex.input);
    // Extract argument names using robust assignment parsing
    const assignments = parseInputAssignments(ex.input).split('\n');
    const argNames = assignments.map(a => a.split('=')[0].trim()).filter(Boolean).join(', ');
    // Compose code to run: user code + input assignments + call
    const testCode = `${userCode}\n\n${inputCode}\ntry:\n    result = ${funcName}(${argNames})\n    print(result)\nexcept Exception as e:\n    print('Error:', e)`;
    let outputBuffer = '';
    pyodideInstance.setStdout({
      batched: (data) => {
        outputBuffer += data + '\n';
      }
    });
    try {
      await pyodideInstance.runPythonAsync(testCode);
      let actualOutput = outputBuffer.trim().split('\n').pop(); // Last line is output
      let expectedOutput = ex.output.replace(/^"|"$/g, ''); // Remove quotes if present
      let pass = false;
      try {
        // Compare using Python's eval for lists/numbers
        const pyEval = pyodideInstance.runPython;
        pass = pyEval(`${actualOutput} == ${expectedOutput}`);
      } catch (e) {
        // Fallback to string comparison if eval fails
        pass = actualOutput == expectedOutput;
      }
      results.push({
        input: ex.input,
        expected: ex.output,
        actual: actualOutput,
        pass
      });
    } catch (err) {
      results.push({
        input: ex.input,
        expected: ex.output,
        actual: 'Error: ' + err,
        pass: false
      });
    }
  }
  // Display results
  if (mode === 'run') {
    const r = results[0];
    outputDiv.innerHTML = `<b>Input:</b> <pre>${r.input}</pre><b>Your Output:</b> <pre>${r.actual}</pre><b>Expected Output:</b> <pre>${r.expected}</pre><b>Status:</b> <span style='color:${r.pass ? 'green' : 'red'}'>${r.pass ? 'PASS' : 'FAIL'}</span>`;
  } else {
    outputDiv.innerHTML = results.map((r, idx) =>
      `<div style='margin-bottom:1em'><b>Test Case ${idx+1}:</b><br/><b>Input:</b> <pre>${r.input}</pre><b>Your Output:</b> <pre>${r.actual}</pre><b>Expected Output:</b> <pre>${r.expected}</pre><b>Status:</b> <span style='color:${r.pass ? 'green' : 'red'}'>${r.pass ? 'PASS' : 'FAIL'}</span></div>`
    ).join('');
  }
}

// Ensure listeners are attached after every DOM change
function observeEditorActions() {
  const targetNode = document.querySelector('.editor-actions');
  if (!targetNode) return;
  const observer = new MutationObserver(() => {
    setupPythonRunButtons();
  });
  observer.observe(targetNode, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  setupPythonRunButtons();
  observeEditorActions();
});
