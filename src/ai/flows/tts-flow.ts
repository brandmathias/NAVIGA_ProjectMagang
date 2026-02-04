'use server';

/**
 * @fileOverview A Text-to-Speech (TTS) flow for generating voice notes.
 *
 * - generateCustomerVoicenote - A function that converts text to a WAV audio data URI.
 * - VoicenoteInput - The input type for the generateCustomerVoicenote function.
 * - VoicenoteOutput - The return type for the generateCustomerVoicenote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const VoicenoteInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type VoicenoteInput = z.infer<typeof VoicenoteInputSchema>;

const VoicenoteOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio as a data URI in WAV format. e.g., 'data:audio/wav;base64,...'"
    ),
});
export type VoicenoteOutput = z.infer<typeof VoicenoteOutputSchema>;

export async function generateCustomerVoicenote(input: VoicenoteInput): Promise<VoicenoteOutput> {
  return generateVoicenoteFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateVoicenoteFlow = ai.defineFlow(
  {
    name: 'generateVoicenoteFlow',
    inputSchema: VoicenoteInputSchema,
    outputSchema: VoicenoteOutputSchema,
  },
  async ({ text }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard, clear male voice
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('TTS model did not return any media.');
    }
    
    // The media.url from Gemini TTS is a base64 encoded string of PCM audio data.
    // Format: 'data:audio/L16;rate=24000;channels=1;base64,....'
    // We need to extract the base64 part and convert it to a WAV buffer.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
