/**
 * ============================================================================
 * SERVICIO DE GESTIÓN Y DISPONIBILIDAD DE CITAS (Calendar Service)
 * ============================================================================
 * Maneja el control de horarios libres vs. ocupados, reserva de citas
 * y generación de resúmenes para el administrador.
 */

import { salonConfig } from "./config.js";

class CalendarService {
  constructor() {
    // Inicializar citas confirmadas con los slots ocupados de prueba
    this.appointments = [...salonConfig.mockBusySlots];
  }

  /**
   * Normaliza formatos de fecha simples como "25-09", "25/9", "25/09"
   */
  normalizeDate(input) {
    if (!input) return "";
    return input.replace(/[-.]/g, "/").trim();
  }

  /**
   * Normaliza la hora ingresada (ej: "14", "14:00", "2pm", "14hs")
   */
  normalizeTime(input) {
    const clean = input.toLowerCase().replace(/[^0-9:]/g, "");
    if (!clean.includes(":")) {
      const num = parseInt(clean, 10);
      if (!isNaN(num) && num >= 1 && num <= 24) {
        return `${num.toString().padStart(2, "0")}:00`;
      }
    }
    return clean.padStart(5, "0");
  }

  /**
   * Verifica si un horario específico ya está ocupado
   */
  isSlotBusy(date, time) {
    const normDate = this.normalizeDate(date);
    const normTime = this.normalizeTime(time);

    return this.appointments.some(
      (app) => app.date === normDate && app.time === normTime
    );
  }

  /**
   * Obtiene la lista de horarios libres para una fecha determinada
   */
  getAvailableSlots(date) {
    const normDate = this.normalizeDate(date);
    return salonConfig.dailyTimeSlots.filter(
      (slot) => !this.isSlotBusy(normDate, slot)
    );
  }

  /**
   * Registra y confirma una nueva cita
   */
  bookAppointment({ date, time, clientName, phone, service }) {
    const normDate = this.normalizeDate(date);
    const normTime = this.normalizeTime(time);

    if (this.isSlotBusy(normDate, normTime)) {
      return { success: false, error: "SLOT_BUSY" };
    }

    const newAppointment = {
      id: "CITA-" + Math.floor(1000 + Math.random() * 9000),
      date: normDate,
      time: normTime,
      client: clientName,
      phone,
      service: service.name,
      price: service.price,
      duration: service.duration,
      createdAt: new Date().toISOString()
    };

    this.appointments.push(newAppointment);
    return { success: true, appointment: newAppointment };
  }

  /**
   * Devuelve un resumen formateado de todas las citas confirmadas para el dueño
   */
  getAdminSummary() {
    if (this.appointments.length === 0) {
      return "📋 *RESUMEN DE CITAS:*\nNo hay citas agendadas por el momento.";
    }

    // Ordenar citas por fecha y hora
    const sorted = [...this.appointments].sort((a, b) => 
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );

    let report = `💅 *RESUMEN DE AGENDA - ${salonConfig.business.name}*\n`;
    report += `📅 Total de citas agendadas: *${sorted.length}*\n`;
    report += "----------------------------------------\n\n";

    sorted.forEach((app, idx) => {
      report += `*#${idx + 1} | ${app.date} a las ${app.time} hs*\n`;
      report += `👤 Cliente: ${app.client}\n`;
      report += `📱 Teléfono: ${app.phone || "No especificado"}\n`;
      report += `✨ Servicio: ${app.service}\n`;
      if (app.price) report += `💰 Valor: ${app.price} (${app.duration})\n`;
      report += "----------------------------------------\n";
    });

    report += `\n_Para consultar nuevamente escribe *${salonConfig.business.adminPasscode}*_`;
    return report;
  }
}

export const calendarService = new CalendarService();
