import { useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import type { Producto } from '../../types/producto';
import { formatearPrecio, type VentaRegistro } from '../../types/venta';
import { ComprobanteVentaModal } from './ComprobanteVenta';

interface AdminPosTabProps {
    productos: Producto[];
    cargarProductos: () => void;
    onMostrarToast: (texto: string, tipo?: 'success' | 'error' | 'info') => void;
}

interface ItemVentaFisica {
    producto: Producto;
    cantidad: number;
}

export function AdminPosTab({
    productos,
    cargarProductos,
    onMostrarToast,
}: AdminPosTabProps) {
    const [clientePos, setClientePos] = useState('');
    const [metodoPagoPos, setMetodoPagoPos] = useState<'efectivo' | 'nequi' | 'daviplata' | 'tarjeta'>('efectivo');
    const [busquedaPos, setBusquedaPos] = useState('');
    const [itemsPos, setItemsPos] = useState<ItemVentaFisica[]>([]);
    const [registrandoVentaPos, setRegistrandoVentaPos] = useState(false);
    const [ventaComprobante, setVentaComprobante] = useState<VentaRegistro | null>(null);

    const agregarItemPos = (prod: Producto) => {
        if (prod.stock <= 0) return;

        const existente = itemsPos.find((i) => i.producto.id === prod.id);
        if (existente) {
            if (existente.cantidad >= prod.stock) {
                onMostrarToast(`Stock máximo alcanzado para ${prod.nombre} (${prod.stock})`, 'error');
                return;
            }
            setItemsPos((prev) =>
                prev.map((i) => (i.producto.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i))
            );
        } else {
            setItemsPos((prev) => [...prev, { producto: prod, cantidad: 1 }]);
        }
    };

    const cambiarCantidadPos = (productoId: number, nuevaCantidad: number) => {
        if (nuevaCantidad <= 0) {
            setItemsPos((prev) => prev.filter((i) => i.producto.id !== productoId));
            return;
        }
        setItemsPos((prev) =>
            prev.map((i) =>
                i.producto.id === productoId
                    ? { ...i, cantidad: Math.min(nuevaCantidad, i.producto.stock) }
                    : i
            )
        );
    };

    const handleRegistrarVentaFisica = async (e: FormEvent) => {
        e.preventDefault();
        if (itemsPos.length === 0) {
            onMostrarToast('Agrega al menos un producto a la venta', 'error');
            return;
        }

        setRegistrandoVentaPos(true);
        try {
            const clienteFinal = clientePos.trim() || 'Cliente Mostrador';
            const direccionMostrador = 'Venta en mostrador (Tienda)';

            const payload = {
                cliente_nombre: clienteFinal,
                direccion: direccionMostrador,
                metodo_pago: metodoPagoPos,
                items: itemsPos.map((i) => ({
                    producto_id: i.producto.id,
                    cantidad: i.cantidad,
                })),
            };

            const res = await api.post('/pedidos', payload);
            const totalPagado = Number(res.data.total_pagado);

            onMostrarToast(
                `Venta #${res.data.pedido_id} registrada ($${totalPagado.toLocaleString('es-CO')})`,
                'success'
            );

            setVentaComprobante({
                id: res.data.pedido_id,
                cliente_nombre: clienteFinal,
                direccion: direccionMostrador,
                metodo_pago: metodoPagoPos,
                total: totalPagado,
                fecha: new Date().toISOString(),
                items: itemsPos.map((i, idx) => ({
                    id: idx + 1,
                    producto_nombre: i.producto.nombre,
                    cantidad: i.cantidad,
                    precio_unitario: Number(i.producto.precio),
                    subtotal: Number(i.producto.precio) * i.cantidad,
                })),
            });

            setItemsPos([]);
            setClientePos('');
            setMetodoPagoPos('efectivo');
            cargarProductos();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Error al registrar la venta';
            onMostrarToast(msg, 'error');
        } finally {
            setRegistrandoVentaPos(false);
        }
    };

    const productosFiltrados = productos.filter(
        (p) =>
            p.nombre.toLowerCase().includes(busquedaPos.toLowerCase()) ||
            (p.categoria_nombre || '').toLowerCase().includes(busquedaPos.toLowerCase())
    );

    const totalVentaPos = itemsPos.reduce(
        (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
        0
    );

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-900/5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-black text-slate-900">1. Seleccionar Insumos</h3>
                        <span className="text-xs font-bold text-slate-400">
                            {productosFiltrados.length} disponibles
                        </span>
                    </div>

                    <input
                        type="text"
                        placeholder="🔍 Buscar producto por nombre o categoría..."
                        value={busquedaPos}
                        onChange={(e) => setBusquedaPos(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />

                    <div className="flex flex-col gap-2.5 max-h-[450px] overflow-y-auto pr-1">
                        {productosFiltrados.map((prod) => {
                            const sinStock = prod.stock <= 0;
                            return (
                                <div
                                    key={prod.id}
                                    className={`flex justify-between items-center p-3.5 rounded-2xl border transition ${sinStock
                                            ? 'bg-slate-50 border-slate-200/60 opacity-60'
                                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                                        }`}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-slate-900">{prod.nombre}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            <strong className="text-slate-700">${formatearPrecio(prod.precio)}</strong> •{' '}
                                            {sinStock ? (
                                                <span className="text-red-600 font-extrabold">Agotado</span>
                                            ) : (
                                                <span className="text-emerald-700 font-extrabold">Stock: {prod.stock}</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={sinStock}
                                        onClick={() => agregarItemPos(prod)}
                                        className="bg-[#07241c] hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 text-lime-300 font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        + Agregar
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <form
                    onSubmit={handleRegistrarVentaFisica}
                    className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5"
                >
                    <h3 className="text-base font-black text-slate-900 mb-4">
                        2. Ticket de Venta en Mostrador
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Nombre del Cliente
                            </label>
                            <input
                                type="text"
                                placeholder="Cliente Mostrador"
                                value={clientePos}
                                onChange={(e) => setClientePos(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-[#faf9f5] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pago</label>
                            <select
                                value={metodoPagoPos}
                                onChange={(e) => setMetodoPagoPos(e.target.value as any)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                                <option value="efectivo">💵 Efectivo</option>
                                <option value="nequi">📱 Nequi</option>
                                <option value="daviplata">📱 Daviplata</option>
                                <option value="tarjeta">💳 Tarjeta / Datáfono</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-[#faf9f5] border border-slate-200/80 rounded-2xl p-4 my-4 min-h-[150px]">
                        {itemsPos.length === 0 ? (
                            <div className="text-center text-slate-400 text-xs my-10">
                                Selecciona productos de la izquierda para armar el ticket.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {itemsPos.map((item) => (
                                    <div
                                        key={item.producto.id}
                                        className="flex justify-between items-center gap-2 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-slate-900 truncate">
                                                {item.producto.nombre}
                                            </div>
                                            <small className="text-xs text-slate-500">
                                                ${formatearPrecio(item.producto.precio)} c/u
                                            </small>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => cambiarCantidadPos(item.producto.id, item.cantidad - 1)}
                                                className="w-7 h-7 rounded-lg bg-white font-bold text-slate-800 hover:bg-slate-50 shadow-2xs cursor-pointer"
                                            >
                                                -
                                            </button>
                                            <span className="font-extrabold text-xs min-w-[22px] text-center">
                                                {item.cantidad}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => cambiarCantidadPos(item.producto.id, item.cantidad + 1)}
                                                className="w-7 h-7 rounded-lg bg-white font-bold text-slate-800 hover:bg-slate-50 shadow-2xs cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="font-extrabold text-sm text-slate-900 min-w-[85px] text-right">
                                            ${formatearPrecio(Number(item.producto.precio) * item.cantidad)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-baseline text-lg font-black mb-4 px-1">
                        <span className="text-slate-800">Total a Cobrar:</span>
                        <span className="text-2xl text-emerald-700">
                            ${formatearPrecio(totalVentaPos)}{' '}
                            <small className="text-xs font-bold text-slate-400">COP</small>
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={itemsPos.length === 0 || registrandoVentaPos}
                        className="w-full bg-[#07241c] hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 text-lime-300 py-3.5 rounded-2xl text-sm sm:text-base font-extrabold shadow-lg shadow-emerald-950/20 disabled:shadow-none transition cursor-pointer disabled:cursor-not-allowed"
                    >
                        {registrandoVentaPos ? 'Registrando venta...' : '✅ Confirmar y Registrar Venta'}
                    </button>
                </form>
            </div>

            {ventaComprobante && (
                <ComprobanteVentaModal
                    venta={ventaComprobante}
                    onCerrar={() => setVentaComprobante(null)}
                />
            )}
        </>
    );
}