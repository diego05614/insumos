import { Router } from 'express';
import {
  getProductos,
  createProducto,
  getProductoById,
  updateProducto,
  deleteProducto,
} from '../controllers/productoController';
import { verificarToken, soloAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Lectura pública para el catálogo
router.get('/', getProductos);
router.get('/:id', getProductoById);

// Gestión de inventario protegida solo para administradores
router.post('/', verificarToken, soloAdmin, createProducto);
router.put('/:id', verificarToken, soloAdmin, updateProducto);
router.delete('/:id', verificarToken, soloAdmin, deleteProducto);

export default router;