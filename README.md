# Google Gemini tts CLI

Interactive command-line interface for generating lifelike speech using the Google Gemini API.
Powered by the `gemini-2.5-flash-preview-tts` model.

---

## Project Structure

```
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── interactive.ts
│   │   │   └── advanced.ts
│   │   └── index.ts
│   ├── api/
│   │   └── server.ts
│   └── utils/
├── test/
│   └── api.test.ts
├── docs/
├── scripts/
├── .gitignore
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

---

## Setup

```sh
npm install @google/genai mime chalk dotenv
npm install -D @types/node tsx
```

Create `.env` in the root:

```env
GEMINI_API_KEY=your_google_genai_api_key_here
```

---

## Run

```sh
npm run tts
```

---

## CLI Mode

Start the interactive CLI:

```sh
npm run cli:interactive
```

Run a specific command:

```sh
npm run cli
```

---

## API Server

Start the development server:

```sh
npm run dev
```

Start the production server:

```sh
npm start
```

---

## Available Scripts

* `npm start` — production server
* `npm run dev` — development server with hot reload
* `npm run cli` — run CLI interface
* `npm run cli:interactive` — interactive CLI mode
* `npm run cli:advanced` — advanced CLI commands
* `npm test` — run tests
* `npm run lint` — lint code
* `npm run format` — format code

---

## Features

* Type text interactively to synthesize speech
* Choose voice: `1` (Zephyr) or `2` (Puck)
* Optional style: `"warm"`, `"calm"`, `"excited"`
* Output saved as `output_audio.wav`
* Type `exit` to quit

---

## Test

```sh
npm run test
```

Runs `test/api.test.ts`.

---

## Conventional Commits

* Commit messages start with lowercase type: `feat:`, `fix:`, `chore:`
* Entire message lowercase
* First line ≤ 60 characters

Optional local hook:

```sh
cp scripts/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg
```
