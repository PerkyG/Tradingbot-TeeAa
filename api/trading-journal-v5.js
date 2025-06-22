// api/trading-journal-v5.js - Met Daily Score Systeem
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Score waardes per kleur
function getColorScore(color) {
  const colorScores = {
    '🟢 Groen': 5,
    '🟡 Geel': 3,
    '🟠 Oranje': 2,
    '🔴 Rood': 1,
    '🟣 Donkerrood': 0
  };
  
  return colorScores[color] || 3; // Default naar 3 (geel) voor onbekende kleuren
}

// Haal alle entries van vandaag op voor score berekening
async function getTodaysEntries() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Date',
        date: {
          equals: today
        }
      }
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching today entries:', error);
    return [];
  }
}

// Bereken dagelijkse score op basis van alle antwoorden van vandaag
async function calculateDailyScore() {
  const todaysEntries = await getTodaysEntries();
  
  if (todaysEntries.length === 0) {
    return { score: 0, totalAnswers: 0 };
  }

  let totalScore = 0;
  let validAnswers = 0;

  todaysEntries.forEach(entry => {
    // Skip bepaalde vragen voor Daily Score
    const questionProperty = entry.properties.Question;
    if (questionProperty && questionProperty.rich_text && questionProperty.rich_text.length > 0) {
      const questionText = questionProperty.rich_text[0].text.content.toLowerCase();
      
      // Lijst van vragen die Daily Score niet beïnvloeden
      const excludeQuestions = [
        'volatiliteit',
        'te spelen',
        'waarom doe je dit'
      ];
      
      const shouldExclude = excludeQuestions.some(keyword => questionText.includes(keyword));
      
      if (shouldExclude) {
        console.log(`Skipping question for daily score: ${questionText}`);
        return; // Skip this entry
      }
    }

    const colorProperty = entry.properties.Response_Color;
    if (colorProperty && colorProperty.select && colorProperty.select.name) {
      const color = colorProperty.select.name;
      const points = getColorScore(color);
      totalScore += points;
      validAnswers++;
    }
  });

  // Gemiddelde score (0-5) * 20 = percentage score (0-100)
  const averageScore = validAnswers > 0 ? totalScore / validAnswers : 0;
  const dailyScore = Math.round(averageScore * 20); // Convert to 0-100 scale

  return { 
    score: dailyScore, 
    totalAnswers: validAnswers,
    averageScore: averageScore.toFixed(2)
  };
}

// Kleuren logic functie (same as before)
function getResponseColor(answer, questionOptions, questionType) {
  if (questionType === 'open' || questionType === 'media') {
    return '🟡 Geel';
  }

  if (questionType === 'memo') {
    return '🟢 Groen';
  }

  if (!questionOptions || questionOptions.length === 0) {
    return '🟡 Geel';
  }

  const totalOptions = questionOptions.length;
  const answerIndex = questionOptions.indexOf(answer);
  
  if (answerIndex === -1) {
    return '🟡 Geel';
  }

  if (totalOptions === 2) {
    return answerIndex === 0 ? '🟢 Groen' : '🔴 Rood';
  } 
  else if (totalOptions === 3) {
    if (answerIndex === 0) return '🟢 Groen';
    if (answerIndex === 1) return '🟡 Geel';
    return '🔴 Rood';
  }
  else if (totalOptions === 4) {
    if (answerIndex === 0) return '🟢 Groen';
    if (answerIndex === 1) return '🟡 Geel';
    if (answerIndex === 2) return '🟠 Oranje';
    return '🔴 Rood';
  }
  else if (totalOptions >= 5) {
    if (answerIndex === 0) return '🟢 Groen';
    if (answerIndex === 1) return '🟡 Geel';
    if (answerIndex === 2) return '🟠 Oranje';
    if (answerIndex === 3) return '🔴 Rood';
    return '🟣 Donkerrood';
  }

  return '🟡 Geel';
}

// Speciale kleuren logic (same as before)
function getSmartResponseColor(question, answer, questionOptions, questionType) {
  const lowerQuestion = question.toLowerCase();

  console.log('Color debug:', { question: lowerQuestion, answer, options: questionOptions });

  // Vragen die geen kleuren krijgen (altijd geel/neutraal)
  const neutralQuestions = [
    'volatiliteit',
    'te spelen',
    'waarom doe je dit'
  ];
  
  const isNeutralQuestion = neutralQuestions.some(keyword => 
    lowerQuestion.includes(keyword)
  );
  
  if (isNeutralQuestion) {
    console.log('Neutral question - always yellow');
    return '🟡 Geel';
  }

  // Negatieve vragen
  const negativeQuestions = [
    'heb je fomo', 'heb je revenge trades', 'chase je price',
    'voel je druk', 'ben je sloppy', 'oude patronen', 'heb je oude patronen gezien'
  ];

  // Check voor nummer scales
  const isNumberScale = questionOptions && questionOptions.length > 2 && 
    questionOptions.every(opt => !isNaN(opt) || opt.match(/^\d+$/));

  const isNegativeQuestion = negativeQuestions.some(keyword => 
    lowerQuestion.includes(keyword)
  );

  if (isNegativeQuestion && questionOptions) {
    const totalOptions = questionOptions.length;
    const answerIndex = questionOptions.indexOf(answer);
    
    if (answerIndex !== -1) {
      const reversedIndex = totalOptions - 1 - answerIndex;
      
      if (totalOptions === 2) {
        return reversedIndex === 0 ? '🟢 Groen' : '🔴 Rood';
      } 
      else if (totalOptions === 3) {
        if (reversedIndex === 0) return '🟢 Groen';
        if (reversedIndex === 1) return '🟡 Geel';
        return '🔴 Rood';
      }
      else if (totalOptions === 4) {
        if (reversedIndex === 0) return '🟢 Groen';
        if (reversedIndex === 1) return '🟡 Geel';
        if (reversedIndex === 2) return '🟠 Oranje';
        return '🔴 Rood';
      }
      else if (totalOptions >= 5) {
        if (reversedIndex === 0) return '🟢 Groen';
        if (reversedIndex === 1) return '🟡 Geel';
        if (reversedIndex === 2) return '🟠 Oranje';
        if (reversedIndex === 3) return '🔴 Rood';
        return '🟣 Donkerrood';
      }
    }
  }

  if (isNumberScale) {
    const answerIndex = questionOptions.indexOf(answer);
    const totalOptions = questionOptions.length;
    
    if (answerIndex !== -1) {
      const reversedIndex = totalOptions - 1 - answerIndex;
      
      if (totalOptions <= 5) {
        if (reversedIndex === 0) return '🟢 Groen';
        if (reversedIndex === 1) return '🟡 Geel';
        if (reversedIndex === 2) return '🟠 Oranje';
        if (reversedIndex === 3) return '🔴 Rood';
        return '🟣 Donkerrood';
      } else {
        if (reversedIndex <= 1) return '🟢 Groen';
        if (reversedIndex <= 3) return '🟡 Geel';
        if (reversedIndex <= 5) return '🟠 Oranje';
        if (reversedIndex <= 7) return '🔴 Rood';
        return '🟣 Donkerrood';
      }
    }
  }

  // Positieve vragen
  const positiveQuestions = [
    'heb je je plan gevolgd', 'ben je mechanisch gebleven', 'heb je je regels gevolgd',
    'trade je zoals de persoon die je wilt zijn', 'wacht je op je trigger', 'ben je een leeuw',
    'heb je de 4r+ regel toegepast', 'ben je dankbaar', 'ben je vandaag 1% gegroeid',
    'tevreden', 'goed voorbereid', 'volledig voorbereid', 'prep gedaan', 'ready', 'goede reden'
  ];

  const isPositiveQuestion = positiveQuestions.some(keyword => 
    lowerQuestion.includes(keyword)
  );

  if (isPositiveQuestion) {
    return getResponseColor(answer, questionOptions, questionType);
  }

  return getResponseColor(answer, questionOptions, questionType);
}

export default async function handler(req, res) {
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      question, answer, category = 'General', time_of_day = 'Unknown',
      response_type = 'Text', question_options = [], mood, market_session, tags,
      media_type, media_url, media_file_size, media_description
    } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    console.log('Token starts with:', process.env.NOTION_TOKEN?.substring(0, 4));
    
    // Bepaal kleur
    const responseColor = getSmartResponseColor(
      question, answer, question_options, response_type
    );

    console.log('Calculated color:', responseColor);

    // Bereken dagelijkse score
    const dailyScoreData = await calculateDailyScore();
    
    // Base properties
    const properties = {
      'Name': {
        title: [{ text: { content: `${category} - ${new Date().toLocaleDateString()}` } }]
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
      'Daily_Score': {  // NIEUWE KOLOM
        number: dailyScoreData.score
      },
      'Time': {
        select: { name: time_of_day }
      },
      'Date': {
        date: { start: new Date().toISOString().split('T')[0] }
      }
    };

    // Add optional properties
    if (mood) {
      properties['Mood'] = { select: { name: mood } };
    }

    if (market_session) {
      properties['Market Session'] = { select: { name: market_session } };
    }

    if (tags) {
      properties['Tags'] = {
        multi_select: tags.split(',').map(tag => ({ name: tag.trim() }))
      };
    }

    // Add media properties
    if (media_type) {
      properties['Media_Type'] = { select: { name: media_type } };
    }

    if (media_url) {
      properties['Media_URL'] = { url: media_url };
    }

    if (media_file_size) {
      properties['Media_File_Size'] = { number: parseInt(media_file_size) || 0 };
    }

    if (media_description) {
      properties['Media_Description'] = {
        rich_text: [{ text: { content: media_description } }]
      };
    }

    if (media_type) {
      properties['Media_Timestamp'] = {
        date: { start: new Date().toISOString() }
      };
    }

    console.log('Sending to Notion with Daily Score:', dailyScoreData);

    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties
    });

    console.log('Notion response received:', response.id);

    return res.status(200).json({
      success: true,
      message: 'Entry added to Notion database',
      notion_id: response.id,
      media_included: !!media_type,
      color_assigned: responseColor,
      daily_score: dailyScoreData.score,
      total_answers_today: dailyScoreData.totalAnswers,
      average_score: dailyScoreData.averageScore
    });

  } catch (error) {
    console.error('Error adding to Notion:', error);
    return res.status(500).json({
      error: 'Failed to add entry to Notion',
      details: error.message
    });
  }
}
