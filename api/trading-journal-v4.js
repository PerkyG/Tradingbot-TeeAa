// api/trading-journal-v4.js - Met Kleuren Systeem
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Kleuren logic functie
function getResponseColor(answer, questionOptions, questionType) {
  // Open vragen en media altijd geel (neutraal)
  if (questionType === 'open' || questionType === 'media') {
    return '🟡 Geel';
  }

  // Memo vragen altijd groen (gezien = goed)
  if (questionType === 'memo') {
    return '🟢 Groen';
  }

  // Multiple choice kleuren op basis van aantal opties
  if (!questionOptions || questionOptions.length === 0) {
    return '🟡 Geel'; // Default
  }

  const totalOptions = questionOptions.length;
  const answerIndex = questionOptions.indexOf(answer);
  
  // Als antwoord niet gevonden, default geel
  if (answerIndex === -1) {
    return '🟡 Geel';
  }

  // Kleuren toekenning op basis van aantal opties
  if (totalOptions === 2) {
    // 2 opties: Groen/Rood
    return answerIndex === 0 ? '🟢 Groen' : '🔴 Rood';
  } 
  else if (totalOptions === 3) {
    // 3 opties: Groen/Geel/Rood
    if (answerIndex === 0) return '🟢 Groen';
    if (answerIndex === 1) return '🟡 Geel';
    return '🔴 Rood';
  }
  else if (totalOptions === 4) {
    // 4 opties: Groen/Geel/Oranje/Rood
    if (answerIndex === 0) return '🟢 Groen';
    if (answerIndex === 1) return '🟡 Geel';
    if (answerIndex === 2) return '🟠 Oranje';
    return '🔴 Rood';
  }
  else if (totalOptions >= 5) {
    // 5+ opties: Groen/Geel/Oranje/Rood/Donkerrood
    if (answerIndex === 0) return '🟢 Groen';
    if (answerIndex === 1) return '🟡 Geel';
    if (answerIndex === 2) return '🟠 Oranje';
    if (answerIndex === 3) return '🔴 Rood';
    return '🟣 Donkerrood';
  }

  return '🟡 Geel'; // Fallback
}

// Speciale kleuren logic voor specifieke vragen
function getSmartResponseColor(question, answer, questionOptions, questionType) {
  const lowerQuestion = question.toLowerCase();
  const lowerAnswer = answer.toLowerCase();

  console.log('Color debug:', { question: lowerQuestion, answer, options: questionOptions });

  // Negatieve vragen (Ja = slecht/rood, Nee = goed/groen)
  const negativeQuestions = [
    'heb je fomo',
    'heb je revenge trades', 
    'chase je price',
    'voel je druk',
    'ben je sloppy',
    'oude patronen', // Ja = rood, Nee = groen
    'heb je oude patronen gezien' // Ja = rood, Nee = groen
  ];

  // Check voor nummer scales (1-5, 1-10, etc) - hoger = beter
  const isNumberScale = questionOptions && questionOptions.length > 2 && 
    questionOptions.every(opt => !isNaN(opt) || opt.match(/^\d+$/));

  console.log('Is number scale:', isNumberScale);

  // Check of het een negatieve vraag is
  const isNegativeQuestion = negativeQuestions.some(keyword => 
    lowerQuestion.includes(keyword)
  );

  console.log('Is negative question:', isNegativeQuestion);

  if (isNegativeQuestion && questionOptions) {
    // Voor negatieve vragen: omgekeerde kleuren (Ja = rood, Nee = groen)
    const totalOptions = questionOptions.length;
    const answerIndex = questionOptions.indexOf(answer);
    
    console.log('Negative question logic:', { answerIndex, totalOptions });
    
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

  // Check voor nummer scales waar hoger = beter
  if (isNumberScale) {
    const answerIndex = questionOptions.indexOf(answer);
    const totalOptions = questionOptions.length;
    
    console.log('Number scale logic:', { answerIndex, totalOptions, answer });
    
    if (answerIndex !== -1) {
      // Voor nummer scales: laatste optie (hoogste nummer) = groen
      const reversedIndex = totalOptions - 1 - answerIndex;
      
      if (totalOptions <= 5) {
        if (reversedIndex === 0) return '🟢 Groen';
        if (reversedIndex === 1) return '🟡 Geel';
        if (reversedIndex === 2) return '🟠 Oranje';
        if (reversedIndex === 3) return '🔴 Rood';
        return '🟣 Donkerrood';
      } else {
        // Voor 1-10 scale
        if (reversedIndex <= 1) return '🟢 Groen';
        if (reversedIndex <= 3) return '🟡 Geel';
        if (reversedIndex <= 5) return '🟠 Oranje';
        if (reversedIndex <= 7) return '🔴 Rood';
        return '🟣 Donkerrood';
      }
    }
  }

  // Positieve vragen (eerste optie = beste, of voor scales: hoger = beter)
  const positiveQuestions = [
    'heb je je plan gevolgd',
    'ben je mechanisch gebleven', 
    'heb je je regels gevolgd',
    'trade je zoals de persoon die je wilt zijn',
    'wacht je op je trigger',
    'ben je een leeuw',
    'heb je de 4r+ regel toegepast',
    'ben je dankbaar',
    'ben je vandaag 1% gegroeid',
    'tevreden', // Scale vraag: 5 = groen, 1 = donkerrood
    'goed voorbereid', // Meest eens = groen, minst eens = donkerrood
    'volledig voorbereid',
    'prep gedaan',
    'ready',
    'goede reden' // Ja duidelijk = groen, Nee geen reden = donkerrood
  ];

  const isPositiveQuestion = positiveQuestions.some(keyword => 
    lowerQuestion.includes(keyword)
  );

  console.log('Is positive question:', isPositiveQuestion);

  if (isPositiveQuestion) {
    // Voor positieve vragen: eerste antwoord = groen, laatste = rood
    return getResponseColor(answer, questionOptions, questionType);
  }

  // Default logic voor andere vragen
  console.log('Using default logic');
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
      question, 
      answer, 
      category = 'General',
      time_of_day = 'Unknown',
      response_type = 'Text',
      question_options = [], // Nieuwe parameter voor kleuren logic
      mood,
      market_session,
      tags,
      // Media fields
      media_type,
      media_url,
      media_file_size,
      media_description
    } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    console.log('Token starts with:', process.env.NOTION_TOKEN?.substring(0, 4));
    
    // Bepaal kleur op basis van antwoord
    const responseColor = getSmartResponseColor(
      question, 
      answer, 
      question_options, 
      response_type
    );

    console.log('Calculated color:', responseColor);
    
    // Base properties
    const properties = {
      'Name': {
        title: [
          {
            text: {
              content: `${category} - ${new Date().toLocaleDateString()}`
            }
          }
        ]
      },
      'Question': {
        rich_text: [
          {
            text: {
              content: question
            }
          }
        ]
      },
      'Answer': {
        rich_text: [
          {
            text: {
              content: answer
            }
          }
        ]
      },
      'Category': {
        select: {
          name: category
        }
      },
      'Response_Type': {
        select: {
          name: response_type
        }
      },
      'Response_Color': {  // NIEUWE KOLOM
        select: {
          name: responseColor
        }
      },
      'Time': {
        select: {
          name: time_of_day
        }
      },
      'Date': {
        date: {
          start: new Date().toISOString().split('T')[0]
        }
      }
    };

    // Add optional original properties if provided
    if (mood) {
      properties['Mood'] = {
        select: {
          name: mood
        }
      };
    }

    if (market_session) {
      properties['Market Session'] = {
        select: {
          name: market_session
        }
      };
    }

    if (tags) {
      properties['Tags'] = {
        multi_select: tags.split(',').map(tag => ({ name: tag.trim() }))
      };
    }

    // Add media properties if provided
    if (media_type) {
      properties['Media_Type'] = {
        select: {
          name: media_type
        }
      };
    }

    if (media_url) {
      properties['Media_URL'] = {
        url: media_url
      };
    }

    if (media_file_size) {
      properties['Media_File_Size'] = {
        number: parseInt(media_file_size) || 0
      };
    }

    if (media_description) {
      properties['Media_Description'] = {
        rich_text: [
          {
            text: {
              content: media_description
            }
          }
        ]
      };
    }

    if (media_type) {
      properties['Media_Timestamp'] = {
        date: {
          start: new Date().toISOString()
        }
      };
    }

    console.log('Sending to Notion:', properties);

    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: properties
    });

    console.log('Notion response received:', response.id);

    return res.status(200).json({
      success: true,
      message: 'Entry added to Notion database',
      notion_id: response.id,
      media_included: !!media_type,
      color_assigned: responseColor
    });

  } catch (error) {
    console.error('Error adding to Notion:', error);
    return res.status(500).json({
      error: 'Failed to add entry to Notion',
      details: error.message
    });
  }
}
