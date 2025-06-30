// api/telegram-webhook-v6.js
// Verbeterde versie met betere error handling, session management en features

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'https://tradingbot-tee-aa.vercel.app';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Voor error notifications

// Enhanced session management met TTL
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

// Progress tracking met persistentie
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

// Time-based category selection
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

// Alle vragen (unchanged from original)
const QUESTION_CATEGORIES = {
  // ... (alle originele vragen hier)
  motivatie: [
    {
      question: "Waarom doe je dit? Familie onderhouden, toekomst opbouwen, Thea trots maken?",
      type: "multiple_choice",
      options: ["Familie onderhouden", "Toekomst opbouwen", "Thea trots maken", "Omdat ik het kan", "Mega interessant"]
    },
    // ... rest van de vragen
  ],
  // ... rest van de categorieën
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
  reflectie: { icon: "🔍", description: "Wat leer je?" },
  ontwikkeling: { icon: "🌱", description: "Groei je als persoon?" },
  inzichten: { icon: "💡", description: "Welke wijsheid pak je op?" }
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
    // Notify admin if configured
    if (ADMIN_CHAT_ID && chatId !== ADMIN_CHAT_ID) {
      await notifyAdmin(`Error sending message to ${chatId}: ${error.message}`);
    }
    throw error;
  }
}

async function editMessage(chatId, messageId, text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
    
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown',
      ...options
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return response.json();
  } catch (error) {
    console.error('Error editing message:', error);
    return null;
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

async function notifyAdmin(message) {
  if (!ADMIN_CHAT_ID) return;
  
  try {
    await sendMessage(ADMIN_CHAT_ID, `🚨 *Bot Alert*\n\n${message}`);
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

// Smart question selection
function getSmartQuestion(chatId, category) {
  progressTracker.initUser(chatId);
  
  const questions = QUESTION_CATEGORIES[category];
  if (!questions || questions.length === 0) return null;

  const progress = progressTracker.getProgress(chatId);
  const categoryData = progress.categories[category];
  
  // Filter beschikbare vragen
  const availableIndices = [];
  for (let i = 0; i < questions.length; i++) {
    if (!categoryData.askedQuestions.has(i)) {
      availableIndices.push(i);
    }
  }

  let selectedIndex;
  
  if (availableIndices.length === 0) {
    // Reset category als alle vragen gesteld zijn
    progressTracker.resetCategory(chatId, category);
    selectedIndex = Math.floor(Math.random() * questions.length);
  } else {
    // Kies willekeurig uit beschikbare vragen
    selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  // Markeer als gesteld
  progressTracker.markQuestionAsked(chatId, category, selectedIndex);

  return {
    ...questions[selectedIndex],
    index: selectedIndex,
    category: category
  };
}

// Get current appropriate categories
function getCurrentCategories() {
  const hour = new Date().getHours();
  
  if (hour >= SCHEDULE.MORNING.start && hour < SCHEDULE.MORNING.end) {
    return SCHEDULE.MORNING.categories;
  } else if (hour >= SCHEDULE.EVENING.start && hour <= SCHEDULE.EVENING.end) {
    return SCHEDULE.EVENING.categories;
  }
  
  // Default: alle categorieën
  return Object.keys(QUESTION_CATEGORIES);
}

// Create category keyboard
function createCategoryKeyboard(filter = null) {
  const categories = filter || getCurrentCategories();
  const keyboard = [];
  
  // Maak rows van 2 buttons
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];
    
    const cat1 = categories[i];
    const meta1 = CATEGORY_META[cat1];
    row.push({
      text: `${meta1.icon} ${cat1.charAt(0).toUpperCase() + cat1.slice(1)}`,
      callback_data: `cat_${cat1}`
    });
    
    if (i + 1 < categories.length) {
      const cat2 = categories[i + 1];
      const meta2 = CATEGORY_META[cat2];
      row.push({
        text: `${meta2.icon} ${cat2.charAt(0).toUpperCase() + cat2.slice(1)}`,
        callback_data: `cat_${cat2}`
      });
    }
    
    keyboard.push(row);
  }
  
  // Voeg extra opties toe
  keyboard.push([
    { text: "📊 Progress", callback_data: "show_progress" },
    { text: "🔄 Reset", callback_data: "reset_progress" }
  ]);
  
  return { inline_keyboard: keyboard };
}

// Ask question with enhanced UI
async function askQuestion(chatId, category) {
  await sendTypingAction(chatId);
  
  const question = getSmartQuestion(chatId, category);
  
  if (!question) {
    await sendMessage(chatId, "❌ Sorry, ik ken deze categorie niet. Gebruik /menu voor beschikbare opties.");
    return;
  }

  // Store session
  sessionManager.set(chatId, {
    question: question.question,
    category: category,
    questionType: question.type,
    questionOptions: question.options || [],
    questionIndex: question.index
  });

  // Build message
  const meta = CATEGORY_META[category];
  let messageText = `${meta.icon} *${category.toUpperCase()}*\n`;
  messageText += `_${meta.description}_\n\n`;
  messageText += `📝 ${question.question}`;

  // Build keyboard
  let keyboard = null;
  
  if (question.type === 'multiple_choice' && question.options.length > 0) {
    const buttons = question.options.map((option, index) => [{
      text: option,
      callback_data: `answer_${index}_${option.substring(0, 20)}`
    }]);
    
    // Add skip option
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

// Save to Notion with retry logic
async function saveToNotion(data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_URL}/api/trading-journal-v7`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

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
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
  }
}

// Format progress message
function formatProgress(progress) {
  let message = "📊 *Jouw Vraag Progress*\n\n";
  
  const categories = progress.categories;
  let totalAsked = 0;
  let totalQuestions = 0;
  
  Object.entries(categories).forEach(([category, data]) => {
    const meta = CATEGORY_META[category];
    const percentage = Math.round((data.askedQuestions.size / data.totalQuestions) * 100);
    
    totalAsked += data.askedQuestions.size;
    totalQuestions += data.totalQuestions;
    
    message += `${meta.icon} *${category}*: ${data.askedQuestions.size}/${data.totalQuestions} (${percentage}%)\n`;
    
    if (data.completed) {
      message += `   └ ✅ Compleet!\n`;
    } else if (data.askedQuestions.size > 0) {
      message += `   └ ${data.totalQuestions - data.askedQuestions.size} vragen over\n`;
    }
    message += "\n";
  });
  
  const totalPercentage = Math.round((totalAsked / totalQuestions) * 100);
  message += `📈 *Totaal*: ${totalAsked}/${totalQuestions} (${totalPercentage}%)\n\n`;
  message += `💡 _Tip: Vragen worden niet herhaald tot alle vragen in een categorie zijn gesteld!_`;
  
  return message;
}

// Main webhook handler
export default async function handler(req, res) {
  // Set response headers
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    // Handle different update types
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    await notifyAdmin(`Webhook error: ${error.message}`);
    return res.status(200).json({ ok: true }); // Return 200 to prevent Telegram retries
  }
}

// Handle regular messages
async function handleMessage(message) {
  const chatId = message.chat.id;
  const messageId = message.message_id;
  
  // Handle commands
  if (message.text && message.text.startsWith('/')) {
    await handleCommand(chatId, message.text, messageId);
    return;
  }
  
  // Handle media
  if (message.photo || message.voice || message.video_note || message.document) {
    await handleMedia(chatId, message);
    return;
  }
  
  // Handle text responses to questions
  if (message.text) {
    await handleTextResponse(chatId, message.text);
    return;
  }
}

// Handle commands
async function handleCommand(chatId, command, messageId) {
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
      
    case '/stats':
      await showStatistics(chatId);
      break;
      
    default:
      await sendMessage(chatId, "❓ Onbekend commando. Gebruik /help voor alle commando's.");
  }
}

// Send welcome message
async function sendWelcomeMessage(chatId) {
  const welcomeText = `🦁 *Welkom bij je Trading Journal Bot!*

_"Today A King..."_ 👑

*Wat kan deze bot?*
• 📝 85+ fine-tuned trading vragen
• 🎯 12 categorieën voor complete zelfreflectie
• 📸 Media support (foto's, voice notes, documenten)
• 📊 Automatische kleur scoring
• 💯 Daily performance tracking
• 🔄 Slimme vraag rotatie (geen dubbele vragen)

*Commando's:*
/menu - Hoofdmenu met categorieën
/progress - Bekijk je voortgang
/stats - Zie je statistieken
/test - Test de Notion connectie
/reset - Reset je progress
/help - Alle informatie

*Pro Tips:*
• 🌅 's Ochtends: Focus op voorbereiding & strategie
• 🌙 's Avonds: Focus op reflectie & ontwikkeling
• 📸 Stuur screenshots van je trades
• 🎙️ Voice notes voor snelle gedachten
• 📄 Upload trade logs als documenten

_"Less is more. Be a lion. Today A King."_ 🦁`;

  await sendMessage(chatId, welcomeText);
  
  // Stuur direct het menu
  setTimeout(() => sendMenu(chatId), 1000);
}

// Send menu
async function sendMenu(chatId) {
  const hour = new Date().getHours();
  let menuText = "🎯 *Kies een categorie:*\n\n";
  
  if (hour >= SCHEDULE.MORNING.start && hour < SCHEDULE.MORNING.end) {
    menuText += "🌅 _Goedemorgen! Focus categorieën voor de ochtend._\n\n";
  } else if (hour >= SCHEDULE.EVENING.start && hour <= SCHEDULE.EVENING.end) {
    menuText += "🌙 _Goedenavond! Tijd voor reflectie._\n\n";
  }
  
  menuText += "💡 _Tip: Stuur ook gewoon een foto, voice note of document!_";
  
  const keyboard = createCategoryKeyboard();
  await sendMessage(chatId, menuText, { reply_markup: keyboard });
}

// Test API connection
async function testAPI(chatId) {
  await sendTypingAction(chatId);
  
  const testData = {
    question: 'API Test - Complete Trading Bot v6',
    answer: 'Test succesvol uitgevoerd',
    category: 'Test',
    time_of_day: new Date().getHours() < 12 ? 'Morning' : 'Evening',
    response_type: 'Text'
  };
  
  const result = await saveToNotion(testData);
  
  if (result.success) {
    await sendMessage(chatId, 
      "✅ *API Test Succesvol!*\n\n" +
      `📊 Daily Score: ${result.data.data.daily_score}\n` +
      `🎨 Kleur: ${result.data.data.color_assigned}\n` +
      `📝 Notion ID: \`${result.data.data.notion_id}\`\n\n` +
      "_Alles werkt perfect!_"
    );
  } else {
    await sendMessage(chatId, 
      "❌ *API Test Gefaald*\n\n" +
      `Error: ${result.error}\n\n` +
      "_Check de logs of contacteer support._"
    );
  }
}

// Show progress
async function showProgress(chatId) {
  const progress = progressTracker.getProgress(chatId);
  const message = formatProgress(progress);
  await sendMessage(chatId, message);
}

// Show statistics
async function showStatistics(chatId) {
  await sendTypingAction(chatId);
  
  // Haal vandaag's entries op via API
  try {
    const response = await fetch(`${API_URL}/api/get-daily-stats?chatId=${chatId}`);
    const stats = await response.json();
    
    let message = "📊 *Jouw Trading Statistieken*\n\n";
    message += `📅 *Vandaag:*\n`;
    message += `• Entries: ${stats.todayEntries || 0}\n`;
    message += `• Daily Score: ${stats.dailyScore || 0}/100\n`;
    message += `• Gem. Score: ${stats.averageScore || 0}\n\n`;
    
    message += `📈 *Deze Week:*\n`;
    message += `• Totaal Entries: ${stats.weekEntries || 0}\n`;
    message += `• Gem. Daily Score: ${stats.weekAvgScore || 0}\n`;
    message += `• Beste Dag: ${stats.bestDay || 'N/A'}\n\n`;
    
    message += `🏆 *All-Time:*\n`;
    message += `• Totaal Entries: ${stats.totalEntries || 0}\n`;
    message += `• Trading Dagen: ${stats.tradingDays || 0}\n`;
    message += `• Hoogste Score: ${stats.highestScore || 0}\n`;
    
    await sendMessage(chatId, message);
  } catch (error) {
    await sendMessage(chatId, "❌ Kon statistieken niet ophalen. Probeer later opnieuw.");
  }
}

// Confirm reset
async function confirmReset(chatId) {
  const keyboard = {
    inline_keyboard: [[
      { text: "✅ Ja, reset alles", callback_data: "confirm_reset" },
      { text: "❌ Annuleer", callback_data: "cancel_reset" }
    ]]
  };
  
  await sendMessage(chatId, 
    "⚠️ *Weet je het zeker?*\n\n" +
    "Dit reset al je vraag progress. Je Notion data blijft bewaard.",
    { reply_markup: keyboard }
    );
}

// Send help message
async function sendHelpMessage(chatId) {
  const helpText = `📚 *Help & Informatie*

*Basis Gebruik:*
1. Gebruik /menu om een categorie te kiezen
2. Beantwoord de vraag met de knoppen of typ een antwoord
3. Stuur media (foto's, voice notes, docs) op elk moment

*Commando's:*
• /menu - Toon categorieën menu
• /progress - Bekijk welke vragen je hebt gehad
• /stats - Zie je trading statistieken
• /test - Test de database connectie
• /reset - Reset je vraag progress
• /help - Deze hulp informatie

*Media Types:*
• 📸 Foto's - Screenshots van charts, setups
• 🎙️ Voice Notes - Snelle gedachten opnemen
• 🎥 Video Notes - Korte video's
• 📄 Documenten - Trade logs, Excel files

*Kleur Scoring:*
• 🟢 Groen = Excellent (5 punten)
• 🟡 Geel = Neutraal (3 punten)
• 🟠 Oranje = Matig (2 punten)
• 🔴 Rood = Slecht (1 punt)
• 🟣 Donkerrood = Zeer slecht (0 punten)

*Daily Score:*
Je daily score wordt berekend op basis van je antwoorden (max 100).
Sommige vragen tellen niet mee voor de score (zoals marktanalyse vragen).

*Tips:*
• Wees eerlijk in je antwoorden
• Gebruik voice notes voor uitgebreide reflecties
• Screenshot belangrijke trades
• Review je progress regelmatig

_Voor support: @YourSupportUsername_`;

  await sendMessage(chatId, helpText);
}

// Handle text responses
async function handleTextResponse(chatId, text) {
  const session = sessionManager.get(chatId);
  
  if (!session) {
    await sendMessage(chatId, 
      "⏰ Je sessie is verlopen of ik weet niet op welke vraag je antwoordt.\n\n" +
      "Gebruik /menu om een nieuwe vraag te kiezen."
    );
    return;
  }
  
  await sendTypingAction(chatId);
  
  // Save to Notion
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
    const responseData = result.data.data;
    await sendMessage(chatId, 
      `✅ *Opgeslagen!*\n\n` +
      `🎨 Kleur: ${responseData.color_assigned}\n` +
      `📊 Daily Score: ${responseData.daily_score}/100\n` +
      `📈 Vragen vandaag: ${responseData.score_details.total_answers}\n\n` +
      `_Gebruik /menu voor de volgende vraag_`
    );
  } else {
    await sendMessage(chatId, 
      "❌ Er ging iets mis bij het opslaan.\n" +
      `Error: ${result.error}\n\n` +
      "_Probeer het later opnieuw._"
    );
  }
  
  // Clear session
  sessionManager.delete(chatId);
}

// Handle media uploads
async function handleMedia(chatId, message) {
  await sendTypingAction(chatId);
  
  let mediaType, fileId, description, fileSize;
  
  if (message.photo) {
    mediaType = 'Photo';
    fileId = message.photo[message.photo.length - 1].file_id;
    description = message.caption || 'Trading screenshot';
    fileSize = message.photo[message.photo.length - 1].file_size;
  } else if (message.voice) {
    mediaType = 'Voice Note';
    fileId = message.voice.file_id;
    description = `Voice note (${message.voice.duration}s)`;
    fileSize = message.voice.file_size;
  } else if (message.video_note) {
    mediaType = 'Video Note';
    fileId = message.video_note.file_id;
    description = `Video note (${message.video_note.duration}s)`;
    fileSize = message.video_note.file_size;
  } else if (message.document) {
    mediaType = 'Document';
    fileId = message.document.file_id;
    description = message.document.file_name || 'Document';
    fileSize = message.document.file_size;
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
      media_file_size: fileSize,
      media_description: description
    };
    
    const result = await saveToNotion(data);
    
    if (result.success) {
      await sendMessage(chatId, 
        `✅ *${mediaType} Opgeslagen!*\n\n` +
        `📊 Daily Score: ${result.data.data.daily_score}/100\n` +
        `📝 Beschrijving: ${description}\n\n` +
        `_Je media is veilig opgeslagen in Notion_`
      );
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    await sendMessage(chatId, 
      `❌ Kon ${mediaType.toLowerCase()} niet opslaan.\n` +
      `Error: ${error.message}`
    );
  }
}

// Handle callback queries
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  
  // Answer callback to remove loading state
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });
  
  // Handle different callback types
  if (data.startsWith('cat_')) {
    const category = data.replace('cat_', '');
    await askQuestion(chatId, category);
    
  } else if (data.startsWith('answer_')) {
    await handleAnswerCallback(chatId, messageId, data);
    
  } else if (data === 'memo_seen') {
    await handleMemoSeen(chatId, messageId);
    
  } else if (data === 'skip_question') {
    await handleSkipQuestion(chatId, messageId);
    
  } else if (data === 'show_progress') {
    await showProgress(chatId);
    
  } else if (data === 'reset_progress') {
    await confirmReset(chatId);
    
  } else if (data === 'confirm_reset') {
    progressTracker.resetAll(chatId);
    await editMessage(chatId, messageId, "✅ *Progress gereset!*\n\nAlle vragen zijn weer beschikbaar.");
    
  } else if (data === 'cancel_reset') {
    await editMessage(chatId, messageId, "❌ *Reset geannuleerd*\n\nJe progress blijft behouden.");
  }
}

// Handle answer callback
async function handleAnswerCallback(chatId, messageId, data) {
  const session = sessionManager.get(chatId);
  
  if (!session) {
    await editMessage(chatId, messageId, 
      "⏰ *Sessie verlopen*\n\n" +
      "Deze vraag is verlopen. Gebruik /menu voor een nieuwe vraag."
    );
    return;
  }
  
  // Parse answer from callback data
  const parts = data.split('_');
  const answerIndex = parseInt(parts[1]);
  const answer = session.questionOptions[answerIndex] || parts.slice(2).join('_');
  
  // Save to Notion
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
    const responseData = result.data.data;
    await editMessage(chatId, messageId,
      `✅ *Antwoord opgeslagen!*\n\n` +
      `❓ ${session.question}\n` +
      `💬 ${answer}\n\n` +
      `🎨 Kleur: ${responseData.color_assigned}\n` +
      `📊 Daily Score: ${responseData.daily_score}/100\n\n` +
      `_Gebruik /menu voor de volgende vraag_`
    );
  } else {
    await editMessage(chatId, messageId,
      `❌ *Opslaan mislukt*\n\n` +
      `Error: ${result.error}\n\n` +
      `_Probeer het later opnieuw_`
    );
  }
  
  sessionManager.delete(chatId);
}

// Handle memo seen
async function handleMemoSeen(chatId, messageId) {
  const session = sessionManager.get(chatId);
  
  if (!session) {
    await editMessage(chatId, messageId, "⏰ Sessie verlopen");
    return;
  }
  
  const data = {
    question: session.question,
    answer: '✅ Gezien',
    category: session.category,
    time_of_day: new Date().getHours() < 12 ? 'Morning' : 'Evening',
    response_type: 'memo'
  };
  
  const result = await saveToNotion(data);
  
  if (result.success) {
    await editMessage(chatId, messageId,
      `✅ *Memo gemarkeerd als gezien*\n\n` +
      `"${session.question}"\n\n` +
      `_Good reminder! 🦁_`
    );
  }
  
  sessionManager.delete(chatId);
}

// Handle skip question
async function handleSkipQuestion(chatId, messageId) {
  await editMessage(chatId, messageId,
    "⏭️ *Vraag overgeslagen*\n\n" +
    "_Gebruik /menu voor een andere vraag_"
  );
  sessionManager.delete(chatId);
}

// Export for testing
export { sessionManager, progressTracker, QUESTION_CATEGORIES };
