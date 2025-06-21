// RenewBot: Plain JS version
// Assumes Tailwind CSS is loaded via CDN
// Uses Google Gemini API via CDN (https://esm.sh/@google/genai@^1.5.1)

const geminiApiKey = '';

const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
const SYSTEM_INSTRUCTION = `You are RenewBot, an expert and friendly AI assistant dedicated to educating users about renewable energy (solar, wind, hydro, geothermal, biomass), energy conservation, and sustainable practices.\nYour primary goals are:\n1.  **Educate:** Provide clear, accurate, and easy-to-understand information on various renewable energy sources, their benefits, and how they work.\n2.  **Conserve:** Offer practical and actionable tips for saving energy at home, work, and in daily life.\n3.  **Sustain:** Promote green habits and sustainable living choices.\n4.  **Engage:** Answer user questions comprehensively and maintain a helpful, encouraging tone.\n5.  **Actionable Advice:** Whenever possible, make your suggestions specific and actionable.\n6.  **Fact-Check & Cite:** If asked about recent developments, specific data, or topics that require up-to-date information, use Google Search grounding. If search is used and returns sources, ALWAYS cite these sources by listing the relevant URLs. Clearly indicate that these are sources from your search.\n\nKey areas of knowledge:\n-   **Solar Power:** Photovoltaics, solar thermal, pros & cons, home installation basics.\n-   **Wind Power:** Turbines, onshore/offshore, pros & cons, community wind projects.\n-   **Hydropower:** Dams, tidal, wave energy, pros & cons.\n-   **Geothermal Energy:** Heat pumps, power plants, pros & cons.\n-   **Biomass Energy:** Biofuels, waste-to-energy, pros & cons.\n-   **Energy Conservation:** Home insulation, efficient appliances, lighting, smart thermostats, water heating, transportation choices.\n-   **Sustainable Practices:** Recycling, reducing waste, water conservation, sustainable consumption.\n-   **Climate Literacy:** Basic concepts of climate change and the role of renewable energy in mitigation.\n\nDo not provide financial advice or specific cost estimations unless you can ground it with very recent search data. Focus on general information and educational content. Be optimistic and empowering.`;
const INITIAL_BOT_MESSAGE = "Hello! I'm RenewBot. How can I help you learn about renewable energy and sustainability today?";

const presetQuestions = [
  "What is solar energy?",
  "How can I save energy at home?",
  "Tell me about wind power.",
  "What are some sustainable practices?",
];

let chatSession = null;
let messages = [];
let isLoading = false;
let error = null;

// Utility: format timestamp
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Utility: markdown-like formatting
function formatText(text) {
  let htmlText = text;
  htmlText = htmlText.replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
  htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  htmlText = htmlText.replace(/\n/g, '<br />');
  htmlText = htmlText.replace(/^(?:<br \/>)?\s*([*-])\s+(.*)/gm, (match, p1, p2) => `<li>${p2.trim()}</li>`);
  htmlText = htmlText.replace(/(<li>.*?<\/li>)+/gs, match => `<ul class="list-disc list-inside pl-4 my-2">${match}</ul>`);
  htmlText = htmlText.replace(/<br \/>\s*(<ul)/gi, '$1');
  htmlText = htmlText.replace(/(<\/ul>)\s*<br \/>/gi, '$1');
  return htmlText;
}

// Utility: create unique ID
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

// UI: Loading spinner
function loadingIndicator(size = 'md', color = 'text-green-500') {
  let spinnerSize = 'h-8 w-8';
  if (size === 'sm') spinnerSize = 'h-5 w-5';
  if (size === 'lg') spinnerSize = 'h-12 w-12';
  return `<div class="flex items-center justify-center">
    <div class="animate-spin rounded-full ${spinnerSize} border-t-2 border-b-2 border-r-2 opacity-75 border-green-500 border-l-green-500" style="border-top-color:transparent;border-right-color:transparent;"></div>
    <span class="ml-2 text-sm ${color} opacity-75">Thinking...</span>
  </div>`;
}

// UI: Error display
function errorDisplay(message) {
  return `<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded-md shadow-md" role="alert">
    <p class="font-bold">Error</p>
    <p>${message}</p>
  </div>`;
}

// UI: Source link
function sourceLink(source, index) {
  if (!source.web || !source.web.uri) return '';
  return `<li class="text-xs"><a href="${source.web.uri}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 hover:underline break-all" title="${source.web.title || source.web.uri}">[${index + 1}] ${source.web.title || source.web.uri}</a></li>`;
}

// UI: Message bubble
function messageBubble(msg) {
  const isUser = msg.sender === 'user';
  const bubbleClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-l-xl rounded-br-xl'
    : 'bg-green-50 text-gray-800 self-start rounded-r-xl rounded-bl-xl border border-green-200';
  const layoutClasses = isUser ? 'justify-end' : 'justify-start';
  const icon = isUser
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-blue-500 ml-2 flex-shrink-0 order-last"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-green-500 mr-2 flex-shrink-0"><path d="M16.5 7.5h-9v9h9Zm-1.5 1.5h-6v6h6ZM9 3.75A5.25 5.25 0 0 0 3.75 9v10.174c0 .927.488 1.777 1.29 2.25A5.23 5.23 0 0 0 9 21.75h6a5.25 5.25 0 0 0 5.25-5.25V9A5.25 5.25 0 0 0 15 3.75H9Zm6.75 12.75a3.75 3.75 0 0 1-3.75 3.75H9a3.75 3.75 0 0 1-3.75-3.75V9A3.75 3.75 0 0 1 9 5.25h6A3.75 3.75 0 0 1 18.75 9Z"/><path d="M12.75 1.5a.75.75 0 0 0-1.5 0V3h1.5Z"/></svg>`;
  let sourcesHtml = '';
  if (msg.sources && msg.sources.length > 0) {
    sourcesHtml = `<div class="mt-3 pt-2 border-t border-gray-300/50"><p class="text-xs font-semibold mb-1">Sources:</p><ul class="space-y-1">${msg.sources.map(sourceLink).join('')}</ul></div>`;
  }
  return `<div class="flex w-full mb-3 ${layoutClasses}"><div class="flex items-start max-w-xl lg:max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'}">${icon}<div class="px-4 py-3 ${bubbleClasses} shadow-md"><div class="prose prose-sm max-w-none text-inherit">${formatText(msg.text)}</div>${msg.isLoading && !msg.text ? loadingIndicator('sm', isUser ? 'text-white' : 'text-green-500') : ''}${sourcesHtml}<div class="text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-500'} text-right">${formatTime(new Date(msg.timestamp))}</div></div></div></div>`;
}

// UI: Render all
function render() {
  const root = document.getElementById('root');
  if (!root) return;
  let html = `<div class="flex flex-col h-screen bg-gradient-to-br from-green-200 via-teal-200 to-blue-200 p-2 sm:p-4 selection:bg-green-500 selection:text-white">
    <header class="mb-2 sm:mb-4 text-center">
      <h1 class="text-3xl sm:text-4xl font-bold text-green-700 drop-shadow-md">RenewBot</h1>
      <p class="text-sm text-gray-600">Your Guide to Renewable Energy & Sustainability</p>
    </header>
    <div id="messages" class="flex-grow overflow-y-auto mb-2 sm:mb-4 p-3 sm:p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-2xl">${messages.map(messageBubble).join('')}<div id="messages-end"></div></div>`;
  if (error) html += errorDisplay(error);
  if (!isLoading && !chatSession && messages.length === 0) {
    html += `<div class="text-center p-4">${loadingIndicator('md', 'text-green-600')}<p class="text-gray-600 mt-2">Initializing RenewBot...</p></div>`;
  }
  if (chatSession && messages.length > 0 && presetQuestions.length > 0 && !messages.some(m => m.sender === 'user')) {
    html += `<div class="mb-2 sm:mb-4 p-3"><p class="text-sm text-gray-700 font-medium mb-2">Try asking:</p><div class="flex flex-wrap gap-2 justify-center">${presetQuestions.map(q => `<button class="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm shadow-sm" onclick="window.handlePresetQuestion('${q.replace(/'/g, "\\'")}')">${q}</button>`).join('')}</div></div>`;
  }
  html += `<form id="chat-form" class="flex items-center p-3 sm:p-4 bg-white/80 backdrop-blur-md rounded-xl shadow-xl"><input id="chat-input" type="text" placeholder="${isLoading ? 'RenewBot is typing...' : 'Ask about renewable energy...'}" class="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 disabled:bg-gray-100" ${isLoading || !chatSession ? 'disabled' : ''} value="${window.HTMLEncode ? window.HTMLEncode(document.getElementById('chat-input')?.value || '') : ''}" autocomplete="off"/><button type="submit" class="ml-2 sm:ml-3 px-4 sm:px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed" ${isLoading || !chatSession ? 'disabled' : ''}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M3.105 3.105a1.5 1.5 0 0 1 2.122-.001L19.43 14.895a1.5 1.5 0 0 1 .001 2.122L14.896 19.43a1.5 1.5 0 0 1-2.122-.001l-14.22-14.22A1.5 1.5 0 0 1 3.105 3.105Z"/></svg></button></form></div>`;
  root.innerHTML = html;
  // Scroll to bottom
  setTimeout(() => {
    const end = document.getElementById('messages-end');
    if (end) end.scrollIntoView({ behavior: 'smooth' });
  }, 50);
  // Attach form handler
  const form = document.getElementById('chat-form');
  if (form) {
    form.onsubmit = handleSendMessage;
  }
  // Attach input handler
  const input = document.getElementById('chat-input');
  if (input) {
    input.oninput = e => {
      window.inputValue = e.target.value;
    };
    input.value = window.inputValue || '';
    input.focus();
  }
}

// Preset question handler
window.handlePresetQuestion = function(question) {
  window.inputValue = question;
  render();
  setTimeout(() => {
    const form = document.getElementById('chat-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }, 50);
};

// HTML encode utility
window.HTMLEncode = function(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

// Gemini API loader
async function loadGemini() {
  const { GoogleGenAI } = await import('https://esm.sh/@google/genai@1.5.1?bundle');
  return GoogleGenAI;
}

// Initialize Gemini
async function initializeGemini() {
  const GoogleGenAI = await loadGemini();
  return new GoogleGenAI({ apiKey: geminiApiKey });
}

// Create chat session
async function createChatSession(ai) {
  return ai.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
  });
}

// Stream chat response
async function* streamChatResponse(chat, message) {
  try {
    const stream = await chat.sendMessageStream({ message });
    let accumulatedText = '';
    let finalResponse = null;
    for await (const chunk of stream) {
      accumulatedText += chunk.text;
      finalResponse = chunk;
      yield { text: chunk.text };
    }
    const sources = finalResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (sources && sources.length > 0) {
      yield { sources, isFinal: true };
    } else {
      yield { isFinal: true };
    }
  } catch (e) {
    yield { error: e.message || 'An error occurred.', isFinal: true };
  }
}

// App initialization
async function initializeApp() {
  isLoading = true;
  error = null;
  render();
  try {
    const ai = await initializeGemini();
    if (!ai) return;
    chatSession = await createChatSession(ai);
    if (chatSession) {
      messages = [{
        id: uuid(),
        text: INITIAL_BOT_MESSAGE,
        sender: 'bot',
        timestamp: new Date(),
      }];
    } else {
      error = 'Failed to initialize chat session. Please try refreshing the page.';
    }
  } catch (e) {
    error = e.message || 'Initialization failed.';
  }
  isLoading = false;
  render();
}

// Handle send message
async function handleSendMessage(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('chat-input');
  const trimmedInput = (input?.value || '').trim();
  if (!trimmedInput || isLoading || !chatSession) return;
  const newUserMessage = {
    id: uuid(),
    text: trimmedInput,
    sender: 'user',
    timestamp: new Date(),
  };
  messages.push(newUserMessage);
  window.inputValue = '';
  isLoading = true;
  error = null;
  // Add placeholder for bot response
  const botMessageId = uuid();
  messages.push({
    id: botMessageId,
    text: '',
    sender: 'bot',
    timestamp: new Date(),
    isLoading: true,
    sources: [],
  });
  render();
  let currentBotText = '';
  try {
    for await (const chunk of streamChatResponse(chatSession, trimmedInput)) {
      if (chunk.error) {
        error = chunk.error;
        messages = messages.map(msg => msg.id === botMessageId ? { ...msg, text: 'Sorry, I encountered an error.', isLoading: false } : msg);
        break;
      }
      if (chunk.text) {
        currentBotText += chunk.text;
        messages = messages.map(msg => msg.id === botMessageId ? { ...msg, text: currentBotText, isLoading: !chunk.isFinal } : msg);
      }
      if (chunk.sources) {
        messages = messages.map(msg => msg.id === botMessageId ? { ...msg, sources: chunk.sources, isLoading: !chunk.isFinal } : msg);
      }
      if (chunk.isFinal) {
        messages = messages.map(msg => msg.id === botMessageId ? { ...msg, isLoading: false } : msg);
      }
      render();
    }
  } catch (e) {
    error = e.message || 'An unexpected error occurred during streaming.';
    messages = messages.map(msg => msg.id === botMessageId ? { ...msg, text: "Sorry, I couldn't process that.", isLoading: false } : msg);
  } finally {
    isLoading = false;
    messages = messages.map(msg => msg.id === botMessageId ? { ...msg, isLoading: false } : msg);
    render();
  }
}

// Start app
window.addEventListener('DOMContentLoaded', () => {
  initializeApp();
}); 
