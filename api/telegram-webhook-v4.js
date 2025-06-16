await saveMediaToNotion(chatId, "Standalone voice note", description, 'media', 'Voice Note', fileInfo, 'media');
    }

  } catch (error) {
    console.error('Error handling voice:', error);
    await sendMessage(chatId, "❌ Er ging iets mis bij het verwerken van je voice note.");
  }
}

async function handleDocumentMessage(chatId, message, userId) {
  try {
    const document = message.document;
    const fileId = document.file_id;
    const fileName = document.file_name || "Document";
    const caption = message.caption || "";
    
    // Get file info from Telegram
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      await sendMessage(chatId, "❌ Kon document informatie niet ophalen.");
      return;
    }

    const session = userSessions.get(chatId);
    const description = `${fileName}${caption ? ' - ' + caption : ''}`;
    
    if (session) {
      // Save document as answer to current question
      await saveMediaToNotion(chatId, session.question, description, session.category, 'Document', fileInfo, session.type);
    } else {
      // Save as standalone media entry
      await saveMediaToNotion(chatId, "Standalone document", description, 'media', 'Document', fileInfo, 'media');
    }

  } catch (error) {
    console.error('Error handling document:', error);
    await sendMessage(chatId, "❌ Er ging iets mis bij het verwerken van je document.");
  }
}

async function handleVideoNoteMessage(chatId, message, userId) {
  try {
    const videoNote = message.video_note;
    const fileId = videoNote.file_id;
    const duration = videoNote.duration;
    
    // Get file info from Telegram
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      await sendMessage(chatId, "❌ Kon video note informatie niet ophalen.");
      return;
    }

    const session = userSessions.get(chatId);
    const description = `Video note (${duration}s)`;
    
    if (session) {
      // Save video note as answer to current question
      await saveMediaToNotion(chatId, session.question, description, session.category, 'Video Note', fileInfo, session.type);
    } else {
      // Save as standalone media entry
      await saveMediaToNotion(chatId, "Standalone video note", description, 'media', 'Video Note', fileInfo, 'media');
    }

  } catch (error) {
    console.error('Error handling video note:', error);
    await sendMessage(chatId, "❌ Er ging iets mis bij het verwerken van je video note.");
  }
}

async function getFileInfo(fileId) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const data = await response.json();
    
    if (data.ok) {
      return {
        file_path: data.result.file_path,
        file_size: data.result.file_size,
        download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
}

async function saveMediaToNotion(chatId, question, description, category, mediaType, fileInfo, questionType) {
  try {
    const timeOfDay = getTimeOfDay();
    const timestamp = new Date().toISOString();
    
    const response = await fetch(`${API_URL}/api/trading-journal-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        answer: description,
        category: QUESTION_CATEGORIES[category]?.name || category,
        response_type: 'Media',
        time_of_day: timeOfDay,
        question_type: questionType,
        media_type: mediaType,
        media_description: description,
        media_url: fileInfo.download_url,
        media_file_size: fileInfo.file_size,
        media_timestamp: timestamp
      })
    });

    const responseData = await response.json();

    if (response.ok) {
      // Clear the session if it was answering a question
      if (userSessions.has(chatId)) {
        userSessions.delete(chatId);
      }
      
      const categoryIcon = getCategoryIcon(category.toLowerCase());
      
      await sendMessage(chatId, 
        `✅ ${categoryIcon} Je **${mediaType}** is opgeslagen!\n\n` +
        `📁 **Beschrijving:** ${description}\n` +
        `📊 **Categorie:** ${QUESTION_CATEGORIES[category]?.name || category}\n` +
        `📅 **Timestamp:** ${new Date().toLocaleString('nl-NL')}\n\n` +
        "🦁 Media toevoegen maakt je journal nog rijker!\n\n" +
        "Gebruik /menu voor een nieuwe vraag."
      );
    } else {
      throw new Error(`API error: ${responseData.error}`);
    }

  } catch (error) {
    console.error('Error saving media to Notion:', error);
    await sendMessage(chatId, 
      "❌ Er ging iets mis bij het opslaan van je media: " + error.message
    );
  }
}

async function sendWelcomeMessage(chatId) {
  const welcomeText = 
    "🦁 **Welkom bij je Complete Trading Journal Bot v4!**\n\n" +
    "Ik help je een beter trader te worden door gerichte vragen te stellen over:\n\n" +
    "🎯 **Motivatie** - Waarom trade je?\n" +
    "📋 **Doelen** - Wat wil je bereiken?\n" +
    "📊 **Voorbereiding** - Ben je klaar voor de markt?\n" +
    "📈 **Marktanalyse** - B.O.B., strength, sentiment\n" +
    "🎲 **Strategie** - Plan in steen, KISS, trend\n" +
    "🧠 **Psychologie** - Leeuw-modus, Wappie Willem\n" +
    "💪 **Discipline** - Regels, 4R+, dopamine delay\n" +
    "📊 **Performance** - R/R, management, scores\n" +
    "⚠️ **Risico** - Exposure, psychologische risico's\n" +
    "🔍 **Reflectie** - Lessen, groei, patronen\n" +
    "🌱 **Ontwikkeling** - Waarden, balans, groei\n" +
    "💡 **Inzichten** - Aha-momenten + trading memo's\n\n" +
    "📸 **NIEUW: Media Support!**\n" +
    "• Stuur foto's/screenshots van trades\n" +
    "• Voice notes voor snelle reflecties\n" +
    "• Documenten en video notes\n\n" +
    "**Commands:**\n" +
    "/menu - Kies een specifieke categorie\n" +
    "/media - Media instructies\n" +
    "/morning - Ochtend vraag\n" +
    "/afternoon - Middag vraag\n" +
    "/evening - Avond vraag\n" +
    "/random - Willekeurige vraag\n\n" +
    "**Ready om Today A King te zijn?** 🦁🚀";

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
        { text: "🌱 Ontwikkeling", callback_data: "cat_persoonlijkeOntwikkeling" },
        { text: "💡 Inzichten", callback_data: "cat_inzichten" }
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
    selectedCategories = ['motivatie', 'doelen', 'voorbereiding', 'marktanalyse', 'strategie', 'psychologie', 'discipline', 'risico'];
  } else if (timeContext === 'afternoon') {
    selectedCategories = ['marktanalyse', 'strategie', 'discipline'];
  } else if (timeContext === 'evening') {
    selectedCategories = ['performance', 'reflectie', 'persoonlijkeOntwikkeling', 'inzichten'];
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
  
  // Store the question context for the user (30 minute session)
  userSessions.set(chatId, {
    category: category,
    question: randomQuestion.question,
    responses: randomQuestion.responses,
    type: randomQuestion.type,
    timestamp: Date.now()
  });

  // Clear session after 30 minutes
  setTimeout(() => {
    if (userSessions.has(chatId)) {
      const session = userSessions.get(chatId);
      if (Date.now() - session.timestamp >= 30 * 60 * 1000) {
        userSessions.delete(chatId);
      }
    }
  }, 30 * 60 * 1000);

  const categoryIcon = getCategoryIcon(category);
  
  // Handle different question types
  if (randomQuestion.type === 'open') {
    // Open question - no buttons
    const message = `${categoryIcon} **${categoryData.name}**\n\n${randomQuestion.question}\n\n💬 Typ je antwoord hieronder of stuur media (foto/voice/document):`;
    await sendMessage(chatId, message);
    
  } else if (randomQuestion.type === 'memo') {
    // Memo question - single checkbox
    const keyboard = {
      inline_keyboard: [[{
        text: randomQuestion.responses[0],
        callback_data: `resp_memo_acknowledged`
      }]]
    };
    const message = `${categoryIcon} **${categoryData.name}**\n\n📝 **${randomQuestion.question}**\n\nKlik om te bevestigen:`;
    await sendMessage(chatId, message, keyboard);
    
  } else {
    // Multiple choice question - create response buttons
    const keyboard = {
      inline_keyboard: randomQuestion.responses.map(response => [{
        text: response,
        callback_data: `resp_${response.replace(/\s+/g, '_').replace(/[^\w]/g, '').substring(0, 30)}`
      }])
    };
    const message = `${categoryIcon} **${categoryData.name}**\n\n${randomQuestion.question}\n\n💬 Kies een optie, typ je eigen antwoord, of stuur media:`;
    await sendMessage(chatId, message, keyboard);
  }
}

async function handleResponseButton(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const responseText = callbackQuery.data.replace('resp_', '').replace(/_/g, ' ');
  
  const session = userSessions.get(chatId);
  if (!session) {
    // Smart fallback for expired sessions
    await sendMessage(chatId, "⏰ Je sessie is verlopen. Hier is een nieuwe vraag!");
    await askRandomQuestion(chatId, 'random');
    return;
  }

  // Handle memo acknowledgments
  if (responseText.startsWith('memo_')) {
    await sendMessage(chatId, 
      `✅ **${session.question}** - Bevestigd!\n\n` +
      "🔥 Keep these trading principles in mind!\n\n" +
      "Gebruik /menu voor een nieuwe vraag."
    );
    userSessions.delete(chatId);
    return;
  }

  await saveToNotion(chatId, session.question, responseText, session.category, responseText, session.type);
}

async function handleAnswer(chatId, answer, userId) {
  const session = userSessions.get(chatId);
  
  if (!session) {
    // Smart fallback for expired sessions
    await sendMessage(chatId, 
      "⏰ Je sessie is verlopen. Hier is een nieuwe vraag!"
    );
    await askRandomQuestion(chatId, 'random');
    return;
  }

  if (answer.length < 5) {
    await sendMessage(chatId, 
      "🤔 Je antwoord lijkt wat kort. Kun je wat meer details geven?\n" +
      "Dit helpt je later bij het analyseren van je trading patronen!"
    );
    return;
  }

  await saveToNotion(chatId, session.question, answer, session.category, null, session.type);
}

async function saveToNotion(chatId, question, answer, category, responseType, questionType) {
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
        time_of_day: timeOfDay,
        question_type: questionType
      })
    });

    const responseData = await response.json();

    if (response.ok) {
      // Clear the session
      userSessions.delete(chatId);
      
      const categoryIcon = getCategoryIcon(category);
      const categoryName = QUESTION_CATEGORIES[category]?.name || category;
      
      await sendMessage(chatId, 
        `✅ ${categoryIcon} Je **${categoryName}** antwoord is opgeslagen!\n\n` +
        "🦁 Consistent journaling maakt je een betere trader!\n\n" +
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

async function sendMediaInstructions(chatId) {
  const instructionsText = 
    "📸 **Media Ondersteuning - v4**\n\n" +
    "Je kunt de volgende media types sturen:\n\n" +
    "📷 **Foto's/Screenshots** - Charts, setups, resultaten\n" +
    "🎙️ **Voice Notes** - Snelle gedachten, reflecties\n" +
    "📄 **Documenten** - Spreadsheets, PDF's, notes\n" +
    "🎥 **Video Notes** - Korte video's\n\n" +
    "**Gebruik:**\n" +
    "• **Tijdens een vraag:** Media wordt gekoppeld aan die vraag\n" +
    "• **Zonder vraag:** Media wordt opgeslagen als standalone entry\n" +
    "• **Caption toevoegen:** Typ tekst bij je media voor context\n\n" +
    "**Praktische voorbeelden:**\n" +
    "• Screenshot van chart → gekoppeld aan Marktanalyse vraag\n" +
    "• Voice note na trade → gekoppeld aan Performance vraag\n" +
    "• Foto van handgeschreven notes → Standalone opslag\n\n" +
    "**Database opslag:**\n" +
    "• Media Type, Beschrijving, URL, Bestandsgrootte\n" +
    "• Timestamp voor chronologische ordening\n" +
    "• Link naar originele vraag/categorie\n\n" +
    "Stuur maar een media bestand om te testen! 🚀";

  await sendMessage(chatId, instructionsText);
}

async function testNotionAPI(chatId) {
  try {
    const response = await fetch(`${API_URL}/api/trading-journal-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'Test van Complete Trading Bot v4 met Media',
        answer: 'Dit is een test van het complete systeem met media support!',
        category: 'Test',
        time_of_day: 'Test',
        question_type: 'multiple_choice'
      })
    });

    if (response.ok) {
      await sendMessage(chatId, "✅ Test succesvol! Complete bot v4 met media support is verbonden met Notion.");
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
    inzichten: '💡',
    media: '📁'
  };
  return icons[category] || '❓';
}// api/telegram-webhook-v4.js - Complete Trading Journal Bot met Media Support
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = 'https://tradingbot-tee-aa.vercel.app';

// Complete fine-tuned question system - alle 12 categorieën
const QUESTION_CATEGORIES = {
  motivatie: {
    name: "Motivatie",
    questions: [
      {
        question: "Waarom doe je dit? Familie onderhouden, toekomst opbouwen, Thea trots maken?",
        responses: ["Familie onderhouden", "Toekomst opbouwen", "Thea trots maken", "Omdat ik het kan", "Mega interessant"],
        type: "multiple_choice"
      },
      {
        question: "Trade je omdat je het kunt, of omdat het moet?",
        responses: ["Omdat ik het kan", "Omdat het moet", "Mix van beide"],
        type: "multiple_choice"
      },
      {
        question: "Voel je nog steeds dat trading mega interessant is, of is het routine geworden?",
        responses: ["Mega interessant", "Redelijk interessant", "Routine geworden", "Saai geworden"],
        type: "multiple_choice"
      },
      {
        question: "Trade je vandaag vanuit je echte drijfveren of uit verveling/gewoonte?",
        responses: ["Echte drijfveren", "Verveling", "Gewoonte", "Mix"],
        type: "multiple_choice"
      },
      {
        question: "Voor wat ben je vandaag het meest dankbaar?",
        responses: null,
        type: "open"
      }
    ]
  },

  doelen: {
    name: "Doelen",
    questions: [
      {
        question: "Wat zijn je concrete doelen voor vandaag? (R targets, max trades, etc.)",
        responses: ["Helder gedefinieerd", "Globaal idee", "Vaag", "Geen specifieke doelen", "Conflicterende doelen"],
        type: "multiple_choice"
      },
      {
        question: "Heb je je 4R doel helder voor ogen vandaag?",
        responses: ["Heel helder", "Redelijk helder", "Vaag", "Vergeten"],
        type: "multiple_choice"
      },
      {
        question: "Brengt trading je dichter bij je parttime-werk doel?",
        responses: ["Ja, duidelijk", "Een beetje", "Niet echt", "Verder weg"],
        type: "multiple_choice"
      },
      {
        question: "Op welk vlak ga je vandaag 1% groeien? (trading, family, gezondheid, mindset)",
        responses: ["Trading", "Family", "Gezondheid", "Mindset", "Meerdere vlakken"],
        type: "multiple_choice"
      },
      {
        question: "Wat is je doel voor family time vandaag?",
        responses: null,
        type: "open"
      }
    ]
  },

  voorbereiding: {
    name: "Voorbereiding",
    questions: [
      {
        question: "Heb je alle prep sources gechecked? (Discord, X, TradingView, ForexFactory)",
        responses: ["Alles volledig", "Meeste bronnen", "Basis prep", "Minimale prep", "Geen prep"],
        type: "multiple_choice"
      },
      {
        question: "Ken je de belangrijkste levels, events en catalysts voor vandaag?",
        responses: ["Volledig op de hoogte", "Grotendeels bekend", "Basis kennis", "Minimaal bekend", "Geen idee"],
        type: "multiple_choice"
      },
      {
        question: "Heb je je weekend planning uitgevoerd? (TF selectie, tickers opschonen, sector analyse)",
        responses: ["Volledig uitgevoerd", "Grotendeels klaar", "Deels gedaan", "Minimaal", "Niet gedaan"],
        type: "multiple_choice"
      },
      {
        question: "Is je trading workspace optimaal ingericht? (Computer only, alerts ready, etc.)",
        responses: ["Perfect setup", "Goed setup", "Basis setup", "Suboptimaal", "Chaotisch"],
        type: "multiple_choice"
      },
      {
        question: "Hoe is je emotionele staat en relatie tot 'the herd' vandaag?",
        responses: ["Scherp en onafhankelijk", "Goed", "Redelijk", "Beïnvloed door herd", "Emotioneel"],
        type: "multiple_choice"
      },
      {
        question: "Ben je relaxed en emotieloos, of voel je spanning/druk?",
        responses: ["Relaxed en emotieloos", "Redelijk relaxed", "Lichte spanning", "Veel spanning", "Veel druk"],
        type: "multiple_choice"
      },
      {
        question: "Heb je Kaz's prep, sentiment en levels bestudeerd?",
        responses: ["Volledig bestudeerd", "Grotendeels", "Basis", "Minimaal", "Niet bekeken"],
        type: "multiple_choice"
      },
      {
        question: "Ken je de numbers/catalysts van vandaag en gisteren met overnight action?",
        responses: ["Volledig bekend", "Grotendeels", "Basis kennis", "Minimaal", "Geen idee"],
        type: "multiple_choice"
      },
      {
        question: "Heb je je dagplanning gemaakt? (welke tickers, welke TF, wanneer tijd)",
        responses: ["Volledig gepland", "Grotendeels", "Basis plan", "Minimaal", "Geen planning"],
        type: "multiple_choice"
      },
      {
        question: "Heb je je communicatie thuis geregeld voor trading tijd?",
        responses: ["Volledig geregeld", "Grotendeels", "Basis afspraken", "Minimaal", "Niet besproken"],
        type: "multiple_choice"
      },
      {
        question: "Heb je gesport, gedoucht en Wim Hof gedaan?",
        responses: ["Alles gedaan", "2 van 3", "1 van 3", "Niets gedaan"],
        type: "multiple_choice"
      },
      {
        question: "Ben je mechanisch ingesteld of voel je je sloppy/moe/ontevreden?",
        responses: ["Mechanisch ingesteld", "Redelijk mechanisch", "Neutraal", "Beetje sloppy", "Sloppy/moe/ontevreden"],
        type: "multiple_choice"
      },
      {
        question: "Heb je je rules en 'start here' doorgelezen?",
        responses: ["Volledig doorgelezen", "Grotendeels", "Snel doorgenomen", "Niet gelezen"],
        type: "multiple_choice"
      },
      {
        question: "Herinner je je je best statistics en beste trading tijden?",
        responses: ["Helder in gedachten", "Redelijk", "Vaag", "Vergeten"],
        type: "multiple_choice"
      },
      {
        question: "Is je watchlist op orde? (niet te groot aantal tickers)",
        responses: ["Perfect gefocust", "Goed aantal", "Redelijk", "Te veel tickers", "Veel te veel - prep niet af"],
        type: "multiple_choice"
      }
    ]
  },

  marktanalyse: {
    name: "Marktanalyse",
    questions: [
      {
        question: "Wat is de overall market strength en welke sectoren zijn sterk?",
        responses: ["Duidelijk beeld", "Redelijk beeld", "Vaag beeld", "Geen duidelijkheid", "Tegengestelde signalen"],
        type: "multiple_choice"
      },
      {
        question: "Welke specifieke B.O.B. tickers zie je vandaag?",
        responses: null,
        type: "open"
      },
      {
        question: "Is SPY/QQQ sterk genoeg om MNQ te spelen, of zie je betere liquid stocks?",
        responses: ["MNQ spelen", "Betere liquid stocks", "Beide goed", "Beide slecht"],
        type: "multiple_choice"
      },
      {
        question: "Hoe is de volatiliteit vandaag?",
        responses: ["Opgaand, meer dan indexen omlaag gaan", "Neergaand, meer dan indexen omhoog gaan", "Approaching significant level", "Extended", "Ranging"],
        type: "multiple_choice"
      },
      {
        question: "Zijn de flags clean of wordt alles gelijk uitgestopt?",
        responses: ["Clean", "Alles uitgestopt", "Nog in range", "Free and clear"],
        type: "multiple_choice"
      },
      {
        question: "Is de markt 'te spelen' vandaag?",
        responses: ["Ja", "Nee", "Patience", "In en out", "Hold gedeelte"],
        type: "multiple_choice"
      },
      {
        question: "Begrijp je de markt sentiment en je relatie tot 'the herd'?",
        responses: ["Volledig begrip", "Goed begrip", "Basis begrip", "Beperkt begrip", "Geen begrip"],
        type: "multiple_choice"
      },
      {
        question: "Zijn mensen mindfucked vandaag?",
        responses: ["2b geweest, range stopped out", "Hoge volatiliteit geweest", "Crazy timeline"],
        type: "multiple_choice"
      }
    ]
  },

  strategie: {
    name: "Strategie",
    questions: [
      {
        question: "Heb je je trading plan 'in steen gebeiteld' voordat je begon?",
        responses: ["Plan in steen", "Duidelijk plan", "Globaal plan", "Vaag plan", "Geen plan"],
        type: "multiple_choice"
      },
      {
        question: "Speel je de trend of probeer je slimmer te zijn dan de markt?",
        responses: ["Volledig trend volgen", "Meestal trend", "Mix", "Vaak tegen trend", "Altijd tegen trend"],
        type: "multiple_choice"
      },
      {
        question: "Focus je op minder tickers (less is more) of spread je te veel?",
        responses: ["Perfecte focus", "Goede focus", "Redelijke focus", "Te verspreid", "Veel te veel tickers"],
        type: "multiple_choice"
      },
      {
        question: "Wacht je op je trigger of ga je te vroeg in?",
        responses: ["Wacht op trigger", "Ben te vroeg"],
        type: "multiple_choice"
      },
      {
        question: "Chase je price of laat je het naar je toe komen?",
        responses: ["Chase price", "Laat het komen"],
        type: "multiple_choice"
      },
      {
        question: "Hou je het KISS (Keep It Simple) of maak je het te complex?",
        responses: ["Keep It Simple", "Maak het complex"],
        type: "multiple_choice"
      },
      {
        question: "Speel je de Best of Breed tickers of ga je voor zwakkere opties?",
        responses: ["Best of Breed", "Zwakkere opties", "Bodemvissen"],
        type: "multiple_choice"
      },
      {
        question: "Heb je geplanned voor beide scenario's (omhoog/omlaag)?",
        responses: ["Beide scenarios", "Geen plan voor beide"],
        type: "multiple_choice"
      },
      {
        question: "Ben je mechanisch je plan aan het volgen of improviseer je?",
        responses: ["Mechanisch volgen", "Improviseer"],
        type: "multiple_choice"
      },
      {
        question: "Respecteer je je box levels of trade je daar doorheen?",
        responses: ["Respecteer box", "Trade erdoorheen"],
        type: "multiple_choice"
      }
    ]
  },

  psychologie: {
    name: "Psychologie",
    questions: [
      {
        question: "Hoe is je emotionele staat? Voel je je sloppy, moe of ontevreden?",
        responses: ["Scherp en gefocust", "Goed", "Redelijk", "Matig", "Sloppy/moe/ontevreden"],
        type: "multiple_choice"
      },
      {
        question: "Hoe ging het gisteren? Ben je nog bezig met winst/verlies van gisteren?",
        responses: ["Volledig los van gisteren", "Grotendeels los", "Beetje bezig", "Nog bezig", "Volledig bezig met gisteren"],
        type: "multiple_choice"
      },
      {
        question: "Voel je vandaag druk om te presteren of ben je relaxed?",
        responses: ["Volledig relaxed", "Redelijk relaxed", "Beetje druk", "Veel druk", "Extreme druk"],
        type: "multiple_choice"
      },
      {
        question: "Ben je mentaal klaar om 'nee' te zeggen tegen slechte setups?",
        responses: ["Volledig klaar", "Redelijk klaar", "Twijfelachtig", "Waarschijnlijk niet", "Niet klaar"],
        type: "multiple_choice"
      },
      {
        question: "Sta je open voor wat de markt aanbiedt of heb je verwachtingen?",
        responses: ["Volledig open", "Redelijk open", "Lichte verwachtingen", "Sterke verwachtingen", "Gefixeerd op scenario"],
        type: "multiple_choice"
      },
      {
        question: "Ben je vandaag in leeuw-modus of voel je jacht-energie?",
        responses: ["Volledige leeuw-modus", "Meestal leeuw", "Mix", "Beetje jacht-energie", "Volledige jacht-modus"],
        type: "multiple_choice"
      },
      {
        question: "Heb je je 'Wappie Willem' triggers onder controle?",
        responses: ["Volledig onder controle", "Redelijk", "Twijfelachtig", "Risico aanwezig", "Niet onder controle"],
        type: "multiple_choice"
      }
    ]
  },

  discipline: {
    name: "Discipline",
    questions: [
      {
        question: "Heb je je vooraf bepaalde regels en entry criteria gevolgd?",
        responses: ["Volledig gevolgd", "Grotendeels gevolgd", "Gedeeltelijk", "Afgeweken", "Totaal genegeerd"],
        type: "multiple_choice"
      },
      {
        question: "Ben je gestopt na je target of heb je doorgegaan uit hebzucht?",
        responses: ["Gestopt bij target", "1 extra trade", "Enkele extra", "Veel extra", "Compleet doorgegaan"],
        type: "multiple_choice"
      },
      {
        question: "Heb je de '4R+ zoom out' regel toegepast?",
        responses: ["Perfect toegepast", "Toegepast", "Deels toegepast", "Vergeten toe te passen", "Bewust genegeerd"],
        type: "multiple_choice"
      },
      {
        question: "Na een stopout: ben je uitgestapt of heb je revenge trades gemaakt?",
        responses: ["Geen stopouts", "Uitgestapt en geanalyseerd", "Kort gestopt", "Enkele revenge trades", "Volledig revenge trading"],
        type: "multiple_choice"
      },
      {
        question: "INSTRUCTIE: Leg je telefoon 10 minuten weg. Gebruik adem of journaling als 'dopamine delay'.",
        responses: ["Gedaan", "Niet gedaan", "Gedeeltelijk gedaan"],
        type: "multiple_choice"
      },
      {
        question: "INSTRUCTIE: Voer een craving-interruptie uit: 60 sec adem, stretch, schrijf, cold water.",
        responses: ["Gedaan", "Niet gedaan", "Gedeeltelijk gedaan"],
        type: "multiple_choice"
      },
      {
        question: "Trade je zoals de persoon die je wilt zijn?",
        responses: ["Ja", "Nee", "Gedeeltelijk"],
        type: "multiple_choice"
      },
      {
        question: "Heb je een fysieke activiteit, ademhaling of wandeling gedaan in plaats van een dopaminezoekende trade?",
        responses: ["Ja, alternatieve optie gekozen", "Dopamine trade gedaan", "Beide gedaan", "Geen behoefte gehad"],
        type: "multiple_choice"
      },
      {
        question: "Welke oude patronen heb je deze dag/gisteren gehad en welke nieuwe patronen heb je gezien?",
        responses: null,
        type: "open"
      }
    ]
  },

  performance: {
    name: "Performance",
    questions: [
      {
        question: "Wat is je totale R/R voor vandaag?",
        responses: null,
        type: "open"
      },
      {
        question: "Wat is je totale R/R voor deze week?",
        responses: null,
        type: "open"
      },
      {
        question: "Wat is je gemiddelde R/R per trade vandaag?",
        responses: ["2-3", "3-5", "5-7", "7+"],
        type: "multiple_choice"
      },
      {
        question: "Hoe waardeer je je trade management vandaag? (1-5)",
        responses: ["1", "2", "3", "4", "5"],
        type: "multiple_choice"
      },
      {
        question: "Wat is je totale score voor de dag in het algemeen? (alle prioriteiten bekeken)",
        responses: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        type: "multiple_choice"
      },
      {
        question: "Welk timeframe was vandaag het meest succesvol?",
        responses: ["<1min", "5-20min", "40m-2h", "2h+"],
        type: "multiple_choice"
      }
    ]
  },

  risico: {
    name: "Risico",
    questions: [
      {
        question: "Heb je je maximum aantal trades per dag gerespecteerd?",
        responses: ["Onder het maximum", "Precies het maximum", "1-2 over", "Significant over", "Veel te veel trades"],
        type: "multiple_choice"
      },
      {
        question: "Was je positionering passend bij de markt volatiliteit?",
        responses: ["Te groot voor liquiditeit", "Opgeschaald uit frustratie", "Stoploss niet gerespecteerd", "Minder risk genomen dan standaard"],
        type: "multiple_choice"
      },
      {
        question: "Heb je events, numbers en wicks goed ingeschat?",
        responses: ["Perfect ingeschat", "Goed ingeschat", "Redelijk", "Deels gemist", "Wicks weglaten"],
        type: "multiple_choice"
      },
      {
        question: "Hoe is je totale risk exposure vandaag?",
        responses: ["Te weinig", "Goed", "Te veel"],
        type: "multiple_choice"
      },
      {
        question: "Wat is het psychologisch risico? (kans op gokgedrag en afwijken van regels)",
        responses: null,
        type: "open"
      },
      {
        question: "Wat kan er vandaag mis gaan?",
        responses: null,
        type: "open"
      }
    ]
  },

  reflectie: {
    name: "Reflectie",
    questions: [
      {
        question: "Wat is de belangrijkste les die je vandaag hebt geleerd?",
        responses: ["Belangrijke inzichten", "Nuttige lessen", "Enkele lessen", "Minimale lessen", "Geen lessen"],
        type: "multiple_choice"
      },
      {
        question: "Welke trading gewoonte wil je morgen verbeteren?",
        responses: ["Duidelijk verbeterpunt", "Enkele punten", "Vaag idee", "Geen specifiek punt", "Alles moet anders"],
        type: "multiple_choice"
      },
      {
        question: "Ben je trots op je trading gedrag vandaag, los van het resultaat?",
        responses: ["Zeer trots", "Trots", "Redelijk tevreden", "Ontevreden", "Zeer ontevreden"],
        type: "multiple_choice"
      },
      {
        question: "Ben je vandaag een leeuw die wacht op zijn prooi geweest, of ben je achter alles aan gerend?",
        responses: ["Volledige leeuw", "Meestal geduldig", "Mix van beide", "Vaak jagen", "Altijd jagen"],
        type: "multiple_choice"
      },
      {
        question: "Ben je mechanisch gebleven of heb je op geluk/gevoel gehandeld?",
        responses: ["Volledig mechanisch", "Grotendeels mechanisch", "Mix", "Vooral gevoel", "Volledig op gevoel"],
        type: "multiple_choice"
      },
      {
        question: "Heb je FOMO of revenge trading gevoeld/uitgevoerd?",
        responses: ["Geen FOMO/revenge", "Licht gevoel maar niet gehandeld", "Enkele trades", "Meerdere trades", "Volledig FOMO/revenge"],
        type: "multiple_choice"
      },
      {
        question: "Heb je oude patronen gezien vandaag?",
        responses: ["Ja", "Nee"],
        type: "multiple_choice"
      },
      {
        question: "Ben je tevreden met de balans in je prioriteiten voor vandaag? (1-5)",
        responses: ["1", "2", "3", "4", "5"],
        type: "multiple_choice"
      }
    ]
  },

  persoonlijkeOntwikkeling: {
    name: "Persoonlijke Ontwikkeling",
    questions: [
      {
        question: "Ben je vandaag tijd vergeten door volledige aandacht voor iets?",
        responses: ["Ja", "Nee", "Gedeeltelijk"],
        type: "multiple_choice"
      },
      {
        question: "Heb je vandaag gewerkt aan iets waar je echt in gelooft?",
        responses: ["Ja", "Nee", "Gedeeltelijk"],
        type: "multiple_choice"
      },
      {
        question: "Heb je vandaag wat betekend voor anderen?",
        responses: ["Ja", "Nee", "Gedeeltelijk"],
        type: "multiple_choice"
      },
      {
        question: "Ben je vandaag dankbaar geweest?",
        responses: ["Ja", "Nee", "Gedeeltelijk"],
        type: "multiple_choice"
      },
      {
        question: "Heb je vandaag geleefd volgens je eigen waarden?",
        responses: ["Ja", "Nee", "Gedeeltelijk"],
        type: "multiple_choice"
      },
      {
        question: "Ben je vandaag gefocust gebleven zonder afleiding?",
        responses: ["Ja", "Nee", "Gedeeltelijk"],
        type: "multiple_choice"
      },
      {
        question: "Ben je vandaag 1% gegroeid?",
        responses: ["Ja", "Nee"],
        type: "multiple_choice"
      },
      {
        question: "Hoeveel tijd heb je besteed aan ontwikkeling op alternatieve vakgebieden? (AI, survivalskills, meditatie, passief inkomen)",
        responses: ["Weinig", "Gemiddeld", "Veel tijd aan besteed"],
        type: "multiple_choice"
      }
    ]
  },

  inzichten: {
    name: "Inzichten",
    questions: [
      {
        question: "Welke 'aha-moment' of random inzicht had je vandaag?",
        responses: null,
        type: "open"
      },
      {
        question: "Welke trading bias of valkuil heb je vandaag het meest gevoeld?",
        responses: null,
        type: "open"
      },
      {
        question: "Today A King... 🦁",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "K.I.S.S.",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "Play B.O.B.",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "Play the strength",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "Play the trend",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "Less is more",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "Price is people",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "Don't chase price, let it come to you",
        responses: ["✅"],
        type: "memo"
      },
      {
        question: "Stick to the plan",
        responses: ["✅"],
        type: "memo"
      }
    ]
  }
};

// User sessions - extended to 30 minutes
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

    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userId = message.from.id;

    console.log(`Message from ${userId}:`, message);

    // Handle different message types
    if (message.text) {
      await handleTextMessage(chatId, message.text, userId);
    } else if (message.photo) {
      await handlePhotoMessage(chatId, message, userId);
    } else if (message.voice) {
      await handleVoiceMessage(chatId, message, userId);
    } else if (message.document) {
      await handleDocumentMessage(chatId, message, userId);
    } else if (message.video_note) {
      await handleVideoNoteMessage(chatId, message, userId);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleTextMessage(chatId, messageText, userId) {
  // Existing text message handling
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
  else if (messageText.startsWith('/media')) {
    await sendMediaInstructions(chatId);
  }
  else if (messageText.startsWith('/test')) {
    await testNotionAPI(chatId);
  }
  else {
    // Handle text answers to questions
    await handleAnswer(chatId, messageText, userId);
  }
}

async function handlePhotoMessage(chatId, message, userId) {
  try {
    const photo = message.photo[message.photo.length - 1]; // Get highest resolution
    const fileId = photo.file_id;
    const caption = message.caption || "";
    
    // Get file info from Telegram
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      await sendMessage(chatId, "❌ Kon foto informatie niet ophalen.");
      return;
    }

    const session = userSessions.get(chatId);
    
    if (session) {
      // Save photo as answer to current question
      await saveMediaToNotion(chatId, session.question, caption, session.category, 'Foto', fileInfo, session.type);
    } else {
      // Save as standalone media entry
      await saveMediaToNotion(chatId, "Standalone foto upload", caption, 'media', 'Foto', fileInfo, 'media');
    }

  } catch (error) {
    console.error('Error handling photo:', error);
    await sendMessage(chatId, "❌ Er ging iets mis bij het verwerken van je foto.");
  }
}

async function handleVoiceMessage(chatId, message, userId) {
  try {
    const voice = message.voice;
    const fileId = voice.file_id;
    const duration = voice.duration;
    
    // Get file info from Telegram
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      await sendMessage(chatId, "❌ Kon voice note informatie niet ophalen.");
      return;
    }

    const session = userSessions.get(chatId);
    const description = `Voice note (${duration}s)`;
    
    if (session) {
      // Save voice as answer to current question
      await saveMediaToNotion(chatId, session.question, description, session.category, 'Voice Note', fileInfo, session.type);
    } else {
      // Save as standalone media entry
      await saveMediaToNotion(chatId, "Standalon
