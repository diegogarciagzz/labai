import { GoogleGenerativeAI } from '@google/generative-ai';

export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  emotion?: Emotion;
}

const SYSTEM_PROMPT = `
You are MoodChat, an expressive AI assistant.
You must ALWAYS respond in valid JSON format.
Analyze your own response and determine its emotional tone from these 4 options: "neutral", "happy", "sad", "angry".
Your JSON response MUST follow this exact structure:
{
  "response": "your actual text response here",
  "emotion": "happy|sad|angry|neutral"
}
Do not include any markdown formatting like \`\`\`json, just return the raw JSON object.
`;

export async function sendChatMessage(
  apiKey: string,
  message: string,
  history: ChatMessage[]
): Promise<{ response: string; emotion: Emotion }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash as it's fast and supports system instructions
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    // Format history for Gemini API
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage([{ text: message }]);
    const responseText = result.response.text().trim();
    
    // Clean up potential markdown from the response
    const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanJsonString);
      return {
        response: parsed.response || "No response provided",
        emotion: parsed.emotion || "neutral"
      };
    } catch (e) {
      console.error("Failed to parse JSON response:", cleanJsonString);
      // Fallback if the AI fails to return JSON
      return {
        response: responseText,
        emotion: "neutral"
      };
    }
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    throw error;
  }
}
