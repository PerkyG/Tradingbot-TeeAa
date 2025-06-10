// api/telegram-webhook.js
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = 'https://tradingbot-tee-aa.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const messageText = message.text;
    const userId = message.from.id;

    console.log(`Message from ${userId}: ${messageText}`);

    // Bot commands
    if (messageText.startsWith('/start')) {
      await sendMessage(chatId, 
        "🤖 Welkom bij je Trading Journal Bot!\n\n" +
        "Ik ga je 3x per dag vragen stellen over je trading:\n" +
        "📅 Ochtend: Doelen voor vandaag\n" +
        "📈 Middag: Hoe gaan je trades?\n" +
        "📊 Avond: Wat heb je geleerd?\n\n" +
        "Type /morning, /afternoon, of /evening om een vraag te krijgen!"
      );
    } 
    else if (messageText.startsWith('/morning')) {
      await askQuestion(chatId, 'morning');
    }
    else if (messageText.startsWith('/afternoon')) {
      await askQuestion(chatId, 'afternoon');
    }
    else if (messageText.startsWith('/evening')) {
      await askQuestion(chatId, 'evening');
    }
    else if (messageText.startsWith('/test')) {
      await testNotionAPI(chatId);
    }
    else {
      // Check if this is an answer to a previous question
      await handleAnswer(chatId, messageText, userId);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function askQuestion(chatId, timeOfDay) {
  const questions = {
    morning: [
      "🌅 Wat zijn je trading doelen voor vandaag?",
      "📊 Welke markten ga je vandaag volgen?", 
      "💡 Wat is je strategie voor vandaag?"
    ],
    afternoon: [
      "📈 Hoe gaan je trades tot nu toe?",
      "🎯 Heb je je ochtend doelen behaald?",
      "⚡ Welke kansen zie je nog voor de rest van de dag?"
    ],
    evening: [
      "📋 Wat heb je geleerd van je trades vandaag?",
      "💰 Wat waren je beste en slechtste trades?",
      "🔍 Wat ga je morgen anders doen?"
    ]
  };

  const questionList = questions[timeOfDay];
  const randomQuestion = questionList[Math.floor(Math.random() * questionList.length)];
  
  // Send question with instruction in one message
  await sendMessage(chatId, 
    randomQuestion + "\n\n" +
    "💬 Typ je antwoord hieronder - ik sla het automatisch op in je Notion database!"
  );
}

async function handleAnswer(chatId, answer, userId) {
  // For now, we'll assume any non-command message is an answer
  if (answer.length < 10) {
    await sendMessage(chatId, 
      "🤔 Je antwoord lijkt wat kort. Kun je wat meer details geven? " +
      "Dit helpt je later bij het analyseren van je trading patronen!"
    );
    return;
  }

  try {
    // Determine time of day
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    if (hour >= 18) timeOfDay = 'evening';

    // Get appropriate question based on time
    const currentQuestion = getCurrentQuestion(timeOfDay);

    // Send to Notion API
    const response = await fetch(`${API_URL}/api/trading-journal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: currentQuestion,
        answer: answer,
        mood: null, // We can ask for mood later
        time: capitalize(timeOfDay),
        market_session: getMarketSession()
      })
    });

    if (response.ok) {
      await sendMessage(chatId, 
        "✅ Je antwoord is opgeslagen in je Notion database!\n\n" +
        "🔥 Keep it up! Consistent journaling verbetert je trading performance."
      );
    } else {
      throw new Error('API call failed');
    }

  } catch (error) {
    console.error('Error saving to Notion:', error);
    await sendMessage(chatId, 
      "❌ Er ging iets mis bij het opslaan. Probeer het later nog eens.\n" +
      "Je antwoord was: " + answer.substring(0, 100) + "..."
    );
  }
}

async function testNotionAPI(chatId) {
  try {
    const response = await fetch(`${API_URL}/api/trading-journal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'Test van Telegram Bot',
        answer: 'Dit is een test bericht vanuit de Telegram bot',
        mood: '4',
        time: 'Afternoon'
      })
    });

    if (response.ok) {
      await sendMessage(chatId, "✅ Test succesvol! Bot is verbonden met Notion.");
    } else {
      await sendMessage(chatId, "❌ Test gefaald. Check je API configuratie.");
    }
  } catch (error) {
    await sendMessage(chatId, "❌ Kan API niet bereiken: " + error.message);
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
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      console.error('Failed to send message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function getCurrentQuestion(timeOfDay) {
  const questions = {
    morning: "Wat zijn je trading doelen voor vandaag?",
    afternoon: "Hoe gaan je trades tot nu toe?",
    evening: "Wat heb je geleerd van je trades vandaag?"
  };
  return questions[timeOfDay] || "Hoe was je trading vandaag?";
}

function getMarketSession() {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  // Weekend
  if (day === 0 || day === 6) return 'Closed';
  
  // Weekdays (aangepast voor Nederlandse tijd)
  if (hour < 15 || hour > 22) return 'After-hours';
  if (hour >= 15 && hour <= 22) return 'Market';
  return 'Pre-market';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
