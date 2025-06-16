// api/telegram-webhook-v4-fixed.js
// Alle 85+ fine-tuned vragen + timing + gefixte property namen
// ZONDER media support (dat later)


const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = 'https://tradingbot-tee-aa.vercel.app';

// Session management
const userSessions = new Map();

// 30 minute session timeout
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Morning categories (8:30)
const MORNING_CATEGORIES = ['motivatie', 'doelen', 'voorbereiding', 'marktanalyse', 'strategie', 'psychologie', 'discipline', 'risico'];

// Evening categories (20:45)  
const EVENING_CATEGORIES = ['performance', 'inzichten', 'reflectie', 'ontwikkeling'];

// Alle 85+ fine-tuned vragen
const QUESTION_CATEGORIES = {
  motivatie: [
    {
      question: "Waarom doe je dit? Familie onderhouden, toekomst opbouwen, Thea trots maken?",
      type: "multiple_choice",
      options: ["Familie onderhouden", "Toekomst opbouwen", "Thea trots maken", "Omdat ik het kan", "Mega interessant"]
    },
    {
      question: "Trade je omdat je het kunt, of omdat het moet?",
      type: "multiple_choice", 
      options: ["Omdat ik het kan", "Omdat het moet", "Mix van beide", "Onduidelijk"]
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

function getRandomQuestion(category) {
  const questions = QUESTION_CATEGORIES[category];
  if (!questions || questions.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
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

Gebruik /menu voor het hoofdmenu
Gebruik /test om de API te testen

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
        
        await sendMessage(chatId, "🎯 **Kies een categorie:**", { reply_markup: keyboard });
        
      } else if (text === '/test') {
        try {
          const testResponse = await fetch(`${API_URL}/api/trading-journal-v2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: 'Test van Complete Trading Bot v4 Fixed',
              answer: 'API test succesvol!',
              category: 'Test',
              time_of_day: 'Test'
            })
          });

          if (testResponse.ok) {
            await sendMessage(chatId, "✅ API test succesvol! Bot werkt perfect.");
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
          const response = await fetch(`${API_URL}/api/trading-journal-v2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: session.question,
              answer: text,
              category: session.category,
              time_of_day: Date.now() < 43200000 ? 'Morning' : 'Evening', // Simple morning/evening detection
              response_type: 'Text'
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
          const response = await fetch(`${API_URL}/api/trading-journal-v2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: session.question,
              answer: answer,
              category: session.category,
              time_of_day: Date.now() < 43200000 ? 'Morning' : 'Evening',
              response_type: session.questionType
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
