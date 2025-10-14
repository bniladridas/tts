import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import mime from "mime";

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType
    .split(";")
    .map((s: string) => s.trim());
  const split = fileType.split("/");
  const format = split[1];
  const options: Partial<WavConversionOptions> = { numChannels: 1 };
  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }
  for (const param of params) {
    const [key, value] = param.split("=").map((s: string) => s.trim());
    if (key === "rate") options.sampleRate = parseInt(value, 10);
  }
  if (!options.sampleRate) options.sampleRate = 24000;
  if (!options.bitsPerSample) options.bitsPerSample = 16;
  return options as WavConversionOptions;
}

function createWavHeader(
  dataLength: number,
  options: WavConversionOptions,
): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

function convertToWav(rawData: string, mimeType: string): Buffer {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(
    Buffer.from(rawData, "base64").length,
    options,
  );
  const buffer = Buffer.from(rawData, "base64");
  return Buffer.concat([wavHeader, buffer]);
}

app.post("/api/tts", async (req, res) => {
  const { text } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set" });
  }
  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const config = {
      temperature: 1,
      responseModalities: ["audio"],
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          {
            speaker: "Speaker 1",
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          {
            speaker: "Speaker 2",
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
        ],
      },
    };
    const model = "gemini-2.5-flash-preview-tts";
    const contents = [{ role: "user", parts: [{ text }] }];
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    for await (const chunk of response) {
      if (
        !chunk.candidates ||
        !chunk.candidates[0].content ||
        !chunk.candidates[0].content.parts
      )
        continue;
      if (chunk.candidates[0].content.parts[0].inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        // @ts-expect-error mime types issue
        let fileExtension = mime.getExtension(inlineData.mimeType || "");
        let buffer = Buffer.from(inlineData.data || "", "base64");
        if (!fileExtension) {
          fileExtension = "wav";
          buffer = convertToWav(
            inlineData.data || "",
            inlineData.mimeType || "",
          );
        }
        res.setHeader("Content-Type", inlineData.mimeType || "audio/wav");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="tts_output.${fileExtension}"`,
        );
        return res.end(buffer);
      }
    }
    return res.status(500).json({ error: "No audio data received from API." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "TTS API error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TTS API server listening on port ${PORT}`);
});
