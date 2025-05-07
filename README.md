# WebLLM Coding Tutor

A modern, browser-based LeetCode-style coding tutor powered by [WebLLM](https://mlc.ai/web-llm/) and an in-browser AI assistant. Practice coding problems, run and submit code, and get AI-powered hints, explanations, and optimizations—all client-side, with no server required.

---

## Features

- **LeetCode-style Problems:**
  - Large curated set of problems (JSON-based, easily extendable)
  - Modal dialog for fast problem selection
  - Full problem descriptions, constraints, and multiple examples

- **Modern Workspace UI:**
  - 3-column layout: problem description (left), code editor & output (center), AI chat (right)
  - Tall, scrollable output console
  - Responsive and mobile-friendly

- **Code Execution in Browser:**
  - Python code runs instantly using Pyodide (no backend)
  - Run button tests the first example; Submit tests all examples
  - Output is compared for correctness; pass/fail shown for each case

- **WebLLM AI Assistant:**
  - Hints, solution approaches, code explanations, and optimizations
  - Context-aware, uses your session and problem state
  - Runs entirely in-browser using WebGPU (Hermes-3, Phi-3.5, etc.)

- **No Server Required:**
  - All code, model inference, and chat happen in your browser
  - Your code and data never leave your device

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm start
   ```
3. **Open your browser:**
   Go to [http://localhost:5173/](http://localhost:5173/) (or as shown in the terminal)
4. **Load a model:**
   Select an AI model (Hermes-3 recommended) and click "Load AI"
5. **Pick a problem:**
   Click "Change Problem" to open the modal and select a coding problem
6. **Practice & Learn:**
   - Write your solution in the editor
   - Use Run/Submit to check your code
   - Ask the AI for hints, explanations, and more!

---

## Project Structure
- `assets/leetcode_problems.json` — Problem set with examples
- `main.js` — UI logic, code execution, AI chat integration
- `index.html` — Main UI layout
- `style.css` — Modern, responsive styles

---

## Tech Stack
- [WebLLM](https://mlc.ai/web-llm/) for in-browser LLM inference
- [Pyodide](https://pyodide.org/) for Python code execution
- [Vite](https://vitejs.dev/) for fast development
- Vanilla JS + modern CSS

---

## License
MIT

## Requirements

- A modern browser with WebGPU support (Chrome 113+ recommended)
- Sufficient RAM (at least 8GB, 16GB recommended)
- A relatively new GPU is recommended but not required

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open the browser at the URL shown in the terminal (typically http://localhost:5173/)

4. Select a model, click "Load Model", and start chatting!

## Notes

- The first model load can take some time as it downloads the model weights
- Function calling currently only works with Hermes-2-Pro models (select these for tool calling)
- The function tools are simulated in the browser (e.g., weather data is random)
- The entire processing happens on your device - no data is sent to any server
