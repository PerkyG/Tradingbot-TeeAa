// api/trading-journal-v2.js - FIXED VERSION
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

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
      mood,
      market_session,
      tags
    } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    console.log('Token starts with:', process.env.NOTION_TOKEN?.substring(0, 4));
    
    // FIXED: Use exact property names from your database
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
      'Response_Type': {  // FIXED: underscore not space
        select: {
          name: response_type
        }
      },
      'Time': {  // FIXED: just "Time" not "Time of Day"
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

    // Add optional properties if provided
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
      notion_id: response.id
    });

  } catch (error) {
    console.error('Error adding to Notion:', error);
    return res.status(500).json({
      error: 'Failed to add entry to Notion',
      details: error.message
    });
  }
}
