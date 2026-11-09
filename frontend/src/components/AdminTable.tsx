import React from 'react';
import type { Producto } from '../types/producto';

interface AdminTableProps {
    productos: Producto[];
    onEditar: (producto: Producto) => void;
    onEliminar: (id: number) => void;
}

export function AdminTable({ productos, onEditar, onEliminar }: AdminTableProps) {
    return (
        <div className="admin-table-container">
            <h3>Inventario Actual</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map((prod) => (
                        <tr key={prod.id}>
                            <td>{prod.id}</td>
                            <td>{prod.nombre}</td>
                            <td>${Number(prod.precio).toFixed(2)}</td>
                            <td>{prod.stock}</td>
                            <td>
                                <button className="btn-action-edit" onClick={() => onEditar(prod)}>Editar</button>
                                <button className="btn-action-delete" onClick={() => onEliminar(prod.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}