import { useState } from 'react';
import type { Producto } from '../types/producto';
import type { Categoria } from '../types/categoria';
import { AdminInventarioTab } from './admin/AdminInventario';
import { AdminPosTab } from './admin/AdminPos';
import { AdminVentasTab } from './admin/AdminVentas';

interface AdminPanelProps {
  productos: Producto[];
  cargarProductos: () => void;
  categorias: Categoria[];
  cargarCategorias: () => void;
  onMostrarToast: (texto: string, tipo?: 'success' | 'error' | 'info') => void;
}

export function AdminPanel({
  productos,
  cargarProductos,
  categorias,
  cargarCategorias,
  onMostrarToast,
}: AdminPanelProps) {
  const [pestanaActiva, setPestanaActiva] = useState<'inventario' | 'pos' | 'resumen'>('inventario');
  const productosCriticos = productos.filter((p) => p.stock <= 3);
  const valorTotalInventario = productos.reduce(
    (acc, p) => acc + Number(p.precio) * Number(p.stock),
    0
  );

  const navItems = [
    {
      id: 'inventario' as const,
      icono: '📦',
      titulo: 'Inventario & Bodega',
      subtitulo: `${productos.length} referencias activas`,
      badge: productosCriticos.length > 0 ? `${productosCriticos.length} bajos` : null,
    },
    {
      id: 'pos' as const,
      icono: '⚡',
      titulo: 'Caja Rápida (POS)',
      subtitulo: 'Venta directa en mostrador',
      badge: null,
    },
    {
      id: 'resumen' as const,
      icono: '📈',
      titulo: 'Analítica & Cierre',
      subtitulo: 'Ingresos, recibos e historial',
      badge: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-6 items-start">
      {/* ================= SIDEBAR COMMAND CENTER ================= */}
      <aside className="bg-[#07241c] text-white rounded-[2rem] p-5 shadow-2xl shadow-emerald-950/20 border border-emerald-800/40 lg:sticky lg:top-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime-400">
              Modo Operador
            </span>
            <h2 className="text-lg font-black tracking-tight text-white">Centro de Control</h2>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" title="Sistema en línea" />
        </div>

        {/* Navegación vertical en desktop / horizontal en móvil */}
        <nav className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
          {navItems.map((item) => {
            const activo = pestanaActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPestanaActiva(item.id)}
                className={`text-left p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  activo
                    ? 'bg-gradient-to-r from-emerald-500/25 to-lime-500/15 border-lime-400/50 shadow-lg shadow-black/20'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border-transparent text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                        activo ? 'bg-lime-400 text-slate-950 font-bold shadow-md' : 'bg-white/10'
                      }`}
                    >
                      {item.icono}
                    </span>
                    <div>
                      <div className={`text-xs sm:text-sm font-extrabold ${activo ? 'text-white' : 'text-slate-200'}`}>
                        {item.titulo}
                      </div>
                      <div className="text-[11px] text-emerald-200/60 hidden lg:block">
                        {item.subtitulo}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Tarjeta de resumen patrimonial en bodega */}
        <div className="hidden lg:block mt-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-900/70 to-black/40 border border-emerald-500/20">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300/80 block">
            Capital en Inventario
          </span>
          <div className="text-xl font-black text-lime-300 mt-1">
            ${valorTotalInventario.toLocaleString('es-CO')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {categorias.length} categorías activas en tienda
          </p>
        </div>
      </aside>

      {/* ================= ÁREA DE TRABAJO DINÁMICA ================= */}
      <div className="min-w-0">
        {pestanaActiva === 'inventario' && (
          <AdminInventarioTab
            productos={productos}
            cargarProductos={cargarProductos}
            categorias={categorias}
            cargarCategorias={cargarCategorias}
            onMostrarToast={onMostrarToast}
          />
        )}

        {pestanaActiva === 'pos' && (
          <AdminPosTab
            productos={productos}
            cargarProductos={cargarProductos}
            onMostrarToast={onMostrarToast}
          />
        )}

        {pestanaActiva === 'resumen' && (
          <AdminVentasTab
            productos={productos}
            cargarProductos={cargarProductos}
            onMostrarToast={onMostrarToast}
          />
        )}
      </div>
    </div>
  );
}