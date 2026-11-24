import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Producto } from '../../types/producto';
import {
    formatearFechaVenta,
    formatearPrecio,
    type ResumenVentas,
    type VentaRegistro,
} from '../../types/venta';
import { ComprobanteVentaModal } from './ComprobanteVenta';

interface AdminVentasTabProps {
    productos: Producto[];
    cargarProductos: () => void;
    onMostrarToast: (texto: string, tipo?: 'success' | 'error' | 'info') => void;
}

export function AdminVentasTab({
    productos,
    cargarProductos,
    onMostrarToast,
}: AdminVentasTabProps) {
    const [ventas, setVentas] = useState<VentaRegistro[]>([]);
    const [resumen, setResumen] = useState<ResumenVentas | null>(null);
    const [cargandoVentas, setCargandoVentas] = useState(false);
    const [filtroPeriodo, setFiltroPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('todo');

    // Modales
    const [ventaComprobante, setVentaComprobante] = useState<VentaRegistro | null>(null);
    const [ventaAAnular, setVentaAAnular] = useState<VentaRegistro | null>(null);
    const [ventaAEliminar, setVentaAEliminar] = useState<VentaRegistro | null>(null);

    const cargarDatosVentas = async () => {
        setCargandoVentas(true);
        try {
            const [resResumen, resVentas] = await Promise.all([
                api.get('/pedidos/resumen'),
                api.get('/pedidos'),
            ]);
            setResumen(resResumen.data);
            setVentas(resVentas.data);
        } catch {
            onMostrarToast('Error al cargar el registro de ventas', 'error');
        } finally {
            setCargandoVentas(false);
        }
    };

    useEffect(() => {
        cargarDatosVentas();
    }, []);

    const confirmarAnulacionVenta = async () => {
        if (!ventaAAnular) return;
        try {
            await api.put(`/pedidos/${ventaAAnular.id}/anular`);
            onMostrarToast(`Venta #${ventaAAnular.id} anulada. Stock devuelto al inventario.`, 'info');
            setVentaAAnular(null);
            cargarDatosVentas();
            cargarProductos();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'No se pudo anular la venta';
            onMostrarToast(msg, 'error');
        }
    };

    const confirmarEliminacionVenta = async () => {
        if (!ventaAEliminar) return;
        try {
            await api.delete(`/pedidos/${ventaAEliminar.id}`);
            setVentas((prev) => prev.filter((v) => v.id !== ventaAEliminar.id));
            onMostrarToast(`Registro #${ventaAEliminar.id} eliminado definitivamente`, 'info');
            setVentaAEliminar(null);
            cargarDatosVentas();
        } catch {
            onMostrarToast('No se pudo eliminar el registro de venta', 'error');
        }
    };

    const renderBadgeEntrega = (direccion?: string | null) => {
        const dirLimpia = (direccion || '').trim();
        const lower = dirLimpia.toLowerCase();

        if (!dirLimpia || lower.includes('mostrador')) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    🏪 Mostrador (Tienda)
                </span>
            );
        }

        if (lower.includes('recoger')) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    🏪 Recoger en tienda
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                📍 Envío: {dirLimpia}
            </span>
        );
    };

    const productosCriticos = productos.filter((p) => p.stock <= 3);

    const ventasFiltradasPorFecha = ventas.filter((v) => {
        if (filtroPeriodo === 'todo') return true;
        const raw = v.fecha || v.created_at;
        if (!raw) return true;
        const fechaVenta = new Date(raw);
        if (isNaN(fechaVenta.getTime())) return true;

        const ahora = new Date();
        const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

        if (filtroPeriodo === 'hoy') return fechaVenta >= inicioHoy;
        if (filtroPeriodo === 'semana') {
            const hace7Dias = new Date(inicioHoy);
            hace7Dias.setDate(hace7Dias.getDate() - 7);
            return fechaVenta >= hace7Dias;
        }
        if (filtroPeriodo === 'mes') {
            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            return fechaVenta >= inicioMes;
        }
        return true;
    });

    const ventasActivasPeriodo = ventasFiltradasPorFecha.filter((v) => v.estado !== 'Anulada');
    const totalIngresosPeriodo = ventasActivasPeriodo.reduce((acc, v) => acc + Number(v.total), 0);

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                        Contabilidad y Cierre
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Registro de Ventas
                    </h2>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={filtroPeriodo}
                        onChange={(e) => setFiltroPeriodo(e.target.value as any)}
                        className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                        <option value="todo">📅 Todo el historial</option>
                        <option value="hoy">☀️ Ventas de Hoy</option>
                        <option value="semana">📆 Últimos 7 días</option>
                        <option value="mes">🗓️ Este Mes</option>
                    </select>

                    <button
                        type="button"
                        onClick={cargarDatosVentas}
                        className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-sm transition cursor-pointer shrink-0"
                    >
                        🔄 <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </div>

            {cargandoVentas || !resumen ? (
                <div className="bg-white rounded-3xl p-10 text-center text-slate-500 font-medium shadow-sm">
                    Cargando registro de ventas...
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg shadow-emerald-900/15">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                                Ingresos ({filtroPeriodo === 'todo' ? 'Histórico' : filtroPeriodo})
                            </div>
                            <div className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight break-words">
                                ${formatearPrecio(totalIngresosPeriodo)}
                            </div>
                            <div className="text-xs text-emerald-100/80 mt-1 font-medium">
                                Pesos Colombianos (COP)
                            </div>
                        </div>

                        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 border-l-4 border-l-blue-500 shadow-md shadow-slate-900/5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                    Ventas Válidas
                                </span>
                                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
                                    🧾
                                </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                                {ventasActivasPeriodo.length}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Transacciones activas en período</div>
                        </div>

                        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 border-l-4 border-l-amber-500 shadow-md shadow-slate-900/5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                    Alerta de Inventario
                                </span>
                                <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
                                    ⚠️
                                </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1.5">
                                {productosCriticos.length}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Productos con 3 o menos unidades</div>
                        </div>
                    </div>

                    {/* Historial Detallado */}
                    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-900/5">
                        <h4 className="text-base font-black text-slate-900 mb-4">
                            📋 Historial Detallado ({ventasFiltradasPorFecha.length})
                        </h4>

                        {ventasFiltradasPorFecha.length === 0 ? (
                            <p className="text-sm text-slate-500 py-6 text-center">
                                No hay ventas registradas en este período.
                            </p>
                        ) : (
                            <>
                                {/* Vista Móvil (< lg) */}
                                <div className="grid grid-cols-1 gap-3.5 lg:hidden">
                                    {ventasFiltradasPorFecha.map((venta) => {
                                        const estaAnulada = venta.estado === 'Anulada';
                                        return (
                                            <div
                                                key={venta.id}
                                                className={`rounded-2xl p-4 border transition ${estaAnulada
                                                        ? 'bg-red-50/70 border-red-200 opacity-80'
                                                        : 'bg-slate-50/60 border-slate-200/80'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start gap-2 mb-2">
                                                    <div>
                                                        <span className="font-black text-sm text-slate-900">
                                                            Venta #{venta.id}
                                                        </span>
                                                        <span className="block text-[11px] text-slate-500">
                                                            {formatearFechaVenta(venta)}
                                                        </span>
                                                    </div>
                                                    {estaAnulada ? (
                                                        <span className="bg-red-100 text-red-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                                            Anulada
                                                        </span>
                                                    ) : (
                                                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full capitalize">
                                                            {venta.metodo_pago || 'Efectivo'}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-xs font-bold text-slate-800 mb-1.5">
                                                    👤 {venta.cliente_nombre}
                                                </div>

                                                <div className="mb-2.5">
                                                    {renderBadgeEntrega(venta.direccion)}
                                                </div>

                                                {venta.items && venta.items.length > 0 && (
                                                    <ul className="bg-white rounded-xl p-2.5 border border-slate-200/70 text-xs text-slate-600 space-y-1 mb-3">
                                                        {venta.items.map((it) => (
                                                            <li key={it.id} className="flex justify-between gap-2">
                                                                <span className="truncate">
                                                                    <strong>{it.cantidad}x</strong> {it.producto_nombre || 'Insumo'}
                                                                </span>
                                                                <span className="font-semibold shrink-0">
                                                                    ${formatearPrecio(Number(it.precio_unitario) * it.cantidad)}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 gap-2 flex-wrap">
                                                    <div>
                                                        <span className="text-[11px] text-slate-400 block">Total</span>
                                                        {estaAnulada ? (
                                                            <span className="line-through text-red-700 font-bold text-sm">
                                                                ${formatearPrecio(venta.total)}
                                                            </span>
                                                        ) : (
                                                            <strong className="text-emerald-700 font-black text-base">
                                                                ${formatearPrecio(venta.total)}
                                                            </strong>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {!estaAnulada && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVentaComprobante(venta)}
                                                                    className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                                                                >
                                                                    🧾 Recibo
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVentaAAnular(venta)}
                                                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                                                                >
                                                                    Anular
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setVentaAEliminar(venta)}
                                                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Vista Escritorio (>= lg) */}
                                <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/80">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                                                <th className="py-3.5 px-4">Venta #</th>
                                                <th className="py-3.5 px-4">Fecha</th>
                                                <th className="py-3.5 px-4">Cliente</th>
                                                <th className="py-3.5 px-4">Entrega / Ubicación</th>
                                                <th className="py-3.5 px-4">Productos Vendidos</th>
                                                <th className="py-3.5 px-4">Pago</th>
                                                <th className="py-3.5 px-4">Total</th>
                                                <th className="py-3.5 px-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ventasFiltradasPorFecha.map((venta) => {
                                                const estaAnulada = venta.estado === 'Anulada';
                                                return (
                                                    <tr
                                                        key={venta.id}
                                                        className={
                                                            estaAnulada
                                                                ? 'bg-red-50/60 opacity-75'
                                                                : 'hover:bg-slate-50/90 transition-colors'
                                                        }
                                                    >
                                                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                                            #{venta.id}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                                                            {formatearFechaVenta(venta)}
                                                        </td>
                                                        <td className="py-3.5 px-4 font-bold text-slate-800">
                                                            {venta.cliente_nombre}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            {renderBadgeEntrega(venta.direccion)}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            {venta.items && venta.items.length > 0 ? (
                                                                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-0.5">
                                                                    {venta.items.map((it) => (
                                                                        <li key={it.id}>
                                                                            {it.producto_nombre || 'Insumo'} —{' '}
                                                                            <strong>{it.cantidad} ud(s)</strong> ($
                                                                            {formatearPrecio(it.precio_unitario)} c/u)
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <small className="text-slate-400">Sin detalle</small>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                                                            {venta.metodo_pago || 'Efectivo'}
                                                        </td>
                                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                                            {estaAnulada ? (
                                                                <span className="line-through text-red-700 font-semibold">
                                                                    ${formatearPrecio(venta.total)}
                                                                </span>
                                                            ) : (
                                                                <strong className="text-emerald-700 font-extrabold">
                                                                    ${formatearPrecio(venta.total)}
                                                                </strong>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {estaAnulada ? (
                                                                    <span className="bg-red-100 text-red-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                                                                        Anulada
                                                                    </span>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setVentaComprobante(venta)}
                                                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                                                                        >
                                                                            🧾 Recibo
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setVentaAAnular(venta)}
                                                                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                                                                        >
                                                                            Anular
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVentaAEliminar(venta)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs shadow-2xs transition cursor-pointer"
                                                                >
                                                                    🗑️ Eliminar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tablas inferiores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-md shadow-slate-900/5 overflow-hidden">
                            <h4 className="text-base font-black text-slate-900 mb-3">
                                🏆 Productos Más Vendidos
                            </h4>
                            {resumen.topProductos.length === 0 ? (
                                <p className="text-sm text-slate-500">Aún no hay datos.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-extrabold uppercase text-slate-400">
                                                <th className="py-2 pr-2">Producto</th>
                                                <th className="py-2 px-2">Unidades</th>
                                                <th className="py-2 pl-2 text-right">Ingresos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {resumen.topProductos.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-2.5 pr-2 font-semibold text-slate-800">{item.nombre}</td>
                                                    <td className="py-2.5 px-2 font-extrabold text-slate-900">
                                                        {item.unidadesVendidas}
                                                    </td>
                                                    <td className="py-2.5 pl-2 text-right text-emerald-700 font-extrabold whitespace-nowrap">
                                                        ${formatearPrecio(item.ingresos)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-md shadow-slate-900/5 overflow-hidden">
                            <h4 className="text-base font-black text-slate-900 mb-3">📂 Ventas por Categoría</h4>
                            {resumen.ventasPorCategoria.length === 0 ? (
                                <p className="text-sm text-slate-500">Aún no hay datos.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-extrabold uppercase text-slate-400">
                                                <th className="py-2 pr-2">Categoría</th>
                                                <th className="py-2 px-2">Unidades</th>
                                                <th className="py-2 pl-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {resumen.ventasPorCategoria.map((cat, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-2.5 pr-2 font-semibold text-slate-800">
                                                        {cat.categoria}
                                                    </td>
                                                    <td className="py-2.5 px-2 font-bold">{cat.unidades}</td>
                                                    <td className="py-2.5 pl-2 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                                                        ${formatearPrecio(cat.ingresos)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {ventaComprobante && (
                <ComprobanteVentaModal
                    venta={ventaComprobante}
                    onCerrar={() => setVentaComprobante(null)}
                />
            )}

            {ventaAAnular && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                    onClick={() => setVentaAAnular(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-slate-900 mb-2">
                            ¿Anular venta #{ventaAAnular.id}?
                        </h3>
                        <p className="text-sm text-slate-600 mb-5">
                            Se descontarán <strong>${formatearPrecio(ventaAAnular.total)}</strong> de los ingresos y los productos volverán automáticamente al inventario.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => setVentaAAnular(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarAnulacionVenta}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                            >
                                Sí, anular venta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ventaAEliminar && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                    onClick={() => setVentaAEliminar(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-slate-900 mb-2">
                            ¿Eliminar registro #{ventaAEliminar.id}?
                        </h3>
                        <p className="text-sm text-slate-600 mb-5">
                            Se borrará definitivamente este registro del historial sin modificar las cantidades actuales del inventario.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => setVentaAEliminar(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarEliminacionVenta}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}