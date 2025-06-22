// api/cron/daily-questions.js - 4 Tijdsloten
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CRON_SECRET = process.env.CRON_SECRET;

// Categorieën per tijdslot
const TIME_CATEGORIES = {
  morning_early: ['motivatie', 'doelen'], // 07:15 - 2 vragen
  morning_late: ['voorbereiding', 'marktanalyse', 'strategie'], // 11:00 - 3 vragen  
  afternoon: ['psychologie', 'discipline', 'risico'], // 14:30 - 3 vragen
  evening: ['performance', 'reflectie', 'ontwikkeling', 'inzichten'] // 20:30 - 4 vragen
};

async function sendMessage(text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML'
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

function determineTimeSlot() {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  
  // Convert to minutes for easier comparison
  const currentTime = hour * 60 + minute;
  
  // UTC tijden (Nederlandse tijd - 1 uur in winter, -2 in zomer)
  const morningEarly = 6 * 60 + 15;  // 06:15 UTC = 07:15 NL
  const morningLate = 10 * 60;       // 10:00 UTC = 11:00 NL  
  const afternoon = 13 * 60 + 30;    // 13:30 UTC = 14:30 NL
  const evening = 19 * 60 + 30;      // 19:30 UTC = 20:30 NL
  
  // Bepaal welk tijdslot het dichtst bij is (binnen 30 minuten)
  if (Math.abs(currentTime - morningEarly) <= 30) {
    return 'morning_early';
  } else if (Math.abs(currentTime - morningLate) <= 30) {
    return 'morning_late';
  } else if (Math.abs(currentTime - afternoon) <= 30) {
    return 'afternoon';
  } else if (Math.abs(currentTime - evening) <= 30) {
    return 'evening';
  }
  
  // Fallback op basis van tijd
  if (currentTime < 9 * 60) return 'morning_early';
  if (currentTime < 12 * 60) return 'morning_late';
  if (currentTime < 17 * 60) return 'afternoon';
  return 'evening';
}

function getTimeSlotMessage(timeSlot) {
  const messages = {
    morning_early: "🌅 **Goedemorgen! Ready to be a King today?** 🦁\n\nTime for some motivation and goal setting:",
    morning_late: "📊 **Pre-Market Check** 📈\n\nMarket prep time - let's get ready:",
    afternoon: "🧠 **Middag Check-in** 💪\n\nHow's your mindset and discipline?",
    evening: "🌙 **Einde Dag Reflectie** 🔍\n\nTime to review and reflect:"
  };
  
  return messages[timeSlot] || "🎯 **Trading Journal Check** 🦁";
}

function getCategoryButtons(categories) {
  const icons = {
    motivatie: "🎯", doelen: "📋", voorbereiding: "📊", marktanalyse: "📈",
    strategie: "🎲", psychologie: "🧠", discipline: "💪", risico: "⚠️",
    performance: "📊", reflectie: "🔍", ontwikkeling: "🌱", inzichten: "💡"
  };
  
  const buttons = categories.map(cat => [{
    text: `${icons[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
    callback_data: `cat_${cat}`
  }]);
  
  return { inline_keyboard: buttons };
}

export default async function handler(req, res) {
  // Security check
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Daily questions cron triggered');
    
    const timeSlot = determineTimeSlot();
    const categories = TIME_CATEGORIES[timeSlot];
    
    console.log(`Time slot: ${timeSlot}, Categories: ${categories.join(', ')}`);
    
    const message = getTimeSlotMessage(timeSlot);
    const keyboard = getCategoryButtons(categories);
    
    await sendMessage(message, keyboard);
    
    console.log(`Sent ${categories.length} category options for ${timeSlot}`);
    
    return res.status(200).json({ 
      success: true, 
      timeSlot: timeSlot,
      categories: categories,
      message: 'Daily questions sent successfully' 
    });
    
  } catch (error) {
    console.error('Error sending daily questions:', error);
    return res.status(500).json({ error: 'Failed to send daily questions' });
  }
}
