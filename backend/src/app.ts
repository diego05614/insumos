import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors()); 
app.use(express.json());

import productoRoutes from './routes/productoRoutes';
app.use('/api/productos', productoRoutes);

export default app;