/**
 * ============================================================================
 * MOTOR CONVERSACIONAL DE AGENDAMIENTO PARA CEJAS Y PESTAÑAS
 * ============================================================================
 */

import { salonConfig } from "./config.js";
import { stateManager } from "./stateManager.js";
import { calendarService } from "./calendarService.js";
import { notifyLead } from "./notifier.js";
import { askSalonAI } from "./aiService.js";

export class BotEngine {
  /**
   * Procesa cualquier mensaje entrante de WhatsApp o simulador
   */
  static async processMessage(userId, rawText) {
    const text = (rawText || "").trim();
    const cleanLower = text.toLowerCase();

    // 0. COMANDO DE ADMINISTRADOR: Reporte y resumen de citas para el dueño
    if (
      cleanLower === salonConfig.business.adminPasscode.toLowerCase() ||
      cleanLower === "citas hoy" ||
      cleanLower === "resumen citas"
    ) {
      return calendarService.getAdminSummary();
    }

    // Comando de reinicio
    if (["reiniciar", "reset", "cancelar", "menu", "inicio"].includes(cleanLower)) {
      stateManager.reset(userId);
      return (
        `¡Hola hermosa! ✨ Bienvenida a *${salonConfig.business.name}*.\n\n` +
        `Nos especializamos en resaltar tu mirada con diseño personalizado de cejas y pestañas.\n\n` +
        `Para comenzar a agendar tu cita, ¿con quién tengo el gusto de hablar? *(Por favor escribe tu Nombre y Apellido)*`
      );
    }

    const session = stateManager.getOrCreate(userId);

    // Detectar si el usuario está haciendo una pregunta sobre servicios, precios o fotos
    const isQuestionOrInquiry =
      text.includes("?") ||
      [
        "que es", "qué es", "como es", "cómo es", "en que consiste", "en qué consiste",
        "para que", "para qué", "precio", "precios", "cuanto", "cuánto", "cuesta", "costo", "vale",
        "lifting", "henna", "pestaña", "pestañas", "pestana", "pestanas",
        "microblading", "micropigmentacion", "micropigmentación", "ceja", "cejas",
        "foto", "fotos", "imagen", "imagenes", "imágenes", "duele", "dolor",
        "dura", "duracion", "duración", "cuidados", "diferencia"
      ].some((w) => cleanLower.includes(w));

    // Si el usuario hace una pregunta sobre tratamientos, responder con IA o base de conocimiento
    if (isQuestionOrInquiry) {
      const aiResponse = await askSalonAI(text, { clientName: session.name });

      // Generar recordatorio contextual según la fase actual
      let reminder = "";
      if (session.step === "AWAITING_NAME") {
        reminder = `\n\n✨ ¿Te gustaría agendar una cita? ¿Con quién tengo el gusto de hablar? *(Por favor escribe tu Nombre y Apellido)*`;
      } else if (session.step === "AWAITING_SERVICE") {
        reminder = `\n\n👉 *Para agendar tu cita*, responde con el número del servicio preferido:\n` +
          `1️⃣ Henna | 2️⃣ Extensiones | 3️⃣ Lash Lifting | 4️⃣ Microblading\n` +
          `_(o escribe *menu* para ver la lista completa con precios)_`;
      } else if (session.step === "AWAITING_DATE") {
        reminder = `\n\n📅 Recuerda indicarnos qué fecha prefieres para tu cita (ej: *25/09* o *26/09*):`;
      } else if (session.step === "AWAITING_TIME") {
        reminder = `\n\n⏰ Por favor indícanos qué hora prefieres de las opciones disponibles:`;
      }

      return {
        text: aiResponse.text + reminder,
        imagePath: aiResponse.imagePath
      };
    }

    // FASE 1: Captura del nombre del cliente
    if (session.step === "AWAITING_NAME") {
      if (!session.namePromptSent) {
        stateManager.update(userId, { namePromptSent: true });
        return (
          `¡Hola hermosa! ✨ Bienvenida a *${salonConfig.business.name}*.\n\n` +
          `Nos especializamos en resaltar tu mirada con diseño personalizado de cejas y pestañas.\n\n` +
          `Para comenzar a agendar tu cita, ¿con quién tengo el gusto de hablar? *(Por favor escribe tu Nombre y Apellido)*`
        );
      }

      const clientName = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").trim() || "Hermosa";
      stateManager.update(userId, {
        name: clientName,
        step: "AWAITING_SERVICE"
      });

      // Menú de servicios
      return this.renderServiceMenu(clientName);
    }

    // FASE 2: Selección del Servicio
    if (session.step === "AWAITING_SERVICE") {
      const selected = salonConfig.services[text];
      if (!selected) {
        return (
          `⚠️ Opción no válida. Por favor selecciona el número de tu servicio preferido:\n\n` +
          this.renderServiceMenu(session.name)
        );
      }

      stateManager.update(userId, {
        selectedService: selected,
        step: "AWAITING_DATE"
      });

      return (
        `¡Excelente elección, *${session.name}*! ✨\n` +
        `Has seleccionado: *${selected.name}* (${selected.price} - ${selected.duration}).\n\n` +
        `📅 *¿Para qué fecha te gustaría agendar tu cita?*\n\n` +
        `👉 Escribe el día y mes que prefieres (Ejemplo: *25/09* o *26/09*):`
      );
    }

    // FASE 3: Captura de Fecha y presentación de horarios
    if (session.step === "AWAITING_DATE") {
      // Normalizar fecha (aceptar 25/09, 25-09, o palabras como mañana)
      let inputDate = text;
      if (cleanLower === "mañana") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dd = String(tomorrow.getDate()).padStart(2, "0");
        const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
        inputDate = `${dd}/${mm}`;
      } else if (cleanLower === "hoy") {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        inputDate = `${dd}/${mm}`;
      }

      const normDate = calendarService.normalizeDate(inputDate);
      const freeSlots = calendarService.getAvailableSlots(normDate);

      if (freeSlots.length === 0) {
        return (
          `😔 Lo sentimos, para la fecha *${normDate}* tenemos la agenda completa.\n\n` +
          `¿Te gustaría probar con otra fecha? Escribe otra fecha (ej: *26/09* o *27/09*):`
        );
      }

      stateManager.update(userId, {
        selectedDate: normDate,
        step: "AWAITING_TIME"
      });

      // Crear lista de opciones numeradas para que sea fácil responder (1, 2, 3...)
      let slotsText = "";
      freeSlots.forEach((slot, i) => {
        slotsText += `   ${i + 1}️⃣  *${slot} hs*\n`;
      });

      return (
        `🗓️ Para el *${normDate}*, estos son los horarios disponibles para tu sesión de *${session.selectedService.duration}*:\n\n` +
        `${slotsText}\n` +
        `👉 Responde con la hora deseada (ej: *${freeSlots[0]}*) o el número de la opción:`
      );
    }

    // FASE 4: Verificación y Control de Disponibilidad
    if (session.step === "AWAITING_TIME") {
      const freeSlots = calendarService.getAvailableSlots(session.selectedDate);
      let chosenTime = text;

      // Si el usuario respondió con el índice (1, 2, 3...)
      const indexChoice = parseInt(text, 10);
      if (!isNaN(indexChoice) && indexChoice >= 1 && indexChoice <= freeSlots.length) {
        chosenTime = freeSlots[indexChoice - 1];
      } else {
        chosenTime = calendarService.normalizeTime(text);
      }

      // ⚠️ Control de disponibilidad: verificar si el horario está ocupado
      if (calendarService.isSlotBusy(session.selectedDate, chosenTime)) {
        let alternativeSlots = "";
        freeSlots.forEach((s) => {
          alternativeSlots += `• *${s} hs*\n`;
        });

        return (
          `⚠️ *Lo sentimos, la fecha ${session.selectedDate} a las ${chosenTime} hs ya está reservada.* ❌\n\n` +
          `Disponemos de los siguientes horarios libres para ese día:\n` +
          `${alternativeSlots}\n` +
          `👉 Por favor indícanos cuál de estos horarios disponibles prefieres:`
        );
      }

      // Validar si la hora ingresada pertenece a los horarios válidos
      if (!freeSlots.includes(chosenTime)) {
        let optionsList = freeSlots.map((s, i) => `${i + 1}️⃣ *${s}*`).join("\n");
        return (
          `⚠️ El horario ingresado no coincide con nuestras opciones disponibles.\n\n` +
          `Por favor elige uno de estos:\n${optionsList}`
        );
      }

      // ✅ HORARIO LIBRE: Confirmar la reserva
      const cleanPhone = userId.replace(/[^0-9]/g, "");
      const bookingResult = calendarService.bookAppointment({
        date: session.selectedDate,
        time: chosenTime,
        clientName: session.name,
        phone: cleanPhone,
        service: session.selectedService
      });

      stateManager.update(userId, {
        step: "CONFIRMED",
        confirmedTime: chosenTime,
        appointmentId: bookingResult.appointment.id
      });

      // Disparar notificación externa (Make / n8n / Telegram)
      notifyLead({
        phone: cleanPhone,
        name: session.name,
        isQualified: true,
        tipo: "CITA_CONFIRMADA",
        appointmentId: bookingResult.appointment.id,
        fecha: session.selectedDate,
        hora: chosenTime,
        servicio: session.selectedService.name,
        precio: session.selectedService.price,
        timestamp: new Date().toISOString()
      }).catch(console.error);

      return (
        `🎉 *¡CITA CONFIRMADA EXITOSAMENTE!* 🎉\n\n` +
        `👤 *Cliente:* ${session.name}\n` +
        `✨ *Servicio:* ${session.selectedService.name}\n` +
        `💰 *Valor:* ${session.selectedService.price} (Duración aprox: ${session.selectedService.duration})\n` +
        `📅 *Fecha:* ${session.selectedDate}\n` +
        `⏰ *Hora:* ${chosenTime} hs\n` +
        `📍 *Lugar:* ${salonConfig.business.address}\n` +
        `🔖 *Código de Reserva:* #${bookingResult.appointment.id}\n\n` +
        `📌 *Recomendaciones para tu cita:*\n` +
        `• Llegar 5 minutos antes.\n` +
        `• Asistir con el área de los ojos limpia y libre de rímel o maquillaje.\n\n` +
        `¡Te esperamos con un rico café para consentirte! Si necesitas reagendar, solo escribe *reiniciar*.`
      );
    }

    // FASE 5: Sesión ya confirmada
    if (session.step === "CONFIRMED") {
      return (
        `Hola *${session.name}* 💖. Ya tienes tu cita confirmada (#${session.appointmentId}) para el *${session.selectedDate}* a las *${session.confirmedTime} hs*.\n\n` +
        `📍 Dirección: ${salonConfig.business.address}\n\n` +
        `_(Si deseas cancelar o agendar un nuevo servicio, escribe *reiniciar*)_`
      );
    }

    return "Escribe *reiniciar* para ver nuestro menú de servicios.";
  }

  /**
   * Genera el menú de servicios con precios y duraciones
   */
  static renderServiceMenu(name) {
    let menu = `¡Mucho gusto, *${name}*! 🥰\n\n`;
    menu += `¿Qué servicio te gustaría realizarte en esta cita?\n\n`;

    Object.entries(salonConfig.services).forEach(([num, item]) => {
      menu += `${num}️⃣ *${item.name}*\n`;
      menu += `   💵 Precio: *${item.price}* | ⏳ Duración: *${item.duration}*\n\n`;
    });

    menu += `👉 _Responde con el número de la opción (1, 2, 3 o 4)_`;
    return menu;
  }
}
