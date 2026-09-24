/**
 * ============================================================================
 * SERVICIO DE INTELIGENCIA ARTIFICIAL CON GOOGLE GEMINI (AI Studio)
 * ============================================================================
 * Responde dudas sobre tratamientos de belleza, explica procedimientos y
 * detecta cuándo enviar fotos de referencia del catálogo.
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { salonConfig } from "./config.js";

// Instancia de Google GenAI usando la API Key de Google AI Studio
let aiClient = null;

function getClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Busca si existe una imagen para el servicio especificado en /assets/services
 * @param {string} serviceId - ej: 'lash_lifting', 'cejas_henna', etc.
 * @returns {string|null} Ruta absoluta del archivo o null si no existe
 */
export function findServiceImage(serviceId) {
  if (!serviceId) return null;
  const supportedExts = [".jpg", ".jpeg", ".png", ".webp"];
  const servicesDir = path.resolve("assets", "services");

  for (const ext of supportedExts) {
    const candidate = path.join(servicesDir, `${serviceId}${ext}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Genera el System Instruction dinámicamente con los datos de config.js
 */
function buildSystemInstruction(clientName = "") {
  let servicesInfo = "";
  Object.values(salonConfig.services).forEach((s) => {
    servicesInfo += `- ID: ${s.id} | Nombre: ${s.name} | Precio: ${s.price} | Duración: ${s.duration}\n  Descripción: ${s.description}\n\n`;
  });

  return `
Eres la especialista de belleza y asistente virtual de "${salonConfig.business.name}".
Dirección del salón: ${salonConfig.business.address}
${clientName ? `Nombre de la clienta actual: "${clientName}".` : ""}

Tu personalidad:
- Cálida, educada, empática, profesional y muy estética (usa emojis elegantes con moderación).
- Hablas en español de forma natural y cercana.

Conocimiento de tratamientos y catálogo:
${servicesInfo}

Preguntas frecuentes que sabes responder:
1. Lash Lifting: Procedimiento que curva y eleva las pestañas naturales desde la raíz mediante moldes de silicona, complementado con tinte negro y baño de keratina nutritiva. No daña la pestaña real, no lleva extensiones sintéticas y dura entre 6 y 8 semanas. No duele en lo absoluto.
2. Diseño con Henna: Mapeo facial y visagismo para encontrar la forma armónica de las cejas. Depilación precisa (cera o hilo) y pigmentación natural con henna. Tiñe la piel por 7 a 10 días y el vello por hasta 3 semanas.
3. Extensiones Pelo a Pelo: Adhesión de fibras ultraligeras individuales sobre cada pestaña real. Da volumen o efecto rímel duradero. Retoque recomendado cada 15-20 días.
4. Micropigmentación / Microblading: Técnica semipermanente que rediseña y rellena las cejas pelo a pelo o con efecto sombreado (Powder). Dura de 1 a 2 años. Se usa anestesia tópica para que sea una experiencia muy cómoda.

Reglas fundamentales de respuesta:
1. Respuestas concisas: Máximo 2 párrafos breves, fáciles de leer en una pantalla de WhatsApp.
2. REGLA DE FOTOS: Si la clienta pide ver fotos, resultados, cómo queda un servicio o pregunta por el aspecto visual de un procedimiento, añade al final de tu mensaje la etiqueta exacta: [FOTO:id_servicio]
   (IDs válidos: cejas_henna, extensiones_pestanas, lash_lifting, microblading).
3. Invitación al agendamiento: Al final de tu explicación, invita a la clienta a reservar un turno o ver los horarios disponibles (ejemplo: "¿Te gustaría agendar una cita para esta semana?").
`;
}

/**
 * Genera una respuesta experta de contingencia basada en config.js si la API Key aún no se ha colocado
 */
function getFallbackKnowledgeResponse(userMessage) {
  const clean = userMessage.toLowerCase();
  
  if (clean.includes("lifting")) {
    const s = salonConfig.services["3"];
    return {
      text: `✨ *Lash Lifting y Tinte de Pestañas* (${s.price} - ${s.duration}):\n\n` +
            `Es un tratamiento que curva y eleva tus pestañas naturales desde la raíz mediante almohadillas de silicona hipoalergénicas. ` +
            `Incluye un baño nutritivo de keratina y tinte negro intenso para dar efecto de máscara de pestañas.\n\n` +
            `• No daña tus pestañas reales.\n` +
            `• No requiere extensiones ni adhesivos pesados.\n` +
            `• Los resultados duran de 6 a 8 semanas y no duele en lo absoluto.`,
      imagePath: findServiceImage("lash_lifting"),
      serviceId: "lash_lifting"
    };
  }

  if (clean.includes("henna") || (clean.includes("ceja") && !clean.includes("micro"))) {
    const s = salonConfig.services["1"];
    return {
      text: `✨ *Diseño y Depilación de Cejas con Henna* (${s.price} - ${s.duration}):\n\n` +
            `Realizamos un visagismo y mapeo facial personalizado para encontrar la forma perfecta de tus cejas según tus rasgos. ` +
            `Luego depilamos con precisión y aplicamos pigmento orgánico de Henna.\n\n` +
            `• Sombrea la piel rellenando huequitos por 7 a 10 días.\n` +
            `• Tiñe el vello de las cejas por hasta 3 semanas.`,
      imagePath: findServiceImage("cejas_henna"),
      serviceId: "cejas_henna"
    };
  }

  if (clean.includes("extension") || clean.includes("extensión") || clean.includes("pelo a pelo")) {
    const s = salonConfig.services["2"];
    return {
      text: `✨ *Extensiones de Pestañas Pelo a Pelo* (${s.price} - ${s.duration}):\n\n` +
            `Aplicamos fibras sintéticas ultraligeras y de seda individualmente sobre cada una de tus pestañas naturales. ` +
            `Puedes elegir entre un efecto sutil y natural o mayor volumen y densidad.\n\n` +
            `• Mantienen la curvatura intacta todos los días.\n` +
            `• Recomendamos mantenimiento o retoque cada 15 a 20 días.`,
      imagePath: findServiceImage("extensiones_pestanas"),
      serviceId: "extensiones_pestanas"
    };
  }

  if (clean.includes("micro") || clean.includes("powder")) {
    const s = salonConfig.services["4"];
    return {
      text: `✨ *Micropigmentación / Microblading de Cejas* (${s.price} - ${s.duration}):\n\n` +
            `Técnica semipermanente donde implantamos pigmento en la capa superficial de la piel para recrear vellos hiperrealistas ` +
            `o un efecto de sombreado suave (Powder brows).\n\n` +
            `• Ideal para cejas despobladas o con cicatrices.\n` +
            `• Duración de 1 a 2 años.\n` +
            `• Aplicamos anestesia tópica calmante para garantizar máxima comodidad.`,
      imagePath: findServiceImage("microblading"),
      serviceId: "microblading"
    };
  }

  if (clean.includes("precio") || clean.includes("cuanto") || clean.includes("cuánto") || clean.includes("costo") || clean.includes("vale")) {
    let priceList = `✨ *Catálogo y Precios de ${salonConfig.business.name}*:\n\n`;
    Object.entries(salonConfig.services).forEach(([num, s]) => {
      priceList += `${num}️⃣ *${s.name}*\n   💵 Valor: *${s.price}* | ⏳ Duración: *${s.duration}*\n\n`;
    });
    return {
      text: priceList.trim(),
      imagePath: null,
      serviceId: null
    };
  }

  if (clean.includes("foto") || clean.includes("fotos") || clean.includes("imagen") || clean.includes("muestra")) {
    return {
      text: `📸 Tenemos fotografías de referencia de todos nuestros servicios: *Lash Lifting*, *Cejas con Henna*, *Extensiones pelo a pelo* y *Microblading*. ¿De cuál de ellos te gustaría ver fotos?`,
      imagePath: null,
      serviceId: null
    };
  }

  return {
    text: `¡Hola hermosa! ✨ En *${salonConfig.business.name}* te asesoramos con gusto sobre diseño de cejas con henna, extensiones de pestañas, lash lifting y microblading.`,
    imagePath: null,
    serviceId: null
  };
}

/**
 * Procesa la consulta de una clienta usando Google Gemini con reintentos automáticos
 * @param {string} userMessage - Mensaje o pregunta de la clienta
 * @param {object} options - Opciones adicionales (clientName, etc.)
 * @returns {Promise<{ text: string, imagePath: string|null, serviceId: string|null }>}
 */
export async function askSalonAI(userMessage, options = {}) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const client = apiKey ? getClient() : null;

  // Sin API KEY: usar base de conocimiento integrada del salón
  if (!client) {
    console.log("ℹ️ [AI Service] GEMINI_API_KEY no configurada. Usando base de conocimiento integrada.");
    return getFallbackKnowledgeResponse(userMessage);
  }

  // Lista de modelos a intentar en orden (si uno da 503, se prueba el siguiente)
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const modelFallbackChain = [
    primaryModel,
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash"
  ].filter((v, i, arr) => arr.indexOf(v) === i); // eliminar duplicados

  const systemInstruction = buildSystemInstruction(options.clientName);

  for (const modelName of modelFallbackChain) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      if (modelName !== primaryModel) {
        console.log(`✅ [AI] Respondiendo con modelo alternativo: ${modelName}`);
      }

      let rawReply = response.text || "";
      let detectedServiceId = null;
      let imagePath = null;

      // Detectar si la IA solicitó enviar una fotografía
      const photoMatch = rawReply.match(/\[FOTO:\s*([a-zA-Z0-9_]+)\]/i);
      if (photoMatch) {
        detectedServiceId = photoMatch[1].toLowerCase().trim();
        rawReply = rawReply.replace(photoMatch[0], "").trim();
        imagePath = findServiceImage(detectedServiceId);

        if (imagePath) {
          console.log(`📸 [AI] Imagen adjunta para servicio: ${detectedServiceId} (${imagePath})`);
        } else {
          console.log(`ℹ️ [AI] Sin imagen en /assets/services/ para '${detectedServiceId}'`);
        }
      }

      return { text: rawReply, imagePath, serviceId: detectedServiceId };

    } catch (err) {
      const errBody = err.message || "";
      const is503 = errBody.includes("503") || errBody.includes("UNAVAILABLE") || errBody.includes("high demand");
      const is404 = errBody.includes("404") || errBody.includes("NOT_FOUND") || errBody.includes("no longer available");

      if (is503 || is404) {
        console.warn(`⚠️ [AI] Modelo '${modelName}' no disponible (${is503 ? "503 saturado" : "404 retirado"}). Probando siguiente modelo...`);
        continue; // intentar el siguiente en la cadena
      }

      // Error desconocido → usar base de conocimiento local
      console.error("❌ [AI Error] Error inesperado al consultar Gemini:", errBody.slice(0, 120));
      return getFallbackKnowledgeResponse(userMessage);
    }
  }

  // Todos los modelos fallaron → respuesta de conocimiento integrado
  console.warn("⚠️ [AI] Todos los modelos de Gemini están saturados. Usando base de conocimiento integrada.");
  return getFallbackKnowledgeResponse(userMessage);
}

