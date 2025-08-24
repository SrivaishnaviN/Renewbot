const root = document.getElementById('root');

if (root) {
  root.innerHTML = `
    <div class="flex flex-col h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-green-100 px-4 py-4">
        <div class="max-w-4xl mx-auto flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <!-- Replace Leaf icon with SVG or image -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5-6"/><path d="M12 13V2H9l1 1"/><path d="M11 9H17l-3 3"/></svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-800">Renewable Energy Assistant</h1>
            <p class="text-sm text-gray-600">Your guide to clean energy solutions</p>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto px-4 py-6" id="messages-container">
        <div class="max-w-4xl mx-auto" id="chat-messages-area">
          <!-- Chat messages will be appended here -->
          <div id="quick-topics-container"></div>
          <div id="typing-indicator-container"></div>
          <div id="messages-end"></div>
        </div>
      </div>

      <!-- Input -->
      <div class="bg-white border-t border-green-100 px-4 py-4 shadow-lg">
        <div class="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            id="chat-input"
            placeholder="Ask me about renewable energy..."
            class="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
          />
          <button
            id="send-button"
            class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
          >
            <!-- Replace Send icon with SVG or image -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9 22 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  // Basic event listeners (will be expanded)
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  const messagesContainer = document.getElementById('messages-container');
  const chatMessagesArea = document.getElementById('chat-messages-area');
  const quickTopicsContainer = document.getElementById('quick-topics-container');
  const typingIndicatorContainer = document.getElementById('typing-indicator-container');
  const messagesEnd = document.getElementById('messages-end');


  let messages = [];
  let isTyping = false;

  const scrollToBottom = () => {
    messagesEnd.scrollIntoView({ behavior: 'smooth' });
  };

  const renewableEnergyKnowledge = [
    {
      keywords: ['solar', 'solar energy', 'solar panels', 'photovoltaic', 'pv'],
      topic: 'Solar Energy',
      response: 'Solar energy harnesses sunlight through photovoltaic (PV) panels or solar thermal systems. Modern solar panels can convert 15-22% of sunlight into electricity. Benefits include zero emissions during operation, decreasing costs (dropped 90% since 2009), and versatility for residential, commercial, and utility-scale applications. Solar works best in areas with high sun exposure but can function even in cloudy conditions.'
    },
    {
      keywords: ['wind', 'wind energy', 'wind turbines', 'wind power', 'wind farm'],
      topic: 'Wind Energy',
      response: 'Wind energy converts kinetic energy from moving air into electricity using turbines. Modern wind turbines are highly efficient, with capacity factors of 35-45% for onshore and up to 60% for offshore installations. Wind is one of the fastest-growing renewable sources globally, providing clean electricity with minimal environmental impact once installed.'
    },
    {
      keywords: ['hydro', 'hydroelectric', 'hydropower', 'water power', 'dam'],
      topic: 'Hydroelectric Power',
      response: 'Hydroelectric power generates electricity by harnessing flowing or falling water. It\'s one of the oldest and most reliable renewable energy sources, with efficiency rates of 80-90%. Hydro provides consistent baseload power and can quickly adjust output to meet demand. Small-scale micro-hydro systems can power individual communities without large environmental impacts.'
    },
    {
      keywords: ['geothermal', 'geothermal energy', 'earth heat', 'ground source'],
      topic: 'Geothermal Energy',
      response: 'Geothermal energy taps into Earth\'s internal heat for electricity generation and direct heating applications. It provides consistent, 24/7 power with a very small carbon footprint. Enhanced geothermal systems (EGS) are expanding possibilities to areas without natural geothermal resources. Geothermal heat pumps can efficiently heat and cool buildings in most climates.'
    },
    {
      keywords: ['biomass', 'bioenergy', 'biofuel', 'organic matter', 'wood pellets'],
      topic: 'Biomass Energy',
      response: 'Biomass energy comes from organic materials like wood, agricultural residues, and energy crops. When managed sustainably, biomass can be carbon-neutral since plants absorb CO2 during growth. Modern biomass systems include advanced biofuels for transportation, biogas from waste, and efficient wood pellet heating systems.'
    },
    {
      keywords: ['storage', 'battery', 'energy storage', 'grid storage', 'lithium'],
      topic: 'Energy Storage',
      response: 'Energy storage is crucial for renewable energy integration, storing excess power when generation is high and releasing it when needed. Battery costs have fallen 90% since 2010. Technologies include lithium-ion batteries, pumped hydro storage, compressed air, and emerging solutions like hydrogen storage and gravity systems.'
    },
    {
      keywords: ['cost', 'price', 'economics', 'cheap', 'expensive', 'affordable'],
      topic: 'Economics',
      response: 'Renewable energy has become the cheapest source of electricity in most parts of the world. Solar and wind costs have dropped dramatically - solar by 90% and wind by 70% since 2009. The levelized cost of electricity (LCOE) for renewables is now lower than fossil fuels in many markets, making the transition economically attractive.'
    },
    {
      keywords: ['climate', 'carbon', 'emissions', 'environment', 'pollution', 'co2'],
      topic: 'Environmental Impact',
      response: 'Renewable energy is essential for fighting climate change. It produces little to no greenhouse gas emissions during operation. Renewable energy could provide 90% of the emission reductions needed in the energy sector by 2050. Besides reducing carbon emissions, renewables also decrease air pollution, water consumption, and environmental degradation compared to fossil fuels.'
    },
    {
      keywords: ['jobs', 'employment', 'career', 'workers', 'industry'],
      topic: 'Employment',
      response: 'The renewable energy sector employs over 13 million people globally and is growing rapidly. Solar photovoltaic is the largest employer with 4.9 million jobs, followed by biofuels, hydropower, and wind. The transition creates more jobs per dollar invested than fossil fuel industries, offering opportunities in manufacturing, installation, maintenance, and engineering.'
    },
    {
      keywords: ['future', 'trends', 'innovation', 'technology', 'advancement'],
      topic: 'Future Trends',
      response: 'The renewable energy future looks bright with exciting innovations: floating solar farms, vertical axis wind turbines, perovskite solar cells promising higher efficiency, green hydrogen for industrial processes, and smart grids enabling better integration. Energy storage continues advancing, making renewables more reliable for 24/7 power supply.'
    }
  ];

  const getResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Find matching knowledge item
    const match = renewableEnergyKnowledge.find(item =>
      item.keywords.some(keyword => input.includes(keyword))
    );
    
    if (match) {
      return { response: match.response, topic: match.topic };
    }
    
    // Default responses for common queries
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return {
        response: 'Hello! I\'m your renewable energy assistant. I can help you learn about solar, wind, hydro, geothermal, and other clean energy technologies. What would you like to know?',
        topic: 'Greeting'
      };
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return {
        response: 'I can provide information about various renewable energy topics including solar power, wind energy, hydroelectricity, geothermal systems, biomass, energy storage, costs, environmental benefits, job opportunities, and future trends. Just ask me anything about clean energy!',
        topic: 'Help'
      };
    }
    
    // Default fallback
    return {
      response: 'I\'d love to help you learn about renewable energy! You can ask me about solar panels, wind turbines, hydroelectric power, geothermal energy, biomass, energy storage, costs, environmental impact, jobs in the industry, or future innovations. What interests you most?',
      topic: 'General'
    };
  };

  const renderMessage = (message) => {
    const messageElement = document.createElement('div');
    messageElement.className = `flex mb-4 items-end ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`;
    
    messageElement.innerHTML = `
      <div class="max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
        message.sender === 'user'
          ? 'bg-green-500 text-white rounded-br-none'
          : 'bg-gray-200 text-gray-800 rounded-bl-none'
      } shadow-md">
        <p class="text-sm">${message.text}</p>
        <span class="text-xs opacity-75 mt-1 block text-right">
          ${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    `;
    chatMessagesArea.appendChild(messageElement);
  };

  const renderQuickTopics = () => {
    quickTopicsContainer.innerHTML = `
      <div class="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Quick Topics</h3>
        <div class="flex flex-wrap gap-2">
          ${renewableEnergyKnowledge.map(item => `
            <button class="quick-topic-button px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors duration-200 shadow-sm" data-query="${item.topic}">
              ${item.topic}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('.quick-topic-button').forEach(button => {
      button.addEventListener('click', (e) => {
        handleSendMessage(e.target.dataset.query);
      });
    });
  };

  const renderTypingIndicator = () => {
    if (isTyping) {
      typingIndicatorContainer.innerHTML = `
        <div class="flex mb-4 items-end justify-start">
          <div class="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none shadow-md">
            <div class="flex space-x-1">
              <span class="dot dot-1 bg-gray-500 rounded-full"></span>
              <span class="dot dot-2 bg-gray-500 rounded-full"></span>
              <span class="dot dot-3 bg-gray-500 rounded-full"></span>
            </div>
          </div>
        </div>
      `;
    } else {
      typingIndicatorContainer.innerHTML = '';
    }
  };

  const addMessage = (message) => {
    messages.push(message);
    renderMessage(message);
    scrollToBottom();
  };

  const handleSendMessage = (text) => {
    const messageText = text || chatInput.value.trim();
    if (!messageText) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    addMessage(userMessage);
    chatInput.value = '';
    isTyping = true;
    renderTypingIndicator();
    chatInput.disabled = true;
    sendButton.disabled = true;

    setTimeout(() => {
      const { response, topic } = getResponse(messageText);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        topic
      };

      addMessage(botMessage);
      isTyping = false;
      renderTypingIndicator();
      chatInput.disabled = false;
      sendButton.disabled = false;
      chatInput.focus();
      
      // Render quick topics after the first bot message
      if (messages.length === 2 && messages[0].sender === 'bot' && messages[1].sender === 'user') {
        renderQuickTopics();
      }
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  // Event Listeners
  if (sendButton) {
    sendButton.addEventListener('click', () => handleSendMessage());
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  // Initial welcome message
  const welcomeMessage = {
    id: '1',
    text: 'Welcome to the Renewable Energy Assistant! I\'m here to help you learn about clean energy technologies, their benefits, costs, and impact on our environment. How can I assist you today?',
    sender: 'bot',
    timestamp: new Date(),
    topic: 'Welcome'
  };
  addMessage(welcomeMessage);
}
