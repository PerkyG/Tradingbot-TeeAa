// api/trading-journal.js
import { Client } from '@notionhq/client';

// Debug logging
console.log('Token starts with:', process.env.NOTION_TOKEN?.substring(0, 4));
console.log('Database ID length:', process.env.NOTION_DATABASE_ID?.length);

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  // Debug method
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  
  // Alleen POST requests accepteren
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      received: req.method,
      expected: 'POST'
    });
  }

  try {
    const { question, answer, mood, time, market_session, tags } = req.body;

    // Debug environment variables
    console.log('Environment check:', {
      hasToken: !!process.env.NOTION_TOKEN,
      hasDatabase: !!process.env.NOTION_DATABASE_ID,
      tokenStart: process.env.NOTION_TOKEN?.substring(0, 4)
    });

    // Validatie van required fields
    if (!question || !answer) {
      return res.status(400).json({ 
        error: 'Question and answer are required' 
      });
    }

    // Data naar Notion sturen
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        // Title kolom - simpelere syntax
        "Name": {
          "title": [
            {
              "text": {
                "content": `Trading Entry ${new Date().toLocaleDateString()}`
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
        ...(time && {
          "Time": {
            "select": {
              "name": time
            }
          }
        }),
        ...(mood && {
          "Mood": {
            "select": {
              "name": mood.toString()
            }
          }
        }),
        ...(market_session && {
          "Market_Session": {
            "select": {
              "name": market_session
            }
          }
        })
      },
    });

    console.log('Successfully added entry to Notion:', response.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Entry added to Notion database',
      notion_id: response.id
    });

  } catch (error) {
    console.error('Error adding to Notion:', error);
    
    res.status(500).json({ 
      error: 'Failed to add entry to Notion',
      details: error.message
    });
  }
}

// Helper function voor je Telegram bot om te gebruiken
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
  
  // Weekdays (EST timezone - pas aan naar jouw timezone)
  if (hour < 9 || hour > 16) return 'After-hours';
  if (hour >= 9 && hour <= 16) return 'Market';
  return 'Pre-market';
}
