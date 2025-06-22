// api/telegram-webhook-v5.js
// Complete Trading Bot met Media Support
// Alle 85+ fine-tuned vragen + foto's, voice notes, documenten

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = 'https://tradingbot-tee-aa.vercel.app';

// Session management
const userSessions = new Map();

// Smart Question Rotation - Track asked questions
const askedQuestions = new Map(); // chatId -> Set van gestelde vragen
const categoryProgress = new Map(); // chatId -> object met progress per categorie

// 30 minute session timeout
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Morning categories (8:30)
const MORNING_CATEGORIES = ['motivatie', 'doelen', 'voorbereiding', 'marktanalyse', 'strategie', 'psychologie', 'discipline', 'risico'];

// Evening categories (20:45)  
const EVENING_CATEGORIES = ['performance', 'inzichten', 'reflectie', 'ontwikkeling'];

// Alle 85+ fine-tuned vragen (same as v4-fixed)
const QUESTION_CATEGORIES = {
  motivatie: [
    {
      question: "Waarom doe je dit? Familie onderhouden, toekomst opbouwen, Thea trots maken?",
      type: "multiple_choice",
      options: ["Familie onderhouden", "Toekomst opbouwen", "Thea trots maken", "Omdat ik het kan", "Mega interessant"]
    },
    {
      question: "Is er een goede reden om vandaag te traden?",
      type: "multiple_choice", 
      options: ["Ja, duidelijke reden", "Ja, redelijke reden", "Onduidelijk", "Eigenlijk niet", "Nee, geen reden"]
    },
    {
      question: "Voel je nog steeds dat trading mega interessant is, of is het routine geworden?",
      type: "multiple_choice",
      options: ["Mega interessant", "Interessant", "Routine geworden", "Saai geworden", "Verveeld"]
    },
    {
      question: "Trade je vandaag vanuit je echte drijfveren of uit verveling/gewoonte?",
      type: "multiple_choice",
      options: ["Echte drijfveren", "Verveling", "Gewoonte", "Verslaving", "Mix"]
    },
    {
      question: "Voor wat ben je vandaag het meest dankbaar?",
      type: "open",
      options: []
    }
  ],

  doelen: [
    {
      question: "Wat zijn je concrete doelen voor vandaag? (R targets, max trades, etc.)",
      type: "multiple_choice",
      options: ["Helder gedefinieerd", "Globaal idee", "Vaag", "Geen specifieke doelen", "Conflicterende doelen"]
    },
    {
      question: "Heb je je 4R doel helder voor ogen vandaag?",
      type: "multiple_choice",
      options: ["Ja, zeer helder", "Ja, redelijk", "Vaag", "Nee", "Geen 4R doel"]
    },
    {
      question: "Op welk vlak ga je vandaag 1% groeien? (trading, family, gezondheid, mindset)",
      type: "open",
      options: []
    },
    {
      question: "Wat is je doel voor family time vandaag?",
      type: "open",
      options: []
    }
  ],

  voorbereiding: [
    {
      question: "Heb je alle prep sources gechecked? (Discord, X, TradingView, ForexFactory)",
      type: "multiple_choice",
      options: ["Alles volledig", "Meeste bronnen", "Basis prep", "Minimale prep", "Geen prep"]
    },
    {
      question: "Ken je de belangrijkste levels, events en catalysts voor vandaag?",
      type: "multiple_choice", 
      options: ["Volledig op de hoogte", "Grotendeels bekend", "Basis kennis", "Minimaal bekend", "Geen idee"]
    },
    {
      question: "Hoe is je emotionele staat en relatie tot 'the herd' vandaag?",
      type: "multiple_choice",
      options: ["Excellent staat", "Goede staat", "Redelijk", "Matige staat", "Slechte staat"]
    },
    {
      question: "Heb je gesport, gedoucht en Wim Hof gedaan?",
      type: "multiple_choice",
      options: ["Alles gedaan", "Meeste gedaan", "Basis gedaan", "Weinig gedaan", "Niets gedaan"]
    },
    {
      question: "Is je watchlist op orde? (niet te groot aantal tickers)",
      type: "multiple_choice",
      options: ["Perfect gefocust", "Goed aantal", "Redelijk", "Te veel tickers", "Veel te veel - prep niet af"]
    }
  ],

  marktanalyse: [
    {
      question: "Wat is de overall market strength en welke sectoren zijn sterk?",
      type: "open",
      options: []
    },
    {
      question: "Welke specifieke B.O.B. tickers zie je vandaag?",
      type: "open", 
      options: []
    },
    {
      question: "Hoe is de volatiliteit vandaag?",
      type: "multiple_choice",
      options: ["Opgaand, meer dan indexen omlaag gaan", "Neergaand, meer dan indexen omhoog gaan", "Approaching significant level", "Extended", "Ranging"]
    },
    {
      question: "Zijn de flags clean of wordt alles gelijk uitgestopt?",
      type: "multiple_choice",
      options: ["Clean", "Alles uitgestopt", "Nog in range", "Free and clear"]
    },
    {
      question: "Is de markt 'te spelen' vandaag?",
      type: "multiple_choice",
      options: ["Ja", "Nee", "Patience", "In en uit", "Hold gedeelte"]
    }
  ],

  strategie: [
    {
      question: "Heb je je trading plan 'in steen gebeiteld' voordat je begon?",
      type: "multiple_choice",
      options: ["Plan in steen", "Duidelijk plan", "Globaal plan", "Vaag plan", "Geen plan"]
    },
    {
      question: "Wacht je op je trigger of ga je te vroeg in?",
      type: "multiple_choice",
      options: ["Wacht op trigger", "Ben te vroeg"]
    },
    {
      question: "Chase je price of laat je het naar je toe komen?",
      type: "multiple_choice",
      options: ["Chase price", "Laat het komen"]
    },
    {
      question: "Speel je de Best of Breed tickers of ga je voor zwakkere opties?",
      type: "multiple_choice",
      options: ["Best of Breed", "Zwakkere opties", "Bodemvissen"]
    }
  ],

  psychologie: [
    {
      question: "Hoe is je emotionele staat? Voel je je sloppy, moe of ontevreden?",
      type: "multiple_choice",
      options: ["Scherp en gefocust", "Goed", "Redelijk", "Matig", "Sloppy/moe/ontevreden"]
    },
    {
      question: "Hoe ging het gisteren? Ben je nog bezig met winst/verlies van gisteren?",
      type: "multiple_choice",
      options: ["Helemaal los van gisteren", "Redelijk los", "Beetje bezig", "Nog bezig", "Volledig bezig met gisteren"]
    },
    {
      question: "Ben je vandaag in leeuw-modus of voel je jacht-energie?",
      type: "multiple_choice",
      options: ["Volledig leeuw-modus", "Grotendeels leeuw", "Mix", "Beetje jacht-energie", "Volledig jacht-modus"]
    },
    {
      question: "Heb je je 'Wappie Willem' triggers onder controle?",
      type: "multiple_choice",
      options: ["Volledig onder controle", "Redelijk onder controle", "Gedeeltelijk", "Moeilijk", "Geen controle"]
    }
  ],

  discipline: [
    {
      question: "Heb je je vooraf bepaalde regels en entry criteria gevolgd?",
      type: "multiple_choice",
      options: ["Volledig gevolgd", "Grotendeels gevolgd", "Gedeeltelijk", "Afgeweken", "Totaal genegeerd"]
    },
    {
      question: "INSTRUCTIE: Leg je telefoon 10 minuten weg. Gebruik adem of journaling als 'dopamine delay'.",
      type: "multiple_choice",
      options: ["Gedaan", "Niet gedaan", "Gedeeltelijk gedaan"]
    },
    {
      question: "Trade je zoals de persoon die je wilt zijn?",
      type: "multiple_choice",
      options: ["Ja", "Nee", "Gedeeltelijk"]
    },
    {
      question: "Welke oude patronen heb je deze dag/gisteren gehad en welke nieuwe patronen heb je gezien?",
      type: "open",
      options: []
    }
  ],

  risico: [
    {
      question: "Heb je je maximum aantal trades per dag gerespecteerd?",
      type: "multiple_choice",
      options: ["Onder het maximum", "Precies het maximum", "1-2 over", "Significant over", "Veel te veel trades"]
    },
    {
      question: "Was je positionering passend bij de markt volatiliteit?",
      type: "multiple_choice",
      options: ["Te groot voor liquiditeit", "Opgeschaald uit frustratie", "Stoploss niet gerespecteerd", "Minder risk genomen dan standaard"]
    },
    {
      question: "Hoe is je totale risk exposure vandaag?",
      type: "multiple_choice",
      options: ["Te weinig", "Goed", "Te veel"]
    },
    {
      question: "Wat kan er vandaag mis gaan?",
      type: "open",
      options: []
    }
  ],

  performance: [
    {
      question: "Wat is je totale R/R voor vandaag?",
      type: "open",
      options: []
    },
    {
      question: "Wat is je totale R/R voor deze week?",
      type: "open", 
      options: []
    },
    {
      question: "Hoe waardeer je je trade management vandaag? (1-5)",
      type: "multiple_choice",
      options: ["1", "2", "3", "4", "5"]
    },
    {
      question: "Welk timeframe was vandaag het meest succesvol?",
      type: "multiple_choice",
      options: ["<1min", "5-20min", "40m-2h", "2h+"]
    }
  ],

  reflectie: [
    {
      question: "Ben je vandaag een leeuw die wacht op zijn prooi geweest, of ben je achter alles aan gerend?",
      type: "multiple_choice",
      options: ["Volledige leeuw", "Meestal geduldig", "Mix van beide", "Vaak jagen", "Altijd jagen"]
    },
    {
      question: "Ben je mechanisch gebleven of heb je op geluk/gevoel gehandeld?",
      type: "multiple_choice",
      options: ["Volledig mechanisch", "Grotendeels mechanisch", "Mix", "Vooral gevoel", "Volledig op gevoel"]
    },
    {
      question: "Heb je oude patronen gezien vandaag?",
      type: "multiple_choice",
      options: ["Ja", "Nee"]
    },
    {
      question: "Ben je tevreden met de balans in je prioriteiten voor vandaag? (1-5)",
      type: "multiple_choice",
      options: ["1", "2", "3", "4", "5"]
    }
  ],

  ontwikkeling: [
    {
      question: "Ben je vandaag tijd vergeten door volledige aandacht voor iets?",
      type: "multiple_choice",
      options: ["Ja", "Nee", "Gedeeltelijk"]
    },
    {
      question: "Heb je vandaag gewerkt aan iets waar je echt in gelooft?",
      type: "multiple_choice",
      options: ["Ja", "Nee", "Gedeeltelijk"]
    },
    {
      question: "Heb je vandaag wat betekend voor anderen?",
      type: "multiple_choice", 
      options: ["Ja", "Nee", "Gedeeltelijk"]
    },
    {
      question: "Ben je vandaag dankbaar geweest?",
      type: "multiple_choice",
      options: ["Ja", "Nee", "Gedeeltelijk"]
    },
    {
      question: "Heb je vandaag geleefd volgens je eigen waarden?",
      type: "multiple_choice",
      options: ["Ja", "Nee", "Gedeeltelijk"]
    }
  ],

  inzichten: [
    {
      question: "Welke 'aha-moment' of random inzicht had je vandaag?",
      type: "open",
      options: []
    },
    {
      question: "Welke trading bias of valkuil heb je vandaag het meest gevoeld?",
      type: "open",
      options: []
    },
    {
      question: "Today A King... 🦁",
      type: "memo",
      options: ["✅"]
    },
    {
      question: "K.I.S.S.",
      type: "memo", 
      options: ["✅"]
    },
    {
      question: "Play B.O.B.",
      type: "memo",
      options: ["✅"]
    },
    {
      question: "Less is more",
      type: "memo",
      options: ["✅"]
    }
  ]
};

async function sendMessage(chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
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
}

async function getFileInfo(fileId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`;
  const response = await fetch(url);
  return response.json();
}

async function saveMediaToNotion(chatId, question, description, category, mediaType, fileInfo, responseType = 'media', questionOptions = []) {
  try {
    const response = await fetch(`${API_URL}/api/trading-journal-v5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        answer: description,
        category: category,
        time_of_day: Date.now() < 43200000 ? 'Morning' : 'Evening',
        response_type: responseType,
        question_options: questionOptions,
        media_type: mediaType,
        media_url: fileInfo.result ? `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.result.file_path}` : '',
        media_file_size: fileInfo.result ? fileInfo.result.file_size : 0,
        media_description: description
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving media to Notion:', error);
    return false;
  }
}

function initializeUserProgress(chatId) {
  if (!askedQuestions.has(chatId)) {
    askedQuestions.set(chatId, new Set());
  }
  
  if (!categoryProgress.has(chatId)) {
    const progress = {};
    Object.keys(QUESTION_CATEGORIES).forEach(category => {
      progress[category] = {
        totalQuestions: QUESTION_CATEGORIES[category].length,
        askedQuestions: new Set(),
        lastAsked: null
      };
    });
    categoryProgress.set(chatId, progress);
  }
}

function getSmartQuestion(chatId, category) {
  initializeUserProgress(chatId);
  
  const questions = QUESTION_CATEGORIES[category];
  if (!questions || questions.length === 0) {
    return null;
  }

  const userProgress = categoryProgress.get(chatId);
  const categoryData = userProgress[category];
  
  // Filter out already asked questions
  const availableQuestions = questions.filter((_, index) => 
    !categoryData.askedQuestions.has(index)
  );

  let selectedQuestion;
  let selectedIndex;

  if (availableQuestions.length === 0) {
    // All questions asked - reset and start over
    console.log(`Resetting questions for category: ${category}`);
    categoryData.askedQuestions.clear();
    selectedIndex = Math.floor(Math.random() * questions.length);
    selectedQuestion = questions[selectedIndex];
  } else {
    // Pick from available questions
    const randomAvailableIndex = Math.floor(Math.random() * availableQuestions.length);
    selectedQuestion = availableQuestions[randomAvailableIndex];
    selectedIndex = questions.indexOf(selectedQuestion);
  }

  // Mark as asked
  categoryData.askedQuestions.add(selectedIndex);
  categoryData.lastAsked = Date.now();
  
  // Create unique key for this question
  const questionKey = `${category}_${selectedIndex}`;
  askedQuestions.get(chatId).add(questionKey);

  console.log(`Smart question selected for ${category}:`, {
    questionIndex: selectedIndex,
    totalInCategory: questions.length,
    askedInCategory: categoryData.askedQuestions.size,
    question: selectedQuestion.question.substring(0, 50) + '...'
  });

  return selectedQuestion;
}

function getRandomQuestion(category) {
  const questions = QUESTION_CATEGORIES[category];
  if (!questions || questions.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

function getUserProgress(chatId) {
  initializeUserProgress(chatId);
  const userProgress = categoryProgress.get(chatId);
  
  const summary = {};
  Object.keys(userProgress).forEach(category => {
    const data = userProgress[category];
    summary[category] = {
      total: data.totalQuestions,
      asked: data.askedQuestions.size,
      remaining: data.totalQuestions - data.askedQuestions.size,
      percentage: Math.round((data.askedQuestions.size / data.totalQuestions) * 100)
    };
  });
  
  return summary;
}

function getCategoryIcon(category) {
  const icons = {
    motivatie: "🎯",
    doelen: "📋", 
    voorbereiding: "📊",
    marktanalyse: "📈",
    strategie: "🎲",
    psychologie: "🧠",
    discipline: "💪",
    risico: "⚠️",
    performance: "📊",
    reflectie: "🔍",
    ontwikkeling: "🌱",
    inzichten: "💡"
  };
  return icons[category] || "❓";
}

async function askRandomQuestion(chatId, category) {
  const question = getRandomQuestion(category);
  
  if (!question) {
    await sendMessage(chatId, "Sorry, ik ken deze categorie nog niet. Probeer /menu voor beschikbare categorieën.");
    return;
  }

  // Store session with 30 minute timeout
  userSessions.set(chatId, {
    question: question.question,
    category: category,
    questionType: question.type,
    questionOptions: question.options || [], // Opties voor kleuren
    timestamp: Date.now()
  });

  // Clean up session after 30 minutes
  setTimeout(() => {
    if (userSessions.has(chatId)) {
      const session = userSessions.get(chatId);
      if (Date.now() - session.timestamp >= SESSION_TIMEOUT) {
        userSessions.delete(chatId);
      }
    }
  }, SESSION_TIMEOUT);

  let keyboard = null;
  
  if (question.type === 'multiple_choice' && question.options.length > 0) {
    const buttons = question.options.map(option => [{
      text: option,
      callback_data: `answer_${option}`
    }]);
    
    keyboard = {
      inline_keyboard: buttons
    };
  } else if (question.type === 'memo') {
    keyboard = {
      inline_keyboard: [[{
        text: "✅ Gezien",
        callback_data: "memo_seen"
      }]]
    };
  }

  const icon = getCategoryIcon(category);
  const questionText = `${icon} **${category.toUpperCase()}**\n\n${question.question}`;

  await sendMessage(chatId, questionText, keyboard ? { reply_markup: keyboard } : {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      // Handle text messages
      if (text) {
        if (text === '/start') {
          await sendMessage(chatId, `🦁 **Welcome to your Trading Journal!**

*Today A King...* 🦁

Je hebt toegang tot 12 categorieën met 85+ fine-tuned vragen:

🎯 Motivatie - Waarom doe je dit?
📋 Doelen - Wat wil je bereiken?  
📊 Voorbereiding - Ben je ready?
📈 Marktanalyse - Hoe staat de markt?
🎲 Strategie - Wat is je plan?
🧠 Psychologie - Hoe is je mindset?
💪 Discipline - Volg je je regels?
⚠️ Risico - Wat kan er mis gaan?
📊 Performance - Hoe presteer je?
🔍 Reflectie - Wat leer je?
🌱 Ontwikkeling - Groei je als persoon?
💡 Inzichten - Welke wijsheid pak je op?

📸 **NIEUW: Media Support**
- Stuur foto's van charts/screenshots
- Voice notes voor snelle gedachten  
- Documenten voor analyse
- Alles wordt opgeslagen in je database!

Gebruik /menu voor het hoofdmenu
Gebruik /test om de API te testen
Gebruik /progress om je vraag progress te zien
Gebruik /reset om vraag progress te resetten

*Less is more. Be a lion. Today A King.* 🦁`);
          
        } else if (text === '/menu') {
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
                { text: "⚠️ Risico", callback_data: "cat_risico" }
              ],
              [
                { text: "📊 Performance", callback_data: "cat_performance" },
                { text: "🔍 Reflectie", callback_data: "cat_reflectie" }
              ],
              [
                { text: "🌱 Ontwikkeling", callback_data: "cat_ontwikkeling" },
                { text: "💡 Inzichten", callback_data: "cat_inzichten" }
              ]
            ]
          };
          
          await sendMessage(chatId, "🎯 **Kies een categorie:**\n\n📸 Je kunt ook gewoon een foto, voice note of document sturen!", { reply_markup: keyboard });
          
        } else if (text === '/test') {
          try {
            const testResponse = await fetch(`${API_URL}/api/trading-journal-v5`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: 'Test van Complete Trading Bot v5 met Media',
                answer: 'API + Media test succesvol!',
                category: 'Test',
                time_of_day: 'Test'
              })
            });

            if (testResponse.ok) {
              await sendMessage(chatId, "✅ API test succesvol! Bot + Media support werkt perfect.");
            } else if (text === '/progress') {
          const progress = getUserProgress(chatId);
          let progressText = "📊 **Vraag Progress:**\n\n";
          
          Object.keys(progress).forEach(category => {
            const data = progress[category];
            const icon = getCategoryIcon(category);
            progressText += `${icon} ${category}: ${data.asked}/${data.total} (${data.percentage}%)\n`;
            if (data.remaining > 0) {
              progressText += `   └ ${data.remaining} vragen over\n`;
            } else {
              progressText += `   └ ✅ Alle vragen gehad!\n`;
            }
            progressText += `\n`;
          });
          
          progressText += `💡 *Geen dubbele vragen tot categorie leeg is!*`;
          
          await sendMessage(chatId, progressText);
          
        } else if (text === '/reset') {
          // Reset alle vraag progress
          if (askedQuestions.has(chatId)) {
            askedQuestions.get(chatId).clear();
          }
          if (categoryProgress.has(chatId)) {
            const userProgress = categoryProgress.get(chatId);
            Object.keys(userProgress).forEach(category => {
              userProgress[category].askedQuestions.clear();
            });
          }
          
          await sendMessage(chatId, "🔄 **Progress gereset!**\n\nAlle vragen zijn weer beschikbaar voor alle categorieën.");
          
        } else {
              await sendMessage(chatId, "❌ API test gefaald. Er is een probleem met de verbinding.");
            }
          } catch (error) {
            await sendMessage(chatId, `❌ Kan API niet bereiken: ${error.message}`);
          }
          
        } else {
          // Handle text response to question
          const session = userSessions.get(chatId);
          
          if (!session) {
            await sendMessage(chatId, "⏰ Je sessie is verlopen of ik weet niet op welke vraag je antwoordt. Hier is een nieuwe vraag!");
            await askRandomQuestion(chatId, 'motivatie');
            return res.status(200).json({ ok: true });
          }

          // Send answer to Notion
          try {
            const response = await fetch(`${API_URL}/api/trading-journal-v5`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: session.question,
                answer: text,
                category: session.category,
                time_of_day: Date.now() < 43200000 ? 'Morning' : 'Evening',
                response_type: 'Text',
                question_options: session.questionOptions || []
              })
            });

            if (response.ok) {
              await sendMessage(chatId, "✅ Antwoord opgeslagen in je Notion database!");
            } else {
              await sendMessage(chatId, "❌ Er ging iets mis bij het opslaan. Probeer het later nog eens.");
            }
          } catch (error) {
            await sendMessage(chatId, "❌ Kon niet opslaan in database. Check je verbinding.");
          }

          // Clear session
          userSessions.delete(chatId);
        }
      }

      // Handle photo messages
      if (update.message.photo) {
        const photo = update.message.photo[update.message.photo.length - 1]; // Get highest resolution
        const caption = update.message.caption || "Screenshot/Foto";
        
        try {
          const fileInfo = await getFileInfo(photo.file_id);
          
          const success = await saveMediaToNotion(
            chatId, 
            "Foto/Screenshot geupload", 
            caption, 
            'Media', 
            'Foto', 
            fileInfo, 
            'media'
          );

          if (success) {
            await sendMessage(chatId, "📸 Foto opgeslagen in je Notion database!");
          } else {
            await sendMessage(chatId, "❌ Kon foto niet opslaan. Probeer opnieuw.");
          }
        } catch (error) {
          await sendMessage(chatId, "❌ Error bij foto upload.");
        }
      }

      // Handle voice messages
      if (update.message.voice) {
        const voice = update.message.voice;
        const duration = voice.duration;
        const description = `Voice note (${duration}s)`;
        
        try {
          const fileInfo = await getFileInfo(voice.file_id);
          
          const success = await saveMediaToNotion(
            chatId,
            "Voice note geupload",
            description,
            'Media',
            'Voice Note',
            fileInfo,
            'media'
          );

          if (success) {
            await sendMessage(chatId, "🎙️ Voice note opgeslagen in je Notion database!");
          } else {
            await sendMessage(chatId, "❌ Kon voice note niet opslaan. Probeer opnieuw.");
          }
        } catch (error) {
          await sendMessage(chatId, "❌ Error bij voice note upload.");
        }
      }

      // Handle video notes (round videos)
      if (update.message.video_note) {
        const videoNote = update.message.video_note;
        const duration = videoNote.duration;
        const description = `Video note (${duration}s)`;
        
        try {
          const fileInfo = await getFileInfo(videoNote.file_id);
          
          const success = await saveMediaToNotion(
            chatId,
            "Video note geupload",
            description,
            'Media',
            'Video Note',
            fileInfo,
            'media'
          );

          if (success) {
            await sendMessage(chatId, "🎥 Video note opgeslagen in je Notion database!");
          } else {
            await sendMessage(chatId, "❌ Kon video note niet opslaan. Probeer opnieuw.");
          }
        } catch (error) {
          await sendMessage(chatId, "❌ Error bij video note upload.");
        }
      }

      // Handle documents
      if (update.message.document) {
        const document = update.message.document;
        const fileName = document.file_name || "Document";
        const fileSize = document.file_size;
        const description = `${fileName} (${Math.round(fileSize/1024)}KB)`;
        
        try {
          const fileInfo = await getFileInfo(document.file_id);
          
          const success = await saveMediaToNotion(
            chatId,
            "Document geupload",
            description,
            'Media',
            'Document',
            fileInfo,
            'media'
          );

          if (success) {
            await sendMessage(chatId, "📄 Document opgeslagen in je Notion database!");
          } else {
            await sendMessage(chatId, "❌ Kon document niet opslaan. Probeer opnieuw.");
          }
        } catch (error) {
          await sendMessage(chatId, "❌ Error bij document upload.");
        }
      }
      
    } else if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;

      if (data.startsWith('cat_')) {
        const category = data.replace('cat_', '');
        await askRandomQuestion(chatId, category);
        
      } else if (data.startsWith('answer_') || data === 'memo_seen') {
        const session = userSessions.get(chatId);
        
        if (!session) {
          await sendMessage(chatId, "⏰ Je sessie is verlopen. Hier is een nieuwe vraag!");
          await askRandomQuestion(chatId, 'motivatie');
          return res.status(200).json({ ok: true });
        }

        const answer = data.startsWith('answer_') ? data.replace('answer_', '') : 'Gezien';

        // Send to Notion
        try {
          const response = await fetch(`${API_URL}/api/trading-journal-v5`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: session.question,
              answer: answer,
              category: session.category,
              time_of_day: Date.now() < 43200000 ? 'Morning' : 'Evening',
              response_type: session.questionType,
              question_options: session.questionOptions || []
            })
          });

          if (response.ok) {
            await sendMessage(chatId, "✅ Antwoord opgeslagen!");
          } else {
            await sendMessage(chatId, "❌ Er ging iets mis bij het opslaan.");
          }
        } catch (error) {
          await sendMessage(chatId, "❌ Kon niet opslaan in database.");
        }

        // Clear session
        userSessions.delete(chatId);
      }
    }

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
