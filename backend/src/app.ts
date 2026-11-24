import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productoRoutes from './routes/productoRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import authRoutes from './routes/authRoutes';
import carritoRoutes from './routes/carritoRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;  

app.use(cors()); 
app.use(express.json());
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/carrito', carritoRoutes);
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost: ${PORT}`);
});

export default app;