require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { testConnection } = require('./config/db');
const routes       = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

/* ── CORS ────────────────────────────────────────────────
   Permite requests desde el frontend (configurable via .env)
   Ejemplos: http://localhost:5500  |  http://127.0.0.1:5500
─────────────────────────────────────────────────────── */
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5173', 'http://localhost:4200'];

const allowAll = allowedOrigins.includes('*');

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowAll || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no permitido — ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', routes);

app.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Sistema Britos API OK', timestamp: new Date() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Ruta no encontrada' })
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  testConnection()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`Sistema Britos API corriendo en http://localhost:${PORT}`)
      );
    })
    .catch((err) => {
      console.error('Error conectando a MySQL:', err.message);
      process.exit(1);
    });
}

module.exports = app;
