# Google Gemini tts CLI

An interactive command-line interface for generating lifelike speech using the **Google Gemini API**.

> Powered by the `gemini-2.5-flash-preview-tts` model for high-quality, low-latency text-to-speech synthesis.

---

## 📦 Project Structure

```
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── interactive.ts    # Basic interactive CLI
│   │   │   └── advanced.ts       # Full-featured CLI with options
│   │   └── index.ts              # CLI entry point
│   ├── api/
│   │   └── server.ts             # Simple TTS API server
│   └── utils/                    # Utility functions (future use)
├── test/
│   └── api.test.ts               # API and CLI test suite
├── docs/                         # Documentation and guides
├── scripts/                      # Project scripts and hooks
├── .gitignore                    # Ignored files
├── package.json                  # Scripts, dependencies, metadata
├── tsconfig.json                 # TypeScript configuration
└── .eslintrc.json                # ESLint rules
```

---

## ⚙️ Setup

```sh
npm install @google/genai mime chalk dotenv
npm install -D @types/node tsx
```

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_google_genai_api_key_here
```

---

## ▶️ Run the CLI

```sh
npm run tts
```

### Features

* Type text interactively to synthesize speech
* Choose voice: `1` (**Zephyr**) or `2` (**Puck**)
* Add style modifiers like `"warm"`, `"calm"`, or `"excited"`
* Output audio automatically saved as `output_audio.wav`
* Type `exit` anytime to quit

---

## 🧪 Test the API

```sh
npm run test
```

Runs the basic TTS test defined in `test/api.test.ts`.

---

## 💬 Conventional Commits

This project follows the **Conventional Commits** standard.
All pull requests are validated through CI.

### Rules

* Start with a lowercase type: `feat:`, `fix:`, `chore:`, etc.
* Entire message should be lowercase
* First line ≤ 60 characters

### Optional Local Setup

To enable the `commit-msg` hook locally:

```sh
cp scripts/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg
```
