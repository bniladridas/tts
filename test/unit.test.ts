import { describe, it, expect } from "vitest";

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
  const [, format] = fileType.split("/");
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

describe("parseMimeType", () => {
  it("should parse basic audio/L16 mime type", () => {
    const result = parseMimeType("audio/L16");
    expect(result).toEqual({
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16,
    });
  });

  it("should parse mime type with rate parameter", () => {
    const result = parseMimeType("audio/L16; rate=44100");
    expect(result).toEqual({
      numChannels: 1,
      sampleRate: 44100,
      bitsPerSample: 16,
    });
  });

  it("should parse mime type with different bit depth", () => {
    const result = parseMimeType("audio/L24");
    expect(result).toEqual({
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 24,
    });
  });
});

describe("createWavHeader", () => {
  it("should create correct WAV header", () => {
    const options: WavConversionOptions = {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16,
    };
    const header = createWavHeader(1000, options);
    expect(header.length).toBe(44);
    expect(header.toString("ascii", 0, 4)).toBe("RIFF");
    expect(header.toString("ascii", 8, 12)).toBe("WAVE");
    expect(header.readUInt32LE(4)).toBe(36 + 1000);
  });
});

describe("convertToWav", () => {
  it("should convert base64 data to WAV buffer", () => {
    const rawData = Buffer.from("test").toString("base64");
    const mimeType = "audio/L16; rate=24000";
    const wavBuffer = convertToWav(rawData, mimeType);
    expect(wavBuffer.length).toBe(44 + 4); // header + data
    expect(wavBuffer.toString("ascii", 0, 4)).toBe("RIFF");
  });
});
