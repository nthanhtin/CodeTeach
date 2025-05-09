/**
 * Progress Tracker Module
 * Handles tracking and persisting user progress locally
 */

// Key for storing progress data in localStorage
const PROGRESS_STORAGE_KEY = 'codeteach_user_progress';

/**
 * User progress data structure
 * @typedef {Object} UserProgress
 * @property {Object} completedProblems - Map of problem IDs to completion status
 * @property {Object} submissionHistory - Map of problem IDs to submission history
 * @property {number} lastAccessTime - Timestamp of last access
 */

/**
 * Load user progress from localStorage
 * @returns {UserProgress} The user's progress data
 */
function loadUserProgress() {
  try {
    const storedData = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!storedData) {
      return initializeProgressData();
    }
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error loading user progress:', error);
    return initializeProgressData();
  }
}

/**
 * Initialize empty progress data structure
 * @returns {UserProgress} New empty progress data
 */
function initializeProgressData() {
  return {
    completedProblems: {},
    submissionHistory: {},
    lastAccessTime: Date.now()
  };
}

/**
 * Save user progress to localStorage
 * @param {UserProgress} progressData - The progress data to save
 */
function saveUserProgress(progressData) {
  try {
    // Update the last access time
    progressData.lastAccessTime = Date.now();
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressData));
  } catch (error) {
    console.error('Error saving user progress:', error);
  }
}

/**
 * Mark a problem as completed
 * @param {string|number} problemId - ID of the problem
 * @param {boolean} isCompleted - Whether the problem is completed
 */
function markProblemCompleted(problemId, isCompleted = true) {
  const progressData = loadUserProgress();
  progressData.completedProblems[problemId] = isCompleted;
  saveUserProgress(progressData);
  
  // Update UI to reflect the change
  updateProblemCompletionUI(problemId, isCompleted);
}

/**
 * Check if a problem is completed
 * @param {string|number} problemId - ID of the problem
 * @returns {boolean} Whether the problem is completed
 */
function isProblemCompleted(problemId) {
  const progressData = loadUserProgress();
  return !!progressData.completedProblems[problemId];
}

/**
 * Add a submission to the user's history
 * @param {string|number} problemId - ID of the problem
 * @param {string} code - The submitted code
 * @param {boolean} isCorrect - Whether the submission was correct
 */
function addSubmissionToHistory(problemId, code, isCorrect) {
  const progressData = loadUserProgress();
  
  if (!progressData.submissionHistory[problemId]) {
    progressData.submissionHistory[problemId] = [];
  }
  
  const submission = {
    timestamp: Date.now(),
    code: code,
    isCorrect: isCorrect
  };
  
  progressData.submissionHistory[problemId].push(submission);
  
  // If submission is correct, mark the problem as completed
  if (isCorrect) {
    progressData.completedProblems[problemId] = true;
  }
  
  saveUserProgress(progressData);
}

/**
 * Get a user's submission history for a problem
 * @param {string|number} problemId - ID of the problem
 * @returns {Array} Array of submission objects
 */
function getSubmissionHistory(problemId) {
  const progressData = loadUserProgress();
  return progressData.submissionHistory[problemId] || [];
}

/**
 * Update the UI to reflect problem completion status
 * @param {string|number} problemId - ID of the problem
 * @param {boolean} isCompleted - Whether the problem is completed
 */
function updateProblemCompletionUI(problemId, isCompleted) {
  // Find all elements representing this problem in the UI
  const problemElements = document.querySelectorAll(`[data-problem-id="${problemId}"]`);
  
  problemElements.forEach(element => {
    if (isCompleted) {
      element.classList.add('completed');
      
      // Add completion indicator if it doesn't exist
      if (!element.querySelector('.completion-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'completion-indicator';
        indicator.innerHTML = '✓';
        indicator.title = 'Problem completed';
        element.appendChild(indicator);
      }
    } else {
      element.classList.remove('completed');
      
      // Remove completion indicator if it exists
      const indicator = element.querySelector('.completion-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
  });
}

/**
 * Get the count of completed problems
 * @returns {number} Count of completed problems
 */
function getCompletedCount() {
  const progressData = loadUserProgress();
  return Object.values(progressData.completedProblems).filter(status => status).length;
}

/**
 * Get the total count of problems attempted
 * @returns {number} Count of problems attempted
 */
function getAttemptedCount() {
  const progressData = loadUserProgress();
  return Object.keys(progressData.submissionHistory).length;
}

/**
 * Initialize the progress tracking UI elements
 */
function initializeProgressTracker() {
  const progressData = loadUserProgress();
  
  // Update UI for all completed problems
  Object.entries(progressData.completedProblems).forEach(([problemId, completed]) => {
    if (completed) {
      updateProblemCompletionUI(problemId, true);
    }
  });
  
  // Add completion count to the UI if stats element exists
  const statsElement = document.getElementById('completion-stats');
  if (statsElement) {
    const completedCount = getCompletedCount();
    const attemptedCount = getAttemptedCount();
    statsElement.textContent = `${completedCount} completed / ${attemptedCount} attempted`;
  }
}

// Export the module functions
export {
  loadUserProgress,
  saveUserProgress,
  markProblemCompleted,
  isProblemCompleted,
  addSubmissionToHistory,
  getSubmissionHistory,
  getCompletedCount,
  getAttemptedCount,
  initializeProgressTracker
};
