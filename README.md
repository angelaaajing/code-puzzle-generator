# Code Puzzle Generator 🧩

**An AI-powered interactive learning tool that transforms complex coding problems into draggable, solvable puzzles.**

### 🚀 Overview
Traditional coding practice can be intimidating. This project leverages LLMs to decompose programming challenges into modular "code pieces," allowing users to reconstruct logic through a gamified drag-and-drop interface. It’s designed to help beginners focus on **logical flow** rather than syntax errors.

### ✨ Key Features
* **AI Logic Decomposition:** Uses OpenAI's models to intelligently split a solution into meaningful, non-trivial code blocks.
* **Interactive Workspace:** A Next.js-powered drag-and-drop interface for assembling code.
* **Real-time Validation:** Instant feedback on the correctness of the assembled logic.
* **Intelligent Hinting:** A "Hint" system that provides context-aware guidance without giving away the full answer.

### 🛠️ Tech Stack
* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **AI Integration:** OpenAI API (GPT-3.5/4) with custom Prompt Engineering for code chunking.
* **Styling & UI:** Tailwind CSS, Framer Motion (for smooth drag-and-drop animations).
* **Backend:** Next.js Serverless Functions.

### 🧠 The "AI" Part
The core challenge wasn't just calling an API, but ensuring the **granularity** of the puzzle. 
* **Prompt Engineering:** I designed specific system prompts to ensure the LLM returns valid JSON containing logical code snippets that are neither too long (making it too easy) nor too short (making it tedious).
* **State Management:** Handling the sequence of dragged cards and validating them against the LLM's "Golden Path" response.

### 🛠️ Installation & Setup
```bash
git clone https://github.com/your-username/code-puzzle-generator.git
cd code-puzzle-generator
npm install
# Add your OPENAI_API_KEY to .env
npm run dev
```
# ChatGPT History
- https://chatgpt.com/share/680be687-b2e8-8007-9b1d-04d73bb4259a
- https://chatgpt.com/share/680bfc43-dca4-8007-bbcc-d1bfb5cf6ea9
- drop and drag: https://chatgpt.com/share/68138bd1-3464-8007-94ae-1b1897b65ed2
- https://chatgpt.com/share/6814361e-3ba8-8007-ac44-4ab724f03065 
- https://chatgpt.com/share/681459e2-2a14-8007-ba85-111d23e480c7
- https://chatgpt.com/share/6814677b-dc0c-8007-9435-523716d09c2a
- https://chatgpt.com/share/68147440-9010-8007-9522-57c224bb17aa
- https://chatgpt.com/share/68148fb1-2bd8-8007-b7b0-1edfead63799
