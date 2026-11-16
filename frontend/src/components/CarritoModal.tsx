import type { FC } from 'react';
import type { ItemCarrito } from '../types/carrito';

interface CarritoModalProps {
    carrito: ItemCarrito[];
    onCerrar: () => void;
    onActualizarCantidad: (id: number, cantidad: number) => void;
    onToggleSeleccion: (id: number) => void;
    onToggleSeleccionarTodos: (seleccionar: boolean) => void;
    onEliminarItem: (id: number) => void;
    onProcederPago: (itemsAPagar: ItemCarrito[]) => void;
    onMostrarToast?: (texto: string, tipo?: 'success' | 'error' | 'info') => void;
}

export const CarritoModal: FC<CarritoModalProps> = ({
    carrito,
    onCerrar,
    onActualizarCantidad,
    onToggleSeleccion,
    onToggleSeleccionarTodos,
    onEliminarItem,
    onProcederPago,
    onMostrarToast,
}) => {
    const itemsSeleccionados = carrito.filter((item) => item.seleccionado);
    const total = itemsSeleccionados.reduce(
        (acc, item) => acc + Number(item.precio) * item.cantidad,
        0
    );
    const todosSeleccionados =
        carrito.length > 0 && carrito.every((item) => item.seleccionado);

    const notificarError = (mensaje: string) => {
        if (onMostrarToast) {
            onMostrarToast(mensaje, 'error');
        } else {
            alert(mensaje);
        }
    };

    const handlePagar = () => {
        if (itemsSeleccionados.length === 0) {
            notificarError('Selecciona al menos un producto para continuar con la compra.');
            return;
        }
        onProcederPago(itemsSeleccionados);
    };

    const handlePedirWhatsApp = () => {
        if (itemsSeleccionados.length === 0) {
            notificarError('Selecciona al menos un producto para enviarlo por WhatsApp.');
            return;
        }

        const telefonoTienda = '573151751222';

        const detalleProductos = itemsSeleccionados
            .map(
                (item) =>
                    `• *${item.nombre}* (x${item.cantidad}) - $${(
                        Number(item.precio) * item.cantidad
                    ).toLocaleString('es-CO')}`
            )
            .join('\n');

        const mensaje = `Hola, quiero realizar el siguiente pedido de insumos agrícolas:\n\n${detalleProductos}\n\n*Total estimado:* $${total.toLocaleString('es-CO')}\n\n¿Me confirman disponibilidad y forma de entrega?`;

        const url = `https://wa.me/${telefonoTienda}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="modal-overlay" onClick={onCerrar}>
            <div
                className="modal-container carrito-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    maxWidth: '550px',
                    width: '95%',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                    }}
                >
                    <h2>Carrito de Compras ({carrito.length})</h2>
                    <button
                        onClick={onCerrar}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                        }}
                    >
                        &times;
                    </button>
                </div>

                {carrito.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p>Tu carrito está vacío 🛒</p>
                        <button
                            className="btn-primary"
                            onClick={onCerrar}
                            style={{ marginTop: '10px' }}
                        >
                            Explorar Productos
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={todosSeleccionados}
                                    onChange={(e) => onToggleSeleccionarTodos(e.target.checked)}
                                    style={{ width: 'auto' }}
                                />
                                <span>Seleccionar todos los productos</span>
                            </label>
                        </div>

                        <div
                            style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                marginBottom: '20px',
                            }}
                        >
                            {carrito.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.seleccionado}
                                        onChange={() => onToggleSeleccion(item.id)}
                                        style={{ width: 'auto' }}
                                    />
                                    {item.imagen_url && (
                                        <img
                                            src={item.imagen_url}
                                            alt={item.nombre}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.nombre}</h4>
                                        <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            ${Number(item.precio).toLocaleString('es-CO')}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => onActualizarCantidad(item.id, item.cantidad - 1)}
                                            disabled={item.cantidad <= 1}
                                            style={{ padding: '4px 10px' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600 }}>
                                            {item.cantidad}
                                        </span>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => onActualizarCantidad(item.id, item.cantidad + 1)}
                                            disabled={item.cantidad >= item.stock}
                                            style={{ padding: '4px 10px' }}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => onEliminarItem(item.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '1.1rem',
                                        }}
                                        title="Eliminar ítem"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                borderTop: '1px solid #e2e8f0',
                                paddingTop: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Productos seleccionados:</span>
                                <strong>{itemsSeleccionados.length}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                                <span>Total:</span>
                                <strong>${total.toLocaleString('es-CO')}</strong>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handlePagar}
                                disabled={itemsSeleccionados.length === 0}
                                style={{ width: '100%', marginTop: '6px', padding: '11px' }}
                            >
                                Continuar Compra ({itemsSeleccionados.length})
                            </button>

                            <button
                                type="button"
                                onClick={handlePedirWhatsApp}
                                disabled={itemsSeleccionados.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: itemsSeleccionados.length === 0 ? '#cbd5e1' : '#25D366',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '0.92rem',
                                    cursor: itemsSeleccionados.length === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                📲 Pedir por WhatsApp ({itemsSeleccionados.length})
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};