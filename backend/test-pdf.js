import { extractTextFromPdfBuffer } from './services/pdfService.js';

// Minimal valid PDF binary
const minimalPdfBase64 = 
  'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NQo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihEYXRhIFN0cnVjdHVyZXMgU3lsbGFidXMgMjAyNikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE5IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjU5IDAwMDAwIG4gCjAwMDAwMDAzNTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgowMDAwMDAwNDMzCiUlRU9G';

async function testPdf() {
  console.log('Testing PDF Extraction...');
  const buffer = Buffer.from(minimalPdfBase64, 'base64');
  const result = await extractTextFromPdfBuffer(buffer);
  console.log('PDF Result:', {
    success: result.success,
    pages: result.pages,
    text: result.text,
  });
  if (result.text.includes('Data Structures Syllabus 2026')) {
    console.log('✅ PDF Extraction test passed!');
  } else {
    throw new Error('PDF content mismatch');
  }
}

testPdf().catch((e) => {
  console.error(e);
  process.exit(1);
});
