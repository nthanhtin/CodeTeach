/**
 * LLM Service Module
 * Handles all interactions with the WebLLM model
 */

import { MLCEngine } from "@mlc-ai/web-llm";
import { marked } from "marked";

// LLM state
let llmModel = null;
let chatHistory = [];

// Summarization states
const SummarizationState = {
  NONE: 0,
  IN_PROGRESS: 1,
  DONE: 2
};
let summarizedHistory = '';
let summarizationState = SummarizationState.NONE;

/**
 * Updates the progress bar UI during model loading
 * @param {Object} progress - Progress information object
 */
function updateProgress(progress) {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressContainer = document.getElementById('progress-container');
  const modelStatus = document.getElementById('model-status');
  
  // Handle different types of progress updates
  if (progress && progress.text) {
    // Check if this is a fetching param cache message that we want to simplify
    if (progress.text.includes('Fetching param cache')) {
      // Extract the loading information with regex
      const cacheMatch = progress.text.match(/\[(\d+)\/(\d+)\]/);
      if (cacheMatch) {
        const current = parseInt(cacheMatch[1]);
        const total = parseInt(cacheMatch[2]);
        const percent = Math.floor((current / total) * 100);
        
        // Extract MB information if available
        const mbMatch = progress.text.match(/(\d+)MB fetched/);
        const mbFetched = mbMatch ? mbMatch[1] : null;
        
        // Update progress bar
        progressFill.style.width = `${percent}%`;
        
        // Show simplified message without the full technical details
        progressText.textContent = `${percent}%: Loading model files...`;
        
        // Update status with cleaner message
        if (mbFetched) {
          modelStatus.textContent = `Status: Loading model (${current}/${total} files)`;
        } else {
          modelStatus.textContent = `Status: Loading model (${current}/${total} files)`;
        }
        
        return;
      }
    }
    
    // Regular loading from cache message (not fetching param)
    const cacheMatch = progress.text.match(/\[(\d+)\/(\d+)\]/);
    if (cacheMatch) {
      const current = parseInt(cacheMatch[1]);
      const total = parseInt(cacheMatch[2]);
      const percent = Math.floor((current / total) * 100);
      
      progressFill.style.width = `${percent}%`;
      
      // For cache loading, show clean message
      if (progress.text.includes('Loading model from cache')) {
        progressText.textContent = `${percent}%: Loading model files...`;
      } else {
        progressText.textContent = `${percent}%: ${progress.text}`;
      }
      
      // Update model status with more detailed information (but still clean)
      const mbMatch = progress.text.match(/(\d+)MB loaded/);
      if (mbMatch) {
        const mbLoaded = mbMatch[1];
        modelStatus.textContent = `Status: Loading model (${current}/${total} files)`;
      } else {
        modelStatus.textContent = `Status: Loading model (${current}/${total} files)`;
      }
      
      return;
    }
  }
  
  // Default behavior for standard progress updates
  if (progress && typeof progress.progress === 'number') {
    const percent = Math.floor(progress.progress * 100);
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
        
        // Add CSS transition for smooth fadeout
        modelStatus.style.transition = 'opacity 1.5s ease-in-out';
        
        // Fade out the status message after 3 seconds
        setTimeout(() => {
          modelStatus.style.opacity = '0';
          
          // After fade completes, replace with a minimal indicator
          setTimeout(() => {
            modelStatus.textContent = '● Model ready';
            modelStatus.style.opacity = '0.7';
            modelStatus.style.fontSize = '0.8em';
          }, 1500);
        }, 3000);
      }, 1000);
    }
  }
}

/**
 * Loads the selected AI model
 * @returns {Promise<void>}
 */
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
  
  // Reset styles if previously faded
  modelStatus.style.opacity = '1';
  modelStatus.style.fontSize = '1em';
  modelStatus.style.transition = 'none';
  
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
        
        // Handle cache loading progress messages from console
        if (report.text && report.text.includes('Loading model from cache')) {
          updateProgress({
            isCache: true,
            text: report.text
          });
        } else {
          // Standard progress update
          updateProgress({
            progress: report.progress || 0,
            text: report.text || `Loading ${report.progress ? Math.floor(report.progress * 100) + '%' : ''}`
          });
        }
      }
    });
    
    console.log('MLCEngine instance created, loading model:', selectedModel);
    
    // Create a progress message handler for console outputs
    // This is needed because some progress messages only appear in console
    const originalConsoleLog = console.log;
    console.log = function() {
      const args = Array.from(arguments);
      originalConsoleLog.apply(console, args);
      
      // Check if this is a model loading progress message
      const message = args.join(' ');
      if (typeof message === 'string' && message.includes('Loading model from cache')) {
        updateProgress({
          isCache: true,
          text: message
        });
      }
    };
    
    // Load the selected model
    await llmModel.reload(selectedModel);
    
    // Restore original console.log
    console.log = originalConsoleLog;
    
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

/**
 * Adds a message to the chat interface and history
 * @param {string} content - Message content
 * @param {string} sender - Message sender ('user', 'assistant', 'system')
 * @param {boolean} isSystemPrompt - Whether this is a hidden system prompt
 */
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

/**
 * Get a summary from the LLM for chat history management
 * @param {string} prompt - The prompt to summarize
 * @returns {Promise<string>} - The generated summary
 */
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

/**
 * Send a message to the LLM and handle the response
 * @param {string} message - The message content
 * @param {boolean} isSystemPrompt - Whether this is a hidden system prompt
 * @param {Object} currentProblem - The current problem being worked on
 * @returns {Promise<void>}
 */
async function sendMessage(message, isSystemPrompt = false, currentProblem) {
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

/**
 * Check if the LLM model is loaded
 * @returns {boolean} - Whether the model is loaded
 */
function isModelLoaded() {
  return llmModel !== null;
}

/**
 * Clear the chat history
 */
function clearChatHistory() {
  chatHistory = [];
  summarizedHistory = '';
  summarizationState = SummarizationState.NONE;
}

// Export the public API of the module
export {
  loadModel,
  addMessage,
  sendMessage,
  getLLMSummary,
  isModelLoaded,
  clearChatHistory
};
