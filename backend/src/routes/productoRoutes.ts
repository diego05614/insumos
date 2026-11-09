import { Router } from 'express';
import { getProductos, 
        createProducto,
        getProductoById, 
        updateProducto, 
        deleteProducto
} from '../controllers/productoController';

const router = Router();

router.get('/', getProductos);
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

export default router;