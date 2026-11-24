import type { FC } from 'react';
import type { ItemCarrito } from '../types/carrito';

interface CarritoModalProps {
  carrito: ItemCarrito[];
  onCerrar: () => void;
  onActualizarCantidad: (id: number, cantidad: number) => void;
  onToggleSeleccion: (id: number) => void;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
  onEliminarItem: (id: number) => void;
  onProcederPago: (itemsAPagar: ItemCarrito[]) => void;
  onMostrarToast?: (texto: string, tipo?: 'success' | 'error' | 'info') => void;
}

export const CarritoModal: FC<CarritoModalProps> = ({
  carrito,
  onCerrar,
  onActualizarCantidad,
  onToggleSeleccion,
  onToggleSeleccionarTodos,
  onEliminarItem,
  onProcederPago,
  onMostrarToast,
}) => {
  const itemsSeleccionados = carrito.filter((item) => item.seleccionado);
  const total = itemsSeleccionados.reduce(
    (acc, item) => acc + Number(item.precio) * item.cantidad,
    0
  );
  const todosSeleccionados =
    carrito.length > 0 && carrito.every((item) => item.seleccionado);

  const notificarError = (mensaje: string) => {
    if (onMostrarToast) {
      onMostrarToast(mensaje, 'error');
    } else {
      alert(mensaje);
    }
  };

  const handlePagar = () => {
    if (itemsSeleccionados.length === 0) {
      notificarError('Selecciona al menos un producto para continuar con la compra.');
      return;
    }
    onProcederPago(itemsSeleccionados);
  };

  const handlePedirWhatsApp = () => {
    if (itemsSeleccionados.length === 0) {
      notificarError('Selecciona al menos un producto para enviarlo por WhatsApp.');
      return;
    }

    const telefonoTienda = '573151751222';

    const detalleProductos = itemsSeleccionados
      .map(
        (item) =>
          `• *${item.nombre}* (x${item.cantidad}) - $${(
            Number(item.precio) * item.cantidad
          ).toLocaleString('es-CO')}`
      )
      .join('\n');

    const mensaje = `Hola, quiero realizar el siguiente pedido de insumos agrícolas:\n\n${detalleProductos}\n\n*Total estimado:* $${total.toLocaleString('es-CO')}\n\n¿Me confirman disponibilidad y forma de entrega?`;

    const url = `https://wa.me/${telefonoTienda}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200/90"
      >
        {/* Cabecera estilo AgroInsumos Pro */}
        <div className="bg-[#07241c] text-white px-6 py-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-lime-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-lg shadow-md">
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Carrito de Compras
                </h2>
                <span className="bg-lime-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                  {carrito.length}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/75">
                Revisa tus insumos antes de confirmar el pedido
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar carrito"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-lime-400 hover:text-slate-950 text-white/80 flex items-center justify-center text-xl leading-none transition cursor-pointer relative"
          >
            &times;
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {carrito.length === 0 ? (
            <div className="text-center py-10 bg-[#faf9f5] rounded-3xl border border-slate-200/70 px-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-3xl mx-auto mb-3">
                🛍️
              </div>
              <p className="text-slate-900 font-black text-base mb-1">Tu carrito está vacío</p>
              <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto">
                Agrega semillas, fertilizantes o herramientas desde el catálogo para armar tu pedido.
              </p>
              <button
                type="button"
                onClick={onCerrar}
                className="bg-[#07241c] hover:bg-emerald-900 text-lime-300 font-black px-6 py-2.5 rounded-2xl text-sm shadow-lg shadow-emerald-950/20 transition cursor-pointer"
              >
                Explorar Productos
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={(e) => onToggleSeleccionarTodos(e.target.checked)}
                    className="w-4 h-4 accent-[#07241c] rounded cursor-pointer"
                  />
                  <span>Seleccionar todos los productos</span>
                </label>
                <span className="text-[11px] font-bold text-slate-400">
                  {itemsSeleccionados.length} de {carrito.length} activos
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto flex flex-col gap-2.5 pr-1 mb-5">
                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                      item.seleccionado
                        ? 'bg-[#faf9f5] border-slate-200/90 shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200/50 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.seleccionado}
                      onChange={() => onToggleSeleccion(item.id)}
                      className="w-4 h-4 accent-[#07241c] rounded cursor-pointer"
                    />

                    {item.imagen_url && (
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center p-1.5 shrink-0">
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate capitalize">
                        {item.nombre}
                      </h4>
                      <span className="text-emerald-700 font-black text-sm">
                        ${Number(item.precio).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => onActualizarCantidad(item.id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-black text-sm transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="min-w-[22px] text-center font-black text-xs text-slate-900">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => onActualizarCantidad(item.id, item.cantidad + 1)}
                        disabled={item.cantidad >= item.stock}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-black text-sm transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEliminarItem(item.id)}
                      title="Eliminar ítem"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-[#faf9f5] border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Productos seleccionados:</span>
                  <strong className="text-slate-900">{itemsSeleccionados.length}</strong>
                </div>
                <div className="flex justify-between items-baseline text-lg font-black text-slate-900 pb-2 border-b border-slate-200/70">
                  <span>Total estimado:</span>
                  <span className="text-emerald-700 text-xl">
                    ${total.toLocaleString('es-CO')}{' '}
                    <small className="text-xs font-bold text-slate-400">COP</small>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePagar}
                  disabled={itemsSeleccionados.length === 0}
                  className="w-full bg-[#07241c] hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 text-lime-300 font-black py-3 rounded-2xl text-sm shadow-lg shadow-emerald-950/20 disabled:shadow-none transition cursor-pointer disabled:cursor-not-allowed"
                >
                  Continuar Compra ({itemsSeleccionados.length})
                </button>

                <button
                  type="button"
                  onClick={handlePedirWhatsApp}
                  disabled={itemsSeleccionados.length === 0}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-3 rounded-2xl text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  📲 Pedir por WhatsApp ({itemsSeleccionados.length})
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};