# Google Gemini TTS CLI

Interactive CLI for synthesizing speech using the Gemini API.

> This CLI uses the gemini-2.5-flash-preview-tts model from Google Gemini for all speech synthesis.

## Setup

```sh
npm install @google/genai mime chalk dotenv
npm install -D @types/node tsx
````

Create a `.env` file:

```env
GEMINI_API_KEY=your_google_genai_api_key_here
```

## Run

```sh
npm run tts
```

## Features

* Type text to synthesize
* Choose speaker: `1` (Zephyr) or `2` (Puck)
* Optional style (e.g. "Warm", "Calm", "Excited")
* Output saved as `output_audio.wav`
* Type `exit` to quit

## Other Scripts

* `test_api.ts`: One-off test
* `interactive_tts.ts`: Basic CLI
* `tts_advanced_cli.ts`: Full-featured CLI

## Conventional Commits

This project enforces conventional commit standards via CI on pull requests.

### Usage

Commit messages must:
- Start with a type like `feat:`, `fix:`, etc.
- Be entirely lowercase
- First line ≤60 characters

### Local Setup (Optional)

To enable the commit-msg hook locally:

```sh
cp scripts/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg
```
