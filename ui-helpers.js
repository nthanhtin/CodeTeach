/**
 * UI Helper functions for the CodeTeach application
 * Contains modular components for rendering the problem list and related UI elements
 */

/**
 * Create a topic tag element
 * @param {string} topic - The topic text
 * @param {boolean} isMoreIndicator - Whether this is a "+n more" indicator
 * @returns {HTMLElement} - The created span element
 */
export function createTopicTag(topic, isMoreIndicator = false) {
  const topicTag = document.createElement('span');
  topicTag.className = isMoreIndicator ? 'topic-tag more' : 'topic-tag';
  topicTag.textContent = isMoreIndicator ? topic : topic.trim();
  return topicTag;
}

/**
 * Create a container with topic tags
 * @param {string} topicsString - Comma-separated list of topics
 * @returns {HTMLElement|null} - Topics container element or null if no topics
 */
export function createTopicsElement(topicsString) {
  if (!topicsString) return null;
  
  const topicsContainer = document.createElement('div');
  topicsContainer.className = 'problem-topics';
  
  const topics = topicsString.split(',');
  
  // Add up to 3 topic tags
  topics.slice(0, 3).forEach(topic => {
    topicsContainer.appendChild(createTopicTag(topic));
  });
  
  // Add a +n indicator if there are more topics
  if (topics.length > 3) {
    topicsContainer.appendChild(
      createTopicTag('+' + (topics.length - 3), true)
    );
  }
  
  return topicsContainer;
}

/**
 * Create the problem info element (title, difficulty, topics)
 * @param {Object} problem - Problem data object
 * @returns {HTMLElement} - Problem info container element
 */
export function createProblemInfoElement(problem) {
  const problemInfo = document.createElement('div');
  problemInfo.className = 'problem-info';
  
  // Add problem ID, title and difficulty
  problemInfo.innerHTML = `${problem.id}. ${problem.title} <span class="difficulty ${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>`;
  
  // Add topic tags if they exist
  if (problem.related_topics && problem.related_topics.length > 0) {
    const topicsElement = createTopicsElement(problem.related_topics[0]);
    if (topicsElement) {
      problemInfo.appendChild(topicsElement);
    }
  }
  
  return problemInfo;
}

/**
 * Create a list item for a problem
 * @param {Object} problem - Problem data object
 * @param {number} index - Index in the list (used for active state)
 * @param {Function} selectProblemFn - Function to call when problem is selected
 * @param {boolean} isCompleted - Whether the problem is completed
 * @returns {HTMLElement} - List item element
 */
export function createProblemListItem(problem, index, selectProblemFn, isCompleted = false) {
  const li = document.createElement('li');
  li.className = 'problem-item' + (index === 0 ? ' active' : '');
  li.dataset.id = problem.id;
  li.dataset.problemId = problem.id; // For progress tracking selectors
  
  // Add completed class if the problem is completed
  if (isCompleted) {
    li.classList.add('completed');
  }
  
  const problemInfo = createProblemInfoElement(problem);
  
  // Add completion indicator if completed
  if (isCompleted) {
    const completionIndicator = document.createElement('span');
    completionIndicator.classList.add('completion-indicator');
    completionIndicator.innerHTML = '✓';
    completionIndicator.title = 'Problem completed';
    problemInfo.appendChild(completionIndicator);
  }
  
  li.appendChild(problemInfo);
  
  li.onclick = () => selectProblemFn(problem.id);
  return li;
}

/**
 * Create an element for displaying when no problems match the filters
 * @returns {HTMLElement} - List item with "no problems" message
 */
export function createNoProblemsElement() {
  const li = document.createElement('li');
  li.className = 'no-problems';
  li.textContent = 'No problems match your filters.';
  return li;
}

/**
 * Extract unique topics from an array of problems
 * @param {Array} problems - Array of problem objects
 * @returns {Array} - Sorted array of unique topics
 */
export function extractUniqueTopics(problems) {
  const topicSet = new Set();
  
  problems.forEach(problem => {
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
  return Array.from(topicSet).sort();
}

/**
 * Populate a select element with topic options
 * @param {HTMLSelectElement} selectElement - The select element to populate
 * @param {Array} topics - Array of topic strings
 */
export function populateTopicFilterOptions(selectElement, topics) {
  if (!selectElement) return;
  
  // Clear existing options except the 'All Topics' option
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
  
  // Add each unique topic as an option
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic.toLowerCase();
    option.textContent = topic;
    selectElement.appendChild(option);
  });
}
