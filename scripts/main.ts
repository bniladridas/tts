// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node
// npm install dotenv

import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { writeFile } from "fs";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, "utf8", (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`File ${fileName} saved to file system.`);
  });
}

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function convertToWav(rawData: string, mimeType: string) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(
    Buffer.from(rawData, "base64").length,
    options,
  );
  const buffer = Buffer.from(rawData, "base64");
  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType: string) {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
  const split = fileType.split("/");
  const format = split[1];
  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
  };
  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }
  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") {
      options.sampleRate = parseInt(value, 10);
    }
  }
  // Provide defaults if missing
  if (!options.sampleRate) options.sampleRate = 24000;
  if (!options.bitsPerSample) options.bitsPerSample = 16;
  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions) {
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

async function synthesize(text: string, fileName: string = "output_audio") {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set in environment variables.");
    console.error(
      "Please add your API key to a .env file or set it in your shell.",
    );
    process.exit(1);
  }
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    temperature: 1,
    responseModalities: ["audio"],
    multiSpeakerVoiceConfig: {
      speakerVoiceConfigs: [
        {
          speaker: "Speaker 1",
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Zephyr",
            },
          },
        },
        {
          speaker: "Speaker 2",
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck",
            },
          },
        },
      ],
    },
  };
  const model = "gemini-2.5-flash-preview-tts";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text,
        },
      ],
    },
  ];
  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    let fileSaved = false;
    for await (const chunk of response) {
      if (
        !chunk.candidates ||
        !chunk.candidates[0].content ||
        !chunk.candidates[0].content.parts
      ) {
        continue;
      }
      if (chunk.candidates[0].content.parts[0].inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        let fileExtension = mime.getExtension(inlineData.mimeType || "");
        let buffer = Buffer.from(inlineData.data || "", "base64");
        if (!fileExtension) {
          fileExtension = "wav";
          buffer = convertToWav(
            inlineData.data || "",
            inlineData.mimeType || "",
          );
        }
        saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
        fileSaved = true;
      } else if (chunk.text) {
        console.log(chunk.text);
      }
    }
    if (fileSaved) {
      console.log("Audio file saved. Check your project directory.");
    } else {
      console.log("No audio data received from API.");
    }
  } catch (err) {
    console.error("Error during API call:", err);
  }
}

function promptAndSynthesize() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function ask() {
    rl.question(
      "Enter text to synthesize (or type 'exit' to quit):\n",
      async (input) => {
        if (input.trim().toLowerCase() === "exit") {
          rl.close();
          process.exit(0);
        }
        await synthesize(input, "output_audio");
        ask();
      },
    );
  }

  ask();
}

promptAndSynthesize();
