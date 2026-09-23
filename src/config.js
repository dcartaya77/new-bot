/**
 * ============================================================================
 * CONFIGURACIÓN DEL NEGOCIO: ESTÉTICA DE CEJAS Y PESTAÑAS (Lash & Brow)
 * ============================================================================
 * Modifica precios, duraciones, servicios y horarios en menos de 5 minutos.
 */

export const salonConfig = {
  // Datos del estudio
  business: {
    name: "Studio Miradas Radiantes ✨",
    address: "Av. Principal 123, Sala 402",
    contactPhone: "+55 11 99999-8888",
    adminPasscode: "admin resumen" // Comando para que el dueño vea el reporte de citas
  },

  // 1. Menú interactivo de servicios con precio y duración
  services: {
    "1": {
      id: "cejas_henna",
      name: "Diseño y Depilación de Cejas con Henna",
      price: "R$ 60",
      duration: "45 min",
      description: "Mapeo facial personalizado, depilación con cera o hilo y pigmentación con Henna."
    },
    "2": {
      id: "extensiones_pestanas",
      name: "Extensiones de Pestañas Pelo a Pelo",
      price: "R$ 150",
      duration: "2 horas",
      description: "Efecto natural o rímel, fibras sintéticas ultraligeras de alta retención."
    },
    "3": {
      id: "lash_lifting",
      name: "Lash Lifting y Tinte de Pestañas",
      price: "R$ 120",
      duration: "1 hora",
      description: "Curvatura natural de tus pestañas reales con baño de queratina y tinte negro intenso."
    },
    "4": {
      id: "microblading",
      name: "Micropigmentación de Cejas (Powder / Microblading)",
      price: "R$ 350",
      duration: "2.5 horas",
      description: "Técnica semipermanente pelo a pelo o efecto sombreado natural. Duración 1 a 2 años."
    }
  },

  // 2. Horarios regulares de atención del salón
  dailyTimeSlots: [
    "09:00",
    "10:30",
    "14:00",
    "16:00",
    "17:30"
  ],

  // 3. Horarios ocupados iniciales (Mock para pruebas de conflicto de citas)
  mockBusySlots: [
    { date: "25/09", time: "14:00", client: "Carla Souza", service: "Extensiones de Pestañas" },
    { date: "25/09", time: "16:00", client: "Mariana Silva", service: "Lash Lifting" },
    { date: "26/09", time: "10:30", client: "Valeria Rios", service: "Micropigmentación" }
  ]
};
