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
      .map((it) => `• ${it.cantidad}x ${it.nombre} ($${(Number(it.precio) * it.cantidad).toLocaleString('es-CO')})`)
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
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center', padding: '24px' }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🎉</div>
        <h2 style={{ fontSize: '1.3rem', color: '#16a34a', marginBottom: '4px' }}>
          ¡Pedido Confirmado!
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
          Orden de compra <strong>#{datos.pedidoId}</strong>
        </p>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'left',
            fontSize: '0.86rem',
            marginBottom: '16px',
          }}
        >
          <div style={{ marginBottom: '6px' }}>
            <strong>Cliente:</strong> {datos.clienteNombre}
          </div>
          <div style={{ marginBottom: '6px' }}>
            <strong>Entrega:</strong> {datos.direccion}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Método de pago:</strong> {datos.metodoPago.toUpperCase()}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginBottom: '8px' }}>
            {datos.items.map((it) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{it.cantidad}x {it.nombre}</span>
                <strong>${(Number(it.precio) * it.cantidad).toLocaleString('es-CO')}</strong>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid #cbd5e1',
              paddingTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            <span>Total Pagado:</span>
            <span style={{ color: '#16a34a' }}>${datos.total.toLocaleString('es-CO')} COP</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={enviarPorWhatsApp}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#25D366',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.92rem',
            }}
          >
            📲 Enviar comprobante por WhatsApp
          </button>

          <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={onCerrar}>
            Volver al catálogo
          </button>
        </div>
      </div>
    </div>
  );
}