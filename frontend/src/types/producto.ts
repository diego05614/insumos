export type Producto = {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    imagen_url?: string | null;
    categoria_id?: number | null;
    categoria_nombre?: string;
}