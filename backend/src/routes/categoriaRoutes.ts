import { Router } from 'express';
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '../controllers/categoriaController';
import { verificarToken, soloAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Lectura pública
router.get('/', getCategorias);

// Gestión protegida solo para administradores
router.post('/', verificarToken, soloAdmin, createCategoria);
router.put('/:id', verificarToken, soloAdmin, updateCategoria);
router.delete('/:id', verificarToken, soloAdmin, deleteCategoria);

export default router;