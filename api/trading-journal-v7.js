// api/trading-journal-v7.js - Verbeterde versie met fixes en optimalisaties
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Score waardes per kleur
const COLOR_SCORES = {
  '🟢 Groen': 5,
  '🟡 Geel': 3,
  '🟠 Oranje': 2,
  '🔴 Rood': 1,
  '🟣 Donkerrood': 0
};

// Cache voor dagelijkse entries om API calls te verminderen
const dailyEntriesCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuten

// Haal alle entries van vandaag op voor score berekening
async function getTodaysEntries(useCache = true) {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `entries_${today}`;
  
  // Check cache eerst
  if (useCache && dailyEntriesCache.has(cacheKey)) {
    const cached = dailyEntriesCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.entries;
    }
  }
  
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Date',
        date: {
          equals: today
        }
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    });

    // Cache de resultaten
    dailyEntriesCache.set(cacheKey, {
      entries: response.results,
      timestamp: Date.now()
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching today entries:', error);
    return [];
  }
}

// Vragen die uitgesloten worden van daily score
const EXCLUDE_FROM_DAILY_SCORE = [
  // Motivatie vragen
  'waarom doe je dit',
  'voor wat ben je vandaag het meest dankbaar',
  
  // Marktanalyse vragen (informatief, geen score)
  'volatiliteit',
  'te spelen', 
  'overall market strength',
  'b.o.b. tickers',
  'specifieke b.o.b',
  'marktanalyse',
  'flags clean',
  'welke sectoren zijn sterk',
  
  // Open reflectie vragen
  'welke aha-moment',
  'welke trading bias',
  'wat is je doel voor family time',
  'op welk vlak ga je vandaag 1% groeien',
  'welke oude patronen',
  'wat kan er vandaag mis gaan',
  
  // Performance tracking (aparte metrics)
  'wat is je totale r/r voor vandaag',
  'wat is je totale r/r voor deze week',
  'welk timeframe was vandaag',
  
  // Memo's (altijd groen, tellen niet mee)
  'today a king',
  'k.i.s.s.',
  'play b.o.b.',
  'less is more'
];

// Bereken dagelijkse score
async function calculateDailyScore() {
  const todaysEntries = await getTodaysEntries();
  
  if (todaysEntries.length === 0) {
    return { 
      score: 0, 
      totalAnswers: 0,
      averageScore: "0.00",
      details: "Geen entries vandaag"
    };
  }

  let totalScore = 0;
  let validAnswers = 0;
  const scoreDistribution = { 5: 0, 3: 0, 2: 0, 1: 0, 0: 0 };

  todaysEntries.forEach(entry => {
    // Check of deze vraag meetelt voor score
    const questionProperty = entry.properties.Question;
    if (questionProperty?.rich_text?.[0]?.text?.content) {
      const questionText = questionProperty.rich_text[0].text.content.toLowerCase();
      
      const shouldExclude = EXCLUDE_FROM_DAILY_SCORE.some(keyword => 
        questionText.includes(keyword)
      );
      
      if (shouldExclude) {
        return; // Skip deze vraag
      }
    }

    // Tel de score
    const colorProperty = entry.properties.Response_Color;
    if (colorProperty?.select?.name) {
      const color = colorProperty.select.name;
      const points = COLOR_SCORES[color] ?? 3;
      totalScore += points;
      validAnswers++;
      scoreDistribution[points]++;
    }
  });

  const averageScore = validAnswers > 0 ? totalScore / validAnswers : 0;
  const dailyScore = Math.round(averageScore * 20);

  return { 
    score: dailyScore, 
    totalAnswers: validAnswers,
    averageScore: averageScore.toFixed(2),
    scoreDistribution,
    totalEntries: todaysEntries.length
  };
}

// Verbeterde kleurlogica met duidelijke categorisatie
function getSmartResponseColor(question, answer, questionOptions, questionType) {
  const lowerQuestion = question.toLowerCase();
  const lowerAnswer = answer.toLowerCase();

  // 1. Neutrale vragen (altijd geel)
  if (EXCLUDE_FROM_DAILY_SCORE.some(keyword => lowerQuestion.includes(keyword))) {
    return '🟡 Geel';
  }

  // 2. Open vragen en media
  if (questionType === 'open' || questionType === 'media') {
    return '🟡 Geel';
  }

  // 3. Memo's (altijd groen)
  if (questionType === 'memo') {
    return '🟢 Groen';
  }

  // 4. Vragen zonder opties
  if (!questionOptions || questionOptions.length === 0) {
    return '🟡 Geel';
  }

  // 5. Bepaal type vraag en pas juiste logica toe
  const answerIndex = questionOptions.indexOf(answer);
  if (answerIndex === -1) {
    return '🟡 Geel';
  }

  // Check voor verschillende vraagtypen
  const isNegativeQuestion = checkNegativeQuestion(lowerQuestion);
  const isNumberScale = checkNumberScale(questionOptions);
  
  if (isNegativeQuestion || isNumberScale) {
    return getReversedColor(answerIndex, questionOptions.length);
  } else {
    return getStandardColor(answerIndex, questionOptions.length);
  }
}

// Helper functies voor vraagtype detectie
function checkNegativeQuestion(question) {
  const negativePatterns = [
    'heb je fomo', 'revenge trades', 'chase je price',
    'voel je druk', 'ben je sloppy', 'oude patronen',
    'te vroeg', 'mindfucked', 'bezig met gisteren'
  ];
  
  return negativePatterns.some(pattern => question.includes(pattern));
}

function checkNumberScale(options) {
  return options.length > 2 && 
    options.every(opt => !isNaN(opt) || /^\d+$/.test(opt));
}

// Standaard kleur mapping
function getStandardColor(index, total) {
  const colorMappings = {
    2: ['🟢 Groen', '🔴 Rood'],
    3: ['🟢 Groen', '🟡 Geel', '🔴 Rood'],
    4: ['🟢 Groen', '🟡 Geel', '🟠 Oranje', '🔴 Rood'],
    5: ['🟢 Groen', '🟡 Geel', '🟠 Oranje', '🔴 Rood', '🟣 Donkerrood']
  };
  
  const mapping = colorMappings[Math.min(total, 5)] || colorMappings[5];
  return mapping[Math.min(index, mapping.length - 1)];
}

// Omgekeerde kleur mapping voor negatieve vragen
function getReversedColor(index, total) {
  const reversedIndex = total - 1 - index;
  return getStandardColor(reversedIndex, total);
}

// Validatie functies
function validateRequest(body) {
  const errors = [];
  
  if (!body.question) errors.push('Question is required');
  if (!body.answer) errors.push('Answer is required');
  
  if (body.media_file_size && isNaN(body.media_file_size)) {
    errors.push('Media file size must be a number');
  }
  
  return errors;
}

// Main handler
export default async function handler(req, res) {
  // CORS headers voor browser compatibiliteit
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    // Valideer request
    const validationErrors = validateRequest(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: validationErrors 
      });
    }

    const { 
      question, 
      answer, 
      category = 'General', 
      time_of_day = 'Unknown',
      response_type = 'Text', 
      question_options = [], 
      mood, 
      market_session, 
      tags,
      media_type, 
      media_url, 
      media_file_size, 
      media_description,
      metadata = {} // Extra metadata voor toekomstige features
    } = req.body;

    // Bepaal kleur met verbeterde logica
    const responseColor = getSmartResponseColor(
      question, answer, question_options, response_type
    );

    // Bereken dagelijkse score
    const dailyScoreData = await calculateDailyScore();
    
    // Bouw Notion properties
    const properties = {
      'Name': {
        title: [{ 
          text: { 
            content: `${category} - ${new Date().toLocaleDateString('nl-NL')}` 
          } 
        }]
      },
      'Question': {
        rich_text: [{ text: { content: question } }]
      },
      'Answer': {
        rich_text: [{ text: { content: answer } }]
      },
      'Category': {
        select: { name: category }
      },
      'Response_Type': {
        select: { name: response_type }
      },
      'Response_Color': {
        select: { name: responseColor }
      },
      'Daily_Score': {
        number: dailyScoreData.score
      },
      'Time': {
        select: { name: time_of_day }
      },
      'Date': {
        date: { start: new Date().toISOString().split('T')[0] }
      }
    };

    // Voeg optionele properties toe
    if (mood) properties['Mood'] = { select: { name: mood } };
    if (market_session) properties['Market Session'] = { select: { name: market_session } };
    if (tags) {
      properties['Tags'] = {
        multi_select: tags.split(',').map(tag => ({ name: tag.trim() }))
      };
    }

    // Media properties
    if (media_type) {
      properties['Media_Type'] = { select: { name: media_type } };
      properties['Media_Timestamp'] = {
        date: { start: new Date().toISOString() }
      };
    }
    if (media_url) properties['Media_URL'] = { url: media_url };
    if (media_file_size) {
      properties['Media_File_Size'] = { 
        number: parseInt(media_file_size) || 0 
      };
    }
    if (media_description) {
      properties['Media_Description'] = {
        rich_text: [{ text: { content: media_description } }]
      };
    }

    // Maak Notion entry
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties
    });

    // Clear cache na nieuwe entry
    dailyEntriesCache.clear();

    // Stuur uitgebreide response
    return res.status(200).json({
      success: true,
      message: 'Entry successfully added to Notion',
      data: {
        notion_id: response.id,
        color_assigned: responseColor,
        daily_score: dailyScoreData.score,
        score_details: {
          average: dailyScoreData.averageScore,
          total_answers: dailyScoreData.totalAnswers,
          total_entries: dailyScoreData.totalEntries,
          distribution: dailyScoreData.scoreDistribution
        },
        media_included: !!media_type,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in trading journal:', error);
    
    // Gedetailleerde error response
    return res.status(500).json({
      error: 'Failed to add entry to Notion',
      details: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    });
  }
}

// Export helper functies voor testing
export { 
  getSmartResponseColor, 
  calculateDailyScore,
  COLOR_SCORES,
  EXCLUDE_FROM_DAILY_SCORE
};
