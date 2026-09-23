/**
 * ============================================================================
 * PUNTO DE ENTRADA PRINCIPAL (Index)
 * ============================================================================
 * Inicia la API de Express y el conector de WhatsApp (Baileys).
 */

import "dotenv/config";
import { createExpressServer } from "./server.js";
import { startWhatsAppClient } from "./whatsappClient.js";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  console.log("=================================================");
  console.log("🚀 INICIANDO BOT DE CALIFICACIÓN Y AGENDAMIENTO");
  console.log("=================================================");

  // 1. Iniciar Servidor Express (API de citas, webhooks y visualizador QR)
  const app = createExpressServer();
  app.listen(PORT, () => {
    console.log(`🌐 [Express Server] Corriendo en puerto ${PORT}`);
    console.log(`👉 Escanea el QR aquí:        http://localhost:${PORT}/qr`);
    console.log(`👉 Estado y citas:            http://localhost:${PORT}/api/health`);
    console.log(`👉 Endpoint de prueba chat:   POST http://localhost:${PORT}/api/chat`);
  });

  // 2. Iniciar Cliente de WhatsApp
  try {
    await startWhatsAppClient();
  } catch (err) {
    console.error("❌ Error al iniciar el cliente de WhatsApp:", err);
    console.log("ℹ️ La API de Express sigue activa para pruebas vía HTTP.");
  }
}

bootstrap();
