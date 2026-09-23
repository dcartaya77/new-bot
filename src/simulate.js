/**
 * ============================================================================
 * SIMULADOR INTERACTIVO DE CITAS PARA CEJAS Y PESTAÑAS (CLI Simulator)
 * ============================================================================
 * Ejecuta este script con: npm run simulate
 */

import readline from "readline";
import { BotEngine } from "./botEngine.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const FAKE_USER_ID = "5511999990000@s.whatsapp.net";

console.log("\n=======================================================");
console.log("🌸 SIMULADOR DE CITAS: CEJAS Y PESTAÑAS 🌸");
console.log("Interactúa como un cliente. Para salir pulsa Ctrl+C");
console.log("👉 Tip: Prueba pedir '25/09' a las '14:00' para ver el control de ocupado.");
console.log("👉 Tip: Escribe 'admin resumen' en cualquier momento para ver la agenda.");
console.log("=======================================================\n");

async function startChat() {
  const initialReply = await BotEngine.processMessage(FAKE_USER_ID, "Hola");
  console.log(`🤖 Bot:\n${initialReply}\n`);
  promptUser();
}

function promptUser() {
  rl.question("👤 Tú: ", async (input) => {
    if (!input.trim()) {
      promptUser();
      return;
    }

    const reply = await BotEngine.processMessage(FAKE_USER_ID, input);
    console.log(`\n🤖 Bot:\n${reply}\n`);
    promptUser();
  });
}

startChat();
