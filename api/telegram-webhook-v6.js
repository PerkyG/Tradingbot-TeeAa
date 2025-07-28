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
      Object.keys(QUESTION_CATEGORIES).forEach(categorybezigheid. = new Map();

      for (let i = 0; i < questions.length; i++) {
        if (!categoryData.askedQuestions.has(i)) {
          availableIndices.push(i);
        }
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

// Create category keyboard (fixed syntax)
function createCategoryKeyboard(filter = null) {
  const categories = filter || getCurrentCategories();
  const keyboard = [];
  
  // Maak rows van 2 buttons
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];
    // Eerste button
    const cat1 = categories[i];
    const meta1 = CATEGORY_META[cat1] || { icon: '❓', description: '' };
    row.push({
      text: meta1.icon + ' ' + cat1.charAt(0).toUpperCase() + cat1.slice(1),
      callback_ 'cat_' + cat1  // Gefixt: callback_data met colon
    });
    // Tweede button (indien aanwezig)
    if (i + 1 < categories.length) {
      const cat2 = categories[i + 1];
      const meta2 = CATEGORY_META[cat2] || { icon: '❓', description: '' };
      row.push({
        text: meta2.icon + ' ' + cat2.charAt(0).toUpperCase() + cat2.slice(1),
        callback_ 'cat_' + cat2  // Gefixt
      });
    }
    keyboard.push(row);
  }
  // Voeg extra opties toe
  keyboard.push([
    { text: "📊 Progress", callback_ "show_progress" },  // Gefixt
    { text: "🔄 Reset", callback_ "reset_progress" }  // Gefixt
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
  const meta = CATEGORY_META[category] || { icon: '❓', description: '' };
  let messageText = meta.icon + ' *' + category.toUpperCase() + '*\n';
  messageText += '_' + meta.description + '_\n\n';
  messageText += '📝 ' + question.question;

  // Build keyboard
  let keyboard = null;
  
  if (question.type === 'multiple_choice' && question.options.length > 0) {
    const buttons = question.options.map((option, index) => [{
      text: option,
      callback_ 'answer_' + index + '_' + option.substring(0, 20)  // Gefixt
    }]);
    
    // Add skip option
    buttons.push([{
      text: "⏭️ Skip deze vraag",
      callback_ "skip_question"  // Gefixt
    }]);
    
    keyboard = { inline_keyboard: buttons };
    
  } else if (question.type === 'memo') {
    keyboard = {
      inline_keyboard: [[
        { text: "✅ Gezien", callback_ "memo_seen" }  // Gefixt
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
        return { success: true, result };
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
    const meta = CATEGORY_META[category] || { icon: '❓' };
    const percentage = Math.round((data.askedQuestions.size / data.totalQuestions) * 100);
    
    totalAsked += data.askedQuestions.size;
    totalQuestions += data.totalQuestions;
    
    message += meta.icon + ' *' + category + '*: ' + data.askedQuestions.size + '/' + data.totalQuestions + ' (' + percentage + '%)\n';
    
    if (data.completed) {
      message += '   └ ✅ Compleet!\n';
    } else if (data.askedQuestions.size > 0) {
      message += '   └ ' + (data.totalQuestions - data.askedQuestions.size) + ' vragen over\n';
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
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    await notifyAdmin(`Webhook error: ${error.message}`);
    return res.status(200).json({ ok: true });
  }
}

// Handle regular messages
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
      `📊 Daily Score: ${result.result.data.daily_score}\n` +  // Aangepast op basis van return in saveToNotion
      `🎨 Kleur: ${result.result.data.color_assigned}\n` +
      `📝 Notion ID: \`${result.result.data.notion_id}\`\n\n` +
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
      { text: "✅ Ja, reset alles", callback_ "confirm_reset" },  // Gefixt
      { text: "❌ Annuleer", callback_ "cancel_reset" }  // Gefixt
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
    const responseData = result.result.data;  // Aangepast op basis van return
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
      const responseData = result.result.data;  // Aangepast
      await sendMessage(chatId, 
        `✅ *${mediaType} Opgeslagen!*\n\n` +
        `📊 Daily Score: ${responseData.daily_score}/100\n` +  // Gefixt: volledige lijn
        `📈 Vragen vandaag: ${responseData.score_details.total_answers}\n\n` +
        `_Goed gedaan! Gebruik /menu voor meer._`
      );
    } else {
      await sendMessage(chatId, 
        "❌ Er ging iets mis bij het opslaan van de media.\n" +
        `Error: ${result.error}\n\n` +
        "_Probeer het later opnieuw._"
      );
    }
  } catch (error) {
    console.error('Media handling error:', error);
    await sendMessage(chatId, "❌ Fout bij verwerken van media. Probeer opnieuw.");
  }
}

// Handle callback queries (voeg deze functie toe als hij ontbrak, gebaseerd op context)
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  await sendTypingAction(chatId);

  if (data.startsWith('cat_')) {
    const category = data.slice(4);
    await askQuestion(chatId, category);
  } else if (data === 'show_progress') {
    await showProgress(chatId);
  } else if (data === 'reset_progress') {
    await confirmReset(chatId);
  } else if (data === 'confirm_reset') {
    progressTracker.resetAll(chatId);
    await editMessage(chatId, messageId, "✅ *Progress gereset!* Gebruik /menu om opnieuw te beginnen.");
  } else if (data === 'cancel_reset') {
    await editMessage(chatId, messageId, "❌ Reset geannuleerd.");
  } else if (data.startsWith('answer_')) {
    // Handel antwoord op multiple choice (voeg logica toe gebaseerd op session)
    const parts = data.split('_');
    const index = parseInt(parts[1]);
    const option = parts.slice(2).join('_');
    await handleTextResponse(chatId, option);  // Behandel als tekstantwoord
  } else if (data === 'skip_question') {
    sessionManager.delete(chatId);
    await editMessage(chatId, messageId, "⏭️ Vraag overgeslagen. Gebruik /menu voor een nieuwe.");
  } else if (data === 'memo_seen') {
    sessionManager.delete(chatId);
    await editMessage(chatId, messageId, "✅ Memo gezien! Ga door met /menu.");
  } else {
    await sendMessage(chatId, "❓ Onbekende actie.");
  }

  // Beantwoord de callback om Telegram te bevestigen
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });
}
