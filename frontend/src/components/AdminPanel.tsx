import React, { useState } from 'react';
import { api } from '../services/api';
import type { Producto } from '../types/producto';
import type { Categoria } from '../types/categoria';
import { CategoryManager } from './CategoryManager';

interface AdminPanelProps {
    productos: Producto[];
    cargarProductos: () => void;
    categorias: Categoria[];
    cargarCategorias: () => void;
}

export function AdminPanel({
    productos,
    cargarProductos,
    categorias,
    cargarCategorias,
}: AdminPanelProps) {
    // Estado para controlar la visibilidad de los formularios desplegables
    const [mostrarFormProducto, setMostrarFormProducto] = useState(false);
    const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false);

    // Estado del formulario de productos
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [categoriaId, setCategoriaId] = useState<string>('');
    const [editandoId, setEditandoId] = useState<number | null>(null);

    const resetFormulario = () => {
        setNombre('');
        setDescripcion('');
        setPrecio('');
        setStock('');
        setImagenUrl('');
        setCategoriaId('');
        setEditandoId(null);
        setMostrarFormProducto(false);
    };

    const handleSubmitProducto = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            nombre,
            descripcion,
            precio: parseFloat(precio) || 0,
            stock: parseInt(stock, 10) || 0,
            imagen_url: imagenUrl || null,
            categoria_id: categoriaId ? Number(categoriaId) : null,
        };

        try {
            if (editandoId !== null) {
                await api.put(`/productos/${editandoId}`, payload);
                alert('Producto actualizado correctamente');
            } else {
                await api.post('/productos', payload);
                alert('Producto creado correctamente');
            }
            resetFormulario();
            cargarProductos();
        } catch (error) {
            console.error('Error al guardar producto:', error);
            alert('Error al guardar el producto');
        }
    };

    const handleEditarProducto = (prod: Producto) => {
        setEditandoId(prod.id);
        setNombre(prod.nombre);
        setDescripcion(prod.descripcion || '');
        setPrecio(prod.precio !== undefined && prod.precio !== null ? String(prod.precio) : '');
        setStock(prod.stock !== undefined && prod.stock !== null ? String(prod.stock) : '');
        setImagenUrl(prod.imagen_url || '');
        setCategoriaId(prod.categoria_id ? String(prod.categoria_id) : '');
        setMostrarFormProducto(true);
    };

    const handleEliminarProducto = async (id: number) => {
        if (window.confirm('¿Deseas eliminar este producto?')) {
            try {
                await api.delete(`/productos/${id}`);
                cargarProductos();
            } catch (error) {
                console.error('Error al eliminar producto:', error);
                alert('Error al eliminar el producto');
            }
        }
    };

    // Función formateadora segura para evitar fallos de renderizado en el precio
    const formatearPrecio = (valor: any): string => {
        const numero = Number(valor);
        return isNaN(numero) ? '0.00' : numero.toFixed(2);
    };

    return (
        <div className="admin-panel">
            {/* Barra de acciones principales para desplegar modales/formularios */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <button
                    className="btn-primary"
                    onClick={() => {
                        resetFormulario();
                        setMostrarFormProducto(!mostrarFormProducto);
                    }}
                >
                    {mostrarFormProducto ? 'Cerrar Formulario' : '+ Agregar Producto'}
                </button>

                <button
                    className="btn-secondary"
                    onClick={() => setMostrarFormCategoria(!mostrarFormCategoria)}
                >
                    {mostrarFormCategoria ? 'Ocultar Categorías' : 'Gestión de Categorías'}
                </button>
            </div>

            {/* Formulario desplegable para Categorías */}
            {mostrarFormCategoria && (
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                    <CategoryManager categorias={categorias} cargarCategorias={cargarCategorias} />
                </div>
            )}

            {/* Formulario desplegable para Productos */}
            {mostrarFormProducto && (
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <h3>{editandoId !== null ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <form onSubmit={handleSubmitProducto} style={{ display: 'grid', gap: '10px', maxWidth: '500px' }}>
                        <input
                            type="text"
                            placeholder="Nombre del producto"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                        <textarea
                            placeholder="Descripción"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Precio"
                            value={precio}
                            onChange={(e) => setPrecio(e.target.value)}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Stock"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="URL de la imagen (opcional)"
                            value={imagenUrl}
                            onChange={(e) => setImagenUrl(e.target.value)}
                        />

                        <select
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">Sin categoría asignada</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn-success">
                                {editandoId !== null ? 'Actualizar Producto' : 'Guardar Producto'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={resetFormulario}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla Principal de Productos */}
            <h3>Lista de Productos</h3>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th style={{ padding: '10px' }}>Nombre</th>
                        <th style={{ padding: '10px' }}>Categoría</th>
                        <th style={{ padding: '10px' }}>Precio</th>
                        <th style={{ padding: '10px' }}>Stock</th>
                        <th style={{ padding: '10px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '15px', textAlign: 'center' }}>No hay productos registrados.</td>
                        </tr>
                    ) : (
                        productos.map((prod) => (
                            <tr key={prod.id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '10px' }}>{prod.id}</td>
                                <td style={{ padding: '10px' }}>{prod.nombre}</td>
                                <td style={{ padding: '10px' }}>{prod.categoria_nombre || 'Sin categoría'}</td>
                                <td style={{ padding: '10px' }}>${formatearPrecio(prod.precio)}</td>
                                <td style={{ padding: '10px' }}>{prod.stock}</td>
                                <td style={{ padding: '10px' }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => handleEditarProducto(prod)}
                                        style={{ marginRight: '8px' }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn-danger"
                                        onClick={() => handleEliminarProducto(prod.id)}
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
    );
}