// api/telegram-webhook-v6.js - Final Version
// Complete Trading Bot met Smart Question Rotation + Media Support

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

// Alle 85+ fine-tuned vragen
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

// Smart Question Rotation Functions
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
