// api/trading-journal-v2.js - Enhanced Trading Journal System
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Trading Journal Categories with Rotating Questions
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
      },
      {
        question: "Hoe verhouden je dagdoelen zich tot je lange termijn visie?",
        responses: ["Perfect aligned", "Grotendeels aligned", "Deels aligned", "Minimaal aligned", "Niet aligned"]
      }
    ]
  },

  voorbereiding: {
    name: "Voorbereiding",
    questions: [
      {
        question: "Heb je alle prep sources gecheckt? (Discord, X, TradingView, ForexFactory)",
        responses: ["Alles volledig", "Meeste bronnen", "Basis prep", "Minimale prep", "Geen prep"]
      },
      {
        question: "Ken je de belangrijkste levels, events en catalysts voor vandaag?",
        responses: ["Volledig op de hoogte", "Grotendeels bekend", "Basis kennis", "Minimaal bekend", "Geen idee"]
      },
      {
        question: "Heb je je weekend planning uitgevoerd? (TF selectie, tickers opschonen, sector analyse)",
        responses: ["Volledig uitgevoerd", "Grotendeels klaar", "Deels gedaan", "Minimaal", "Niet gedaan"]
      },
      {
        question: "Is je trading workspace optimaal ingericht? (Computer only, alerts ready, etc.)",
        responses: ["Perfect setup", "Goed setup", "Basis setup", "Suboptimaal", "Chaotisch"]
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
      },
      {
        question: "Ben je mechanisch gebleven of heb je op geluk/gevoel gehandeld?",
        responses: ["Volledig mechanisch", "Grotendeels mechanisch", "Mix", "Vooral gevoel", "Volledig op gevoel"]
      },
      {
        question: "Heb je FOMO of revenge trading gevoeld/uitgevoerd?",
        responses: ["Geen FOMO/revenge", "Licht gevoel maar niet gehandeld", "Enkele trades", "Meerdere trades", "Volledig FOMO/revenge"]
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
      },
      {
        question: "Heb je de '4R+ zoom out' regel toegepast?",
        responses: ["Perfect toegepast", "Toegepast", "Deels toegepast", "Vergeten toe te passen", "Bewust genegeerd"]
      },
      {
        question: "Na een stopout: ben je uitgestapt of heb je revenge trades gemaakt?",
        responses: ["Geen stopouts", "Uitgestapt en geanalyseerd", "Kort gestopt", "Enkele revenge trades", "Volledig revenge trading"]
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, answer, category, response_type, time_of_day } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ 
        error: 'Question and answer are required' 
      });
    }

    // Create entry in Notion
    const response_data = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        "Name": {
          "title": [
            {
              "text": {
                "content": `${category || 'General'} - ${new Date().toLocaleDateString()}`
              }
            }
          ]
        },
        "Question": {
          "rich_text": [
            {
              "text": {
                "content": question
              }
            }
          ]
        },
        "Answer": {
          "rich_text": [
            {
              "text": {
                "content": answer
              }
            }
          ]
        },
        "Date": {
          "date": {
            "start": new Date().toISOString().split('T')[0]
          }
        },
        ...(category && {
          "Category": {
            "select": {
              "name": category
            }
          }
        }),
        ...(response_type && {
          "Response_Type": {
            "select": {
              "name": response_type
            }
          }
        }),
        ...(time_of_day && {
          "Time": {
            "select": {
              "name": time_of_day
            }
          }
        })
      },
    });

    console.log('Successfully added entry to Notion:', response_data.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Entry added to trading journal',
      notion_id: response_data.id,
      category: category
    });

  } catch (error) {
    console.error('Error adding to Notion:', error);
    
    res.status(500).json({ 
      error: 'Failed to add entry to Notion',
      details: error.message
    });
  }
}

// Helper functions for the bot
export function getRandomQuestionByCategory(category) {
  const categoryData = QUESTION_CATEGORIES[category];
  if (!categoryData) return null;
  
  const randomIndex = Math.floor(Math.random() * categoryData.questions.length);
  return categoryData.questions[randomIndex];
}

export function getAllCategories() {
  return Object.keys(QUESTION_CATEGORIES);
}

export function getCategoryName(category) {
  return QUESTION_CATEGORIES[category]?.name || category;
}

export { QUESTION_CATEGORIES };
