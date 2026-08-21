import { apiFetch } from './api';

export type ProviderInfo = {
  provider: 'groq' | 'openrouter' | 'nvidia';
  apiKey?: string;
  model?: string;
};

export const simulateAiResponse = async (prompt: string, customSystemPrompt?: string, userContext?: string, providerInfo?: ProviderInfo) => {
  try {
    const token = localStorage.getItem('token');
    const response = await apiFetch('/api/ai/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt, customSystemPrompt, userContext, providerInfo })
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

export const generateFlashcards = async (content: string, userContext?: string): Promise<{front: string, back: string}[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await apiFetch('/api/ai/flashcards', {
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
    const token = localStorage.getItem('token');
    const response = await apiFetch('/api/ai/extract-routine', {
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
