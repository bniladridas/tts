import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';
import dotenv from 'dotenv';
import readline from 'readline';
import chalk from 'chalk';

dotenv.config();

function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(chalk.red(`Error writing file ${fileName}:`), err);
    } else {
      console.log(chalk.green(`✓ Saved: ${fileName}`));
    }
  });
}

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function convertToWav(rawData: string, mimeType: string) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(Buffer.from(rawData, 'base64').length, options);
  const buffer = Buffer.from(rawData, 'base64');
  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [, format] = fileType.split('/');
  const options: Partial<WavConversionOptions> = { numChannels: 1 };

  if (format?.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') options.sampleRate = parseInt(value, 10);
  }

  return {
    sampleRate: options.sampleRate || 24000,
    bitsPerSample: options.bitsPerSample || 16,
    numChannels: options.numChannels,
  };
}

function createWavHeader(dataLength: number, { numChannels, sampleRate, bitsPerSample }: WavConversionOptions) {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

async function synthesize({ text, speaker, style, fileName = 'output_audio' }: { text: string, speaker: string, style?: string, fileName?: string }) {
  if (!process.env.GEMINI_API_KEY) {
    console.error(chalk.red('GEMINI_API_KEY not set.'));
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `${style?.trim() ? style.trim() + '\n' : ''}${speaker}: ${text}`;

  const config = {
    temperature: 1,
    responseModalities: ['audio'],
    multiSpeakerVoiceConfig: {
      speakerVoiceConfigs: [
        { speaker: 'Speaker 1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        { speaker: 'Speaker 2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      ],
    },
  };

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-preview-tts',
      config,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    let fileSaved = false;

    for await (const chunk of response) {
      const part = chunk.candidates?.[0].content?.parts?.[0];
      if (part?.inlineData) {
        const { mimeType, data } = part.inlineData;
        let extension = mime.getExtension(mimeType || '') || 'wav';
        let buffer = Buffer.from(data || '', 'base64');
        if (!mimeType?.includes('wav')) {
          buffer = convertToWav(data || '', mimeType || '');
        }
        saveBinaryFile(`${fileName}.${extension}`, buffer);
        fileSaved = true;
      }
    }

    if (!fileSaved) console.log(chalk.red('No audio data received.'));
  } catch (err) {
    console.error(chalk.red('API error:'), err);
  }
}

function promptAndSynthesize() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(chalk.bold('\nGemini TTS CLI\n'));
  console.log('Enter text, choose speaker, add optional style.\n');

  function ask() {
    rl.question('Text: ', async (text) => {
      if (text.trim().toLowerCase() === 'exit') return rl.close();

      rl.question('Speaker (1=Zephyr, 2=Puck): ', async (speakerInput) => {
        if (speakerInput.trim().toLowerCase() === 'exit') return rl.close();

        const speaker = speakerInput.trim() === '2' ? 'Speaker 2' : 'Speaker 1';

        rl.question('Style (optional): ', async (style) => {
          if (style.trim().toLowerCase() === 'exit') return rl.close();

          console.log(chalk.gray('Generating...'));
          await synthesize({ text, speaker, style });
          ask();
        });
      });
    });
  }

  ask();
}

promptAndSynthesize();
