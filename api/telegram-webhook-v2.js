// api/telegram-webhook-v2.js - Enhanced Trading Journal Bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = 'https://tradingbot-tee-aa.vercel.app';

// Import question categories (in practice, we'll duplicate the structure here)
const QUESTION_CATEGORIES = {
  motivatie: {
    name: "Motivatie",
    questions: [
      {
        question: "Waarom trade je vandaag? Wat drijft je?",
        responses: ["Purpose driven", "Financiële noodzaak", "Passie", "Routine", "Onduidelijk"]
      },
      {
        question: "Voel je de intrinsieke motivatie of trade je uit dwang?",
        responses: ["Intrinsiek gemotiveerd", "Mix van beide", "Vooral dwang", "Onduidelijk", "Geen motivatie"]
      },
      {
        question: "Ben je vandaag dankbaar voor de mogelijkheid om te traden?",
        responses: ["Zeer dankbaar", "Dankbaar", "Neutraal", "Gefrustreerd", "Ontevreden"]
      }
    ]
  },
  doelen: {
    name: "Doelen", 
    questions: [
      {
        question: "Wat zijn je concrete doelen voor vandaag? (R targets, max trades, etc.)",
        responses: ["Helder gedefinieerd", "Globaal idee", "Vaag", "Geen specifieke doelen", "Conflicterende doelen"]
      },
      {
        question: "Zijn je doelen realistisch en haalbaar voor vandaag?",
        responses: ["Zeer realistisch", "Realistisch", "Ambitieus maar haalbaar", "Te ambitieus", "Onrealistisch"]
      }
    ]
  },
  voorbereiding: {
    name: "Voorbereiding",
    questions: [
      {
        question: "Heb je alle prep sources gechecked? (Discord, X, TradingView, ForexFactory)",
        responses: ["Alles volledig", "Meeste bronnen", "Basis prep", "Minimale prep", "Geen prep"]
      },
      {
        question: "Ken je de belangrijkste levels, events en catalysts voor vandaag?",
        responses: ["Volledig op de hoogte", "Grotendeels bekend", "Basis kennis", "Minimaal bekend", "Geen idee"]
      }
    ]
  },
  psychologie: {
    name: "Psychologie",
    questions: [
      {
        question: "Ben je vandaag een leeuw die wacht op zijn prooi, of ren je achter alles aan?",
        responses: ["Volledige leeuw", "Meestal geduldig", "Mix van beide", "Vaak jagen", "Altijd jagen"]
      },
      {
        question: "Hoe is je emotionele staat? Voel je je sloppy, moe of ontevreden?",
        responses: ["Scherp en gefocust", "Goed", "Redelijk", "Matig", "Sloppy/moe/ontevreden"]
      }
    ]
  },
  discipline: {
    name: "Discipline",
    questions: [
      {
        question: "Heb je je vooraf bepaalde regels en entry criteria gevolgd?",
        responses: ["Volledig gevolgd", "Grotendeels gevolgd", "Gedeeltelijk", "Afgeweken", "Totaal genegeerd"]
      },
      {
        question: "Ben je gestopt na je target of heb je doorgegaan uit hebzucht?",
        responses: ["Gestopt bij target", "1 extra trade", "Enkele extra", "Veel extra", "Compleet doorgegaan"]
      }
    ]
  }
};

// User sessions to track current questions
const userSessions = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, callback_query } = req.body;
    
    // Handle callback queries (button presses)
    if (callback_query) {
      await handleCallback(callback_query);
      return res.status(200).json({ ok: true });
    }

    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const messageText = message.text;
    const userId = message.from.id;

    console.log(`Message from ${userId}: ${messageText}`);

    // Bot commands
    if (messageText.startsWith('/start')) {
      await sendWelcomeMessage(chatId);
    } 
    else if (messageText.startsWith('/menu')) {
      await sendCategoryMenu(chatId);
    }
    else if (messageText.startsWith('/morning')) {
      await askRandomQuestion(chatId, 'morning');
    }
    else if (messageText.startsWith('/afternoon')) {
      await askRandomQuestion(chatId, 'afternoon');
    }
    else if (messageText.startsWith('/evening')) {
      await askRandomQuestion(chatId, 'evening');
    }
    else if (messageText.startsWith('/random')) {
      await askRandomQuestion(chatId, 'random');
    }
    else if (messageText.startsWith('/test')) {
      await testNotionAPI(chatId);
    }
    else {
      // Handle answers to questions
      await handleAnswer(chatId, messageText, userId);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendWelcomeMessage(chatId) {
  const welcomeText = 
    "🦁 **Welkom bij je Intelligent Trading Journal Bot!**\n\n" +
    "Ik help je een beter trader te worden door gerichte vragen te stellen over:\n\n" +
    "🎯 **Motivatie** - Waarom trade je?\n" +
    "📋 **Voorbereiding** - Ben je klaar voor de markt?\n" +
    "🧠 **Psychologie** - Ben je een leeuw of ren je achter alles aan?\n" +
    "💪 **Discipline** - Volg je je plan?\n" +
    "📈 **Performance** - Hoe waren je trades?\n" +
    "🔍 **Reflectie** - Wat heb je geleerd?\n" +
    "En nog veel meer categorieën!\n\n" +
    "**Commands:**\n" +
    "/menu - Kies een specifieke categorie\n" +
    "/morning - Ochtend vraag\n" +
    "/afternoon - Middag vraag\n" +
    "/evening - Avond vraag\n" +
    "/random - Willekeurige vraag\n\n" +
    "**Ready om een betere trader te worden?** 🚀";

  await sendMessage(chatId, welcomeText);
}

async function sendCategoryMenu(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "🎯 Motivatie", callback_data: "cat_motivatie" },
        { text: "📋 Doelen", callback_data: "cat_doelen" }
      ],
      [
        { text: "📊 Voorbereiding", callback_data: "cat_voorbereiding" },
        { text: "📈 Marktanalyse", callback_data: "cat_marktanalyse" }
      ],
      [
        { text: "🧠 Psychologie", callback_data: "cat_psychologie" },
        { text: "💪 Discipline", callback_data: "cat_discipline" }
      ],
      [
        { text: "📊 Performance", callback_data: "cat_performance" },
        { text: "⚠️ Risico", callback_data: "cat_risico" }
      ],
      [
        { text: "🔍 Reflectie", callback_data: "cat_reflectie" },
        { text: "💡 Inzichten", callback_data: "cat_inzichten" }
      ],
      [
        { text: "🌱 Ontwikkeling", callback_data: "cat_persoonlijkeOntwikkeling" }
      ],
      [
        { text: "🎲 Random vraag", callback_data: "cat_random" }
      ]
    ]
  };

  await sendMessage(chatId, "Kies een categorie voor een gerichte vraag:", keyboard);
}

async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith('cat_')) {
    const category = data.replace('cat_', '');
    if (category === 'random') {
      await askRandomQuestion(chatId, 'random');
    } else {
      await askCategoryQuestion(chatId, category);
    }
  } else if (data.startsWith('resp_')) {
    await handleResponseButton(callbackQuery);
  }

  // Answer the callback query
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });
}

async function askRandomQuestion(chatId, timeContext) {
  let selectedCategories;
  
  if (timeContext === 'morning') {
    selectedCategories = ['motivatie', 'doelen', 'voorbereiding'];
  } else if (timeContext === 'afternoon') {
    selectedCategories = ['psychologie', 'discipline', 'marktanalyse'];
  } else if (timeContext === 'evening') {
    selectedCategories = ['performance', 'reflectie', 'inzichten'];
  } else {
    selectedCategories = Object.keys(QUESTION_CATEGORIES);
  }

  const randomCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
  await askCategoryQuestion(chatId, randomCategory);
}

async function askCategoryQuestion(chatId, category) {
  const categoryData = QUESTION_CATEGORIES[category];
  if (!categoryData) {
    await sendMessage(chatId, "Sorry, die categorie ken ik niet!");
    return;
  }

  const randomQuestion = categoryData.questions[Math.floor(Math.random() * categoryData.questions.length)];
  
  // Store the question context for the user
  userSessions.set(chatId, {
    category: category,
    question: randomQuestion.question,
    responses: randomQuestion.responses,
    timestamp: Date.now()
  });

  // Create response buttons
  const keyboard = {
    inline_keyboard: randomQuestion.responses.map(response => [{
      text: response,
      callback_data: `resp_${response.replace(/\s+/g, '_').substring(0, 30)}`
    }])
  };

  const categoryIcon = getCategoryIcon(category);
  const message = `${categoryIcon} **${categoryData.name}**\n\n${randomQuestion.question}\n\n💬 Kies een optie of typ je eigen antwoord:`;

  await sendMessage(chatId, message, keyboard);
}

async function handleResponseButton(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const responseText = callbackQuery.data.replace('resp_', '').replace(/_/g, ' ');
  
  const session = userSessions.get(chatId);
  if (!session) {
    await sendMessage(chatId, "Sorry, ik kan deze response niet verwerken. Probeer een nieuwe vraag!");
    return;
  }

  await saveToNotion(chatId, session.question, responseText, session.category, responseText);
}

async function handleAnswer(chatId, answer, userId) {
  const session = userSessions.get(chatId);
  
  if (!session) {
    await sendMessage(chatId, 
      "🤔 Ik weet niet zeker op welke vraag je antwoordt.\n\n" +
      "Gebruik /menu om een nieuwe vraag te krijgen!"
    );
    return;
  }

  if (answer.length < 5) {
    await sendMessage(chatId, 
      "🤔 Je antwoord lijkt wat kort. Kun je wat meer details geven?\n" +
      "Dit helpt je later bij het analyseren van je trading patronen!"
    );
    return;
  }

  await saveToNotion(chatId, session.question, answer, session.category, null);
}

async function saveToNotion(chatId, question, answer, category, responseType) {
  try {
    const timeOfDay = getTimeOfDay();
    
    const response = await fetch(`${API_URL}/api/trading-journal-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        answer: answer,
        category: QUESTION_CATEGORIES[category]?.name || category,
        response_type: responseType,
        time_of_day: timeOfDay
      })
    });

    const responseData = await response.json();

    if (response.ok) {
      // Clear the session
      userSessions.delete(chatId);
      
      const categoryIcon = getCategoryIcon(category);
      await sendMessage(chatId, 
        `✅ ${categoryIcon} Je **${QUESTION_CATEGORIES[category]?.name}** antwoord is opgeslagen!\n\n` +
        "🔥 Consistent journaling verbetert je trading performance!\n\n" +
        "Gebruik /menu voor een nieuwe vraag of /random voor een willekeurige vraag."
      );
    } else {
      throw new Error(`API error: ${responseData.error}`);
    }

  } catch (error) {
    console.error('Error saving to Notion:', error);
    await sendMessage(chatId, 
      "❌ Er ging iets mis bij het opslaan: " + error.message + "\n\n" +
      "Probeer het later nog eens. Je antwoord was: " + answer.substring(0, 100) + "..."
    );
  }
}

async function testNotionAPI(chatId) {
  try {
    const response = await fetch(`${API_URL}/api/trading-journal-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'Test van Enhanced Telegram Bot',
        answer: 'Dit is een test van het nieuwe intelligente systeem!',
        category: 'Test',
        time_of_day: 'Test'
      })
    });

    if (response.ok) {
      await sendMessage(chatId, "✅ Test succesvol! Enhanced bot is verbonden met Notion.");
    } else {
      await sendMessage(chatId, "❌ Test gefaald. Check je API configuratie.");
    }
  } catch (error) {
    await sendMessage(chatId, "❌ Kan API niet bereiken: " + error.message);
  }
}

async function sendMessage(chatId, text, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to send message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function getCategoryIcon(category) {
  const icons = {
    motivatie: '🎯',
    doelen: '📋',
    voorbereiding: '📊',
    marktanalyse: '📈',
    strategie: '🎲',
    psychologie: '🧠',
    discipline: '💪',
    performance: '📊',
    risico: '⚠️',
    reflectie: '🔍',
    persoonlijkeOntwikkeling: '🌱',
    inzichten: '💡'
  };
  return icons[category] || '❓';
}
