/**
 * ============================================================================
 * SERVICIO DE NOTIFICACIONES (Webhooks / Make / n8n / Telegram)
 * ============================================================================
 */

export async function notifyLead(leadData) {
  const webhookUrl = process.env.WEBHOOK_URL;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  console.log("\n=======================================================");
  console.log("📢 [NUEVA CITA REGISTRADA]");
  console.log(`👤 Cliente:     ${leadData.name}`);
  console.log(`📱 Teléfono:    +${leadData.phone}`);
  console.log(`✨ Servicio:    ${leadData.servicio}`);
  console.log(`📅 Fecha/Hora:  ${leadData.fecha} a las ${leadData.hora} hs`);
  console.log(`💰 Precio:      ${leadData.precio}`);
  console.log("=======================================================\n");

  const results = { webhook: false, telegram: false };

  // 1. Envío vía Webhook (n8n, Make.com, Zapier)
  if (webhookUrl && webhookUrl.startsWith("http")) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
        signal: AbortSignal.timeout(6000)
      });
      console.log(`✅ [Notifier] Webhook enviado con éxito a: ${webhookUrl} (Status: ${response.status})`);
      results.webhook = true;
    } catch (err) {
      console.error("❌ [Notifier Error] Falló el envío del Webhook:", err.message);
    }
  }

  // 2. Envío directo a Telegram del dueño
  if (telegramToken && telegramChatId) {
    try {
      const message = 
        `💅 *NUEVA CITA CONFIRMADA*\n\n` +
        `👤 *Cliente:* ${leadData.name}\n` +
        `📱 *WhatsApp:* +${leadData.phone}\n` +
        `✨ *Servicio:* ${leadData.servicio} (${leadData.precio})\n` +
        `📅 *Fecha:* ${leadData.fecha} a las ${leadData.hora} hs\n` +
        `🔖 *Código:* #${leadData.appointmentId}\n\n` +
        `⏰ *Registrado:* ${new Date().toLocaleString("es-ES")}`;

      const tgUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
      await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: "Markdown"
        }),
        signal: AbortSignal.timeout(6000)
      });
      console.log("✅ [Notifier] Notificación enviada a Telegram con éxito.");
      results.telegram = true;
    } catch (err) {
      console.error("❌ [Notifier Error] Falló el envío a Telegram:", err.message);
    }
  }

  return results;
}
