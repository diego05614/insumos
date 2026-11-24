import { useState, type FormEvent, type ChangeEvent } from 'react';
import { api } from '../../services/api';
import type { Producto } from '../../types/producto';
import type { Categoria } from '../../types/categoria';
import { formatearPrecio } from '../../types/venta';
import { CategoryManager } from '../CategoryManager';
import { AdminForm } from '../AdminForm';
import { AdminTable } from '../AdminTable';

interface AdminInventarioTabProps {
    productos: Producto[];
    cargarProductos: () => void;
    categorias: Categoria[];
    cargarCategorias: () => void;
    onMostrarToast: (texto: string, tipo?: 'success' | 'error' | 'info') => void;
}

export function AdminInventarioTab({
    productos,
    cargarProductos,
    categorias,
    cargarCategorias,
    onMostrarToast,
}: AdminInventarioTabProps) {
    const [vistaInventario, setVistaInventario] = useState<'tarjetas' | 'tabla'>('tarjetas');
    const [mostrarFormProducto, setMostrarFormProducto] = useState(false);
    const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false);

    // Modales de inventario
    const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
    const [productoReabastecer, setProductoReabastecer] = useState<Producto | null>(null);
    const [cantidadReabastecer, setCantidadReabastecer] = useState('10');
    const [guardandoStock, setGuardandoStock] = useState(false);

    // Campos del formulario
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [subiendoImagen, setSubiendoImagen] = useState(false);
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

    const handleSubirArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        const formData = new FormData();
        formData.append('imagen', archivo);

        setSubiendoImagen(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImagenUrl(res.data.imagen_url);
            onMostrarToast('Imagen subida correctamente', 'success');
        } catch {
            onMostrarToast('No se pudo subir la imagen (JPG, PNG o WEBP, máx. 5MB)', 'error');
        } finally {
            setSubiendoImagen(false);
        }
    };

    const handleSubmitProducto = async (e: FormEvent) => {
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
                onMostrarToast('Producto actualizado correctamente', 'success');
            } else {
                await api.post('/productos', payload);
                onMostrarToast('Producto creado correctamente', 'success');
            }
            resetFormulario();
            cargarProductos();
        } catch {
            onMostrarToast('Error al guardar el producto', 'error');
        }
    };

    const handleEditarProducto = (prod: Producto) => {
        setEditandoId(prod.id);
        setNombre(prod.nombre);
        setDescripcion(prod.descripcion || '');
        setPrecio(prod.precio != null ? String(prod.precio) : '');
        setStock(prod.stock != null ? String(prod.stock) : '');
        setImagenUrl(prod.imagen_url || '');
        setCategoriaId(prod.categoria_id ? String(prod.categoria_id) : '');
        setMostrarFormProducto(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmarEliminacionProducto = async () => {
        if (!productoAEliminar) return;
        try {
            await api.delete(`/productos/${productoAEliminar.id}`);
            onMostrarToast(`Producto eliminado: ${productoAEliminar.nombre}`, 'info');
            setProductoAEliminar(null);
            cargarProductos();
        } catch {
            onMostrarToast('Error al eliminar el producto', 'error');
        }
    };

    const handleConfirmarReabastecimiento = async (e: FormEvent) => {
        e.preventDefault();
        if (!productoReabastecer) return;

        const sumar = parseInt(cantidadReabastecer, 10);
        if (isNaN(sumar) || sumar <= 0) {
            onMostrarToast('Ingresa una cantidad válida mayor a 0', 'error');
            return;
        }

        const nuevoStock = Number(productoReabastecer.stock) + sumar;
        setGuardandoStock(true);
        try {
            await api.put(`/productos/${productoReabastecer.id}`, {
                nombre: productoReabastecer.nombre,
                descripcion: productoReabastecer.descripcion || '',
                precio: Number(productoReabastecer.precio),
                stock: nuevoStock,
                imagen_url: productoReabastecer.imagen_url || null,
                categoria_id: productoReabastecer.categoria_id || null,
            });

            onMostrarToast(
                `+${sumar} uds agregadas a ${productoReabastecer.nombre} (Nuevo stock: ${nuevoStock})`,
                'success'
            );
            setProductoReabastecer(null);
            setCantidadReabastecer('10');
            cargarProductos();
        } catch {
            onMostrarToast('No se pudo actualizar el inventario', 'error');
        } finally {
            setGuardandoStock(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                        Panel de Control
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Gestión de Inventario
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs flex gap-1">
                        <button
                            type="button"
                            onClick={() => setVistaInventario('tarjetas')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${vistaInventario === 'tarjetas'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            ⊞ Tarjetas
                        </button>
                        <button
                            type="button"
                            onClick={() => setVistaInventario('tabla')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${vistaInventario === 'tabla'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            ☰ Tabla
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => (mostrarFormProducto ? resetFormulario() : setMostrarFormProducto(true))}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    >
                        {mostrarFormProducto ? '✕ Cerrar Formulario' : '+ Nuevo Producto'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setMostrarFormCategoria(!mostrarFormCategoria)}
                        className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-sm transition cursor-pointer"
                    >
                        {mostrarFormCategoria ? 'Ocultar Categorías' : '🏷️ Categorías'}
                    </button>
                </div>
            </div>

            {mostrarFormCategoria && (
                <div className="rounded-3xl shadow-lg shadow-slate-900/5">
                    <CategoryManager categorias={categorias} cargarCategorias={cargarCategorias} />
                </div>
            )}

            {mostrarFormProducto && (
                <AdminForm
                    editandoId={editandoId}
                    nombre={nombre}
                    setNombre={setNombre}
                    descripcion={descripcion}
                    setDescripcion={setDescripcion}
                    precio={precio}
                    setPrecio={setPrecio}
                    stock={stock}
                    setStock={setStock}
                    imagenUrl={imagenUrl}
                    setImagenUrl={setImagenUrl}
                    subiendoImagen={subiendoImagen}
                    onSubirArchivo={handleSubirArchivo}
                    categoriaId={categoriaId}
                    setCategoriaId={setCategoriaId}
                    categorias={categorias}
                    onSubmit={handleSubmitProducto}
                    onCancelar={resetFormulario}
                />
            )}

            {vistaInventario === 'tabla' ? (
                <AdminTable
                    productos={productos}
                    onEditar={handleEditarProducto}
                    onEliminar={(prod) => setProductoAEliminar(prod)}
                    onReabastecer={(prod) => {
                        setProductoReabastecer(prod);
                        setCantidadReabastecer('10');
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {productos.length === 0 ? (
                        <div className="col-span-full text-center text-slate-500 py-14 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            No hay productos registrados en el inventario.
                        </div>
                    ) : (
                        productos.map((prod) => (
                            <div
                                key={prod.id}
                                className={`group bg-white rounded-3xl p-4 shadow-md shadow-slate-900/5 hover:shadow-xl hover:-translate-y-1 border flex flex-col justify-between transition-all duration-200 ${prod.stock === 0
                                        ? 'border-red-300'
                                        : prod.stock <= 3
                                            ? 'border-amber-300'
                                            : 'border-slate-200/80 hover:border-emerald-300'
                                    }`}
                            >
                                <div>
                                    <div className="w-full h-40 bg-gradient-to-b from-slate-50 to-slate-100/90 rounded-2xl mb-3.5 flex items-center justify-center overflow-hidden p-3 border border-slate-100 relative">
                                        {prod.imagen_url ? (
                                            <img
                                                src={prod.imagen_url}
                                                alt={prod.nombre}
                                                className="max-h-full max-w-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <span className="text-3xl opacity-40">📦</span>
                                        )}
                                        {prod.categoria_nombre && (
                                            <span className="absolute bottom-2 left-2 bg-white/95 text-slate-700 border border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-2xs">
                                                {prod.categoria_nombre}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2">
                                        {prod.nombre}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {prod.descripcion}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div>
                                            <span className="block text-[10px] font-bold uppercase text-slate-400">
                                                Precio
                                            </span>
                                            <p className="text-lg font-black text-slate-900 leading-none">
                                                ${formatearPrecio(prod.precio)}
                                            </p>
                                        </div>

                                        <div>
                                            {prod.stock === 0 ? (
                                                <span className="inline-block bg-red-100 text-red-700 text-[11px] font-extrabold px-2.5 py-1 rounded-xl">
                                                    Agotado (0)
                                                </span>
                                            ) : prod.stock <= 3 ? (
                                                <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-1 rounded-xl">
                                                    ⚠️ Bajo: {prod.stock}
                                                </span>
                                            ) : (
                                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-1 rounded-xl">
                                                    Stock: {prod.stock}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProductoReabastecer(prod);
                                            setCantidadReabastecer('10');
                                        }}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 rounded-xl text-xs shadow-sm shadow-emerald-600/20 mb-2 transition cursor-pointer"
                                    >
                                        + Reabastecer Stock
                                    </button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEditarProducto(prod)}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-xl text-xs transition cursor-pointer"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setProductoAEliminar(prod)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 rounded-xl text-xs transition cursor-pointer"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal Reabastecimiento Rápido */}
            {productoReabastecer && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                    onClick={() => setProductoReabastecer(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/80"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-slate-900 mb-1">📦 Reabastecer Inventario</h3>
                        <p className="text-xs sm:text-sm text-slate-600 mb-4">
                            Producto: <strong className="text-slate-900">{productoReabastecer.nombre}</strong>
                            <br />
                            Stock actual: <strong className="text-emerald-700">{productoReabastecer.stock} uds</strong>
                        </p>

                        <form onSubmit={handleConfirmarReabastecimiento}>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Unidades que ingresan:
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={cantidadReabastecer}
                                onChange={(e) => setCantidadReabastecer(e.target.value)}
                                required
                                autoFocus
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />

                            <div className="flex gap-2 mb-5">
                                {['5', '10', '20', '50'].map((cant) => (
                                    <button
                                        key={cant}
                                        type="button"
                                        onClick={() => setCantidadReabastecer(cant)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-1.5 rounded-xl text-xs transition cursor-pointer"
                                    >
                                        +{cant}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setProductoReabastecer(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoStock}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
                                >
                                    {guardandoStock ? 'Guardando...' : 'Sumar Stock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Eliminar Producto */}
            {productoAEliminar && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                    onClick={() => setProductoAEliminar(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-slate-900 mb-2">¿Eliminar producto?</h3>
                        <p className="text-sm text-slate-600 mb-5">
                            Estás a punto de eliminar <strong>{productoAEliminar.nombre}</strong> del inventario.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => setProductoAEliminar(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarEliminacionProducto}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}