# 🚀 Bot de Calificación de Leads y Agendamiento para WhatsApp

Estructura modular en Node.js (ESM) con **Baileys** (conexión directa por WebSockets sin necesidad de Chrome/Puppeteer), motor de conversación desacoplado, API REST con Express y soporte de Webhooks (Make.com / n8n / Zapier / Telegram).

---

## 📁 Estructura del Proyecto

```text
whatsapp-lead-bot/
├── src/
│   ├── config.js          # ⚙️ Plantilla de preguntas, opciones, reglas y Calendly (< 5 min)
│   ├── stateManager.js    # 🧠 Máquina de estados en memoria con TTL
│   ├── botEngine.js       # 🤖 Lógica conversacional desacoplada (evaluación y respuestas)
│   ├── notifier.js        # 📢 Despacho de Webhooks (Make/n8n/Telegram) con fetch nativo
│   ├── whatsappClient.js  # 📱 Conexión a WhatsApp con Baileys y QR en terminal
│   ├── server.js          # 🌐 API Express para pruebas HTTP y endpoints REST
│   ├── simulate.js        # 💻 Simulador interactivo en consola (sin escanear QR)
│   └── index.js           # 🚀 Punto de entrada principal (Express + WhatsApp)
├── .env.example           # 🔑 Variables de entorno de ejemplo
└── package.json           # 📦 Dependencias y scripts de ejecución
```

---

## ⚡ Inicio Rápido (3 Pasos)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Probar inmediatamente en la terminal (Sin escanear QR)
```bash
npm run simulate
```

### 3. Ejecutar el Bot en vivo con WhatsApp y la API REST
```bash
npm start
```
Escanea el código QR que aparecerá en tu terminal desde WhatsApp (Dispositivos vinculados).
