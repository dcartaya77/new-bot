# 💅 Bot de WhatsApp para Salón de Belleza y Estudio de Cejas y Pestañas

Bot conversacional inteligente para WhatsApp desarrollado en Node.js (ESM) con **Baileys** (conexión directa vía WebSockets sin navegadores pesados ni Puppeteer). Especializado en la atención automatizada, consulta de servicios y agendamiento de turnos para salones de belleza, estéticas y estudios de cejas y pestañas (*Lash & Brow*).

---

## ✨ Características Principales

- 🌸 **Atención y Menú Interactivo de Servicios:** Presenta los servicios del salón con sus precios, duraciones y descripciones detalladas (Diseño con Henna, Extensiones de Pestañas, Lash Lifting, Microblading).
- 📅 **Gestión y Control de Agenda (`calendarService`):**
  - Validación de días y franjas horarias disponibles.
  - Detección automática de conflictos (horarios ocupados vs. libres).
  - Confirmación con código de reserva único (ej. `#CITA-4921`) y recomendaciones para la cita.
- 📱 **Visualizador Web de Código QR:**
  - Accede a `http://localhost:3000/qr` desde tu navegador para escanear el QR nítidamente sin depender de la terminal.
- 🔔 **Notificaciones Multicanal:**
  - Envío automático de confirmación de turnos hacia **Telegram** y **Webhooks** (n8n, Make.com, Zapier).
- 👑 **Comandos para la Administradora / Dueña:**
  - Escribiendo `admin resumen` o `citas hoy` en WhatsApp, el bot genera un reporte completo de los turnos agendados.
- 💻 **Simulador en Consola:**
  - Permite probar y validar todo el flujo de conversación al instante sin necesidad de escanear el QR ni consumir mensajes.
- 🌐 **API REST con Express:**
  - Endpoints listos para integración: `/api/health`, `/api/appointments` y `/api/chat`.

---

## 📁 Estructura del Proyecto

```text
new-bot/
├── src/
│   ├── config.js          # ⚙️ Configuración del salón (nombre, servicios, precios, horarios, clave admin)
│   ├── calendarService.js # 📅 Lógica de disponibilidad, reservas y reporte de citas
│   ├── stateManager.js    # 🧠 Máquina de estados en memoria para el seguimiento de la clienta
│   ├── botEngine.js       # 🤖 Flujo conversacional (captura de datos, selección de servicio y horarios)
│   ├── notifier.js        # 📢 Despacho de notificaciones a Telegram y Webhooks (Make/n8n)
│   ├── whatsappClient.js  # 📱 Conexión directa a WhatsApp con Baileys
│   ├── server.js          # 🌐 Servidor Express (página web para escanear QR y API REST)
│   ├── simulate.js        # 💻 Simulador interactivo en consola para pruebas rápidas
│   └── index.js           # 🚀 Punto de entrada principal (Express + WhatsApp)
├── .env.example           # 🔑 Plantilla de variables de entorno (puertos, tokens, webhooks)
├── .gitignore             # 🛡️ Exclusión de node_modules, .env y auth_session
└── package.json           # 📦 Dependencias y scripts de ejecución
```

---

## ⚙️ Configuración

1. **Clonar el repositorio o situarse en la carpeta del proyecto:**
   ```bash
   cd new-bot
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Variables de entorno:**
   Copia `.env.example` a `.env` y configura los valores deseados:
   ```bash
   PORT=3000
   WEBHOOK_URL=https://tu-n8n-o-make-webhook.com
   TELEGRAM_BOT_TOKEN=tu_token_de_telegram
   TELEGRAM_CHAT_ID=tu_chat_id_de_telegram
   ```

4. **Personalizar servicios y horarios:**
   Edita [src/config.js](file:///c:/Users/David/Desktop/new-bot/src/config.js) para ajustar el nombre de tu negocio, dirección, catálogo de servicios, precios y horarios de atención.

---

## 🚀 Modos de Ejecución

### 1. Simulador interactivo (Sin escanear QR)
Prueba la experiencia de la clienta directamente en la terminal:
```bash
npm run simulate
```

### 2. Iniciar el Bot en Producción / Desarrollo
Inicia el servidor web y el cliente de WhatsApp:
```bash
npm start
```
- Para conectar WhatsApp, escanea el código QR que se muestra en la terminal o abre en tu navegador:  
  👉 **http://localhost:3000/qr**

---

## 👑 Comandos Útiles en el Chat

| Comando | Acción |
| :--- | :--- |
| `reiniciar` / `menu` | Reinicia la conversación y muestra la bienvenida y servicios. |
| `admin resumen` / `citas hoy` | Muestra el listado de todas las citas agendadas con datos de las clientas. |
