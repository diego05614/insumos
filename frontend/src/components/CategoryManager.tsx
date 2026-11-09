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
        <div className="admin-form-container">
            <h3>Gestión de Categorías</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Nombre de la categoría..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" className="btn-success">
                    {editandoId !== null ? 'Guardar Cambios' : 'Agregar Categoría'}
                </button>
                {editandoId !== null && (
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                            setEditandoId(null);
                            setNombre('');
                        }}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {categorias.map((cat) => (
                        <tr key={cat.id}>
                            <td>{cat.id}</td>
                            <td>{cat.nombre}</td>
                            <td>
                                <button className="btn-secondary" onClick={() => handleEditar(cat)} style={{ marginRight: '8px' }}>
                                    Editar
                                </button>
                                <button className="btn-danger" onClick={() => handleEliminar(cat.id)}>
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}