import type { ItemCarrito } from '../types/carrito';

export interface DatosComprobante {
  pedidoId: number;
  clienteNombre: string;
  telefono: string;
  direccion: string;
  metodoPago: string;
  items: ItemCarrito[];
  total: number;
}

interface ComprobanteModalProps {
  datos: DatosComprobante;
  onCerrar: () => void;
}

export function ComprobanteModal({ datos, onCerrar }: ComprobanteModalProps) {
  const enviarPorWhatsApp = () => {
    const telefonoTienda = '573151751222';
    const listaProductos = datos.items
      .map(
        (it) =>
          `• ${it.cantidad}x ${it.nombre} ($${(Number(it.precio) * it.cantidad).toLocaleString('es-CO')})`
      )
      .join('\n');

    const mensaje =
      `✅ *NUEVO PEDIDO #${datos.pedidoId}*\n\n` +
      `👤 *Cliente:* ${datos.clienteNombre}\n` +
      `📞 *Teléfono:* ${datos.telefono}\n` +
      `📍 *Entrega:* ${datos.direccion}\n` +
      `💳 *Pago:* ${datos.metodoPago.toUpperCase()}\n\n` +
      `📦 *Productos:*\n${listaProductos}\n\n` +
      `💰 *TOTAL:* $${datos.total.toLocaleString('es-CO')} COP`;

    window.open(`https://wa.me/${telefonoTienda}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl mx-auto mb-3 shadow-xs">
          🎉
        </div>
        <h2 className="text-xl font-black text-emerald-700">¡Pedido Confirmado!</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Orden de compra <strong className="text-slate-800">#{datos.pedidoId}</strong>
        </p>

        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-left text-xs sm:text-sm space-y-1.5 mb-5">
          <div>
            <strong className="text-slate-700">Cliente:</strong>{' '}
            <span className="text-slate-900">{datos.clienteNombre}</span>
          </div>
          <div>
            <strong className="text-slate-700">Entrega:</strong>{' '}
            <span className="text-slate-900">{datos.direccion}</span>
          </div>
          <div className="pb-2">
            <strong className="text-slate-700">Método de pago:</strong>{' '}
            <span className="uppercase font-semibold text-slate-800">{datos.metodoPago}</span>
          </div>

          <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
            {datos.items.map((it) => (
              <div key={it.id} className="flex justify-between text-slate-700">
                <span>
                  {it.cantidad}x {it.nombre}
                </span>
                <strong className="text-slate-900">
                  ${(Number(it.precio) * it.cantidad).toLocaleString('es-CO')}
                </strong>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-300 pt-2.5 mt-2 flex justify-between items-center text-base font-black text-slate-900">
            <span>Total Pagado:</span>
            <span className="text-emerald-700">${datos.total.toLocaleString('es-CO')} COP</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={enviarPorWhatsApp}
            className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md shadow-emerald-600/15 transition cursor-pointer"
          >
            📲 Enviar comprobante por WhatsApp
          </button>

          <button
            type="button"
            onClick={onCerrar}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    </div>
  );
}