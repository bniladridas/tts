import { describe, it, expect } from "vitest";
import { spawn } from "child_process";

describe("CLI E2E Tests", () => {
  it("should start CLI without error", async () => {
    const cliProcess = spawn("./node_modules/.bin/tsx", ["src/cli/index.ts"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";

    cliProcess.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    // Wait a bit for it to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Kill the process
    cliProcess.kill();

    await new Promise((resolve) => {
      cliProcess.on("close", () => {
        resolve(true);
      });
    });

    // Check that it showed prompt
    expect(output).toContain("Gemini TTS CLI");
  });

  it("should start advanced CLI without error", async () => {
    const cliProcess = spawn(
      "./node_modules/.bin/tsx",
      ["src/cli/commands/advanced.ts"],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let output = "";

    cliProcess.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    // Wait a bit for it to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Kill the process
    cliProcess.kill();

    await new Promise((resolve) => {
      cliProcess.on("close", () => {
        resolve(true);
      });
    });

    // Check that it showed header
    expect(output).toContain("Google GenAI TTS");
  });
});
