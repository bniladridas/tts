# Google Gemini tts CLI

Interactive command-line interface for generating lifelike speech using the Google Gemini API.
Powered by the `gemini-2.5-flash-preview-tts` model.

## Project Structure

```
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── interactive.ts
│   │   │   └── advanced.ts
│   │   └── index.ts
│   └── api/
│       └── server.ts
├── test/
│   ├── unit.test.ts
│   ├── e2e.test.ts
│   └── cli-e2e.test.ts
├── docs/
├── scripts/
│   └── main.ts
├── .gitignore
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

## Installation

```sh
npm install @bniladridas/tts
```

## Development Setup

```sh
npm install @google/genai mime chalk dotenv
npm install -D @types/node tsx
```

Create `.env` in the root:

```env
GEMINI_API_KEY=your_google_genai_api_key_here
```

## Run

```sh
npm run tts
```

## CLI Mode

```sh
npm run cli:interactive
npm run cli
```

## API Server

```sh
npm run dev
npm start
```

## Available Scripts

- `npm start` — production server
- `npm run dev` — development server
- `npm run cli` — CLI interface
- `npm run cli:interactive` — interactive CLI
- `npm run cli:advanced` — advanced CLI
- `npm test` — all tests
- `npm run test:e2e` — e2e tests only
- `npm run lint` — lint code
- `npm run typecheck` — type check
- `npm run format` — format code
- `npm run build` — build TypeScript

## Features

- Type text interactively to synthesize speech
- Choose voice: `1` (Zephyr) or `2` (Puck)
- Optional style: `"warm"`, `"calm"`, `"excited"`
- Output saved as `output_audio.wav`
- Type `exit` to quit

## CI/CD

GitHub Actions workflows:

- `tts.yml`: Runs tests, linting, type checking, and build on push/PR to main/master.
- `tts-release.yml`: Automates versioning, changelog, and GitHub releases on push to main using semantic-release.
- `tts-security.yml`: Performs security code scanning with CodeQL on push/PR and weekly.

## Releases

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and releases. Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat:` for new features (minor version bump)
- `fix:` for bug fixes (patch version bump)
- `BREAKING CHANGE:` for breaking changes (major version bump)

Releases are triggered on pushes to `main` branch. The latest release is automatically published to GitHub with generated changelogs.

## Conventional Commits

- Commit messages start with lowercase type: `feat:`, `fix:`, `chore:`
- Entire message lowercase
- First line ≤ 50 characters

Husky manages Git hooks automatically. Hooks are set up in `.husky/`:

- `pre-commit`: Checks code formatting.
- `commit-msg`: Validates commit message format (lowercase, <=50 chars, starts with type:).
