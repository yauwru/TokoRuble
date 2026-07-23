async function notifyTelegram(text) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const params = new URLSearchParams({ chat_id: chatId, text, parse_mode: 'HTML' });
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
  } catch {
    // Notifikasi Telegram opsional, kegagalan tidak boleh menggagalkan alur antrian.
  }
}

module.exports = { notifyTelegram };
