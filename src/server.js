/**
 * ============================================================================
 * SERVIDOR EXPRESS / API REST DE PRUEBA Y WEBHOOKS
 * ============================================================================
 */

import express from "express";
import QRCode from "qrcode";
import { BotEngine } from "./botEngine.js";
import { stateManager } from "./stateManager.js";
import { salonConfig } from "./config.js";
import { calendarService } from "./calendarService.js";
import { latestQR, latestQRDataURL, isConnected } from "./whatsappClient.js";

export function createExpressServer() {
  const app = express();
  app.use(express.json());

  // 1. Página Web para escanear el QR nítidamente en el navegador
  app.get("/qr", async (req, res) => {
    // Si ya está conectado, mostrar mensaje de confirmación
    if (isConnected) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>WhatsApp Conectado</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f0fdf4;
              color: #166534;
              text-align: center;
              padding: 20px;
            }
            .card {
              background: #ffffff;
              padding: 36px 32px;
              border-radius: 16px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.06);
              border: 1px solid #bbf7d0;
              max-width: 400px;
              width: 100%;
            }
            h1 { margin: 0 0 12px; font-size: 26px; color: #15803d; }
            p { margin: 0; font-size: 17px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🟢 Conectado</h1>
            <p>WhatsApp ya está conectado y listo para usar.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Si aún no se ha generado el QR, mostrar mensaje de espera
    if (!latestQR && !latestQRDataURL) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="5">
          <title>Generando QR - WhatsApp</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f8fafc;
              color: #334155;
              text-align: center;
              padding: 20px;
            }
            .card {
              background: #ffffff;
              padding: 36px 32px;
              border-radius: 16px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.06);
              border: 1px solid #e2e8f0;
              max-width: 400px;
              width: 100%;
            }
            h2 { margin: 0 0 10px; color: #0284c7; font-size: 22px; }
            p { margin: 0; color: #64748b; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>⏳ Generando código QR...</h2>
            <p>Por favor espera un momento, la página se recargará automáticamente.</p>
          </div>
        </body>
        </html>
      `);
    }

    try {
      // Obtener o generar Data URL (base64) del código QR
      const qrDataUrl = latestQRDataURL || await QRCode.toDataURL(latestQR, { width: 300, margin: 2 });

      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="15">
          <title>Escanear QR - WhatsApp</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #0f172a;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background-color: #1e293b;
              padding: 32px 24px;
              border-radius: 20px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
              border: 1px solid #334155;
              text-align: center;
              max-width: 380px;
              width: 100%;
            }
            h2 {
              margin: 0 0 12px 0;
              font-size: 22px;
              color: #38bdf8;
            }
            p.instructions {
              margin: 0 0 20px 0;
              font-size: 15px;
              color: #cbd5e1;
              line-height: 1.4;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 10px 0 20px 0;
            }
            img.qr-image {
              width: 300px;
              height: 300px;
              border-radius: 12px;
              background: #ffffff;
              padding: 10px;
              box-sizing: border-box;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .steps {
              background: #0f172a;
              border-radius: 10px;
              padding: 14px 16px;
              text-align: left;
              margin: 0 0 16px 0;
            }
            .steps p {
              margin: 6px 0;
              font-size: 13px;
              color: #94a3b8;
            }
            .steps p strong {
              color: #f1f5f9;
            }
            .footer-info {
              font-size: 12px;
              color: #64748b;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>📲 Vincular WhatsApp</h2>
            <p class="instructions">Por favor, abre WhatsApp en tu teléfono y escanea este código QR para conectar el bot:</p>
            <div class="qr-container">
              <img class="qr-image" src="${qrDataUrl}" alt="Código QR WhatsApp" width="300" height="300" />
            </div>
            <div class="steps">
              <p>1. Abre WhatsApp en tu celular</p>
              <p>2. Ve a <strong>Ajustes / Menú > Dispositivos vinculados</strong></p>
              <p>3. Toca en <strong>Vincular un dispositivo</strong> y apunta tu cámara</p>
            </div>
            <p class="footer-info">🔄 Esta página se actualiza automáticamente cada 15 segundos.</p>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      console.error("❌ Error al servir la ruta /qr:", err);
      return res.status(500).send("Error generando código QR: " + err.message);
    }
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
