} else if (text === '/hello') {
  await sendMessage(chatId, "✅ Hello werkt! Bot code is updated.");
          
} else if (text === '/progress') {
  const progress = getUserProgress(chatId);
  let progressText = "📊 **Vraag Progress:**\n\n";
  
  Object.keys(progress).forEach(category => {
    const data = progress[category];
    const icon = getCategoryIcon(category);
    progressText += `${icon} ${category}: ${data.asked}/${data.total} (${data.percentage}%)\n`;
  });
  
  await sendMessage(chatId, progressText);
