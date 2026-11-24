import { useState } from 'react';
import { formatearFechaVenta, formatearPrecio, type VentaRegistro } from '../../types/venta';

interface ComprobanteVentaModalProps {
    venta: VentaRegistro;
    onCerrar: () => void;
}

export function ComprobanteVentaModal({ venta, onCerrar }: ComprobanteVentaModalProps) {
    const [telefonoCliente, setTelefonoCliente] = useState('');

    const textoEntrega = (venta.direccion || '').trim() || 'Mostrador (Tienda)';

    const handleEnviarWhatsApp = () => {
        const lineasProductos = (venta.items || [])
            .map(
                (it) =>
                    `• ${it.producto_nombre || 'Producto'} x${it.cantidad} — $${formatearPrecio(
                        Number(it.precio_unitario) * it.cantidad
                    )}`
            )
            .join('\n');

        const mensaje = [
            `🧾 *COMPROBANTE DE VENTA #${venta.id}*`,
            `📅 Fecha: ${formatearFechaVenta(venta)}`,
            `👤 Cliente: ${venta.cliente_nombre}`,
            `📍 Entrega: ${textoEntrega}`,
            `💳 Pago: ${(venta.metodo_pago || 'Efectivo').toUpperCase()}`,
            `────────────────────`,
            lineasProductos,
            `────────────────────`,
            `💰 *TOTAL PAGADO: $${formatearPrecio(venta.total)} COP*`,
            ``,
            `¡Gracias por su compra!`,
        ].join('\n');

        const limpio = telefonoCliente.replace(/\D/g, '');
        const numeroConPrefijo = limpio ? (limpio.startsWith('57') ? limpio : `57${limpio}`) : '';

        const url = numeroConPrefijo
            ? `https://wa.me/${numeroConPrefijo}?text=${encodeURIComponent(mensaje)}`
            : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={onCerrar}
        >
            <div
                className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl border border-slate-200/80"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera unificada AgroInsumos Pro */}
                <div className="bg-[#07241c] text-white px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-lg shadow-md">
                            🧾
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white leading-tight">
                                Comprobante #{venta.id}
                            </h3>
                            <span className="text-[11px] text-emerald-100/75">
                                {formatearFechaVenta(venta)}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar"
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-lime-400 hover:text-slate-950 text-white/80 flex items-center justify-center text-lg leading-none transition cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    <div className="text-sm text-slate-700 space-y-1.5 mb-4 bg-[#faf9f5] p-3.5 rounded-2xl border border-slate-200/70">
                        <div>
                            <strong>Cliente:</strong> {venta.cliente_nombre}
                        </div>
                        <div>
                            <strong>Entrega:</strong> {textoEntrega}
                        </div>
                        <div className="capitalize">
                            <strong>Método de pago:</strong> {venta.metodo_pago || 'Efectivo'}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 text-sm border border-slate-200/70">
                        {(venta.items || []).map((it) => (
                            <div
                                key={it.id}
                                className="flex justify-between py-1.5 border-b border-slate-200 last:border-none"
                            >
                                <span>
                                    {it.producto_nombre || 'Producto'} <strong>x{it.cantidad}</strong>
                                </span>
                                <strong>${formatearPrecio(Number(it.precio_unitario) * it.cantidad)}</strong>
                            </div>
                        ))}

                        <div className="flex justify-between mt-3 pt-2 border-t border-slate-300 text-base font-black text-emerald-700">
                            <span>TOTAL PAGADO:</span>
                            <span>${formatearPrecio(venta.total)} COP</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            WhatsApp del cliente (opcional):
                        </label>
                        <input
                            type="tel"
                            placeholder="Ej. 3001234567"
                            value={telefonoCliente}
                            onChange={(e) => setTelefonoCliente(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-[#faf9f5] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={handleEnviarWhatsApp}
                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-emerald-600/15 transition cursor-pointer"
                        >
                            📲 Enviar Comprobante por WhatsApp
                        </button>
                        <button
                            type="button"
                            onClick={onCerrar}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}