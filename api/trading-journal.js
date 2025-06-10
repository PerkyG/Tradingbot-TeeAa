// api/trading-journal.js
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  // Alleen POST requests accepteren
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, answer, mood, time, market_session, tags } = req.body;

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
        // Title kolom (automatisch gegenereerd met timestamp)
        Name: {
          title: [
            {
              text: {
                content: `Entry ${new Date().toISOString().split('T')[0]}`,
              },
            },
          ],
        },
        Question: {
          rich_text: [
            {
              text: {
                content: question,
              },
            },
          ],
        },
        Answer: {
          rich_text: [
            {
              text: {
                content: answer,
              },
            },
          ],
        },
        Date: {
          date: {
            start: new Date().toISOString().split('T')[0],
          },
        },
        Time: time ? {
          select: {
            name: time, // Morning, Afternoon, Evening
          },
        } : null,
        Mood: mood ? {
          select: {
            name: mood.toString(), // 1, 2, 3, 4, 5
          },
        } : null,
        Market_Session: market_session ? {
          select: {
            name: market_session, // Pre-market, Market, After-hours
          },
        } : null,
        Tags: tags && tags.length > 0 ? {
          multi_select: tags.map(tag => ({ name: tag })),
        } : null,
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
