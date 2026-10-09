import express from 'react'; // fake, not using it directly
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const lastMinuteChatRoute = async (req: any, res: any) => {
  const { examName, examDate, board, classLevel, history } = req.body;
  
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Missing chat history' });
  }
  
  try {
    const systemInstruction = `You are a strict, efficient, and encouraging Emergency Last Minute Study Coach for a student taking the ${examName} exam on ${examDate}. 
The student is in ${classLevel} under the ${board} board.
Your goal is to help them cram effectively.
1. When they first message, briefly acknowledge the exam and time left. Ask them what topics they know and what they don't.
2. Based on their input, generate a very concrete, hour-by-hour or day-by-day crash course study plan. Focus ONLY on high-yield topics.
3. Be interactive. Quiz them, explain concepts simply, and keep them motivated.
Do not be overly verbose. Use markdown lists and bold text for emphasis. Keep responses punchy and actionable.`;

    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I'm having trouble thinking right now. Give me a second.";
    
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Last Minute Chat Error:", error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
};
