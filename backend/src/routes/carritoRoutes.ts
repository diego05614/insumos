import { Router } from 'express';
import {
  getCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  sincronizarCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
} from '../controllers/carritoController';
import { identificarCliente, verificarToken } from '../middlewares/authMiddleware';

const router = Router();

// Sincronización requiere sesión iniciada (JWT)
router.post('/sincronizar', verificarToken, sincronizarCarrito);

// Operaciones normales del carrito funcionan tanto para invitados (x-session-id) como usuarios con JWT
router.get('/', identificarCliente, getCarrito);
router.post('/', identificarCliente, agregarAlCarrito);
router.put('/:productoId', identificarCliente, actualizarCantidadCarrito);
router.delete('/:productoId', identificarCliente, eliminarDelCarrito);
router.delete('/', identificarCliente, vaciarCarrito);

export default router;