import type { Producto } from './producto';

export interface ItemCarrito extends Producto {
    cantidad: number;
    seleccionado: boolean;
}