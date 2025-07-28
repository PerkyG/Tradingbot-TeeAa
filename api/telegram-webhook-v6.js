// api/telegram-webhook-v8.js
// Gefixte versie - werkend met alle 85 vragen

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'https://tradingbot-tee-aa.vercel.app';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// Session management
class SessionManager {
  constructor(timeout = 30 * 60 * 1000) {
    this.sessions = new Map();
    this.timeout = timeout;
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(chatId, data) {
    this.sessions.set(chatId, {
      ...data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.timeout
    });
  }

  get(chatId) {
    const session = this.sessions.get(chatId);
    if (!session) return null;
    
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(chatId);
      return null;
    }
    
    return session;
  }

  delete(chatId) {
    this.sessions.delete(chatId);
  }

  cleanup() {
    const now = Date.now();
    for (const [chatId, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(chatId);
      }
    }
  }
}

// Progress tracking
class ProgressTracker {
  constructor() {
    this.userProgress = new Map();
    this.categoryProgress = new Map();
  }

  initUser(chatId) {
    if (!this.userProgress.has(chatId)) {
      this.userProgress.set(chatId, {
        askedQuestions: new Set(),
        lastActivity: Date.now(),
        totalQuestions: 0,
        streak: 0
      });
    }

    if (!this.categoryProgress.has(chatId)) {
      const progress = {};
      Object.keys(QUESTION_CATEGORIES).forEach(category => {
        progress[category] = {
          totalQuestions: QUESTION_CATEGORIES[category].length,
          askedQuestions: new Set(),
          lastAsked: null,
          completed: false
        };
      });
      this.categoryProgress.set(chatId, progress);
    }
  }

  markQuestionAsked(chatId, category, questionIndex) {
    this.initUser(chatId);
    
    const userProgress = this.userProgress.get(chatId);
    const categoryData = this.categoryProgress.get(chatId)[category];
    
    categoryData.askedQuestions.add(questionIndex);
    categoryData.lastAsked = Date.now();
    
    if (categoryData.askedQuestions.size === categoryData.totalQuestions) {
      categoryData.completed = true;
    }
    
    userProgress.askedQuestions.add(`${category}_${questionIndex}`);
    userProgress.lastActivity = Date.now();
    userProgress.totalQuestions++;
  }

  resetCategory(chatId, category) {
    const categoryData = this.categoryProgress.get(chatId)?.[category];
    if (categoryData) {
      categoryData.askedQuestions.clear();
      categoryData.completed = false;
    }
  }

  resetAll(chatId) {
    this.userProgress.delete(chatId);
    this.categoryProgress.delete(chatId);
  }

  getProgress(chatId) {
    this.initUser(chatId);
    return {
      user: this.userProgress.get(chatId),
      categories: this.categoryProgress.get(chatId)
    };
  }
}

// Initialize managers
const sessionManager = new SessionManager();
const progressTracker = new ProgressTracker();

// Time schedules
const SCHEDULE = {
  MORNING: {
    start: 6,
    end: 12,
    categories: ['motivatie', 'doelen', 'voorbereiding', 'marktanalyse', 'strategie', 'psychologie', 'discipline', 'risico']
  },
  EVENING: {
    start: 18,
    end: 23,
    categories: ['performance', 'inzichten', 'reflectie', 'ontwikkeling']
  }
};

// Alle 85 vragen (verkort voor leesbaarheid - gebruik je originele vragen)
const QUESTION_CATEGORIES = {
  motivatie: [
    { 
      question: "Waarom trade je vandaag? Kies je motivatie.", 
      type: "multiple_choice", 
      options: ["Familie onderhouden", "Toekomst opbouwen", "Thea trots maken", "Uit verveling", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Wat drijft je het meest: geld, groei of iets persoonlijks?", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Hoe gemotiveerd voel je je nu? (1-5 schaal)", 
      type: "multiple_choice", 
      options: ["5 - Volledig", "4 - Hoog", "3 - Gemiddeld", "2 - Laag", "1 - Geen"], 
      excludeFromScoring: false 
    }
  ],
  doelen: [
    { 
      question: "Wat is je hoofddoel vandaag? Wees specifiek.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Heb je je doelen opgeschreven?", 
      type: "multiple_choice", 
      options: ["Ja, volledig", "Gedeeltelijk", "Nee"], 
      excludeFromScoring: false 
    }
  ],
  voorbereiding: [
    { 
      question: "Heb je je ochtendroutine voltooid (sport, douche, Wim Hof)?", 
      type: "multiple_choice", 
      options: ["Alles gedaan", "Meeste gedaan", "Weinig gedaan", "Niets gedaan"], 
      excludeFromScoring: false 
    }
  ],
  // ... voeg hier alle andere categorieën toe uit je originele lijst
};

// Category metadata
const CATEGORY_META = {
  motivatie: { icon: "🎯", description: "Waarom doe je dit?" },
  doelen: { icon: "📋", description: "Wat wil je bereiken?" },
  voorbereiding: { icon: "📊", description: "Ben je ready?" },
  marktanalyse: { icon: "📈", description: "Hoe staat de markt?" },
  strategie: { icon: "🎲", description: "Wat is je plan?" },
  psychologie: { icon: "🧠", description: "Hoe is je mindset?" },
  discipline: { icon: "💪", description: "Volg je je regels?" },
  risico: { icon: "⚠️", description: "Wat kan er mis gaan?" },
  performance: { icon: "📊", description: "Hoe presteer je?" },
  inzichten: { icon: "💡", description: "Welke wijsheid pak je op?" },
  reflectie: { icon: "🔍", description: "Wat leer je?" },
  ontwikkeling: { icon: "🌱", description: "Groei je als persoon?" }
};

// Telegram API helpers
async function sendMessage(chatId, text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      throw new Error(result.description || 'Telegram API error');
    }

    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function sendTypingAction(chatId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      action: 'typing'
    })
  });
}

async function getFileInfo(fileId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error('Failed to get file info');
  }
  
  return data;
}

// Smart question selection
function getSmartQuestion(chatId, category) {
  progressTracker.initUser(chatId);
  
  const questions = QUESTION_CATEGORIES[category];
  if (!questions || questions.length === 0) return null;

  const progress = progressTracker.getProgress(chatId);
  const categoryData = progress.categories[category];
  
  const availableIndices = [];
  for (let i = 0; i < questions.length; i++) {
    if (!categoryData.askedQuestions.has(i)) {
      availableIndices.push(i);
    }
  }

  let selectedIndex;
  
  if (availableIndices.length === 0) {
    progressTracker.resetCategory(chatId, category);
    selectedIndex = Math.floor(Math.random() * questions.length);
  } else {
    selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  progressTracker.markQuestionAsked(chatId, category, selectedIndex);

  return {
    ...questions[selectedIndex],
    index: selectedIndex,
    category: category
  };
}

// Create category keyboard - FIXED
function createCategoryKeyboard(filter = null) {
  const categories = filter || Object.keys(QUESTION_CATEGORIES);
  const keyboard = [];
  
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];
    
    const cat1 = categories[i];
    const meta1 = CATEGORY_META[cat1] || { icon: '❓' };
    row.push({
      text: `${meta1.icon} ${cat1.charAt(0).toUpperCase() + cat1.slice(1)}`,
      callback_data: `cat_${cat1}` // FIXED: was callback_ 
    });
    
    if (i + 1 < categories.length) {
      const cat2 = categories[i + 1];
      const meta2 = CATEGORY_META[cat2] || { icon: '❓' };
      row.push({
        text: `${meta2.icon} ${cat2.charAt(0).toUpperCase() + cat2.slice(1)}`,
        callback_data: `cat_${cat2}` // FIXED: was callback_
      });
    }
    
    keyboard.push(row);
  }
  
  keyboard.push([
    { text: "📊 Progress", callback_data: "show_progress" },
    { text: "🔄 Reset", callback_data: "reset_progress" }
  ]);
  
  return { inline_keyboard: keyboard };
}

// Ask question
async function askQuestion(chatId, category) {
  await sendTypingAction(chatId);
  
  const question = getSmartQuestion(chatId, category);
  
  if (!question) {
    await sendMessage(chatId, "❌ Sorry, geen vragen beschikbaar. Gebruik /menu.");
    return;
  }

  sessionManager.set(chatId, {
    question: question.question,
    category: category,
    questionType: question.type,
    questionOptions: question.options || [],
    questionIndex: question.index
  });

  const meta = CATEGORY_META[category] || { icon: '❓', description: '' };
  let messageText = `${meta.icon} *${category.toUpperCase()}*\n`;
  messageText += `_${meta.description}_\n\n`;
  messageText += `📝 ${question.question}`;

  let keyboard = null;
  
  if (question.type === 'multiple_choice' && question.options.length > 0) {
    const buttons = question.options.map((option, index) => [{
      text: option,
      callback_data: `answer_${index}` // Simplified to avoid length issues
    }]);
    
    buttons.push([{
      text: "⏭️ Skip deze vraag",
      callback_data: "skip_question"
    }]);
    
    keyboard = { inline_keyboard: buttons };
    
  } else if (question.type === 'memo') {
    keyboard = {
      inline_keyboard: [[
        { text: "✅ Gezien", callback_data: "memo_seen" }
      ]]
    };
    
  } else if (question.type === 'open') {
    messageText += "\n\n💬 _Typ je antwoord of stuur een voice note_";
  }

  await sendMessage(chatId, messageText, keyboard ? { reply_markup: keyboard } : {});
}

// Save to Notion
async function saveToNotion(data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // CHANGE THIS TO YOUR ACTUAL API VERSION
      const apiEndpoint = `${API_URL}/api/trading-journal-v7`; // or v8
      console.log('Saving to:', apiEndpoint);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`API returned non-JSON response. Status: ${response.status}`);
      }

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, data: result };
      } else {
        console.error(`Notion save failed (attempt ${i + 1}):`, result);
        if (i === retries - 1) {
          return { success: false, error: result.error || 'Unknown error' };
        }
      }
    } catch (error) {
      console.error(`Network error (attempt ${i + 1}):`, error);
      if (i === retries - 1) {
        return { success: false, error: error.message };
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
  }
}

// Main webhook handler
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    console.log('Received update:', JSON.stringify(update, null, 2));
    
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true }); // Always return 200 to prevent Telegram retries
  }
}

// Handle messages
async function handleMessage(message) {
  const chatId = message.chat.id;
  const messageId = message.message_id;
  
  if (message.text && message.text.startsWith('/')) {
    await handleCommand(chatId, message.text, messageId);
    return;
  }
  
  if (message.photo || message.voice || message.video_note || message.document) {
    await handleMedia(chatId, message);
    return;
  }
  
  if (message.text) {
    await handleTextResponse(chatId, message.text);
    return;
  }
}

// Handle commands
async function handleCommand(chatId, command, messageId) {
  console.log(`Handling command: ${command} for chat ${chatId}`);
  
  switch (command) {
    case '/start':
      await sendWelcomeMessage(chatId);
      break;
      
    case '/menu':
      await sendMenu(chatId);
      break;
      
    case '/test':
      await testAPI(chatId);
      break;
      
    case '/progress':
      await showProgress(chatId);
      break;
      
    case '/reset':
      await confirmReset(chatId);
      break;
      
    case '/help':
      await sendHelpMessage(chatId);
      break;
      
    default:
      await sendMessage(chatId, "❓ Onbekend commando. Gebruik /help voor alle commando's.");
  }
}

// Send welcome message
async function sendWelcomeMessage(chatId) {
  const welcomeText = `🦁 *Welkom bij je Trading Journal Bot!*

_"Today A King..."_ 👑

*Features:*
• 📝 85+ trading vragen
• 🎯 12 categorieën
• 📸 Media support
• 📊 Automatische scoring
• 🔄 Slimme vraag rotatie

*Commando's:*
/menu - Start hier
/progress - Je voortgang
/test - Test connectie
/reset - Reset progress
/help - Hulp

_"Less is more. Be a lion."_ 🦁`;

  await sendMessage(chatId, welcomeText);
  // Removed setTimeout that was causing double menu
}

// Send menu
async function sendMenu(chatId) {
  const hour = new Date().getHours();
  let menuText = "🎯 *Kies een categorie:*\n\n";
  
  if (hour < 12) {
    menuText += "🌅 _Goedemorgen! Start met voorbereiding._\n\n";
  } else if (hour > 18) {
    menuText += "🌙 _Tijd voor reflectie._\n\n";
  }
  
  menuText += "💡 _Je kunt ook direct media sturen!_";
  
  const keyboard = createCategoryKeyboard();
  await sendMessage(chatId, menuText, { reply_markup: keyboard });
}

// Test API
// Test API
async function testAPI(chatId) {
  await sendTypingAction(chatId);
  
  try {
    const checkUrl = `${API_URL}/api/trading-journal-v7`; // Dit moet v7 zijn nu
    console.log('Testing API at:', checkUrl);
    
    const testData = {
      question: 'API Test - Bot Check',
      answer: 'Test succesvol',
      category: 'Test',
      time_of_day: new Date().getHours() < 12 ? 'Morning' : 'Evening',
      response_type: 'Text',
      question_options: []
    };
    
    const response = await fetch(checkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    // Debug: log response details
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
    }
    
    if (response.ok && result.success) {
      await sendMessage(chatId, 
        "✅ *API Test Succesvol!*\n\n" +
        `📊 Daily Score: ${result.data?.daily_score || 'N/A'}\n` +
        `🎨 Kleur: ${result.data?.color_assigned || 'N/A'}\n` +
        `📝 Notion ID: ${result.data?.notion_id || 'N/A'}\n\n` +
        "_Alles werkt perfect!_"
      );
    } else {
      throw new Error(result.error || `API error: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error('Test API error:', error);
    await sendMessage(chatId, 
      "❌ *API Test Gefaald*\n\n" +
      `Error: ${error.message}\n\n` +
      "_Check Vercel logs voor details_"
    );
  }
}
// Show progress
async function showProgress(chatId) {
  const progress = progressTracker.getProgress(chatId);
  let message = "📊 *Jouw Progress*\n\n";
  
  const categories = progress.categories;
  let totalAsked = 0;
  let totalQuestions = 0;
  
  Object.entries(categories).forEach(([category, data]) => {
    const meta = CATEGORY_META[category] || { icon: '❓' };
    const percentage = Math.round((data.askedQuestions.size / data.totalQuestions) * 100);
    
    totalAsked += data.askedQuestions.size;
    totalQuestions += data.totalQuestions;
    
    message += `${meta.icon} ${category}: ${data.askedQuestions.size}/${data.totalQuestions} (${percentage}%)\n`;
  });
  
  const totalPercentage = Math.round((totalAsked / totalQuestions) * 100);
  message += `\n📈 *Totaal*: ${totalAsked}/${totalQuestions} (${totalPercentage}%)`;
  
  await sendMessage(chatId, message);
}

// Confirm reset
async function confirmReset(chatId) {
  const keyboard = {
    inline_keyboard: [[
      { text: "✅ Ja, reset", callback_data: "confirm_reset" },
      { text: "❌ Annuleer", callback_data: "cancel_reset" }
    ]]
  };
  
  await sendMessage(chatId, 
    "⚠️ *Reset Progress?*\n\nDit reset welke vragen je hebt gehad.",
    { reply_markup: keyboard }
  );
}

// Send help
async function sendHelpMessage(chatId) {
  const helpText = `📚 *Help*

*Gebruik:*
1. Kies categorie via /menu
2. Beantwoord vragen
3. Stuur media wanneer je wilt

*Media:*
• 📸 Foto's
• 🎙️ Voice notes
• 📄 Documenten

*Scoring:*
• 🟢 Groen = 5 pts
• 🟡 Geel = 3 pts
• 🟠 Oranje = 2 pts
• 🔴 Rood = 1 pt
• 🟣 Donkerrood = 0 pts`;

  await sendMessage(chatId, helpText);
}

// Handle text response
async function handleTextResponse(chatId, text) {
  const session = sessionManager.get(chatId);
  
  if (!session) {
    await sendMessage(chatId, "⏰ Geen actieve vraag. Gebruik /menu");
    return;
  }
  
  await sendTypingAction(chatId);
  
  const data = {
    question: session.question,
    answer: text,
    category: session.category,
    time_of_day: new Date().getHours() < 12 ? 'Morning' : 'Evening',
    response_type: session.questionType || 'Text',
    question_options: session.questionOptions || []
  };
  
  const result = await saveToNotion(data);
  
  if (result.success) {
    await sendMessage(chatId, "✅ Opgeslagen!\n\n_Gebruik /menu voor volgende vraag_");
  } else {
    await sendMessage(chatId, "❌ Fout bij opslaan. Probeer opnieuw.");
  }
  
  sessionManager.delete(chatId);
}

// Handle media
async function handleMedia(chatId, message) {
  await sendTypingAction(chatId);
  
  let mediaType, fileId, description;
  
  if (message.photo) {
    mediaType = 'Photo';
    fileId = message.photo[message.photo.length - 1].file_id;
    description = message.caption || 'Photo';
  } else if (message.voice) {
    mediaType = 'Voice';
    fileId = message.voice.file_id;
    description = `Voice note (${message.voice.duration}s)`;
  } else if (message.document) {
    mediaType = 'Document';
    fileId = message.document.file_id;
    description = message.document.file_name || 'Document';
  }
  
  try {
    const fileInfo = await getFileInfo(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.result.file_path}`;
    
    const data = {
      question: `${mediaType} Upload`,
      answer: description,
      category: 'Media',
      time_of_day: new Date().getHours() < 12 ? 'Morning' : 'Evening',
      response_type: 'media',
      media_type: mediaType,
      media_url: fileUrl,
      media_description: description
    };
    
    const result = await saveToNotion(data);
    
    if (result.success) {
      await sendMessage(chatId, `✅ ${mediaType} opgeslagen!`);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    await sendMessage(chatId, `❌ Fout bij ${mediaType} upload.`);
  }
}

// Handle callback queries
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  
  console.log(`Handling callback: ${data}`);
  
  // Answer callback to remove loading
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });
  
  if (data.startsWith('cat_')) {
    const category = data.replace('cat_', '');
    await askQuestion(chatId, category);
    
  } else if (data.startsWith('answer_')) {
    await handleAnswerCallback(chatId, messageId, data);
    
  } else if (data === 'memo_seen') {
    await handleMemoSeen(chatId, messageId);
    
  } else if (data === 'skip_question') {
    sessionManager.delete(chatId);
    await sendMessage(chatId, "⏭️ Vraag overgeslagen. /menu voor nieuwe vraag.");
    
  } else if (data === 'show_progress') {
    await showProgress(chatId);
    
  } else if (data === 'confirm_reset') {
    progressTracker.resetAll(chatId);
    await sendMessage(chatId, "✅ Progress gereset!");
    
  } else if (data === 'cancel_reset') {
    await sendMessage(chatId, "❌ Reset geannuleerd.");
  }
}

// Handle answer callback
async function handleAnswerCallback(chatId, messageId, data) {
  const session = sessionManager.get(chatId);
  
  if (!session) {
    await sendMessage(chatId, "⏰ Sessie verlopen.");
    return;
  }
  
  const answerIndex = parseInt(data.split('_')[1]);
  const answer = session.questionOptions[answerIndex] || 'Unknown';
  
  const notionData = {
    question: session.question,
    answer: answer,
    category: session.category,
    time_of_day: new Date().getHours() < 12 ? 'Morning' : 'Evening',
    response_type: session.questionType,
    question_options: session.questionOptions
  };
  
  const result = await saveToNotion(notionData);
  
  if (result.success) {
    await sendMessage(chatId, "✅ Antwoord opgeslagen!\n\n_/menu voor volgende vraag_");
  } else {
    await sendMessage(chatId, "❌ Fout bij opslaan.");
  }
  
  sessionManager.delete(chatId);
}

// Handle memo seen
async function handleMemoSeen(chatId, messageId) {
  const session = sessionManager.get(chatId);
  
  if (!session) return;
  
  const data = {
    question: session.question,
    answer: '✅ Gezien',
    category: session.category,
    time_of_day: new Date().getHours() < 12 ? 'Morning' : 'Evening',
    response_type: 'memo'
  };
  
  await saveToNotion(data);
  await sendMessage(chatId, "✅ Memo gemarkeerd!");
  
  sessionManager.delete(chatId);
}

// Export for testing
export { sessionManager, progressTracker };
