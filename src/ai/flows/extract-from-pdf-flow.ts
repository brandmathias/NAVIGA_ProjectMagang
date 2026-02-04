
'use server';

/**
 * @fileOverview An AI flow to extract structured customer data from a PDF document.
 *
 * - extractCustomersFromPdf - Extracts customer information from a PDF file provided as a data URI.
 * - ExtractCustomersInput - The input type for the extractCustomersFromPdf function.
 * - ExtractCustomersOutput - The return type for the extractCustomersFromPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

const ExtractCustomersInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file encoded as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractCustomersInput = z.infer<typeof ExtractCustomersInputSchema>;


// Zod schema for a single customer, matching the BroadcastCustomer type
const CustomerSchema = z.object({
    sbg_number: z.string().describe("Nomor SBG (Surat Bukti Gadai). Ekstrak nilai ini persis seperti yang tertulis."),
    rubrik: z.string().describe("Kode Rubrik. Ekstrak nilai ini persis seperti yang tertulis (contoh: A - KT, B1 - KT)."),
    name: z.string().describe("Nama lengkap nasabah."),
    phone_number: z.string().describe("Nomor telepon atau HP nasabah."),
    credit_date: z.string().describe("Tanggal kredit dalam format DD/MM/YYYY. WAJIB format ini."),
    due_date: z.string().describe("Tanggal jatuh tempo dalam format DD/MM/YYYY. WAJIB format ini."),
    loan_value: z.number().describe("Nilai pinjaman (UP atau Uang Pinjaman). Ini harus berupa angka, tanpa simbol atau pemisah ribuan."),
    barang_jaminan: z.string().describe("Deskripsi barang yang dijaminkan."),
    taksiran: z.number().describe("Nilai taksiran barang jaminan. Ini harus berupa angka, tanpa simbol atau pemisah ribuan."),
    sewa_modal: z.number().describe("Nilai sewa modal (SM). Ini harus berupa angka, tanpa simbol atau pemisah ribuan."),
    alamat: z.string().describe("Alamat lengkap nasabah."),
    status: z.string().describe("Status gadai saat ini (misalnya: 'Aktif')."),
});

const ExtractCustomersOutputSchema = z.object({
  customers: z
    .array(CustomerSchema)
    .describe('An array of customer objects extracted from the document.'),
});
export type ExtractCustomersOutput = z.infer<typeof ExtractCustomersOutputSchema>;


export async function extractCustomersFromPdf(
  input: ExtractCustomersInput
): Promise<ExtractCustomersOutput> {
  return extractCustomersFlow(input);
}


const extractCustomersFlow = ai.defineFlow(
  {
    name: 'extractCustomersFlow',
    inputSchema: ExtractCustomersInputSchema,
    outputSchema: ExtractCustomersOutputSchema,
  },
  async ({ pdfDataUri }) => {
    try {
      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        output: { schema: ExtractCustomersOutputSchema },
        prompt: [
          {
            text: `You are an expert data extraction agent for a pawnshop called Pegadaian. Your task is to extract all customer records from the provided PDF with extremely high accuracy.

**Critical Instructions:**
1.  **Analyze the ENTIRE document**: First, go through all pages of the PDF from beginning to end to understand its structure and identify all customer records.
2.  **Extract ALL records**: Once you have analyzed the document, proceed to extract the details for every single record you found. Do not stop until all records are extracted.
3.  **Extract-As-Is**: You MUST extract the data for each field exactly as it appears in the document. DO NOT assume, guess, or change any values. If a field contains a code like "B1 - KT", you must return "B1 - KT".

**Extraction Fields & Rules:**
For each record, extract these fields into a structured JSON object:
- **sbg_number**: Extract the SBG number exactly as written.
- **rubrik**: Extract the Rubrik code exactly as written.
- **name**: Extract the full name of the customer.
- **phone_number**: Extract the phone number.
- **credit_date**: Extract the credit date. It MUST be in DD/MM/YYYY format.
- **due_date**: Extract the due date. It MUST be in DD/MM/YYYY format.
- **loan_value**: Extract the loan value (Uang Pinjaman/UP). It MUST be a number.
- **barang_jaminan**: Extract the description of the collateral.
- **taksiran**: Extract the estimated value of the collateral. It MUST be a number.
- **sewa_modal**: Extract the lease capital value (SM). It MUST be a number.
- **alamat**: Extract the full address.
- **status**: Extract the current status.

If the document is unreadable or contains no valid data, return an empty 'customers' array.`,
          },
          { media: { url: pdfDataUri } },
        ],
      });
      // Safely return the output or an empty array if output is null/undefined
      return output || { customers: [] };
    } catch (error) {
      console.error("Error during AI prompt execution in extractCustomersFlow:", error);
      // Return an empty array in case of any error during the AI call
      return { customers: [] };
    }
  }
);
