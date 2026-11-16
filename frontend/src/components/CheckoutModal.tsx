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

    if (!clienteNombre.trim() || !telefono.trim()) {
      setError('Por favor completa tu nombre y teléfono de contacto.');
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
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '450px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ marginBottom: '12px' }}>
          <h2>{esCompraDirecta ? '⚡ Compra Directa' : '🛒 Finalizar Pedido'}</h2>
          <button type="button" className="btn-close" onClick={onCerrar}>
            ×
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* Resumen de productos con selector de cantidad */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
            Resumen de productos:
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 0',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                  {item.nombre}
                </div>
                <small style={{ color: '#64748b' }}>
                  ${Number(item.precio).toLocaleString('es-CO')} c/u • Disp: {item.stock}
                </small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontWeight: 700 }}
                  onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                  disabled={item.cantidad <= 1}
                >
                  -
                </button>
                <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                  {item.cantidad}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontWeight: 700 }}
                  onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                  disabled={item.cantidad >= item.stock}
                >
                  +
                </button>
              </div>

              <div style={{ fontWeight: 700, minWidth: '80px', textAlign: 'right', color: '#0f172a' }}>
                ${(Number(item.precio) * item.cantidad).toLocaleString('es-CO')}
              </div>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#16a34a',
            }}
          >
            <span>Total a Pagar:</span>
            <span>${totalPagar.toLocaleString('es-CO')} COP</span>
          </div>
        </div>

        {/* Formulario de datos de entrega */}
        <form onSubmit={handleConfirmarCompra}>
          <div className="form-group">
            <label>Nombre completo:</label>
            <input
              type="text"
              placeholder="Ej. Juan Pérez"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Teléfono / WhatsApp de contacto:</label>
            <input
              type="tel"
              placeholder="Ej. 300 123 4567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
          </div>

          {/* Selector de modalidad de entrega */}
          <div className="form-group">
            <label>Modalidad de entrega:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={tipoEntrega === 'domicilio' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px', fontSize: '0.84rem' }}
                onClick={() => setTipoEntrega('domicilio')}
              >
                🚚 Envío a domicilio
              </button>
              <button
                type="button"
                className={tipoEntrega === 'tienda' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px', fontSize: '0.84rem' }}
                onClick={() => setTipoEntrega('tienda')}
              >
                🏪 Recoger en tienda
              </button>
            </div>
          </div>

          {tipoEntrega === 'domicilio' && (
            <div className="form-group">
              <label>Dirección de entrega (Vereda, Finca, Barrio o Ciudad):</label>
              <textarea
                placeholder="Ej. Vereda El Rosal, Finca La Esperanza, Km 4 vía principal..."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                rows={2}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Método de pago:</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as any)}>
              <option value="efectivo">
                {tipoEntrega === 'tienda' ? '💵 Efectivo en tienda' : '💵 Efectivo contra entrega'}
              </option>
              <option value="nequi">📱 Nequi</option>
              <option value="daviplata">📱 Daviplata</option>
              <option value="tarjeta">💳 Transferencia / Tarjeta</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onCerrar}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={procesando}
            >
              {procesando ? 'Procesando pedido...' : '✅ Confirmar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}