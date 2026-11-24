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
        const res = await api.get('/pedidos/mis-pedidos');
        setPedidos(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error al cargar historial del cliente:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarMisPedidos();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/90"
      >
        {/* Cabecera estilo AgroInsumos Pro */}
        <div className="bg-[#07241c] text-white px-6 py-5 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-lime-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-lg shadow-md">
              📦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Mis Pedidos
                </h2>
                {!cargando && (
                  <span className="bg-lime-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {pedidos.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/75">
                Historial de compras de <strong className="text-lime-300">{nombreCliente}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar historial"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-lime-400 hover:text-slate-950 text-white/80 flex items-center justify-center text-xl leading-none transition cursor-pointer relative"
          >
            &times;
          </button>
        </div>

        {/* Cuerpo con scroll interno */}
        <div className="p-6 overflow-y-auto flex-1">
          {cargando ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="bg-[#faf9f5] rounded-2xl p-4 h-28 animate-pulse border border-slate-200/70"
                />
              ))}
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-10 bg-[#faf9f5] rounded-3xl border border-slate-200/70 px-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-3xl mx-auto mb-3">
                📭
              </div>
              <p className="text-slate-900 font-black text-base mb-1">
                Aún no tienes pedidos registrados
              </p>
              <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto">
                Cuando realices tu primera compra en el catálogo, podrás consultar aquí el estado y detalle.
              </p>
              <button
                type="button"
                onClick={onCerrar}
                className="bg-[#07241c] hover:bg-emerald-900 text-lime-300 font-black px-6 py-2.5 rounded-2xl text-sm shadow-lg shadow-emerald-950/20 transition cursor-pointer"
              >
                Ir al Catálogo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {pedidos.map((ped) => {
                const esAnulada = ped.estado === 'Anulada';

                return (
                  <div
                    key={ped.id}
                    className={`border rounded-2xl p-4 shadow-2xs transition ${
                      esAnulada
                        ? 'border-red-200 bg-red-50/70'
                        : 'border-slate-200/90 bg-[#faf9f5] hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#07241c] text-lime-300 text-xs font-black px-2.5 py-0.5 rounded-lg">
                          #{ped.id}
                        </span>
                        <strong className="text-sm font-extrabold text-slate-900">
                          Orden de Compra
                        </strong>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          esAnulada
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            esAnulada ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                        {esAnulada ? 'Anulado' : 'Confirmado'}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-500 mb-3">
                      📍 {ped.direccion} • 💳 {ped.metodo_pago.toUpperCase()}
                    </div>

                    {ped.items && ped.items.length > 0 && (
                      <div className="bg-white p-3 rounded-xl text-xs space-y-1.5 mb-3 border border-slate-200/70">
                        {ped.items.map((it) => (
                          <div key={it.id} className="flex justify-between items-center text-slate-700">
                            <span className="capitalize font-medium">
                              <strong className="text-slate-900">{it.cantidad}x</strong>{' '}
                              {it.producto_nombre}
                            </span>
                            <span className="font-bold text-slate-900">
                              ${Number(it.subtotal).toLocaleString('es-CO')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/70">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Total Pagado
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        ${Number(ped.total).toLocaleString('es-CO')}{' '}
                        <small className="text-[10px] font-bold text-slate-400">COP</small>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}