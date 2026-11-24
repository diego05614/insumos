import React, { useState } from 'react';
import { api } from '../services/api';
import type { ItemCarrito } from '../types/carrito';
import type { DatosComprobante } from './ComprobanteModal';

interface CheckoutModalProps {
  items: ItemCarrito[];
  clienteNombrePredeterminado?: string;
  onCerrar: () => void;
  onPagoExitoso: (idsComprados: number[], comprobante: DatosComprobante) => void;
}

export function CheckoutModal({
  items: itemsProp,
  clienteNombrePredeterminado = '',
  onCerrar,
  onPagoExitoso,
}: CheckoutModalProps) {
  const [items, setItems] = useState<ItemCarrito[]>(itemsProp);
  const [clienteNombre, setClienteNombre] = useState(clienteNombrePredeterminado);
  const [telefono, setTelefono] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'domicilio' | 'tienda'>('domicilio');
  const [direccion, setDireccion] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'nequi' | 'daviplata' | 'tarjeta'>('efectivo');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const esCompraDirecta = itemsProp.length === 1 && itemsProp[0].cantidad === 1;

  const cambiarCantidad = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== productoId) return item;
        const maxStock = Number(item.stock) || 1;
        return { ...item, cantidad: Math.min(nuevaCantidad, maxStock) };
      })
    );
  };

  const totalPagar = items.reduce(
    (acc, item) => acc + Number(item.precio) * item.cantidad,
    0
  );

  const handleConfirmarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const digitosTelefono = telefono.replace(/\D/g, '');
    if (clienteNombre.trim().length < 3) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }

    if (digitosTelefono.length < 7) {
      setError('Ingresa un número de teléfono o WhatsApp válido.');
      return;
    }

    if (tipoEntrega === 'domicilio' && !direccion.trim()) {
      setError('Por favor ingresa la dirección de entrega.');
      return;
    }

    setProcesando(true);
    try {
      const direccionEnvio =
        tipoEntrega === 'tienda' ? 'Recoger en tienda' : direccion.trim();

      const payload = {
        cliente_nombre: clienteNombre.trim(),
        telefono: telefono.trim(),
        direccion: direccionEnvio,
        metodo_pago: metodoPago,
        items: items.map((it) => ({
          producto_id: it.id,
          cantidad: it.cantidad,
        })),
      };

      const res = await api.post('/pedidos', payload);

      const idsComprados = items.map((it) => it.id);
      onPagoExitoso(idsComprados, {
        pedidoId: res.data.pedido_id,
        clienteNombre: clienteNombre.trim(),
        telefono: telefono.trim(),
        direccion: direccionEnvio,
        metodoPago,
        items,
        total: Number(res.data.total_pagado),
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'No se pudo procesar tu compra. Intenta nuevamente.';
      setError(msg);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/90"
      >
        {/* Cabecera unificada AgroInsumos Pro */}
        <div className="bg-[#07241c] text-white px-6 py-5 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-lime-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-lg shadow-md">
              {esCompraDirecta ? '⚡' : '🛒'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {esCompraDirecta ? 'Compra Directa' : 'Finalizar Pedido'}
              </h2>
              <p className="text-[11px] text-emerald-200/75">
                Confirma tus datos de entrega y método de pago
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-lime-400 hover:text-slate-950 text-white/80 flex items-center justify-center text-xl leading-none transition cursor-pointer relative"
          >
            ×
          </button>
        </div>

        {/* Cuerpo con scroll interno */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3.5 py-2.5 rounded-2xl mb-4 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Resumen de productos con selector de cantidad */}
          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-slate-200/80 mb-5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              Resumen de productos
            </div>

            <div className="divide-y divide-slate-200/80">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center gap-3 py-2.5 first:pt-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate capitalize">
                      {item.nombre}
                    </div>
                    <small className="text-xs text-slate-500">
                      ${Number(item.precio).toLocaleString('es-CO')} c/u • Disp: {item.stock}
                    </small>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold text-sm transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-xs min-w-[22px] text-center text-slate-900">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                      disabled={item.cantidad >= item.stock}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold text-sm transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  <div className="font-extrabold text-sm min-w-[85px] text-right text-slate-900">
                    ${(Number(item.precio) * item.cantidad).toLocaleString('es-CO')}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-slate-300 text-base font-black text-slate-900">
              <span>Total a Pagar:</span>
              <span className="text-emerald-700 text-lg">
                ${totalPagar.toLocaleString('es-CO')}{' '}
                <small className="text-xs font-bold text-slate-400">COP</small>
              </span>
            </div>
          </div>

          {/* Formulario de datos de entrega */}
          <form onSubmit={handleConfirmarCompra} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Teléfono / WhatsApp de contacto
              </label>
              <input
                type="tel"
                placeholder="Ej. 300 123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
              />
            </div>

            {/* Selector de modalidad de entrega */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Modalidad de entrega
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipoEntrega('domicilio')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                    tipoEntrega === 'domicilio'
                      ? 'bg-[#07241c] border-[#07241c] text-lime-300 shadow-md shadow-emerald-950/15'
                      : 'bg-[#faf9f5] hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  🚚 Envío a domicilio
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEntrega('tienda')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                    tipoEntrega === 'tienda'
                      ? 'bg-[#07241c] border-[#07241c] text-lime-300 shadow-md shadow-emerald-950/15'
                      : 'bg-[#faf9f5] hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  🏪 Recoger en tienda
                </button>
              </div>
            </div>

            {tipoEntrega === 'domicilio' && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Dirección de entrega (Vereda, Finca, Barrio o Ciudad)
                </label>
                <textarea
                  placeholder="Ej. Vereda El Rosal, Finca La Esperanza, Km 4 vía principal..."
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
              >
                <option value="efectivo">
                  {tipoEntrega === 'tienda' ? '💵 Efectivo en tienda' : '💵 Efectivo contra entrega'}
                </option>
                <option value="nequi">📱 Nequi</option>
                <option value="daviplata">📱 Daviplata</option>
                <option value="tarjeta">💳 Transferencia / Tarjeta</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando}
                className="flex-[2] bg-[#07241c] hover:bg-emerald-900 disabled:opacity-50 text-lime-300 font-black py-3 rounded-2xl text-sm shadow-lg shadow-emerald-950/20 transition cursor-pointer"
              >
                {procesando ? 'Procesando pedido...' : '✅ Confirmar Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}