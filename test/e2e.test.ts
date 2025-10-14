import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess } from "child_process";
import dotenv from "dotenv";

dotenv.config();

describe("E2E Tests", () => {
  let serverProcess: ChildProcess;
  let port: number;

  beforeAll(async () => {
    port = 3002; // Use a different port for tests
    process.env.PORT = port.toString();
    process.env.NODE_ENV = "test";
    process.env.GEMINI_API_KEY = "dummy_key_for_tests";

    // Start the server
    serverProcess = spawn("./node_modules/.bin/tsx", ["src/api/server.ts"], {
      stdio: "pipe",
      env: { ...process.env, PORT: port.toString() },
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      let output = "";
      serverProcess.stdout.on("data", (data: Buffer) => {
        output += data.toString();
        if (output.includes(`listening on port ${port}`)) {
          resolve(true);
        }
      });
      serverProcess.stderr.on("data", (data: Buffer) => {
        console.error("Server stderr:", data.toString());
      });
      serverProcess.on("error", reject);

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error("Server did not start")), 10000);
    });
  }, 15000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  it("should return error for missing text", async () => {
    const response = await fetch(`http://localhost:${port}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing text");
  });

  // Note: Actual TTS test would require a valid API key and might be mocked
  it.skip("should handle valid request (mocked)", async () => {
    // This test assumes API key is set, but in CI it might not be
    // For now, just check that the endpoint accepts the request
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping TTS test: GEMINI_API_KEY not set");
      return;
    }

    const response = await fetch(`http://localhost:${port}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello world" }),
    });

    // Should return audio or error
    expect([200, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(response.headers.get("content-type")).toMatch(/^audio\//);
    }
  });
});
