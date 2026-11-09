import React from 'react';

export type FormState = {
    nombre: string;
    descripcion: string;
    precio: string;
    stock: string;
    imagen_url: string;
};

interface AdminFormProps {
    formProducto: FormState;
    editandoId: number | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancelar: () => void;
}

export function AdminForm({
    formProducto,
    editandoId,
    onChange,
    onSubmit,
    onCancelar
}: AdminFormProps) {
    return (
        <div className="admin-form-container">
            <form onSubmit={onSubmit}>
                <h3>{editandoId !== null ? 'Editar Producto' : 'Nuevo Producto'}</h3>

                <div className="admin-form-grid">
                    <div>
                        <label>Nombre:</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formProducto.nombre}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div>
                        <label>Precio:</label>
                        <input
                            type="number"
                            step="0.01"
                            name="precio"
                            value={formProducto.precio}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div>
                        <label>Stock:</label>
                        <input
                            type="number"
                            name="stock"
                            value={formProducto.stock}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div>
                        <label>URL Imagen:</label>
                        <input
                            type="text"
                            name="imagen_url"
                            value={formProducto.imagen_url}
                            onChange={onChange}
                        />
                    </div>

                    <div className="full-width">
                        <label>Descripción:</label>
                        <textarea
                            name="descripcion"
                            value={formProducto.descripcion}
                            onChange={onChange}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-success">
                        {editandoId !== null ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>

                    {/* El botón de cancelar ahora se muestra SIEMPRE */}
                    <button type="button" className="btn-secondary" onClick={onCancelar}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}