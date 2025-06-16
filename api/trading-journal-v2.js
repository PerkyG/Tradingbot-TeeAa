// api/trading-journal-v2.js - Updated met nieuwe media kolommen
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      question,
      answer,
      category,
      response_type,
      time_of_day,
      question_type,
      // Nieuwe media velden
      media_type,
      media_description,
      media_url,
      media_file_size,
      media_timestamp
    } = req.body;

    console.log('Request body:', req.body);

    // Validate required fields
    if (!question || !answer) {
      return res.status(400).json({ 
        error: 'Missing required fields: question and answer are required' 
      });
    }

    // Build de properties object
    const properties = {
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
      "Category": {
        "select": {
          "name": category || "Algemeen"
        }
      },
      "Response Type": {
        "select": {
          "name": response_type || "Text"
        }
      },
      "Time of Day": {
        "select": {
          "name": time_of_day || "Unknown"
        }
      },
      "Question Type": {
        "select": {
          "name": question_type || "open"
        }
      },
      "Date": {
        "date": {
          "start": new Date().toISOString().split('T')[0]
        }
      }
    };

    // Voeg nieuwe media kolommen toe indien van toepassing
    if (media_type) {
      properties["Type"] = {
        "select": {
          "name": media_type
        }
      };
    }

    if (media_description) {
      properties["Description"] = {
        "rich_text": [
          {
            "text": {
              "content": media_description
            }
          }
        ]
      };
    }

    if (media_url) {
      properties["URL"] = {
        "url": media_url
      };
    }

    if (media_file_size) {
      properties["File Size"] = {
        "number": parseInt(media_file_size) || 0
      };
    }

    if (media_timestamp) {
      properties["Timestamp"] = {
        "date": {
          "start": media_timestamp
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

    console.log('Notion response:', response);

    res.status(200).json({ 
      message: 'Entry added to Notion database with media support',
      notion_id: response.id,
      media_fields_added: {
        type: !!media_type,
        description: !!media_description,
        url: !!media_url,
        file_size: !!media_file_size,
        timestamp: !!media_timestamp
      }
    });

  } catch (error) {
    console.error('Error adding to Notion:', error);
    
    res.status(500).json({ 
      error: 'Failed to add entry to Notion',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper functions voor de Telegram bot
export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

export function getMarketSession() {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  // Weekend
  if (day === 0 || day === 6) return 'Closed';
  
  // Weekdays (EST timezone)
  if (hour < 9 || hour > 16) return 'After-hours';
  if (hour >= 9 && hour <= 16) return 'Market';
  return 'Pre-market';
}
