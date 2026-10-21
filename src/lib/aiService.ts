import { auth } from './firebase';

export type ProviderInfo = {
  provider: 'openrouter' | 'nvidia' | 'groq' | 'google';
  apiKey?: string;
  model?: string;
};

export const simulateAiResponse = async (prompt: string | any[], customSystemPrompt?: string, userContext?: string, providerInfo?: ProviderInfo) => {
  try {
    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : localStorage.getItem('token');
    
    const body: any = { customSystemPrompt, userContext, providerInfo };
    if (typeof prompt === 'string') {
      body.prompt = prompt;
    } else {
      body.messages = prompt;
    }

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch AI response');
    }
    
    const data = await response.json();
    return data.result;
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return `[Error] Failed to connect to AI: ${error.message}`;
  }
};

// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Compresses and downscales an image file using an HTML Canvas to prevent
 * mobile memory exhaustion and 413 Payload Too Large errors.
 * Returns a base64 Data URL (e.g. data:image/jpeg;base64,...)
 */
export const compressImageForOcr = async (file: File, maxDimension = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || typeof document === 'undefined') {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
};

export const extractTextFromDocument = async (file: File): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : localStorage.getItem('token');
    
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let fullText = '';
      
      const BATCH_SIZE = 3;
      const numPages = Math.min(pdf.numPages, 10); // Limit to first 10 pages

      for (let i = 1; i <= numPages; i += BATCH_SIZE) {
        const imagesBatch = [];
        const end = Math.min(i + BATCH_SIZE - 1, numPages);
        for (let j = i; j <= end; j++) {
          const page = await pdf.getPage(j);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // @ts-ignore
          await page.render({ canvasContext: context!, viewport: viewport } as any).promise;
          const base64 = canvas.toDataURL('image/jpeg', 0.5);
          imagesBatch.push({ base64Data: base64, mimeType: 'image/jpeg' });
        }

        const response = await fetch('/api/ai/gemini-vision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ images: imagesBatch })
        });

        if (!response.ok) {
          throw new Error('Failed to process document pages');
        }
        const data = await response.json();
        fullText += data.result + '\n\n';
      }
      return fullText.trim();
    } else {
      const base64Data = await compressImageForOcr(file);
      
      const response = await fetch('/api/ai/gemini-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ images: [{ base64Data, mimeType: 'image/jpeg' }] })
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }
      const data = await response.json();
      return data.result;
    }
  } catch (error: any) {
    console.error('Document Extraction Error:', error);
    throw new Error(`Failed to read document: ${error.message}`);
  }
};

export const generateFlashcards = async (content: string, userContext?: string): Promise<{front: string, back: string}[]> => {
  try {
    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : localStorage.getItem('token');
    const response = await fetch('/api/ai/flashcards', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content, userContext })
    });

    if (!response.ok) {
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("AI Service Error during flashcard generation:", error);
    return [];
  }
};

export const extractRoutineFromData = async (rawData: string): Promise<{schedule: Record<string, any[]>} | null> => {
  try {
    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : localStorage.getItem('token');
    const response = await fetch('/api/ai/extract-routine', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rawData })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to extract routine from data');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('AI Routine Extraction Error:', error);
    throw error;
  }
};
