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

// Update ook de SCHEDULE voor de juiste tijden:
const SCHEDULE = {
  MORNING: {
    start: 6,
    end: 12,
    categories: ['motivatie', 'doelen', 'voorbereiding', 'psychologie', 'discipline', 'marktanalyse', 'strategie', 'risico']
  },
  AFTERNOON: {
    start: 12,
    end: 18,
    categories: ['trades', 'performance', 'discipline', 'psychologie']
  },
  EVENING: {
    start: 18,
    end: 23,
    categories: ['reflectie', 'leren', 'ontwikkeling', 'inzichten', 'avond', 'relaties', 'gezondheid']
  }
};

// Complete vragenlijst - vervang de QUESTION_CATEGORIES in je telegram-webhook-v6.js hiermee:

const QUESTION_CATEGORIES = {
  motivatie: [  // 8 vragen
    { 
      question: "Waarom trade je vandaag? Kies je motivatie en deel optioneel een voice note met waarom.", 
      type: "multiple_choice", 
      options: ["Familie onderhouden (5 pts)", "Toekomst opbouwen (4 pts)", "Thea trots maken (4 pts)", "Uit verveling (2 pts)", "Ander (specificeer, 3 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Wat drijft je het meest: geld, groei of iets persoonlijks? Upload een foto van een inspirerend object.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Hoe gemotiveerd voel je je nu? (1-5 schaal, voice note voor uitleg).", 
      type: "multiple_choice", 
      options: ["5 (Volledig, Groen)", "4 (Hoog)", "3 (Gemiddeld, Geel)", "2 (Laag, Oranje)", "1 (Geen, Rood)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Herinner je een succesvol moment; hoe motiveert dat je? Deel via voice.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Is je motivatie intrinsiek of extrinsiek? Leg uit met een voorbeeld.", 
      type: "multiple_choice", 
      options: ["Intrinsiek (5 pts)", "Extrinsiek (3 pts)", "Mix (4 pts)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Wat zou je motivatie boosten? Upload een idee-foto.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Voel je passie voor trading? Schaal en voice note.", 
      type: "multiple_choice", 
      options: ["Ja, sterk (5 pts)", "Matig (3 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Blijf gemotiveerd! Voice reminder?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  doelen: [  // 7 vragen
    { 
      question: "Wat is je hoofddoel vandaag? Wees specifiek en deel een voice note als reminder.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Heb je je doelen opgeschreven? Upload een foto van je notitie.", 
      type: "multiple_choice", 
      options: ["Ja, volledig (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Zijn je doelen SMART? Check en leg uit.", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Hoe meet je vooruitgang? Deel een metric via voice.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Past dit doel bij je lange-termijn visie? Foto van plan?", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (2 pts)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Wat als je het doel mist? Reflecteer.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Stel dagelijkse doelen. Voice note?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  voorbereiding: [  // 8 vragen
    { 
      question: "Heb je je ochtendroutine voltooid (sport, douche, Wim Hof)? Upload een foto als bewijs.", 
      type: "multiple_choice", 
      options: ["Alles (5/5, Groen)", "Meeste (3-4/5, Geel)", "Weinig (1-2/5, Oranje)", "Niets (0/5, Rood)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Ben je fysiek en mentaal voorbereid? Deel een korte voice note.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Heb je je tools gecheckt? Screenshot uploaden?", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)", "Gedeeltelijk (3 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Hoe is je werkplek? Foto voor accountability.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Heb je nieuws gecheckt? Belangrijke updates?", 
      type: "multiple_choice", 
      options: ["Ja, volledig (5 pts)", "Nee (1 pt)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Voel je je gefocust? Schaal 1-5 met voice.", 
      type: "multiple_choice", 
      options: ["5 (Groen)", "3 (Geel)", "1 (Rood)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Heb je gegeten? Gezond ontbijt foto?", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Bereid je voor succes. Voice?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  psychologie: [  // 7 vragen
    { 
      question: "Hoe is je mindset nu? Positief of gestrest? Voice note voor details.", 
      type: "multiple_choice", 
      options: ["Zeer positief (5 pts)", "Goed (4 pts)", "Neutraal (3 pts)", "Gestrest (2 pts)", "Negatief (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Voel je angst of hebzucht? Deel een gedachte via photo.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Hoe handel je emoties? Strategie voice note.", 
      type: "multiple_choice", 
      options: ["Goed (5 pts)", "Matig (3 pts)", "Slecht (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Ben je in flow-state? Leg uit.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Invloed van vorige trades? Reflecteer met voice.", 
      type: "multiple_choice", 
      options: ["Positief (5 pts)", "Negatief (1 pt)", "Neutraal (3 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Mindset tip: Adem diep. Foto van oefening?", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Hoe manage je stress? Deel tip.", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  discipline: [  // 7 vragen
    { 
      question: "Volg je je regels strikt? Deel een voorbeeld via photo.", 
      type: "multiple_choice", 
      options: ["Altijd (5 pts)", "Meestal (4 pts)", "Soms (3 pts)", "Zelden (2 pts)", "Nooit (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Heb je impulsieve acties vermeden? Voice reflectie.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Hoe is je routine-discipline? Schaal met bonus voor details.", 
      type: "multiple_choice", 
      options: ["Hoog (5 pts)", "Gemiddeld (3 pts)", "Laag (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Discipline reminder: Blijf gefocust. Photo?", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Heb je breaks genomen? Balans check.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Volg je je plan? Upload bewijs.", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Wat verbeter je in discipline? Idee voice.", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  trades: [  // 8 vragen
    { 
      question: "Hoeveel trades heb je vandaag genomen? Upload een screenshot.", 
      type: "open", 
      excludeFromScoring: true 
    },
    { 
      question: "Waren ze volgens plan? Voice uitleg.", 
      type: "multiple_choice", 
      options: ["Alle (5 pts)", "Meeste (3 pts)", "Weinig (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Beste trade vandaag? Deel chart photo.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Slechtste trade? Lessen via voice.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Risico management ok? Schaal.", 
      type: "multiple_choice", 
      options: ["Perfect (5 pts)", "Goed (4 pts)", "Slecht (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Trades memo: Kwaliteit > kwantiteit.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Heb je wins/losses geanalyseerd? Photo?", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Volgende trade plan? Deel idee.", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  reflectie: [  // 8 vragen
    { 
      question: "Was je geduldig (leeuw) of impulsief? Deel een chart-screenshot.", 
      type: "multiple_choice", 
      options: ["Volledig geduldig (5 pts)", "Meestal (4 pts)", "Mix (3 pts)", "Vaak impulsief (2 pts)", "Altijd (1 pt)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Wat ging goed vandaag? Voice reflectie.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Wat kan beter? Upload notitie.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Emotionele reflectie: Hoe voelde het? Schaal.", 
      type: "multiple_choice", 
      options: ["Positief (5 pts)", "Neutraal (3 pts)", "Negatief (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Reflectie memo: Leer van fouten.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Heb je je doelen gehaald? Voice uitleg.", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Dagelijkse winst? Deel metric photo.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Morgen beter: Wat pas je aan?", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  leren: [  // 7 vragen
    { 
      question: "Wat heb je vandaag geleerd? Spreek het in via voice note.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Nieuwe strategie getest? Upload voorbeeld.", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)", "Gedeeltelijk (3 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Boek/artikel gelezen? Deel insight.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Leren memo: Blijf studeren.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Fout geanalyseerd? Voice les.", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Mentor advies gevolgd? Leg uit.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Volgende leerdoel? Plan photo.", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  gezondheid: [  // 7 vragen
    { 
      question: "Heb je gezond gegeten en bewogen? Foto van je maaltijd.", 
      type: "multiple_choice", 
      options: ["Ja, volledig (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Slaapkwaliteit? Schaal met voice.", 
      type: "multiple_choice", 
      options: ["Uitstekend (5 pts)", "Gemiddeld (3 pts)", "Slecht (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Hydratatie ok? Dagelijkse check.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Gezondheid memo: Lichaam eerst.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Stress level? Deel via photo.", 
      type: "multiple_choice", 
      options: ["Laag (5 pts)", "Hoog (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Beweging vandaag? Upload bewijs.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Mentale gezondheid: Hoe voel je je?", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  relaties: [  // 6 vragen
    { 
      question: "Heb je tijd gemaakt voor familie? Deel een moment via voice.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Communicatie met Thea? Positief?", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)", "Gemiddeld (3 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Relaties memo: Koester ze.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Vrienden contact? Deel insight.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Balans werk/relaties? Schaal.", 
      type: "multiple_choice", 
      options: ["Goed (5 pts)", "Slecht (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Dankbaarheid voor relaties? Voice note.", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  avond: [  // 7 vragen
    { 
      question: "Hoe was je dag overall? Reflecteer met een voice note.", 
      type: "multiple_choice", 
      options: ["Uitstekend (5 pts)", "Goed (4 pts)", "Gemiddeld (3 pts)", "Slecht (2 pts)", "Zeer slecht (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Avond routine gedaan? Upload photo.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Morgen plan? Deel via voice.", 
      type: "multiple_choice", 
      options: ["Klaar (5 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Avond memo: Rust uit.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Dankbaar voor vandaag? Leg uit.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Slaap voorbereid? Check lijst.", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Emotionele afsluiting? Voice reflectie.", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  memo: [  // 5 vragen
    { 
      question: "Memo: Vergeet niet te rusten. Voice note als reminder?", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Memo: Drink water. Photo reminder?", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Memo: Check doelen dagelijks.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Memo: Blijf positief. Voice?", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Memo: Leer van trades.", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  marktanalyse: [  // 6 vragen
    { 
      question: "Hoe staat de markt vandaag? Deel een screenshot.", 
      type: "open", 
      excludeFromScoring: true 
    },
    { 
      question: "Trend analyse: Bullish of bearish? Voice uitleg.", 
      type: "multiple_choice", 
      options: ["Bullish (5 pts)", "Bearish (3 pts)", "Neutraal (4 pts)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Key indicators gecheckt? Upload grafiek.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Volatiliteit niveau? Schaal met voice.", 
      type: "multiple_choice", 
      options: ["Hoog (3 pts)", "Laag (5 pts)", "Middel (4 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Nieuws impact? Deel insight.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Analyseer markt. Photo?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  strategie: [  // 6 vragen
    { 
      question: "Wat is je trading strategie? Upload plan foto.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Volg je een specifieke methode? Kies en leg uit.", 
      type: "multiple_choice", 
      options: ["Scalping (4 pts)", "Day trading (5 pts)", "Swing (3 pts)", "Ander"], 
      excludeFromScoring: false 
    },
    { 
      question: "Strategie aanpassing nodig? Voice note.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Entry/exit rules? Deel voorbeeld.", 
      type: "multiple_choice", 
      options: ["Duidelijk (5 pts)", "Vage (2 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Backtest resultaten? Upload data.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Stick to strategy. Voice?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  risico: [  // 5 vragen
    { 
      question: "Risico assessment: Hoog of laag? Voice note.", 
      type: "multiple_choice", 
      options: ["Laag (5 pts)", "Hoog (1 pt)", "Middel (3 pts)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Stop-loss gezet? Deel setup photo.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Risico-reward ratio? Bereken en leg uit.", 
      type: "multiple_choice", 
      options: ["Goed (5 pts)", "Slecht (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Potentiële risks? List via voice.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Manage risico. Photo?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  performance: [  // 5 vragen
    { 
      question: "Hoe presteer je? Deel metrics screenshot.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Win rate vandaag? Schaal met voice.", 
      type: "multiple_choice", 
      options: ["Hoog (5 pts)", "Laag (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Performance review? Insights.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Vergelijking met gisteren? Photo.", 
      type: "multiple_choice", 
      options: ["Beter (5 pts)", "Slechter (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Track performance. Voice?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ],

  inzichten: [  // 5 vragen
    { 
      question: "Welke inzichten vandaag? Spreek in via voice.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Nieuw inzicht over markt? Deel photo.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Lessen uit trades? Kies.", 
      type: "multiple_choice", 
      options: ["Veel (5 pts)", "Weinig (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Inzicht memo: Noteer ze.", 
      type: "memo", 
      excludeFromScoring: true 
    },
    { 
      question: "Toekomstig inzicht? Voice plan.", 
      type: "open", 
      excludeFromScoring: false 
    }
  ],

  ontwikkeling: [  // 5 vragen
    { 
      question: "Hoe groei je als trader? Reflecteer met photo.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Nieuwe skills geleerd? Deel via voice.", 
      type: "multiple_choice", 
      options: ["Ja (5 pts)", "Nee (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Ontwikkeling doel? Plan upload.", 
      type: "open", 
      excludeFromScoring: false 
    },
    { 
      question: "Progressie check? Schaal.", 
      type: "multiple_choice", 
      options: ["Goed (5 pts)", "Slecht (1 pt)"], 
      excludeFromScoring: false 
    },
    { 
      question: "Memo: Blijf groeien. Voice?", 
      type: "memo", 
      excludeFromScoring: true 
    }
  ]
};

// Ook update de CATEGORY_META om alle categorieën te hebben:
const CATEGORY_META = {
  motivatie: { icon: "🎯", description: "Waarom doe je dit?" },
  doelen: { icon: "📋", description: "Wat wil je bereiken?" },
  voorbereiding: { icon: "📊", description: "Ben je ready?" },
  psychologie: { icon: "🧠", description: "Hoe is je mindset?" },
  discipline: { icon: "💪", description: "Volg je je regels?" },
  trades: { icon: "💹", description: "Hoe ging het traden?" },
  reflectie: { icon: "🔍", description: "Wat leer je?" },
  leren: { icon: "📚", description: "Ontwikkel je kennis" },
  gezondheid: { icon: "🏃", description: "Zorg voor jezelf" },
  relaties: { icon: "👥", description: "Verbind met anderen" },
  avond: { icon: "🌙", description: "Sluit de dag af" },
  memo: { icon: "📌", description: "Belangrijke reminders" },
  marktanalyse: { icon: "📈", description: "Hoe staat de markt?" },
  strategie: { icon: "🎲", description: "Wat is je plan?" },
  risico: { icon: "⚠️", description: "Wat kan er mis gaan?" },
  performance: { icon: "📊", description: "Hoe presteer je?" },
  inzichten: { icon: "💡", description: "Welke wijsheid pak je op?" },
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
