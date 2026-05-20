import { useState, useRef, useEffect } from 'react';
import { IconSend, IconMessageChatbot, IconKey, IconBrain } from '@tabler/icons-react';
import { sendChatMessage, type ChatMessage, type Emotion } from './services/ai';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Update theme when emotion changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentEmotion);
  }, [currentEmotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out the IDs and just pass role and text to history
      const { response, emotion } = await sendChatMessage(apiKey, userMessage.text, messages);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        emotion: emotion
      };

      setCurrentEmotion(emotion);
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Error: Could not connect to the AI. Please check your API key.',
        emotion: 'sad'
      };
      setCurrentEmotion('sad');
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionLabel = (emotion: Emotion) => {
    switch(emotion) {
      case 'happy': return 'Alegre 😊';
      case 'sad': return 'Triste 😢';
      case 'angry': return 'Enojado 😡';
      default: return 'Neutral 🤖';
    }
  };

  return (
    <div className="app-container">
      <div className="chat-card">
        <header className="chat-header">
          <div className="header-title">
            <IconBrain size={32} color="var(--accent-color)" />
            <h1>MoodChat</h1>
          </div>
          <div className="emotion-indicator">
            {getEmotionLabel(currentEmotion)}
          </div>
        </header>

        <div className="api-key-container">
          <IconKey size={24} color="var(--text-secondary)" style={{ marginTop: '8px' }} />
          <input
            type="password"
            className="api-input"
            placeholder="Pega tu Google Gemini API Key aquí..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="message model" style={{ alignSelf: 'center', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', background: 'transparent', border: 'none' }}>
              <IconMessageChatbot size={48} color="var(--accent-color)" style={{ marginBottom: '16px' }} />
              <h2>¡Hola! Soy MoodChat.</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Mis colores cambian según la emoción de nuestra conversación.<br/>
                ¡Ingresa tu API Key y cuéntame algo!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                {msg.text}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message model">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chat-input"
              placeholder={apiKey ? "Escribe un mensaje..." : "Ingresa tu API key primero"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!apiKey || isLoading}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!input.trim() || !apiKey || isLoading}
            >
              <IconSend size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
