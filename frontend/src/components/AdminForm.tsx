import type { FormEvent, ChangeEvent } from 'react';
import type { Categoria } from '../types/categoria';

interface AdminFormProps {
  editandoId: number | null;
  nombre: string;
  setNombre: (v: string) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  precio: string;
  setPrecio: (v: string) => void;
  stock: string;
  setStock: (v: string) => void;
  imagenUrl: string;
  setImagenUrl: (v: string) => void;
  subiendoImagen: boolean;
  onSubirArchivo: (e: ChangeEvent<HTMLInputElement>) => void;
  categoriaId: string;
  setCategoriaId: (v: string) => void;
  categorias: Categoria[];
  onSubmit: (e: FormEvent) => void;
  onCancelar: () => void;
}

export function AdminForm({
  editandoId,
  nombre,
  setNombre,
  descripcion,
  setDescripcion,
  precio,
  setPrecio,
  stock,
  setStock,
  imagenUrl,
  setImagenUrl,
  subiendoImagen,
  onSubirArchivo,
  categoriaId,
  setCategoriaId,
  categorias,
  onSubmit,
  onCancelar,
}: AdminFormProps) {
  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-200/80 max-w-2xl">
      <h3 className="text-lg font-black text-slate-900 mb-4">
        {editandoId !== null ? '✏️ Editar Producto' : '✨ Registrar Nuevo Insumo'}
      </h3>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nombre del producto
          </label>
          <input
            type="text"
            placeholder="Ej. Fertilizante Triple 15 x 50kg"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Descripción y especificaciones
          </label>
          <textarea
            placeholder="Composición, dosis recomendada o detalles técnicos..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Precio de venta ($ COP)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Stock inicial (unidades)
            </label>
            <input
              type="number"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/80">
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
            📷 Fotografía del producto
          </label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={onSubirArchivo}
            disabled={subiendoImagen}
            className="text-xs sm:text-sm text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
          />
          {subiendoImagen && (
            <p className="text-xs text-emerald-700 font-bold mt-2">
              Subiendo imagen al servidor...
            </p>
          )}

          {imagenUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={imagenUrl}
                alt="Vista previa"
                className="w-16 h-16 object-contain bg-white rounded-xl border border-slate-200 p-1 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setImagenUrl('')}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                Quitar imagen
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="O pega un enlace externo de imagen (opcional)"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Categoría
          </label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Sin categoría asignada</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={subiendoImagen}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            {editandoId !== null ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}