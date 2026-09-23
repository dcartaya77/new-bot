/**
 * ============================================================================
 * CONECTOR DE WHATSAPP (Baileys Engine)
 * ============================================================================
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import fs from "fs";
import { BotEngine } from "./botEngine.js";

export let latestQR = null;
export let isConnected = false;

export async function startWhatsAppClient() {
  console.log("⚡ [WhatsApp] Iniciando cliente Baileys...");

  const { state, saveCreds } = await useMultiFileAuthState("auth_session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["EstudioCejas", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR = qr;
      console.log("\n=======================================================");
      console.log("📲 ESCANEA EL CÓDIGO QR EN TU TELÉFONO:");
      console.log("👉 O abre en tu navegador: http://localhost:3000/qr");
      console.log("=======================================================\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      isConnected = false;
      latestQR = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      // Error 401: Sesión cerrada desde el teléfono o credenciales expiradas
      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        console.log("🔄 [WhatsApp] Sesión anterior cerrada o inválida (401). Limpiando credenciales antiguas...");
        try {
          fs.rmSync("auth_session", { recursive: true, force: true });
        } catch (e) {
          // Ignorar si no existe
        }
        console.log("⚡ Generando nuevo código QR en 2 segundos...\n");
        setTimeout(startWhatsAppClient, 2000);
        return;
      }

      console.log(`⚠️ Conexión cerrada (${statusCode || "Desconexión"}). Reconectando en 3s...`);
      setTimeout(startWhatsAppClient, 3000);
    } else if (connection === "open") {
      isConnected = true;
      latestQR = null;
      console.log("\n🟢 [WhatsApp] ¡CONECTADO CON ÉXITO! El bot de citas está activo y listo para responder.\n");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const remoteJid = msg.key.remoteJid;

      // Filtrar canales/boletines, grupos y estados de WhatsApp
      if (
        remoteJid.includes("@g.us") ||
        remoteJid.includes("@newsletter") ||
        remoteJid === "status@broadcast"
      ) {
        continue;
      }

      const messageContent =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.buttonsResponseMessage?.selectedButtonId ||
        "";

      if (!messageContent.trim()) continue;

      console.log(`\n📩 [Mensaje de ${remoteJid}]: "${messageContent}"`);

      try {
        await sock.sendPresenceUpdate("composing", remoteJid);
        await new Promise((r) => setTimeout(r, 1000));

        const replyText = await BotEngine.processMessage(remoteJid, messageContent);
        await sock.sendMessage(remoteJid, { text: replyText });
        await sock.sendPresenceUpdate("available", remoteJid);
        console.log(`📤 [Respuesta enviada a ${remoteJid}]`);
      } catch (err) {
        console.error("❌ Error al procesar mensaje:", err);
      }
    }
  });

  return sock;
}
