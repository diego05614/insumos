import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import productoRoutes from './routes/productoRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import authRoutes from './routes/authRoutes';
import carritoRoutes from './routes/carritoRoutes';
import { upload } from './middlewares/upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS unificado (permite Authorization JWT y x-session-id para carrito de invitados)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  })
);

app.use(express.json());

// Servir imágenes subidas de forma pública
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Subida de imágenes
app.post('/api/upload', upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ninguna imagen válida.' });
  }

  const protocolo = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const imagenUrl = `${protocolo}://${host}/uploads/${req.file.filename}`;

  res.json({ imagen_url: imagenUrl });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor AgroInsumos Pro corriendo en http://localhost:${PORT}`);
});

export default app;