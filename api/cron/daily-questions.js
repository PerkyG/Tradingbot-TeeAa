// api/cron/daily-questions.js
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Je eigen chat ID

export default async function handler(req, res) {
  // Alleen cron jobs en manual triggers accepteren
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const hour = new Date().getHours();
    let timeOfDay = '';
    let question = '';

    // Bepaal tijd van dag en vraag
    if (hour >= 8 && hour <= 10) {
      timeOfDay = 'morning';
      question = "🌅 Goedemorgen! Wat zijn je trading doelen voor vandaag?";
    } else if (hour >= 13 && hour <= 15) {
      timeOfDay = 'afternoon';
      question = "📈 Hoe gaan je trades tot nu toe? Blijf je bij je strategie?";
    } else if (hour >= 18 && hour <= 20) {
      timeOfDay = 'evening';
      question = "📊 Wat heb je geleerd van je trades vandaag? Wat ga je morgen anders doen?";
    } else {
      return res.status(200).json({ message: 'Not time for questions yet' });
    }

    // Stuur vraag naar gebruiker
    await sendMessage(CHAT_ID, question);
    
    console.log(`Sent ${timeOfDay} question at ${new Date().toISOString()}`);
    
    return res.status(200).json({ 
      success: true, 
      timeOfDay,
      question,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_markup: {
          inline_keyboard: [[
            { text: "📝 Antwoorden", callback_data: "ready_to_answer" }
          ]]
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to send message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
