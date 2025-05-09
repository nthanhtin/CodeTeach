/**
 * CodeTeach Main Application Entry Point
 * 
 * A modular LeetCode-style coding practice platform with AI assistance
 */

// Import modules
import { loadModel } from './llm-service.js';
import { 
  fetchProblems, 
  renderProblemList,
  selectProblem,
  setupProblemModal,
  getCurrentProblem
} from './problem-service.js';
import {
  setupPyodideIntegration,
  setupPythonRunButtons
} from './python-runner.js';
import { initChatEventListeners, resetHintCount } from './chat-ui.js';
import { initializeProgressTracker } from './progress-tracker.js';

/**
 * Initialize the application
 */
async function init() {
  try {
    // Initialize progress tracker for user's completed problems
    initializeProgressTracker();
    
    // Fetch problems and initialize the problem list
    const problems = await fetchProblems();
    
    // Set up the problem modal with the select callback
    setupProblemModal(selectProblem);
    
    // Render the initial problem list
    renderProblemList(problems, selectProblem);
    
    // Select first problem by default
    if (problems[0]) {
      selectProblem(problems[0].id);
    }
    
    // Initialize event listeners for user interactions
    initEventListeners();
    
    // Set up Python code execution environment
    await setupPyodideIntegration();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

/**
 * Initialize UI event listeners not handled by specific modules
 */
function initEventListeners() {
  // Initialize chat UI event listeners (handled by chat-ui.js)
  initChatEventListeners();
  
  // Set up the load model button
  const loadModelBtn = document.getElementById('load-model-btn');
  if (loadModelBtn) {
    loadModelBtn.addEventListener('click', loadModel);
  }
  
  // Set up code editor functions
  setupCodeEditor();
  
  // Set up tab switching for test cases and results
  setupTabSwitching();
}

/**
 * Set up code editor functionality
 */
function setupCodeEditor() {
  const codeEditor = document.getElementById('code-editor');
  const resetCodeBtn = document.getElementById('reset-code-btn');
  
  if (resetCodeBtn && codeEditor) {
    resetCodeBtn.addEventListener('click', () => {
      // Reset code editor to default content
      codeEditor.value = '# Your solution here\n\n';
      resetHintCount(); // Reset hint counter when code is reset
    });
    
    // Initial code template
    codeEditor.value = '# Your solution here\n\n';
  }
  
  // Set up Python run buttons with the current problem
  setupPythonRunButtons(getCurrentProblem());
}

/**
 * Set up tab switching for test cases and results
 */
function setupTabSwitching() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      if (!tabName) return;
      
      // Remove active class from all buttons and sections
      tabButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Add active class to selected button and section
      button.classList.add('active');
      const tabElement = document.getElementById(`${tabName}-tab`);
      if (tabElement) {
        tabElement.classList.add('active');
      }
    });
  });
}

/**
 * Observe editor actions and ensure listeners are attached
 * after DOM changes
 */
function observeEditorActions() {
  // Use MutationObserver to watch for DOM changes
  const observer = new MutationObserver(() => {
    // Re-attach event listeners to elements that might have been modified
    setupPythonRunButtons(getCurrentProblem());
  });
  
  // Observe the code workspace
  const workspace = document.querySelector('.code-workspace');
  if (workspace) {
    observer.observe(workspace, { childList: true, subtree: true });
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  init();
  observeEditorActions();
});
