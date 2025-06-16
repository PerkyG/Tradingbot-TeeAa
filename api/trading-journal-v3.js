// api/trading-journal-v3.js - Met Media Support
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
    
    // Base properties - using exact property names from your database
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
      'Response_Type': {  // Exact name with underscore
        select: {
          name: response_type
        }
      },
      'Time': {  // Exact name - just "Time"
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

    // Media timestamp - always add current time if media is present
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
      media_included: !!media_type
    });

  } catch (error) {
    console.error('Error adding to Notion:', error);
    return res.status(500).json({
      error: 'Failed to add entry to Notion',
      details: error.message
    });
  }
}
