import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { Producto } from './types/producto';
import type { Categoria } from './types/categoria';
import type { ItemCarrito } from './types/carrito';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { SearchBar } from './components/Searchbar';
import { CarritoModal } from './components/CarritoModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ComprobanteModal, type DatosComprobante } from './components/ComprobanteModal';
import { PedidosModal } from './components/PedidosModal';
import './App.css';

interface ToastMessage {
  id: number;
  texto: string;
  tipo: 'success' | 'error' | 'info';
}

export function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [menuLateralAbierto, setMenuLateralAbierto] = useState<boolean>(false);

  // Favoritos persistentes
  const [favoritos, setFavoritos] = useState<number[]>(() => {
    try {
      const guardados = localStorage.getItem('insumos_favoritos');
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });
  const [soloFavoritos, setSoloFavoritos] = useState<boolean>(false);

  // Modal de detalle y productos relacionados
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);

  // Estado de notificaciones Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Estado de autenticación persistente
  const [userRol, setUserRol] = useState<'admin' | 'cliente' | null>(() => {
    const rolGuardado = localStorage.getItem('insumos_rol');
    return rolGuardado === 'admin' || rolGuardado === 'cliente' ? rolGuardado : null;
  });
  const [nombreCliente, setNombreCliente] = useState<string>(() => {
    return localStorage.getItem('insumos_usuario') || '';
  });
  const [mostrarLogin, setMostrarLogin] = useState<boolean>(false);

  // Estados del Carrito persistente
  const [carrito, setCarrito] = useState<ItemCarrito[]>(() => {
    try {
      const guardado = localStorage.getItem('insumos_carrito');
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });
  const [mostrarCarrito, setMostrarCarrito] = useState<boolean>(false);
  const [itemsParaCheckout, setItemsParaCheckout] = useState<ItemCarrito[] | null>(null);

  // Estados de Comprobante post-compra e Historial del Cliente (Paso 3)
  const [comprobanteActual, setComprobanteActual] = useState<DatosComprobante | null>(null);
  const [mostrarMisPedidos, setMostrarMisPedidos] = useState<boolean>(false);

  // Sincronizar carrito automáticamente
  useEffect(() => {
    localStorage.setItem('insumos_carrito', JSON.stringify(carrito));
  }, [carrito]);

  const mostrarToast = (texto: string, tipo: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const filtrados = prev.filter((t) => t.texto !== texto);
      return [...filtrados, { id, texto, tipo }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const toggleFavorito = (prod: Producto) => {
    const yaEsFavorito = favoritos.includes(prod.id);
    const actualizados = yaEsFavorito
      ? favoritos.filter((id) => id !== prod.id)
      : [...favoritos, prod.id];

    setFavoritos(actualizados);
    localStorage.setItem('insumos_favoritos', JSON.stringify(actualizados));

    mostrarToast(
      yaEsFavorito
        ? `Quitado de favoritos: ${prod.nombre}`
        : `Guardado en favoritos: ${prod.nombre}`,
      'info'
    );
  };

  const cargarProductos = async () => {
    try {
      const respuesta = await api.get('/productos');
      const listaActualizada: Producto[] = respuesta.data;
      setProductos(listaActualizada);

      setCarrito((prevCarrito) =>
        prevCarrito
          .map((item) => {
            const prodActual = listaActualizada.find((p) => p.id === item.id);
            if (!prodActual || prodActual.stock <= 0) return null;
            return {
              ...item,
              stock: prodActual.stock,
              precio: prodActual.precio,
              cantidad: Math.min(item.cantidad, prodActual.stock),
            };
          })
          .filter((item): item is ItemCarrito => item !== null)
      );
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const respuesta = await api.get('/categorias');
      setCategorias(respuesta.data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();

    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarProductos();
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cargarProductos();
        cargarCategorias();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleLoginExitoso = (rol: 'admin' | 'cliente', usuario: string) => {
    setUserRol(rol);
    setNombreCliente(usuario);
    localStorage.setItem('insumos_rol', rol);
    localStorage.setItem('insumos_usuario', usuario);
    setMostrarLogin(false);
    mostrarToast(`Bienvenido, ${usuario}`);
  };

  const handleCerrarSesion = () => {
    setUserRol(null);
    setNombreCliente('');
    setCarrito([]);
    localStorage.removeItem('insumos_rol');
    localStorage.removeItem('insumos_usuario');
    localStorage.removeItem('insumos_carrito');
    mostrarToast('Sesión cerrada', 'info');
  };

  // Lógica del Carrito de Compras
  const handleAgregarAlCarrito = (prod: Producto) => {
    if (userRol !== 'cliente') {
      mostrarToast('Inicia sesión como Cliente para agregar productos', 'info');
      setMostrarLogin(true);
      return;
    }

    const existe = carrito.find((item) => item.id === prod.id);

    if (existe) {
      if (existe.cantidad >= prod.stock) {
        mostrarToast(`Stock máximo alcanzado (${prod.stock})`, 'error');
        return;
      }
      setCarrito((prev) =>
        prev.map((item) =>
          item.id === prod.id
            ? { ...item, cantidad: Math.min(item.cantidad + 1, prod.stock) }
            : item
        )
      );
      mostrarToast(`Cantidad actualizada: ${prod.nombre}`);
    } else {
      setCarrito((prev) => [...prev, { ...prod, cantidad: 1, seleccionado: true }]);
      mostrarToast(`Agregado al carrito: ${prod.nombre}`);
    }
  };

  const handleComprarAhora = (prod: Producto) => {
    if (userRol !== 'cliente') {
      mostrarToast('Inicia sesión como Cliente para realizar compras', 'info');
      setMostrarLogin(true);
      return;
    }

    const itemDirecto: ItemCarrito = {
      ...prod,
      cantidad: 1,
      seleccionado: true,
    };
    setItemsParaCheckout([itemDirecto]);
  };

  const handlePedirWhatsAppProducto = (prod: Producto) => {
    const telefonoTienda = '573151751222';
    const mensaje = `Hola, me interesa este insumo agrícola:\n\n• *${prod.nombre}*\n• Precio: $${Number(prod.precio).toLocaleString('es-CO')}\n\n¿Tienen disponibilidad inmediata?`;
    const url = `https://wa.me/${telefonoTienda}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleActualizarCantidad = (id: number, cantidad: number) => {
    setCarrito((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad } : item))
    );
  };

  const handleToggleSeleccion = (id: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, seleccionado: !item.seleccionado } : item
      )
    );
  };

  const handleToggleSeleccionarTodos = (seleccionar: boolean) => {
    setCarrito((prev) =>
      prev.map((item) => ({ ...item, seleccionado: seleccionar }))
    );
  };

  const handleEliminarItem = (id: number) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
    mostrarToast('Producto eliminado del carrito', 'info');
  };

  const handlePagoExitoso = (idsComprados: number[], comprobante: DatosComprobante) => {
    setCarrito((prev) => prev.filter((item) => !idsComprados.includes(item.id)));
    setItemsParaCheckout(null);
    setMostrarCarrito(false);
    setComprobanteActual(comprobante);
    mostrarToast('¡Pedido registrado con éxito!');
    cargarProductos();
  };

// Filtrado  Búsqueda + Categoría + Favoritos
  const productosFiltrados = productos.filter((prod) => {
    const coincideBusqueda =
      prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (prod.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoriaSeleccionada === '' ||
      String(prod.categoria_id) === categoriaSeleccionada;

    const cumpleFavorito = !soloFavoritos || favoritos.includes(prod.id);

    return coincideBusqueda && coincideCategoria && cumpleFavorito;
  });

  // Productos relacionados 
  const productosRelacionados = productoDetalle
    ? productos
        .filter(
          (p) =>
            p.id !== productoDetalle.id &&
            p.categoria_id === productoDetalle.categoria_id
        )
        .slice(0, 3)
    : [];

  const totalUnidadesCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      <header
        className="header-banner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        {/* Franja superior sutil para PQRS */}
        <div
          style={{
            width: '100%',
            padding: '6px 22px',
            backgroundColor: 'rgba(6, 38, 77, 0.78)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#ffffff',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <span style={{ opacity: 0.9 }}>🌱 Insumos agrícolas </span>
          <a
            href="https://wa.me/573151751222?text=Hola,%20deseo%20radicar%20una%20PQRS%20(Petici%C3%B3n,%20Queja,%20Reclamo%20o%20Sugerencia)."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.5px',
            }}
          >
            PQRS
          </a>
        </div>

        <div
          style={{
            width: '100%',
            padding: '22px 24px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Izquierda: Menú blanco */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setMenuLateralAbierto((prev) => !prev)}
              title="Menú y Categorías"
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '1.35rem',
                cursor: 'pointer',
                color: '#ffffff',
                padding: '6px 11px',
                lineHeight: 1,
              }}
            >
              ☰
            </button>
          </div>

          <div
            onClick={() => {
              setCategoriaSeleccionada('');
              setSoloFavoritos(false);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '2px' }}>🌱</div>
            <h1 className="banner-title" style={{ margin: 0, fontSize: '1.45rem' }}>
              Sistema de Insumos Agrícolas
            </h1>
            <p className="banner-subtitle" style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}>
              Catálogo y gestión de productos de insumos
            </p>
          </div>

          {/* Derecha: Usuario y Carrito en blanco */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            {userRol ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                  Hola, <strong>{nombreCliente}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  title="Cerrar sesión"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarLogin(true)}
                title="Iniciar sesión"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#ffffff" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </button>
            )}

            {userRol === 'cliente' && (
              <button
                type="button"
                onClick={() => setMostrarCarrito(true)}
                title="Ver carrito"
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#ffffff" strokeWidth="2">
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                  <path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.5L22 7H6" />
                </svg>
                {totalUnidadesCarrito > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-4px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      padding: '1px 6px',
                      border: '1px solid #ffffff',
                    }}
                  >
                    {totalUnidadesCarrito}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Menú desplegable*/}
      {menuLateralAbierto && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontSize: '0.85rem', color: '#475569', marginRight: '6px' }}>
            Categorías:
          </strong>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            onClick={() => {
              setCategoriaSeleccionada('');
              setMenuLateralAbierto(false);
            }}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => {
                setCategoriaSeleccionada(String(cat.id));
                setMenuLateralAbierto(false);
              }}
            >
              {cat.nombre}
            </button>
          ))}
          {userRol === 'cliente' && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.82rem', marginLeft: 'auto' }}
              onClick={() => {
                setMostrarMisPedidos(true);
                setMenuLateralAbierto(false);
              }}
            >
              📦 Mis Pedidos
            </button>
          )}
        </div>
      )}

      <main style={{ flex: 1 }}>
        {cargando ? (
          <p>Cargando insumos...</p>
        ) : userRol === 'admin' ? (
          <AdminPanel
            productos={productos}
            cargarProductos={cargarProductos}
            categorias={categorias}
            cargarCategorias={cargarCategorias}
            onMostrarToast={mostrarToast}
          />
        ) : (
          <section>
            <h2 className="catalogo-titulo">Catálogo de Productos</h2>

           {/* Barra de Búsqueda, Categorías y Favoritos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center' }}>
                <SearchBar valor={busqueda} onCambio={setBusqueda} />

                <select
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  style={{ width: '135px', height: '42px', margin: 0 }}
                  aria-label="Filtrar por categoría"
                >
                  <option value="">Categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSoloFavoritos((prev) => !prev)}
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: soloFavoritos ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    backgroundColor: soloFavoritos ? '#fee2e2' : '#ffffff',
                    color: soloFavoritos ? '#b91c1c' : '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {soloFavoritos ? '❤️ Favoritos' : `🤍 (${favoritos.length})`}
                </button>
              </div>

              {(busqueda || categoriaSeleccionada || soloFavoritos) && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setBusqueda('');
                    setCategoriaSeleccionada('');
                    setSoloFavoritos(false);
                  }}
                  style={{ height: '38px', width: '100%' }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Cuadrícula del Catálogo */}
            <div className="catalogo-grid">
              {productosFiltrados.length === 0 ? (
                <p>No se encontraron productos coincidentes.</p>
              ) : (
                productosFiltrados.map((prod) => {
                  const esFavorito = favoritos.includes(prod.id);
                  const sinStock = Number(prod.stock) === 0;

                  return (
                    <div
                      key={prod.id}
                      className="producto-card"
                      onClick={() => setProductoDetalle(prod)}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {/* Botón de Favorito*/}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(prod);
                        }}
                        title={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                          zIndex: 2,
                        }}
                      >
                        {esFavorito ? '❤️' : '🤍'}
                      </button>

                      <div>
                        {prod.imagen_url && (
                          <img src={prod.imagen_url} alt={prod.nombre} className="producto-img" />
                        )}
                        <h3>{prod.nombre}</h3>
                        {prod.categoria_nombre && (
                          <span className="categoria-tag">{prod.categoria_nombre}</span>
                        )}
                        <p>{prod.descripcion}</p>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
        
                        <p className="precio-tag" style={{ marginBottom: '6px' }}>
                          ${Number(prod.precio).toLocaleString('es-CO')}{' '}
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                            COP
                          </span>
                        </p>

                        {/* Estado de stock siempre visible */}
                        <div style={{ margin: '4px 0 10px 0' }}>
                          {sinStock ? (
                            <span className="stock-badge stock-agotado">Agotado</span>
                          ) : prod.stock <= 3 ? (
                            <span className="stock-badge stock-bajo">
                              ¡Últimas {prod.stock} uds!
                            </span>
                          ) : (
                            <span className="stock-badge stock-disponible">
                              Disponible: {prod.stock}
                            </span>
                          )}
                        </div>

                        {/*  botones: Comprar ,  Carrito y WhatsApp  */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '9px' }}
                            onClick={() => handleComprarAhora(prod)}
                            disabled={sinStock}
                          >
                            {sinStock ? 'Sin stock' : 'Comprar'}
                          </button>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-secondary"
                              style={{ flex: 1, padding: '7px 6px', fontSize: '0.82rem' }}
                              onClick={() => handleAgregarAlCarrito(prod)}
                              disabled={sinStock}
                            >
                              + Carrito
                            </button>

                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handlePedirWhatsAppProducto(prod)}
                              style={{
                                flex: 1,
                                padding: '7px 6px',
                                fontSize: '0.82rem',
                                borderColor: '#25D366',
                                color: '#15803d',
                              }}
                            >
                              💬 WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>

      {/* Pie de Página Comercial */}
      <footer
        style={{
          marginTop: '48px',
          padding: '24px 20px',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          borderRadius: '10px',
          fontSize: '0.86rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '6px' }}>
              🌱 AgroInsumos del Campo
            </h4>
            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>
              Fertilizantes, semillas certificadas, herramientas y protección de cultivos con entrega rápida en finca y tienda física.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '6px' }}>
              📍 Punto de Venta y Horarios
            </h4>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              Parque Principal<br />
              Lunes a Sábado: 7:00 AM – 6:00 PM
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '6px' }}>
              📞 Atención y Domicilios
            </h4>
            <p style={{ color: '#94a3b8', marginBottom: '8px' }}>
              Pedidos directos y asesoría técnica por WhatsApp:
            </p>
            <a
              href="https://wa.me/573151751222?text=Hola,%20necesito%20asesor%C3%ADa%20sobre%20insumos%20agr%C3%ADcolas."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontWeight: 700,
                padding: '7px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.84rem',
              }}
            >
              📲 Escribir al +57 315 175 1222
            </a>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '12px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.8rem',
          }}
        >
          © {new Date().getFullYear()} Sistema de Insumos Agrícolas — Todos los derechos reservados.
          <br />
          Desarrollado por{' '}
          <a
            href="https://github.com/diego05614/insumos.git"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#94a3b8', textDecoration: 'none' }}
          >
            Diego Angel Cristian 
          </a>
        </div>
      </footer>

      {/* Modal de Detalle de Producto + Productos Relacionados */}
      {productoDetalle && (
        <div className="modal-overlay" onClick={() => setProductoDetalle(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '22px',
            }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>{productoDetalle.nombre}</h2>
                <button
                  type="button"
                  onClick={() => toggleFavorito(productoDetalle)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                >
                  {favoritos.includes(productoDetalle.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <button className="btn-close" onClick={() => setProductoDetalle(null)}>
                &times;
              </button>
            </div>

            {productoDetalle.imagen_url && (
              <img
                src={productoDetalle.imagen_url}
                alt={productoDetalle.nombre}
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'contain',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
              />
            )}

            {productoDetalle.categoria_nombre && (
              <span className="categoria-tag">{productoDetalle.categoria_nombre}</span>
            )}

            <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.5, margin: '10px 0 14px 0' }}>
              {productoDetalle.descripcion || 'Sin descripción detallada.'}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '14px',
              }}
            >
              <span className="precio-tag" style={{ margin: 0, fontSize: '1.25rem' }}>
                ${Number(productoDetalle.precio).toLocaleString('es-CO')}
              </span>
              <span>
                {productoDetalle.stock === 0 ? (
                  <span className="stock-badge stock-agotado">Agotado</span>
                ) : productoDetalle.stock <= 3 ? (
                  <span className="stock-badge stock-bajo">¡Últimas {productoDetalle.stock} uds!</span>
                ) : (
                  <small style={{ color: '#475569', fontWeight: 600 }}>
                    Disponibles: {productoDetalle.stock}
                  </small>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={productoDetalle.stock <= 0}
                onClick={() => {
                  handleAgregarAlCarrito(productoDetalle);
                  setProductoDetalle(null);
                }}
              >
                + Carrito
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={productoDetalle.stock <= 0}
                onClick={() => {
                  handleComprarAhora(productoDetalle);
                  setProductoDetalle(null);
                }}
              >
                Comprar Ahora
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePedirWhatsAppProducto(productoDetalle)}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📲 Consultar por WhatsApp
            </button>

            {/* Sección de Productos Relacionados */}
            {productosRelacionados.length > 0 && (
              <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0f172a', marginBottom: '10px' }}>
                  Productos relacionados en {productoDetalle.categoria_nombre}
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {productosRelacionados.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => setProductoDetalle(rel)}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {rel.imagen_url && (
                        <img
                          src={rel.imagen_url}
                          alt={rel.nombre}
                          style={{
                            width: '100%',
                            height: '75px',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            marginBottom: '6px',
                          }}
                        />
                      )}
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                        {rel.nombre}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                        ${Number(rel.precio).toLocaleString('es-CO')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenedor flotante de Notificaciones Toast */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.tipo}`}>
            <span>{t.tipo === 'success' ? '✅' : t.tipo === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span>{t.texto}</span>
          </div>
        ))}
      </div>

      {/* Modal de Autenticación */}
      {mostrarLogin && (
        <LoginModal
          onLoginExitoso={handleLoginExitoso}
          onCancelar={() => setMostrarLogin(false)}
        />
      )}

      {/* Modal del Carrito de Compras */}
      {mostrarCarrito && (
        <CarritoModal
          carrito={carrito}
          onCerrar={() => setMostrarCarrito(false)}
          onActualizarCantidad={handleActualizarCantidad}
          onToggleSeleccion={handleToggleSeleccion}
          onToggleSeleccionarTodos={handleToggleSeleccionarTodos}
          onEliminarItem={handleEliminarItem}
          onProcederPago={(items) => setItemsParaCheckout(items)}
          onMostrarToast={mostrarToast}
        />
      )}

      {/* Modal de Pago final */}
      {itemsParaCheckout && (
        <CheckoutModal
          items={itemsParaCheckout}
          clienteNombrePredeterminado={nombreCliente}
          onCerrar={() => setItemsParaCheckout(null)}
          onPagoExitoso={handlePagoExitoso}
        />
      )}

      {/* Modal de Comprobante post-compra */}
      {comprobanteActual && (
        <ComprobanteModal
          datos={comprobanteActual}
          onCerrar={() => setComprobanteActual(null)}
        />
      )}

      {/* Modal Historial "Mis Pedidos" del Cliente */}
      {mostrarMisPedidos && (
        <PedidosModal
          nombreCliente={nombreCliente}
          onCerrar={() => setMostrarMisPedidos(false)}
        />
      )}
    </div>
  );
}

export default App;