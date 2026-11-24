import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productoRoutes from './routes/productoRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import authRoutes from './routes/authRoutes';
import carritoRoutes from './routes/carritoRoutes';
import { upload, subirACloudinary } from './middlewares/upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  })
);

app.use(express.json());

// Subida permanente de imágenes a Cloudinary
app.post('/api/upload', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen válida.' });
    }

    const imagenUrl = await subirACloudinary(req.file.buffer);
    return res.json({ imagen_url: imagenUrl });
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    return res.status(500).json({ error: 'Error al subir la imagen al servidor.' });
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor AgroInsumos Pro corriendo en el puerto ${PORT}`);
});

export default app;