import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface PedidoCliente {
  id: number;
  cliente_nombre: string;
  direccion: string;
  metodo_pago: string;
  total: number;
  estado?: string;
  fecha?: string;
  items?: {
    id: number;
    producto_nombre: string;
    cantidad: number;
    subtotal: number;
  }[];
}

interface MisPedidosModalProps {
  nombreCliente: string;
  onCerrar: () => void;
}

export function PedidosModal({ nombreCliente, onCerrar }: MisPedidosModalProps) {
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarMisPedidos = async () => {
      try {
        const res = await api.get('/pedidos');
        const todos: PedidoCliente[] = res.data;
        const filtrados = todos.filter(
          (p) => p.cliente_nombre.trim().toLowerCase() === nombreCliente.trim().toLowerCase()
        );
        setPedidos(filtrados);
      } catch (error) {
        console.error('Error al cargar historial del cliente:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarMisPedidos();
  }, [nombreCliente]);

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '95%', maxHeight: '85vh', overflowY: 'auto', padding: '22px' }}
      >
        <div className="modal-header">
          <h2>📦 Mis Pedidos</h2>
          <button type="button" className="btn-close" onClick={onCerrar}>
            ×
          </button>
        </div>

        {cargando ? (
          <p>Cargando tus pedidos...</p>
        ) : pedidos.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
            Aún no tienes pedidos registrados con tu cuenta.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           {pedidos.map((ped) => {
              const esAnulada = ped.estado === 'Anulada';

              return (
                <div
                  key={ped.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                    backgroundColor: esAnulada ? '#fef2f2' : '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong>Pedido #{ped.id}</strong>
                    <span
                      className={`stock-badge ${esAnulada ? 'stock-agotado' : 'stock-disponible'}`}
                      style={{ margin: 0 }}
                    >
                      {esAnulada ? 'Anulado' : 'Confirmado'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '8px' }}>
                    📍 {ped.direccion} • 💳 {ped.metodo_pago.toUpperCase()}
                  </div>

                  {ped.items && ped.items.length > 0 && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.84rem', marginBottom: '8px' }}>
                      {ped.items.map((it) => (
                        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{it.cantidad}x {it.producto_nombre}</span>
                          <span>${Number(it.subtotal).toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                    Total: ${Number(ped.total).toLocaleString('es-CO')} COP
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}