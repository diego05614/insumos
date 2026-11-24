import type { Producto } from '../types/producto';

interface AdminTableProps {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (producto: Producto) => void;
  onReabastecer: (producto: Producto) => void;
}

export function AdminTable({
  productos,
  onEditar,
  onEliminar,
  onReabastecer,
}: AdminTableProps) {
  const productosCriticos = productos.filter((p) => p.stock <= 3);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-900/5">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Tabla de Inventario
          </h3>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
            {productos.length}
          </span>
        </div>

        {productosCriticos.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-2xl">
            <span>⚠️</span>
            <span>
              {productosCriticos.length}{' '}
              {productosCriticos.length === 1
                ? 'producto con stock crítico'
                : 'productos con stock crítico'}
            </span>
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Producto</th>
              <th className="py-3.5 px-4">Categoría</th>
              <th className="py-3.5 px-4">Precio</th>
              <th className="py-3.5 px-4">Stock</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productos.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                  No hay productos registrados en el inventario.
                </td>
              </tr>
            ) : (
              productos.map((prod) => (
                <tr
                  key={prod.id}
                  className={`transition-colors ${
                    prod.stock === 0
                      ? 'bg-red-50/70'
                      : prod.stock <= 3
                      ? 'bg-amber-50/60'
                      : 'hover:bg-slate-50/90'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        {prod.imagen_url ? (
                          <img
                            src={prod.imagen_url}
                            alt={prod.nombre}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-base opacity-50">📦</span>
                        )}
                      </div>
                      <div>
                        <strong className="text-slate-900 font-bold block">{prod.nombre}</strong>
                        <span className="text-[11px] text-slate-400">ID #{prod.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {prod.categoria_nombre ? (
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                        {prod.categoria_nombre}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin categoría</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                    ${Number(prod.precio).toLocaleString('es-CO')}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {prod.stock === 0 ? (
                      <span className="inline-block bg-red-100 text-red-700 text-[11px] font-extrabold px-2.5 py-1 rounded-xl">
                        Agotado (0)
                      </span>
                    ) : prod.stock <= 3 ? (
                      <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-1 rounded-xl">
                        ⚠️ Bajo ({prod.stock} uds)
                      </span>
                    ) : (
                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-1 rounded-xl">
                        {prod.stock} uds
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onReabastecer(prod)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-2xs transition cursor-pointer"
                      >
                        + Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditar(prod)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(prod)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}