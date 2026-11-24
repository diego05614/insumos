import React, { useState } from 'react';
import { api } from '../services/api';
import type { Categoria } from '../types/categoria';

interface CategoryManagerProps {
  categorias: Categoria[];
  cargarCategorias: () => void;
}

export function CategoryManager({ categorias, cargarCategorias }: CategoryManagerProps) {
  const [nombre, setNombre] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      if (editandoId !== null) {
        await api.put(`/categorias/${editandoId}`, { nombre });
        alert('Categoría actualizada correctamente');
      } else {
        await api.post('/categorias', { nombre });
        alert('Categoría creada correctamente');
      }
      setNombre('');
      setEditandoId(null);
      cargarCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      alert('Error al procesar la categoría');
    }
  };

  const handleEditar = (cat: Categoria) => {
    setEditandoId(cat.id);
    setNombre(cat.nombre);
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Deseas eliminar esta categoría?')) {
      try {
        await api.delete(`/categorias/${id}`);
        cargarCategorias();
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        alert('No se pudo eliminar la categoría');
      }
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <h3 className="text-base font-extrabold text-slate-900 mb-3">
        🏷️ Gestión de Categorías
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2.5 mb-5">
        <input
          type="text"
          placeholder="Nombre de la categoría..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-xs transition cursor-pointer"
        >
          {editandoId !== null ? 'Guardar Cambios' : '+ Agregar Categoría'}
        </button>
        {editandoId !== null && (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setNombre('');
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
              <th className="py-2.5 px-4">ID</th>
              <th className="py-2.5 px-4">Nombre</th>
              <th className="py-2.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">
                  No hay categorías creadas todavía.
                </td>
              </tr>
            ) : (
              categorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-semibold text-slate-500">#{cat.id}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{cat.nombre}</td>
                  <td className="py-2.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditar(cat)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(cat.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                    >
                      Eliminar
                    </button>
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