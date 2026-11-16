import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import productoRoutes from './routes/productoRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import { upload } from './middlewares/upload';
import authRoutes from './routes/authRoutes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir imágenes subidas de forma pública
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Permite subir fotos desde el computador
app.post('/api/upload', upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ninguna imagen válida.' });
  }

  // Detecta protocolo y host reales (soporta localhost y VS Code Dev Tunnels)
  const protocolo = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const imagenUrl = `${protocolo}://${host}/uploads/${req.file.filename}`;

  res.json({ imagen_url: imagenUrl });
});

// Registrar rutas del API
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});