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
  marktanalyse: {
    name: "Marktanalyse",
    questions: [
      {
        question: "Wat is de overall market strength en welke sectoren zijn sterk?",
        responses: ["Duidelijk beeld", "Redelijk beeld", "Vaag beeld", "Geen duidelijkheid", "Tegengestelde signalen"]
      },
      {
        question: "Heb je de Best of Breed tickers geïdentificeerd?",
        responses: ["Helder geïdentificeerd", "Redelijk idee", "Enkele kandidaten", "Onduidelijk", "Geen idee"]
      },
      {
        question: "Begrijp je de markt sentiment en je relatie tot 'the herd'?",
        responses: ["Volledig begrip", "Goed begrip", "Basis begrip", "Beperkt begrip", "Geen begrip"]
      }
    ]
  },
  strategie: {
    name: "Strategie",
    questions: [
      {
        question: "Heb je je trading plan 'in steen gebeiteld' voordat je begon?",
        responses: ["Plan in steen", "Duidelijk plan", "Globaal plan", "Vaag plan", "Geen plan"]
      },
      {
        question: "Speel je de trend of probeer je slimmer te zijn dan de markt?",
        responses: ["Volledig trend volgen", "Meestal trend", "Mix", "Vaak tegen trend", "Altijd tegen trend"]
      },
      {
        question: "Focus je op minder tickers (less is more) of spread je te veel?",
        responses: ["Perfecte focus", "Goede focus", "Redelijke focus", "Te verspreid", "Veel te veel tickers"]
      }
    ]
  },
  performance: {
    name: "Performance",
    questions: [
      {
        question: "Wat waren je beste en slechteste trades vandaag?",
        responses: ["Alleen A+ setups", "Goede trades", "Mix", "Enkele slechte", "Veel slechte trades"]
      },
      {
        question: "Hoe was je risk management? Te groot, te klein, of precies goed?",
        responses: ["Perfect gemanaged", "Goed gemanaged", "Redelijk", "Te groot geriskeert", "Roekeloos"]
      },
      {
        question: "Heb je winnaars te vroeg gecut of verliezers te lang aangehouden?",
        responses: ["Perfect timing", "Goed timing", "Redelijk timing", "Te vroeg gecut", "Te lang aangehouden"]
      },
      {
        question: "Wat is je R-multiple vandaag? (totaal resultaat in R)",
        responses: ["3R+", "1-3R", "0-1R", "0 tot -1R", "-1R of slechter"]
      }
    ]
  },
  risico: {
    name: "Risico",
    questions: [
      {
        question: "Heb je je maximum aantal trades per dag gerespecteerd?",
        responses: ["Onder het maximum", "Precies het maximum", "1-2 over", "Significant over", "Veel te veel trades"]
      },
      {
        question: "Was je positionering passend bij de markt volatiliteit?",
        responses: ["Perfect passend", "Goed passend", "Redelijk", "Te groot voor volatiliteit", "Roekeloos groot"]
      },
      {
        question: "Heb je events, numbers en wicks goed ingeschat?",
        responses: ["Perfect ingeschat", "Goed ingeschat", "Redelijk", "Deels gemist", "Volledig verrast"]
      }
    ]
  },
  reflectie: {
    name: "Reflectie",
    questions: [
      {
        question: "Wat is de belangrijkste les die je vandaag hebt geleerd?",
        responses: ["Belangrijke inzichten", "Nuttige lessen", "Enkele lessen", "Minimale lessen", "Geen lessen"]
      },
      {
        question: "Welke trading gewoonte wil je morgen verbeteren?",
        responses: ["Duidelijk verbeterpunt", "Enkele punten", "Vaag idee", "Geen specifiek punt", "Alles moet anders"]
      },
      {
        question: "Ben je trots op je trading gedrag vandaag, los van het resultaat?",
        responses: ["Zeer trots", "Trots", "Redelijk tevreden", "Ontevreden", "Zeer ontevreden"]
      }
    ]
  },
  persoonlijkeOntwikkeling: {
    name: "Persoonlijke Ontwikkeling",
    questions: [
      {
        question: "Heb je vandaag geleefd volgens je waarden? (dankbaar, betekenisvol, authentiek)",
        responses: ["Volledig volgens waarden", "Grotendeels", "Deels", "Minimaal", "Niet volgens waarden"]
      },
      {
        question: "Ben je vandaag 'tijd vergeten' door aandacht voor trading?",
        responses: ["Volledig in flow", "Grotendeels gefocust", "Redelijk gefocust", "Vaak afgeleid", "Constant afgeleid"]
      },
      {
        question: "Heb je balans gehouden tussen trading, family, gezondheid en huishouding?",
        responses: ["Perfecte balans", "Goede balans", "Redelijke balans", "Uit balans", "Volledig uit balans"]
      },
      {
        question: "Wat betekende trading vandaag voor anderen in je leven?",
        responses: ["Positieve impact", "Neutrale impact", "Gemixte impact", "Negatieve impact", "Zeer negatieve impact"]
      }
    ]
  },
  inzichten: {
    name: "Inzichten",
    questions: [
      {
        question: "Welke 'aha-moment' of random inzicht had je vandaag?",
        responses: ["Belangrijk inzicht", "Nuttig inzicht", "Klein inzicht", "Geen bijzonder inzicht", "Verwarrende dag"]
      },
      {
        question: "Wat zou je tegen je beginnende trader-zelf zeggen over vandaag?",
        responses: ["Belangrijke wijsheid", "Nuttige tip", "Kleine tip", "Weinig toe te voegen", "Waarschuwing"]
      },
      {
        question: "Welke trading bias of valkuil heb je vandaag het meest gevoeld?",
        responses: ["Geen bias gevoeld", "Lichte bias maar beheerst", "Merkbare bias", "Sterke bias", "Volledig overmand door bias"]
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
        { text: "🎲 Strategie", callback_data: "cat_strategie" },
        { text: "🧠 Psychologie", callback_data: "cat_psychologie" }
      ],
      [
        { text: "💪 Discipline", callback_data: "cat_discipline" },
        { text: "📊 Performance", callback_data: "cat_performance" }
      ],
      [
        { text: "⚠️ Risico", callback_data: "cat_risico" },
        { text: "🔍 Reflectie", callback_data: "cat_reflectie" }
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
