export interface VentaItemDetalle {
  id: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

export interface VentaRegistro {
  id: number;
  cliente_nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  metodo_pago?: string;
  total: number;
  estado?: string;
  fecha?: string;
  created_at?: string;
  items?: {
    id: number;
    producto_nombre?: string;
    cantidad: number;
    precio_unitario: number;
    subtotal?: number;
  }[];
}

export interface ResumenVentas {
  totalVendido: number;
  totalPedidos: number;
  topProductos: { nombre: string; unidadesVendidas: number; ingresos: number }[];
  ventasPorCategoria: { categoria: string; unidades: number; ingresos: number }[];
}

export const formatearPrecio = (valor: unknown): string => {
  const numero = Number(valor);
  return isNaN(numero) ? '0' : numero.toLocaleString('es-CO');
};

export const formatearFechaVenta = (venta: VentaRegistro): string => {
  const raw = venta.fecha || venta.created_at;
  if (!raw) return 'Reciente';
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? String(raw)
    : d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};