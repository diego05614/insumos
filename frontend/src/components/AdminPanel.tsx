import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { api } from '../services/api';
import type { Producto } from '../types/producto';
import type { Categoria } from '../types/categoria';
import { CategoryManager } from './CategoryManager';

interface AdminPanelProps {
  productos: Producto[];
  cargarProductos: () => void;
  categorias: Categoria[];
  cargarCategorias: () => void;
  onMostrarToast: (texto: string, tipo?: 'success' | 'error' | 'info') => void;
}

interface VentaItemDetalle {
  id: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

interface VentaRegistro {
  id: number;
  cliente_nombre: string;
  metodo_pago?: string;
  total: number;
  estado?: string;
  fecha?: string;
  created_at?: string;
  items?: VentaItemDetalle[];
}

interface ResumenVentas {
  totalVendido: number;
  totalPedidos: number;
  topProductos: { nombre: string; unidadesVendidas: number; ingresos: number }[];
  ventasPorCategoria: { categoria: string; unidades: number; ingresos: number }[];
}

interface ItemVentaFisica {
  producto: Producto;
  cantidad: number;
}

export function AdminPanel({
  productos,
  cargarProductos,
  categorias,
  cargarCategorias,
  onMostrarToast,
}: AdminPanelProps) {
  // Navegación principal
  const [pestanaActiva, setPestanaActiva] = useState<'inventario' | 'pos' | 'resumen'>('inventario');

  // Estados de visibilidad de formularios y modales
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false);
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [ventaAAnular, setVentaAAnular] = useState<VentaRegistro | null>(null);

  // Estado para Comprobante Digital
  const [ventaComprobante, setVentaComprobante] = useState<VentaRegistro | null>(null);
  const [telefonoClienteTicket, setTelefonoClienteTicket] = useState('');

  // Estado para Reabastecimiento Rápido de Stock
  const [productoReabastecer, setProductoReabastecer] = useState<Producto | null>(null);
  const [cantidadReabastecer, setCantidadReabastecer] = useState('10');
  const [guardandoStock, setGuardandoStock] = useState(false);

  // Estado del formulario de productos
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Estados para Venta en Punto Físico
  const [clientePos, setClientePos] = useState('Cliente Mostrador');
  const [metodoPagoPos, setMetodoPagoPos] = useState<'efectivo' | 'nequi' | 'daviplata' | 'tarjeta'>('efectivo');
  const [busquedaPos, setBusquedaPos] = useState('');
  const [itemsPos, setItemsPos] = useState<ItemVentaFisica[]>([]);
  const [registrandoVentaPos, setRegistrandoVentaPos] = useState(false);

  // Estados del Registro de Ventas
  const [ventas, setVentas] = useState<VentaRegistro[]>([]);
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('todo');

  const cargarDatosVentas = async () => {
    setCargandoVentas(true);
    try {
      const [resResumen, resVentas] = await Promise.all([
        api.get('/pedidos/resumen'),
        api.get('/pedidos'),
      ]);
      setResumen(resResumen.data);
      setVentas(resVentas.data);
    } catch (error) {
      console.error('Error al cargar registro de ventas:', error);
      onMostrarToast('Error al cargar el registro de ventas', 'error');
    } finally {
      setCargandoVentas(false);
    }
  };

  useEffect(() => {
    if (pestanaActiva === 'resumen') {
      cargarDatosVentas();
    }
  }, [pestanaActiva]);

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

  // Subida de foto desde el dispositivo
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
    } catch (error) {
      console.error('Error al subir la imagen:', error);
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
    } catch (error) {
      console.error('Error al guardar producto:', error);
      onMostrarToast('Error al guardar el producto', 'error');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmarEliminacionProducto = async () => {
    if (!productoAEliminar) return;
    try {
      await api.delete(`/productos/${productoAEliminar.id}`);
      onMostrarToast(`Producto eliminado: ${productoAEliminar.nombre}`, 'info');
      setProductoAEliminar(null);
      cargarProductos();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      onMostrarToast('Error al eliminar el producto', 'error');
    }
  };

  // Reabastecimiento rápido de stock
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
    } catch (error) {
      console.error('Error al reabastecer stock:', error);
      onMostrarToast('No se pudo actualizar el inventario', 'error');
    } finally {
      setGuardandoStock(false);
    }
  };

  // Funciones para Venta Física
  const agregarItemPos = (prod: Producto) => {
    if (prod.stock <= 0) return;

    const existente = itemsPos.find((i) => i.producto.id === prod.id);
    if (existente) {
      if (existente.cantidad >= prod.stock) {
        onMostrarToast(`Stock máximo alcanzado para ${prod.nombre} (${prod.stock})`, 'error');
        return;
      }
      setItemsPos((prev) =>
        prev.map((i) =>
          i.producto.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      );
    } else {
      setItemsPos((prev) => [...prev, { producto: prod, cantidad: 1 }]);
    }
  };

  const cambiarCantidadPos = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      setItemsPos((prev) => prev.filter((i) => i.producto.id !== productoId));
      return;
    }
    setItemsPos((prev) =>
      prev.map((i) => {
        if (i.producto.id !== productoId) return i;
        return { ...i, cantidad: Math.min(nuevaCantidad, i.producto.stock) };
      })
    );
  };

  const handleRegistrarVentaFisica = async (e: FormEvent) => {
    e.preventDefault();
    if (itemsPos.length === 0) {
      onMostrarToast('Agrega al menos un producto a la venta', 'error');
      return;
    }

    setRegistrandoVentaPos(true);
    try {
      const clienteFinal = clientePos.trim() || 'Cliente Mostrador';
      const payload = {
        cliente_nombre: clienteFinal,
        metodo_pago: metodoPagoPos,
        items: itemsPos.map((i) => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
        })),
      };

      const res = await api.post('/pedidos', payload);
      const totalPagado = Number(res.data.total_pagado);

      onMostrarToast(
        `Venta #${res.data.pedido_id} registrada ($${totalPagado.toLocaleString('es-CO')})`,
        'success'
      );

      setVentaComprobante({
        id: res.data.pedido_id,
        cliente_nombre: clienteFinal,
        metodo_pago: metodoPagoPos,
        total: totalPagado,
        fecha: new Date().toISOString(),
        items: itemsPos.map((i, idx) => ({
          id: idx + 1,
          producto_nombre: i.producto.nombre,
          cantidad: i.cantidad,
          precio_unitario: Number(i.producto.precio),
          subtotal: Number(i.producto.precio) * i.cantidad,
        })),
      });
      setTelefonoClienteTicket('');

      setItemsPos([]);
      setClientePos('Cliente Mostrador');
      setMetodoPagoPos('efectivo');
      cargarProductos();
    } catch (error: any) {
      console.error('Error al registrar venta física:', error);
      const msg = error.response?.data?.error || 'Error al registrar la venta';
      onMostrarToast(msg, 'error');
    } finally {
      setRegistrandoVentaPos(false);
    }
  };

  // Enviar comprobante digital por WhatsApp
  const handleEnviarComprobanteWhatsApp = () => {
    if (!ventaComprobante) return;

    const lineasProductos = (ventaComprobante.items || [])
      .map(
        (it) =>
          `• ${it.producto_nombre || 'Producto'} x${it.cantidad} — $${formatearPrecio(
            Number(it.precio_unitario) * it.cantidad
          )}`
      )
      .join('\n');

    const mensaje = [
      `🧾 *COMPROBANTE DE VENTA #${ventaComprobante.id}*`,
      `📅 Fecha: ${formatearFecha(ventaComprobante)}`,
      `👤 Cliente: ${ventaComprobante.cliente_nombre}`,
      `💳 Pago: ${(ventaComprobante.metodo_pago || 'Efectivo').toUpperCase()}`,
      `────────────────────`,
      lineasProductos,
      `────────────────────`,
      `💰 *TOTAL PAGADO: $${formatearPrecio(ventaComprobante.total)} COP*`,
      ``,
      `¡Gracias por su compra!`,
    ].join('\n');

    const limpio = telefonoClienteTicket.replace(/\D/g, '');
    const numeroConPrefijo = limpio
      ? limpio.startsWith('57')
        ? limpio
        : `57${limpio}`
      : '';

    const url = numeroConPrefijo
      ? `https://wa.me/${numeroConPrefijo}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Anular venta y restaurar inventario
  const confirmarAnulacionVenta = async () => {
    if (!ventaAAnular) return;
    try {
      await api.put(`/pedidos/${ventaAAnular.id}/anular`);
      onMostrarToast(`Venta #${ventaAAnular.id} anulada. Stock devuelto al inventario.`, 'info');
      setVentaAAnular(null);
      cargarDatosVentas();
      cargarProductos();
    } catch (error: any) {
      console.error('Error al anular venta:', error);
      const msg = error.response?.data?.error || 'No se pudo anular la venta';
      onMostrarToast(msg, 'error');
    }
  };

  const formatearPrecio = (valor: unknown): string => {
    const numero = Number(valor);
    return isNaN(numero) ? '0' : numero.toLocaleString('es-CO');
  };

  const formatearFecha = (venta: VentaRegistro): string => {
    const raw = venta.fecha || venta.created_at;
    if (!raw) return 'Reciente';
    const d = new Date(raw);
    return isNaN(d.getTime())
      ? String(raw)
      : d.toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  const productosCriticos = productos.filter((p) => p.stock <= 3);

  const productosPosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busquedaPos.toLowerCase()) ||
      (p.categoria_nombre || '').toLowerCase().includes(busquedaPos.toLowerCase())
  );

  const totalVentaPos = itemsPos.reduce(
    (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
    0
  );

  const ventasFiltradasPorFecha = ventas.filter((v) => {
    if (filtroPeriodo === 'todo') return true;
    const raw = v.fecha || v.created_at;
    if (!raw) return true;

    const fechaVenta = new Date(raw);
    if (isNaN(fechaVenta.getTime())) return true;

    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    if (filtroPeriodo === 'hoy') {
      return fechaVenta >= inicioHoy;
    }
    if (filtroPeriodo === 'semana') {
      const hace7Dias = new Date(inicioHoy);
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      return fechaVenta >= hace7Dias;
    }
    if (filtroPeriodo === 'mes') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return fechaVenta >= inicioMes;
    }
    return true;
  });

  const ventasActivasPeriodo = ventasFiltradasPorFecha.filter((v) => v.estado !== 'Anulada');
  const totalIngresosPeriodo = ventasActivasPeriodo.reduce((acc, v) => acc + Number(v.total), 0);

  return (
    <div className="admin-panel">
      {/* Navegación superior (3 pestañas) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className={pestanaActiva === 'inventario' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setPestanaActiva('inventario')}
        >
          📦 Inventario ({productos.length})
        </button>
        <button
          type="button"
          className={pestanaActiva === 'pos' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setPestanaActiva('pos')}
        >
          🛒 Registrar Venta
        </button>
        <button
          type="button"
          className={pestanaActiva === 'resumen' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setPestanaActiva('resumen')}
        >
          📊 Registro de Ventas
        </button>
      </div>

      {/*INVENTARIO*/}
      {pestanaActiva === 'inventario' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => {
                if (mostrarFormProducto) {
                  resetFormulario();
                } else {
                  setMostrarFormProducto(true);
                }
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

          {mostrarFormCategoria && (
            <div
              style={{
                background: '#f8fafc',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0',
              }}
            >
              <CategoryManager categorias={categorias} cargarCategorias={cargarCategorias} />
            </div>
          )}

          {mostrarFormProducto && (
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '25px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3 style={{ marginBottom: '12px' }}>
                {editandoId !== null ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <form
                onSubmit={handleSubmitProducto}
                style={{ display: 'grid', gap: '12px', maxWidth: '520px' }}
              >
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
                  rows={3}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio ($)"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Stock (unidades)"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    padding: '12px',
                    border: '1px dashed #94a3b8',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    📷 Subir imagen desde el dispositivo:
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleSubirArchivo}
                    disabled={subiendoImagen}
                  />
                  {subiendoImagen && (
                    <p style={{ fontSize: '0.82rem', color: '#16a34a', marginTop: '6px' }}>
                      Subiendo foto al servidor...
                    </p>
                  )}

                  {imagenUrl && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={imagenUrl}
                        alt="Vista previa"
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'contain',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setImagenUrl('')}
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
                    style={{ marginTop: '8px', fontSize: '0.82rem' }}
                  />
                </div>

                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="">Sin categoría asignada</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="btn-success" disabled={subiendoImagen}>
                    {editandoId !== null ? 'Actualizar Producto' : 'Guardar Producto'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={resetFormulario}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Lista de Productos</h3>
            {productosCriticos.length > 0 && (
              <span className="stock-badge stock-bajo" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                ⚠️ {productosCriticos.length} con stock bajo
              </span>
            )}
          </div>

          <div className="catalogo-grid" style={{ marginTop: '15px' }}>
            {productos.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                No hay productos registrados.
              </p>
            ) : (
              productos.map((prod) => (
                <div
                  key={prod.id}
                  className="producto-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderColor: prod.stock === 0 ? '#fca5a5' : prod.stock <= 3 ? '#fcd34d' : undefined,
                  }}
                >
                  <div>
                    {prod.imagen_url && (
                      <img src={prod.imagen_url} alt={prod.nombre} className="producto-img" />
                    )}
                    <h3>{prod.nombre}</h3>
                    {prod.categoria_nombre && (
                      <span className="categoria-tag">{prod.categoria_nombre}</span>
                    )}
                    <p style={{ marginTop: '8px' }}>{prod.descripcion}</p>
                  </div>

                  <div>
                    <p className="precio-tag">
                      <strong>Precio:</strong> ${formatearPrecio(prod.precio)}{' '}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>COP</span>
                    </p>

                    <div style={{ margin: '4px 0 10px 0' }}>
                      {prod.stock === 0 ? (
                        <span className="stock-badge stock-agotado">Agotado (0)</span>
                      ) : prod.stock <= 3 ? (
                        <span className="stock-badge stock-bajo">⚠️ Stock bajo: {prod.stock} uds</span>
                      ) : (
                        <span className="stock-badge stock-disponible">Disponible: {prod.stock}</span>
                      )}
                    </div>

                    {/* Botón rápido de Reabastecimiento */}
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        setProductoReabastecer(prod);
                        setCantidadReabastecer('10');
                      }}
                      style={{ width: '100%', padding: '7px', fontSize: '0.84rem', marginBottom: '6px' }}
                    >
                      + Reabastecer Stock
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => handleEditarProducto(prod)}
                        style={{ flex: 1, padding: '6px', fontSize: '0.82rem' }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => setProductoAEliminar(prod)}
                        style={{ flex: 1, padding: '6px', fontSize: '0.82rem' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* VENTA EN PUNTO FÍSICO */}
      {pestanaActiva === 'pos' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/*Selector rápido de productos */}
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <h3 style={{ marginBottom: '12px' }}>1. Seleccionar Insumos</h3>
            <input
              type="text"
              placeholder="Buscar producto por nombre o categoría..."
              value={busquedaPos}
              onChange={(e) => setBusquedaPos(e.target.value)}
              style={{ marginBottom: '12px' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {productosPosFiltrados.map((prod) => {
                const sinStock = prod.stock <= 0;
                return (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: sinStock ? '#f8fafc' : '#ffffff',
                      opacity: sinStock ? 0.65 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{prod.nombre}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        ${formatearPrecio(prod.precio)} •{' '}
                        {sinStock ? (
                          <span style={{ color: '#b91c1c', fontWeight: 600 }}>Agotado</span>
                        ) : (
                          <span style={{ color: '#15803d', fontWeight: 600 }}>Stock: {prod.stock}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      disabled={sinStock}
                      onClick={() => agregarItemPos(prod)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      + Agregar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/*Detalle de la venta en mostrador */}
          <form
            onSubmit={handleRegistrarVentaFisica}
            style={{
              background: '#ffffff',
              padding: '18px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
          >
            <h3 style={{ marginBottom: '14px' }}>2. Detalle de Venta en Mostrador</h3>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                </label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={clientePos}
                  onChange={(e) => setClientePos(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Método de Pago:
                </label>
                <select
                  value={metodoPagoPos}
                  onChange={(e) => setMetodoPagoPos(e.target.value as any)}
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="nequi">📱 Nequi</option>
                  <option value="daviplata">📱 Daviplata</option>
                  <option value="tarjeta">💳 Tarjeta / Datáfono</option>
                </select>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                padding: '12px 0',
                marginBottom: '14px',
                minHeight: '100px',
              }}
            >
              {itemsPos.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', margin: '24px 0' }}>
                  Selecciona productos de la lista para armar la venta.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {itemsPos.map((item) => (
                    <div
                      key={item.producto.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.producto.nombre}</div>
                        <small style={{ color: '#64748b' }}>
                          ${formatearPrecio(item.producto.precio)} c/u
                        </small>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '2px 8px' }}
                          onClick={() => cambiarCantidadPos(item.producto.id, item.cantidad - 1)}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '22px', textAlign: 'center' }}>
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '2px 8px' }}
                          onClick={() => cambiarCantidadPos(item.producto.id, item.cantidad + 1)}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ fontWeight: 700, minWidth: '80px', textAlign: 'right' }}>
                        ${formatearPrecio(Number(item.producto.precio) * item.cantidad)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '1.15rem',
                fontWeight: 800,
                marginBottom: '14px',
              }}
            >
              <span>Total a Cobrar:</span>
              <span style={{ color: '#16a34a' }}>${formatearPrecio(totalVentaPos)} COP</span>
            </div>

            <button
              type="submit"
              className="btn-success"
              disabled={itemsPos.length === 0 || registrandoVentaPos}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 700 }}
            >
              {registrandoVentaPos ? 'Registrando venta...' : '✅ Confirmar y Registrar Venta'}
            </button>
          </form>
        </div>
      )}

      {/* REGISTRO DE VENTAS EN PANTALLA */}
      {pestanaActiva === 'resumen' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0 }}>Registro y Cierre de Ventas</h3>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value as any)}
                style={{ width: 'auto', fontWeight: 600 }}
              >
                <option value="todo">📅 Todo el historial</option>
                <option value="hoy">☀️ Ventas de Hoy</option>
                <option value="semana">📆 Últimos 7 días</option>
                <option value="mes">🗓️ Este Mes</option>
              </select>

              <button type="button" className="btn-secondary" onClick={cargarDatosVentas}>
                🔄 Actualizar
              </button>
            </div>
          </div>

          {cargandoVentas || !resumen ? (
            <p>Cargando registro de ventas...</p>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    padding: '18px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #16a34a',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Ingresos ({filtroPeriodo === 'todo' ? 'Histórico' : filtroPeriodo.toUpperCase()})
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                    ${formatearPrecio(totalIngresosPeriodo)}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    padding: '18px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Ventas Válidas</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    {ventasActivasPeriodo.length}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    padding: '18px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #f59e0b',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Productos con Stock Bajo</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>
                    {productosCriticos.length}
                  </div>
                </div>
              </div>

              {/* Tabla completa del Registro de Ventas */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '24px',
                }}
              >
                <h4 style={{ marginBottom: '12px' }}>
                  📋 Historial Detallado ({ventasFiltradasPorFecha.length})
                </h4>
                {ventasFiltradasPorFecha.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    No hay ventas registradas en este período.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ marginTop: 0 }}>
                      <thead>
                        <tr>
                          <th>Venta #</th>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Productos Vendidos</th>
                          <th>Pago</th>
                          <th>Total</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventasFiltradasPorFecha.map((venta) => {
                          const estaAnulada = venta.estado === 'Anulada';
                          return (
                            <tr
                              key={venta.id}
                              style={{
                                opacity: estaAnulada ? 0.6 : 1,
                                backgroundColor: estaAnulada ? '#fef2f2' : undefined,
                              }}
                            >
                              <td>
                                <strong>#{venta.id}</strong>
                              </td>
                              <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                                {formatearFecha(venta)}
                              </td>
                              <td>
                                <strong>{venta.cliente_nombre}</strong>
                              </td>
                              <td>
                                {venta.items && venta.items.length > 0 ? (
                                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.84rem' }}>
                                    {venta.items.map((it) => (
                                      <li key={it.id}>
                                        {it.producto_nombre || 'Insumo'} — <strong>{it.cantidad} ud(s)</strong> ($
                                        {formatearPrecio(it.precio_unitario)} c/u)
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <small style={{ color: '#94a3b8' }}>Sin detalle</small>
                                )}
                              </td>
                              <td style={{ textTransform: 'capitalize' }}>{venta.metodo_pago || 'Efectivo'}</td>
                              <td>
                                {estaAnulada ? (
                                  <span style={{ textDecoration: 'line-through', color: '#991b1b' }}>
                                    ${formatearPrecio(venta.total)}
                                  </span>
                                ) : (
                                  <strong style={{ color: '#16a34a' }}>${formatearPrecio(venta.total)}</strong>
                                )}
                              </td>
                              <td>
                                {estaAnulada ? (
                                  <span className="stock-badge stock-agotado">Anulada</span>
                                ) : (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                      onClick={() => {
                                        setVentaComprobante(venta);
                                        setTelefonoClienteTicket('');
                                      }}
                                    >
                                      🧾 Recibo
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-danger"
                                      style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                      onClick={() => setVentaAAnular(venta)}
                                    >
                                      Anular
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Desglose por Productos más vendidos y Categorías */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ marginBottom: '12px' }}>🏆 Productos Más Vendidos</h4>
                  {resumen.topProductos.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Aún no hay datos.</p>
                  ) : (
                    <table className="admin-table" style={{ marginTop: 0 }}>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Unidades</th>
                          <th>Ingresos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.topProductos.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.nombre}</td>
                            <td>
                              <strong>{item.unidadesVendidas}</strong>
                            </td>
                            <td>${formatearPrecio(item.ingresos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ marginBottom: '12px' }}>📂 Ventas por Categoría</h4>
                  {resumen.ventasPorCategoria.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Aún no hay datos.</p>
                  ) : (
                    <table className="admin-table" style={{ marginTop: 0 }}>
                      <thead>
                        <tr>
                          <th>Categoría</th>
                          <th>Unidades</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.ventasPorCategoria.map((cat, idx) => (
                          <tr key={idx}>
                            <td>{cat.categoria}</td>
                            <td>{cat.unidades}</td>
                            <td>
                              <strong>${formatearPrecio(cat.ingresos)}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/*REABASTECIMIENTO RÁPIDO DE STOCK  */}
      {productoReabastecer && (
        <div className="modal-overlay" onClick={() => setProductoReabastecer(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', padding: '20px' }}
          >
            <h3 style={{ marginBottom: '6px', color: '#0f172a' }}>📦 Reabastecer Inventario</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '14px' }}>
              Producto: <strong>{productoReabastecer.nombre}</strong>
              <br />
              Stock actual: <strong>{productoReabastecer.stock} uds</strong>
            </p>

            <form onSubmit={handleConfirmarReabastecimiento}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Unidades que ingresan:
              </label>
              <input
                type="number"
                min="1"
                value={cantidadReabastecer}
                onChange={(e) => setCantidadReabastecer(e.target.value)}
                required
                autoFocus
                style={{ marginBottom: '10px' }}
              />

              {/* Atajos rápidos de cantidad */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {['5', '10', '20', '50'].map((cant) => (
                  <button
                    key={cant}
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, padding: '4px', fontSize: '0.8rem' }}
                    onClick={() => setCantidadReabastecer(cant)}
                  >
                    +{cant}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setProductoReabastecer(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-success"
                  style={{ flex: 1 }}
                  disabled={guardandoStock}
                >
                  {guardandoStock ? 'Guardando...' : 'Sumar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*COMPROBANTE DIGITAL / TICKET */}
      {ventaComprobante && (
        <div className="modal-overlay" onClick={() => setVentaComprobante(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', padding: '22px' }}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.6rem' }}>🧾</span>
              <h3 style={{ margin: '4px 0', color: '#0f172a' }}>
                Comprobante de Venta #{ventaComprobante.id}
              </h3>
              <small style={{ color: '#64748b' }}>{formatearFecha(ventaComprobante)}</small>
            </div>

            <div style={{ fontSize: '0.88rem', marginBottom: '12px', color: '#334155' }}>
              <div>
                <strong>Cliente:</strong> {ventaComprobante.cliente_nombre}
              </div>
              <div style={{ textTransform: 'capitalize' }}>
                <strong>Método de pago:</strong> {ventaComprobante.metodo_pago || 'Efectivo'}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.86rem',
              }}
            >
              {(ventaComprobante.items || []).map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <span>
                    {it.producto_nombre || 'Producto'} <strong>x{it.cantidad}</strong>
                  </span>
                  <strong>${formatearPrecio(Number(it.precio_unitario) * it.cantidad)}</strong>
                </div>
              ))}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#16a34a',
                }}
              >
                <span>TOTAL PAGADO:</span>
                <span>${formatearPrecio(ventaComprobante.total)} COP</span>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                WhatsApp del cliente (opcional):
              </label>
              <input
                type="tel"
                placeholder="Ej. 3001234567"
                value={telefonoClienteTicket}
                onChange={(e) => setTelefonoClienteTicket(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn-success"
                onClick={handleEnviarComprobanteWhatsApp}
                style={{ width: '100%', backgroundColor: '#25D366', borderColor: '#25D366', fontWeight: 700 }}
              >
                📲 Enviar Comprobante por WhatsApp
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVentaComprobante(null)}
                style={{ width: '100%' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/*CONFIRMACIÓN ELIMINAR PRODUCTO */}
      {productoAEliminar && (
        <div className="modal-overlay" onClick={() => setProductoAEliminar(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', padding: '20px', textAlign: 'center' }}
          >
            <h3 style={{ marginBottom: '10px', color: '#0f172a' }}>¿Eliminar producto?</h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '18px' }}>
              Estás a punto de eliminar <strong>{productoAEliminar.nombre}</strong> del inventario. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setProductoAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{ flex: 1 }}
                onClick={confirmarEliminacionProducto}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/*CONFIRMACIÓN ANULAR VENTA*/}
      {ventaAAnular && (
        <div className="modal-overlay" onClick={() => setVentaAAnular(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', padding: '20px', textAlign: 'center' }}
          >
            <h3 style={{ marginBottom: '10px', color: '#0f172a' }}>¿Anular venta #{ventaAAnular.id}?</h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '18px' }}>
              Se descontarán <strong>${formatearPrecio(ventaAAnular.total)}</strong> de los ingresos y los productos volverán automáticamente al inventario.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setVentaAAnular(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{ flex: 1 }}
                onClick={confirmarAnulacionVenta}
              >
                Sí, anular venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}