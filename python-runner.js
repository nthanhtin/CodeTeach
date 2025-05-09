/**
 * Python Runner Module
 * Handles Python code execution with Pyodide integration
 */

// Import the progress tracker
import { markProblemCompleted, addSubmissionToHistory } from './progress-tracker.js';

// Global Pyodide instance
let pyodideInstance = null;

/**
 * Set up Pyodide integration for Python code execution
 * @returns {Promise<void>}
 */
async function setupPyodideIntegration() {
  try {
    console.log('Loading Pyodide...');
    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
    });
    
    console.log('Pyodide loaded successfully');
    
    // Set up basic Python environment
    await pyodideInstance.runPythonAsync(`
      import sys
      
      class OutputInterceptor:
          def __init__(self):
              self.buffer = ""
          
          def write(self, text):
              self.buffer += text
              return len(text)
          
          def flush(self):
              pass
      
      stdout_interceptor = OutputInterceptor()
      stderr_interceptor = OutputInterceptor()
      
      def get_stdout():
          return stdout_interceptor.buffer
      
      def get_stderr():
          return stderr_interceptor.buffer
      
      def clear_output():
          stdout_interceptor.buffer = ""
          stderr_interceptor.buffer = ""
      
      def run_python_code(code):
          """Execute Python code and handle exceptions"""
          try:
              # Use Python's exec function to run the code
              exec_globals = {}
              exec(code, exec_globals)
              return None
          except Exception as e:
              import traceback
              return traceback.format_exc()
    `);
    
    // Show successful installation message
    document.getElementById('python-output').textContent = "Python environment ready.";
  } catch (error) {
    console.error('Error setting up Pyodide:', error);
    document.getElementById('python-output').textContent = 
      "Error setting up Python environment: " + error.message;
  }
}

/**
 * Run Python code with the Pyodide instance
 * @param {string} code - Python code to execute
 * @param {boolean} captureOutput - Whether to capture stdout/stderr
 * @returns {Promise<Object>} - Execution result with stdout, stderr, and any return value
 */
async function runPythonCode(code, captureOutput = true) {
  if (!pyodideInstance) {
    throw new Error("Python environment not initialized");
  }
  
  const outputElement = document.getElementById('python-output');
  if (outputElement) {
    outputElement.innerHTML = "Running code...\n";
  }
  
  try {
    // Clear previous output
    await pyodideInstance.runPythonAsync("clear_output()");
    
    // Inject code into an environment with stdout/stderr capturing if needed
    let result;
    if (captureOutput) {
      result = await pyodideInstance.runPythonAsync(`
        import sys
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        
        sys.stdout = stdout_interceptor
        sys.stderr = stderr_interceptor
        
        try:
            # Use our custom run_python_code function
            error = run_python_code(${JSON.stringify(code)})
            if error:
                sys.stderr.write(error)
                result_value = None
            else:
                result_value = None
        except Exception as e:
            import traceback
            sys.stderr.write(traceback.format_exc())
            result_value = None
        finally:
            sys.stdout = original_stdout
            sys.stderr = original_stderr
        
        result_value
      `);
    } else {
      // Run directly without capturing output (for interactive use cases)
      result = await pyodideInstance.runPythonAsync(code);
    }
    
    // Get captured stdout and stderr
    const stdout = await pyodideInstance.runPythonAsync("get_stdout()");
    const stderr = await pyodideInstance.runPythonAsync("get_stderr()");
    
    // Format and return results
    if (outputElement) {
      let output = "";
      if (stdout) output += stdout;
      if (stderr) {
        output += "\n\nError:\n" + stderr;
      }
      outputElement.textContent = output || "Code executed successfully with no output.";
    }
    
    return {
      result: result,
      stdout: stdout,
      stderr: stderr
    };
  } catch (error) {
    console.error('Error executing Python code:', error);
    if (outputElement) {
      outputElement.textContent = "Error executing code: " + error.message;
    }
    
    return {
      result: null,
      stdout: "",
      stderr: error.toString()
    };
  }
}

/**
 * Parse input string for code examples
 * @param {string} inputStr - String containing input assignments
 * @returns {string} - Python code with the assignments
 */
function parseInputAssignments(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return '';
  
  // Parse complex input with proper handling of nested structures
  function safeSplit(str) {
    let parts = [];
    let start = 0;
    let bracketDepth = 0;
    let quoteChar = null;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (quoteChar) {
        // Inside a quoted string
        if (char === quoteChar && str[i-1] !== '\\') {
          quoteChar = null; // Exit quoted string
        }
      } else if (char === '"' || char === "'") {
        // Enter quoted string
        quoteChar = char;
      } else if (char === '[' || char === '{') {
        bracketDepth++;
      } else if (char === ']' || char === '}') {
        bracketDepth--;
      } else if (char === ',' && bracketDepth === 0) {
        // Found separator at top level
        parts.push(str.substring(start, i).trim());
        start = i + 1;
      }
    }
    
    // Add the last part
    if (start < str.length) {
      parts.push(str.substring(start).trim());
    }
    
    return parts;
  }
  
  // Convert input assignments to Python code
  const inputs = safeSplit(inputStr);
  const pythonCode = inputs
    .map(input => {
      if (!input.includes('=')) return null;
      
      const [name, value] = input.split('=').map(s => s.trim());
      // Try to adapt the values to Python syntax
      let pyValue = value;
      
      // Convert JavaScript-style arrays to Python lists
      if (value.startsWith('[') && value.endsWith(']')) {
        pyValue = value.replace(/null/g, 'None').replace(/true/g, 'True').replace(/false/g, 'False');
      }
      
      return `${name} = ${pyValue}`;
    })
    .filter(Boolean)
    .join('\n');
  
  return pythonCode;
}

/**
 * Run code with the provided examples from a problem
 * @param {string} code - The Python code to run
 * @param {Array} examples - Array of example objects with input and expected output
 * @param {string} mode - 'run' for single execution or 'submit' for testing against examples
 * @returns {Promise<Object>} - Execution results
 */
async function runWithExamples(code, examples, mode = 'run') {
  if (!pyodideInstance) {
    throw new Error("Python environment not initialized");
  }
  
  const outputElement = document.getElementById('python-output');
  if (!outputElement) return null;
  
  outputElement.textContent = mode === 'run' ? "Running code...\n" : "Testing with examples...\n";
  
  try {
    if (mode === 'run') {
      // Simple execution with the first example as input
      if (examples && examples.length > 0) {
        const firstExample = examples[0];
        const inputAssignments = parseInputAssignments(firstExample.input);
        
        const fullCode = `
${inputAssignments}

${code}
`;
        
        return await runPythonCode(fullCode);
      } else {
        // No examples, just run the code as is
        return await runPythonCode(code);
      }
    } else if (mode === 'submit') {
      // Test against all examples
      if (!examples || examples.length === 0) {
        outputElement.textContent = "No test cases available for this problem.";
        return null;
      }
      
      // Clear previous output
      await pyodideInstance.runPythonAsync("clear_output()");
      
      let allResults = [];
      for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        const inputAssignments = parseInputAssignments(example.input);
        
        // Prepare the test case
        const testCode = `
# Test case ${i + 1}
${inputAssignments}

# Store variables before running
_original_vars = list(locals().keys())

# Run user code
${code}

# Find new variables
_new_vars = [var for var in locals().keys() if var not in _original_vars and not var.startswith('_')]

# Show results
if _new_vars:
  print(f"Test case {i + 1} output:")
  for var in _new_vars:
    print(f"{var} = {locals()[var]}")
else:
  print(f"Test case {i + 1}: No output variables found.")
`;
        
        const result = await runPythonCode(testCode, false);
        allResults.push({
          example,
          ...result
        });
        
        // Append to output
        if (result.stdout) {
          outputElement.textContent += result.stdout + "\n";
        }
        if (result.stderr) {
          outputElement.textContent += "Error in test case " + (i + 1) + ":\n" + result.stderr + "\n";
        }
        
        // Add expected output for comparison
        if (example.output) {
          outputElement.textContent += `Expected: ${example.output}\n\n`;
        }
      }
      
      outputElement.textContent += "\nAll test cases completed.";
      return allResults;
    }
  } catch (error) {
    console.error('Error in runWithExamples:', error);
    outputElement.textContent += "Error: " + error.message;
    return null;
  }
}

/**
 * Set up event listeners for Run and Submit buttons
 * @param {Object} currentProblem - The currently selected problem
 */
function setupPythonRunButtons(currentProblem) {
  const runBtn = document.getElementById('run-code-btn');
  const submitBtn = document.getElementById('submit-code-btn');
  
  if (runBtn) {
    runBtn.onclick = () => {
      const codeEditor = document.getElementById('code-editor');
      const code = codeEditor.value.trim();
      
      if (!code) {
        document.getElementById('python-output').textContent = 'Please enter some code to run.';
        return;
      }
      
      if (currentProblem && currentProblem.examples) {
        runWithExamples(code, currentProblem.examples, 'run');
      } else {
        runPythonCode(code);
      }
    };
  }
  
  if (submitBtn) {
    submitBtn.onclick = async () => {
      const codeEditor = document.getElementById('code-editor');
      const code = codeEditor.value.trim();
      
      if (!code) {
        document.getElementById('python-output').textContent = 'Please enter some code to submit.';
        return;
      }
      
      if (currentProblem && currentProblem.examples) {
        // Add the code submission to history regardless of correctness
        if (currentProblem.id) {
          // We'll determine correctness after running the tests
          const results = await runWithExamples(code, currentProblem.examples, 'submit');
          
          // Check if all test cases passed by examining results
          let allTestsPassed = false;
          if (results && results.length > 0) {
            // Consider it passed if no test case has errors
            allTestsPassed = results.every(result => !result.stderr || result.stderr.trim() === '');
            
            // Record the submission with pass/fail status
            addSubmissionToHistory(
              currentProblem.id, 
              code, 
              allTestsPassed
            );
            
            // If all tests passed, mark the problem as completed
            if (allTestsPassed) {
              markProblemCompleted(currentProblem.id, true);
              // Display a success message
              const outputElement = document.getElementById('python-output');
              if (outputElement) {
                outputElement.textContent += "\n\n🎉 Congratulations! All tests passed! This problem is now marked as completed.";
              }
            }
          }
        } else {
          await runWithExamples(code, currentProblem.examples, 'submit');
        }
      } else {
        document.getElementById('python-output').textContent = 'No test cases available for this problem.';
      }
    };
  }
}

// Export the module's public API
export {
  setupPyodideIntegration,
  runPythonCode,
  runWithExamples,
  setupPythonRunButtons
};
