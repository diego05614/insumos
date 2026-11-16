import type { Producto } from '../types/producto';

interface AdminTableProps {
    productos: Producto[];
    onEditar: (producto: Producto) => void;
    onEliminar: (id: number) => void;
}

export function AdminTable({ productos, onEditar, onEliminar }: AdminTableProps) {
    const productosCriticos = productos.filter((p) => p.stock <= 3);

    return (
        <div className="admin-table-container">
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '12px',
                }}
            >
                <h3 style={{ margin: 0 }}>Inventario Actual ({productos.length})</h3>

                {productosCriticos.length > 0 && (
                    <span className="stock-badge stock-bajo" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                        ⚠️ {productosCriticos.length}{' '}
                        {productosCriticos.length === 1 ? 'producto con stock crítico' : 'productos con stock crítico'}
                    </span>
                )}
            </div>

            <div style={{ overflowX: 'auto' }}>
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
                            <tr
                                key={prod.id}
                                style={{
                                    backgroundColor:
                                        prod.stock === 0
                                            ? '#fef2f2'
                                            : prod.stock <= 3
                                                ? '#fffbeb'
                                                : undefined,
                                }}
                            >
                                <td>{prod.id}</td>
                                <td>
                                    <strong>{prod.nombre}</strong>
                                    {prod.categoria_nombre && (
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {prod.categoria_nombre}
                                        </div>
                                    )}
                                </td>
                                <td>${Number(prod.precio).toLocaleString('es-CO')}</td>
                                <td>
                                    {prod.stock === 0 ? (
                                        <span className="stock-badge stock-agotado">Agotado (0)</span>
                                    ) : prod.stock <= 3 ? (
                                        <span className="stock-badge stock-bajo">
                                            ⚠️ Bajo ({prod.stock} uds)
                                        </span>
                                    ) : (
                                        <span>{prod.stock} uds</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn-action-edit" onClick={() => onEditar(prod)}>
                                            Editar
                                        </button>
                                        <button className="btn-action-delete" onClick={() => onEliminar(prod.id)}>
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}