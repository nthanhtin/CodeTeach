/**
 * Problem Service Module
 * Handles fetching, filtering, and selection of coding problems
 */

// Import UI helper functions
import { 
  createProblemListItem, 
  createNoProblemsElement
} from "./ui-helpers.js";
import { marked } from "marked";
import { 
  isProblemCompleted, 
  initializeProgressTracker,
  getCompletedCount,
  getAttemptedCount
} from "./progress-tracker.js";

// State
let problemsData = [];
let currentProblem = null;
let allTopics = []; // Store all unique topics for filtering

/**
 * Fetch problems from the JSON file
 * @returns {Promise<Array>} The array of problems
 */
async function fetchProblems() {
  try {
    const res = await fetch('assets/leetcode_problems.json');
    problemsData = await res.json();
    extractTopics();
    return problemsData;
  } catch (error) {
    console.error('Error fetching problems:', error);
    return [];
  }
}

/**
 * Render the problem list with provided filter
 * @param {Array} problems - List of problems to render
 * @param {Function} selectCallback - Callback to call when a problem is selected
 */
function renderProblemList(problems, selectCallback) {
  const problemList = document.getElementById('problem-list');
  if (!problemList) return;
  
  // Clear the current problem list
  problemList.innerHTML = '';
  
  if (!problems || problems.length === 0) {
    // Handle empty problem list
    problemList.appendChild(createNoProblemsElement());
    return;
  }
  
  // Create stats element to show completion progress
  const statsElement = document.createElement('div');
  statsElement.id = 'completion-stats';
  statsElement.className = 'completion-stats';
  const completedCount = getCompletedCount();
  const attemptedCount = getAttemptedCount();
  statsElement.textContent = `${completedCount} completed / ${attemptedCount} attempted`;
  
  // Add stats element at the top of the problem list
  problemList.appendChild(statsElement);
  
  // Create and append list items for each problem
  problems.forEach((problem, index) => {
    // Check if the problem is completed
    const isCompleted = isProblemCompleted(problem.id);
    
    // Create list item with completion status
    const listItem = createProblemListItem(problem, index, selectCallback, isCompleted);
    problemList.appendChild(listItem);
  });
}

/**
 * Select a problem by ID and update the UI
 * @param {string} id - The problem ID
 * @returns {Object|null} The selected problem or null if not found
 */
function selectProblem(id) {
  // Find the problem in our data
  const problem = problemsData.find(p => p.id == id);
  if (!problem) return null;
  
  // Store as current problem
  currentProblem = problem;
  
  // Reset UI elements associated with problem selection
  resetProblemUI();
  
  // Update active state in the list
  document.querySelectorAll('.problem-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id == id);
  });
  
  // Update the problem display in the main area
  updateProblemDisplay(problem);
  
  return problem;
}

/**
 * Reset UI elements when selecting a new problem
 */
function resetProblemUI() {
  // Reset hint counter
  window.hintCount = 0;
  
  // Reset code editor if reset button exists
  const resetBtn = document.getElementById('reset-code-btn');
  if (resetBtn) resetBtn.click();
}

/**
 * Update the main area to display the selected problem
 * @param {Object} problem - The problem object to display
 */
function updateProblemDisplay(problem) {
  // Update problem title and difficulty
  const titleElement = document.getElementById('problem-title');
  const difficultyElement = document.querySelector('.problem-header .difficulty');
  const contentElement = document.getElementById('problem-content');
  
  if (titleElement) {
    titleElement.textContent = `${problem.id}. ${problem.title}`;
  }
  
  if (difficultyElement) {
    difficultyElement.textContent = problem.difficulty;
    difficultyElement.className = `difficulty ${problem.difficulty.toLowerCase()}`;
  }
  
  if (contentElement) {
    contentElement.innerHTML = marked.parse(problem.description);
  }
}

/**
 * Extract unique topics from all problems
 */
function extractTopics() {
  allTopics = [];
  const topicSet = new Set();
  
  problemsData.forEach(problem => {
    if (problem.related_topics && problem.related_topics.length > 0) {
      const topicsString = problem.related_topics[0];
      if (topicsString) {
        const topics = topicsString.split(',');
        topics.forEach(topic => {
          const trimmedTopic = topic.trim();
          if (trimmedTopic) {
            topicSet.add(trimmedTopic);
          }
        });
      }
    }
  });
  
  // Convert Set to array and sort alphabetically
  allTopics = Array.from(topicSet).sort();
}

/**
 * Filter problems by difficulty and/or topic
 * @param {string} difficulty - The difficulty filter (or 'all')
 * @param {string} topic - The topic filter (or 'all')
 * @returns {Array} Filtered problems
 */
function filterProblems(difficulty, topic) {
  let filteredProblems = [...problemsData];
  
  // Apply difficulty filter
  if (difficulty !== 'all') {
    filteredProblems = filteredProblems.filter(
      (p) => p.difficulty.toLowerCase() === difficulty
    );
  }
  
  // Apply topic filter
  if (topic !== 'all') {
    filteredProblems = filteredProblems.filter(p => {
      if (!p.related_topics || p.related_topics.length === 0) return false;
      
      // Check if any of the related topics contain the selected topic
      const topicString = p.related_topics[0];
      if (!topicString) return false;
      
      const topics = topicString.split(',').map(t => t.trim().toLowerCase());
      return topics.some(t => t.toLowerCase().includes(topic.toLowerCase()));
    });
  }
  
  return filteredProblems;
}

/**
 * Populate topic filter dropdown with extracted topics
 */
function populateTopicFilter() {
  const topicFilter = document.getElementById('topic-filter');
  if (!topicFilter) return;
  
  // Clear existing options except the 'All Topics' option
  while (topicFilter.options.length > 1) {
    topicFilter.remove(1);
  }
  
  // Add each unique topic as an option
  allTopics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic.toLowerCase();
    option.textContent = topic;
    topicFilter.appendChild(option);
  });
}

/**
 * Set up the problem modal with filter functionality
 * @param {Function} onSelectProblem - Callback when problem is selected
 */
function setupProblemModal(onSelectProblem) {
  const modal = document.getElementById('problem-modal');
  const closeBtn = document.getElementById('close-modal');
  const changeBtn = document.getElementById('change-problem-btn');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const topicFilter = document.getElementById('topic-filter');

  if (changeBtn) {
    changeBtn.onclick = () => {
      modal.style.display = 'block';
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }

  // Close modal if clicked outside of content
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  // Populate topic filter with extracted topics
  populateTopicFilter();

  // Function to apply both filters simultaneously
  function applyFilters() {
    const difficulty = difficultyFilter.value;
    const topic = topicFilter.value;
    
    const filteredProblems = filterProblems(difficulty, topic);
    renderProblemList(filteredProblems, onSelectProblem);
  }

  // Filter problems by difficulty and topic
  if (difficultyFilter) {
    difficultyFilter.onchange = applyFilters;
  }
  
  // Filter problems by topic
  if (topicFilter) {
    topicFilter.onchange = applyFilters;
  }
}

/**
 * Get the current problem
 * @returns {Object|null} Current problem or null if none
 */
function getCurrentProblem() {
  return currentProblem;
}

/**
 * Get all problems data
 * @returns {Array} Array of all problems
 */
function getAllProblems() {
  return problemsData;
}

/**
 * Get all available topics
 * @returns {Array} Array of topic strings
 */
function getAllTopics() {
  return allTopics;
}

// Export the public API
export {
  fetchProblems,
  renderProblemList,
  selectProblem,
  setupProblemModal,
  filterProblems,
  getCurrentProblem,
  getAllProblems,
  getAllTopics
};
