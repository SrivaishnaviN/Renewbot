import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage, SenderType } from './types';
import { initializeGemini, createChatSession, streamChatResponse } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import { INITIAL_BOT_MESSAGE } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setApiKeyError(null);

    const initError = initializeGemini();
    if (initError) {
      setApiKeyError(initError);
      setIsLoading(false);
      return;
    }

    const session = await createChatSession();
    if (session) {
      setChatSession(session);
      setMessages([
        {
          id: crypto.randomUUID(),
          text: INITIAL_BOT_MESSAGE,
          sender: SenderType.BOT,
          timestamp: new Date(),
        },
      ]);
    } else {
      setError("Failed to initialize chat session. Please try refreshing the page.");
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    initializeApp();
  }, [initializeApp]);


  const handleSendMessage = async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading || !chatSession) return;

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: trimmedInput,
      sender: SenderType.USER,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const botMessageId = crypto.randomUUID();
    // Add a placeholder for the bot's response
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: botMessageId,
        text: '',
        sender: SenderType.BOT,
        timestamp: new Date(),
        isLoading: true,
        sources: [],
      },
    ]);

    let currentBotText = "";
    try {
      for await (const chunk of streamChatResponse(chatSession, trimmedInput)) {
        if (chunk.error) {
          setError(chunk.error);
          setMessages(prev => prev.map(msg => msg.id === botMessageId ? {...msg, text: "Sorry, I encountered an error.", isLoading: false} : msg));
          break;
        }
        if (chunk.text) {
          currentBotText += chunk.text;
          setMessages(prev => prev.map(msg => msg.id === botMessageId ? {...msg, text: currentBotText, isLoading: !chunk.isFinal} : msg));
        }
        if (chunk.sources) {
           setMessages(prev => prev.map(msg => msg.id === botMessageId ? {...msg, sources: chunk.sources, isLoading: !chunk.isFinal} : msg));
        }
        if (chunk.isFinal) {
           setMessages(prev => prev.map(msg => msg.id === botMessageId ? {...msg, isLoading: false} : msg));
        }
      }
    } catch (e: any) {
      console.error("Streaming failed:", e);
      setError(e.message || "An unexpected error occurred during streaming.");
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? {...msg, text: "Sorry, I couldn't process that.", isLoading: false} : msg));
    } finally {
      setIsLoading(false);
      // Ensure the specific bot message loading state is false
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? {...msg, isLoading: false} : msg));
    }
  };
  
  const handlePresetQuestion = (question: string) => {
    setInputValue(question);
    // Directly submit if input field was filled
    // Small timeout to allow state to update before submit
    setTimeout(() => {
        const form = document.getElementById('chat-form') as HTMLFormElement;
        if (form) {
            const FAKE_EVENT = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
            handleSendMessage(FAKE_EVENT);
        }
    }, 50);
  };

  const presetQuestions = [
    "What is solar energy?",
    "How can I save energy at home?",
    "Tell me about wind power.",
    "What are some sustainable practices?",
  ];


  if (apiKeyError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <ErrorDisplay message={`Configuration Error: ${apiKeyError} Please ensure the API_KEY is correctly set up in your environment.`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-200 via-teal-200 to-blue-200 p-2 sm:p-4 selection:bg-green-500 selection:text-white">
      <header className="mb-2 sm:mb-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-700 drop-shadow-md">RenewBot</h1>
        <p className="text-sm text-gray-600">Your Guide to Renewable Energy & Sustainability</p>
      </header>

      <div className="flex-grow overflow-y-auto mb-2 sm:mb-4 p-3 sm:p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-2xl">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <ErrorDisplay message={error} />}

      {!isLoading && !chatSession && messages.length === 0 && (
         <div className="text-center p-4">
            <LoadingIndicator color="text-green-600" />
            <p className="text-gray-600 mt-2">Initializing RenewBot...</p>
         </div>
      )}

      {chatSession && messages.length > 0 && presetQuestions.length > 0 && messages.filter(m => m.sender === SenderType.USER).length === 0 && (
        <div className="mb-2 sm:mb-4 p-3">
          <p className="text-sm text-gray-700 font-medium mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {presetQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handlePresetQuestion(q)}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} id="chat-form" className="flex items-center p-3 sm:p-4 bg-white/80 backdrop-blur-md rounded-xl shadow-xl">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isLoading ? "RenewBot is typing..." : "Ask about renewable energy..."}
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 disabled:bg-gray-100"
          disabled={isLoading || !chatSession}
        />
        <button
          type="submit"
          className="ml-2 sm:ml-3 px-4 sm:px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
          disabled={isLoading || !inputValue.trim() || !chatSession}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M3.105 3.105a1.5 1.5 0 0 1 2.122-.001L19.43 14.895a1.5 1.5 0 0 1 .001 2.122L14.896 19.43a1.5 1.5 0 0 1-2.122-.001l-14.22-14.22A1.5 1.5 0 0 1 3.105 3.105Z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default App;
