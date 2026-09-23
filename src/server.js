/**
 * ============================================================================
 * SERVIDOR EXPRESS / API REST DE PRUEBA Y WEBHOOKS
 * ============================================================================
 */

import express from "express";
import { BotEngine } from "./botEngine.js";
import { stateManager } from "./stateManager.js";
import { salonConfig } from "./config.js";
import { calendarService } from "./calendarService.js";
import { latestQR, isConnected } from "./whatsappClient.js";

export function createExpressServer() {
  const app = express();
  app.use(express.json());

  // 1. Página Web para escanear el QR nítidamente en el navegador
  app.get("/qr", (req, res) => {
    if (isConnected) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Bot Conectado</title></head>
        <body style="font-family:sans-serif; text-align:center; padding-top:50px; background:#f0fdf4;">
          <h1 style="color:#16a34a;">🟢 ¡WhatsApp Conectado Exitosamente!</h1>
          <p>El bot de citas para cejas y pestañas está activo y respondiendo mensajes.</p>
        </body>
        </html>
      `);
    }

    if (!latestQR) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Generando QR...</title><meta http-equiv="refresh" content="3"></head>
        <body style="font-family:sans-serif; text-align:center; padding-top:50px;">
          <h2>⏳ Generando código QR...</h2>
          <p>Esta página se actualizará automáticamente en 3 segundos.</p>
        </body>
        </html>
      `);
    }

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(latestQR)}&size=350x350`;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Escanear QR - Bot WhatsApp</title>
        <meta http-equiv="refresh" content="20">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: white; text-align: center; padding: 40px 20px; }
          .card { background: #1e293b; max-width: 440px; margin: 0 auto; border-radius: 16px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          img { border-radius: 12px; background: white; padding: 12px; }
          .badge { display: inline-block; background: #38bdf8; color: #0f172a; font-weight: bold; padding: 4px 12px; border-radius: 999px; font-size: 13px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">WHATSAPP WEB QR</div>
          <h2>Studio Miradas Radiantes ✨</h2>
          <p style="color:#94a3b8; font-size:14px;">Abre WhatsApp > Dispositivos vinculados > Vincular un dispositivo</p>
          <img src="${qrImageUrl}" alt="Código QR WhatsApp" width="300" height="300" />
          <p style="color:#64748b; font-size:12px; margin-top:16px;">🔄 Se actualiza automáticamente cada 20 segundos</p>
        </div>
      </body>
      </html>
    `);
  });

  // 2. Endpoint de estado y salud
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      bot: salonConfig.business.name,
      whatsappConnected: isConnected,
      activeSessions: stateManager.sessions.size,
      totalAppointments: calendarService.appointments.length
    });
  });

  // 3. Ver todas las citas agendadas (JSON)
  app.get("/api/appointments", (req, res) => {
    res.json({
      total: calendarService.appointments.length,
      appointments: calendarService.appointments
    });
  });

  // 4. Simulador HTTP para frontend o pruebas
  app.post("/api/chat", async (req, res) => {
    const { userId = "cliente-test", message = "" } = req.body;
    try {
      const reply = await BotEngine.processMessage(userId, message);
      res.json({ success: true, reply });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}
