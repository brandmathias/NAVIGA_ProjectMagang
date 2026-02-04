
'use server';

import { extractCustomersFromPdf } from '@/ai/flows/extract-from-pdf-flow';
import type { BroadcastCustomer } from '@/types';

/**
 * Takes a PDF file from a FormData object, converts it to a data URI,
 * and calls an AI flow to extract customer data.
 * @param formData The FormData object containing the uploaded PDF file.
 * @returns A promise that resolves to an array of BroadcastCustomer objects.
 */
export async function parsePdf(
  formData: FormData
): Promise<BroadcastCustomer[]> {
  const file = formData.get('pdf-file') as File;

  if (!file || file.size === 0) {
    throw new Error('No file uploaded or file is empty.');
  }

  // Convert the file to a Buffer, then to a Base64 string for the data URI.
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const pdfDataUri = `data:application/pdf;base64,${base64}`;

  try {
    const result = await extractCustomersFromPdf({ pdfDataUri });

    // The AI flow now returns a valid structure even if no customers are found.
    const customers = result.customers || [];
    
    // Filter out any potentially empty or malformed records returned by the AI
    return customers.filter(
      (c) => c.sbg_number && c.name && c.due_date
    );

  } catch (err: any) {
    // Re-throw the original error to show the real cause in the UI.
    console.error('Error in parsePdf action:', err);
    // We pass the original error message to the client.
    throw new Error(err.message || 'An unknown AI processing error occurred.');
  }
}
