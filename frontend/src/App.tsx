import { useState, useEffect, useRef } from 'react';
import { api, obtenerSessionId } from './services/api';
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
  const bloqueadoSyncCarrito = useRef<boolean>(false);
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

  // Intenciones pendientes cuando el invitado intenta pagar
  const [itemsPendientesTrasLogin, setItemsPendientesTrasLogin] = useState<ItemCarrito[] | null>(null);

  // Estados del Carrito híbrido (MySQL + respaldo local)
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

  // Estados de Comprobante post-compra e Historial del Cliente
  const [comprobanteActual, setComprobanteActual] = useState<DatosComprobante | null>(null);
  const [mostrarMisPedidos, setMostrarMisPedidos] = useState<boolean>(false);

  // Respaldo local del carrito
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

  // Cargar carrito desde el backend (funciona tanto con JWT como con x-session-id)
const cargarCarritoServidor = async (forzar = false) => {
    if (localStorage.getItem('insumos_rol') === 'admin') return;
    if (bloqueadoSyncCarrito.current && !forzar) return;

    try {
      const res = await api.get('/carrito');
      if (bloqueadoSyncCarrito.current && !forzar) return;

      const rows = Array.isArray(res.data) ? res.data : [];

      setCarrito((prev) => {
        const seleccionadosPrevios = new Map(prev.map((i) => [i.id, i.seleccionado]));
        return rows.map((row: any) => ({
          id: Number(row.producto_id),
          nombre: row.nombre,
          descripcion: row.descripcion || '',
          precio: Number(row.precio),
          stock: Number(row.stock),
          imagen_url: row.imagen_url || undefined,
          categoria_nombre: row.categoria_nombre || undefined,
          cantidad: Math.min(Number(row.cantidad), Number(row.stock)),
          seleccionado: seleccionadosPrevios.has(Number(row.producto_id))
            ? Boolean(seleccionadosPrevios.get(Number(row.producto_id)))
            : true,
        }));
      });
    } catch (error) {
      console.error('Error al sincronizar carrito con servidor:', error);
    }
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
    obtenerSessionId();
    cargarProductos();
    cargarCategorias();
    cargarCarritoServidor(true);

    const sincronizarTodo = () => {
      if (document.visibilityState === 'visible') {
        cargarProductos();
        cargarCarritoServidor();
      }
    };

    const intervalo = setInterval(sincronizarTodo, 3000);

    document.addEventListener('visibilitychange', sincronizarTodo);
    window.addEventListener('focus', sincronizarTodo);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', sincronizarTodo);
      window.removeEventListener('focus', sincronizarTodo);
    };
  }, []);

  const handleLoginExitoso = async (rol: 'admin' | 'cliente', usuario: string) => {
    setUserRol(rol);
    setNombreCliente(usuario);
    localStorage.setItem('insumos_rol', rol);
    localStorage.setItem('insumos_usuario', usuario);
    setMostrarLogin(false);
    setMenuLateralAbierto(false);
    mostrarToast(`Bienvenido, ${usuario}`);

    if (rol === 'cliente') {
      try {
        const sessionId = obtenerSessionId();
        await api.post('/carrito/sincronizar', { session_id: sessionId });
        await cargarCarritoServidor();
      } catch (error) {
        console.error('Error al fusionar carrito de invitado:', error);
      }

      if (itemsPendientesTrasLogin && itemsPendientesTrasLogin.length > 0) {
        setItemsParaCheckout(itemsPendientesTrasLogin);
        setItemsPendientesTrasLogin(null);
      }
    } else {
      setItemsPendientesTrasLogin(null);
    }
  };

  const handleCerrarSesion = () => {
    setUserRol(null);
    setNombreCliente('');
    setCarrito([]);
    setItemsPendientesTrasLogin(null);
    setMenuLateralAbierto(false);
    localStorage.removeItem('insumos_rol');
    localStorage.removeItem('insumos_usuario');
    localStorage.removeItem('insumos_token');
    localStorage.removeItem('insumos_carrito');
    // Generar nuevo sessionId limpio para futuras visitas como invitado
    localStorage.removeItem('insumos_session_id');
    obtenerSessionId();
    mostrarToast('Sesión cerrada', 'info');
  };

  // Permitir añadir al carrito SIN exigir iniciar sesión
  // Permitir añadir al carrito SIN exigir iniciar sesión
  const handleAgregarAlCarrito = async (prod: Producto) => {
    if (userRol === 'admin') {
      mostrarToast('El modo administrador no realiza compras en catálogo', 'info');
      return;
    }

    const existe = carrito.find((item) => item.id === prod.id);
    if (existe && existe.cantidad >= prod.stock) {
      mostrarToast(`Stock máximo alcanzado (${prod.stock})`, 'error');
      return;
    }

    bloqueadoSyncCarrito.current = true;

    // Actualización optimista inmediata en interfaz
    setCarrito((prev) => {
      const encontrado = prev.find((item) => item.id === prod.id);
      if (encontrado) {
        return prev.map((item) =>
          item.id === prod.id
            ? { ...item, cantidad: Math.min(item.cantidad + 1, prod.stock) }
            : item
        );
      }
      return [...prev, { ...prod, cantidad: 1, seleccionado: true }];
    });

    mostrarToast(
      existe ? `Cantidad actualizada: ${prod.nombre}` : `Agregado al carrito: ${prod.nombre}`
    );

    try {
      await api.post('/carrito', { producto_id: prod.id, cantidad: 1 });
    } catch (error: any) {
      const msg = error.response?.data?.error;
      if (msg) mostrarToast(msg, 'error');
    } finally {
      bloqueadoSyncCarrito.current = false;
      await cargarCarritoServidor(true);
    }
  };
  

  const handleComprarAhora = (prod: Producto) => {
    const itemCompra: ItemCarrito[] = [{ ...prod, cantidad: 1, seleccionado: true }];
    if (userRol !== 'cliente') {
      setItemsPendientesTrasLogin(itemCompra);
      mostrarToast('Inicia sesión o regístrate para completar tu envío', 'info');
      setMostrarLogin(true);
      return;
    }
    setItemsParaCheckout(itemCompra);
  };

  const handleProcederPagoDesdeCarrito = (itemsSeleccionados: ItemCarrito[]) => {
    if (userRol !== 'cliente') {
      setItemsPendientesTrasLogin(itemsSeleccionados);
      setMostrarCarrito(false);
      mostrarToast('Inicia sesión o crea tu cuenta para confirmar el pedido', 'info');
      setMostrarLogin(true);
      return;
    }
    setItemsParaCheckout(itemsSeleccionados);
  };

  const handlePedirWhatsAppProducto = (prod: Producto) => {
    const telefonoTienda = '573151751222';
    const mensaje = `Hola, me interesa este insumo agrícola:\n\n• *${prod.nombre}*\n• Precio: $${Number(prod.precio).toLocaleString('es-CO')}\n\n¿Tienen disponibilidad inmediata?`;
    window.open(`https://wa.me/${telefonoTienda}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

 const handleActualizarCantidad = async (id: number, cantidad: number) => {
    bloqueadoSyncCarrito.current = true;
    setCarrito((prev) => prev.map((item) => (item.id === id ? { ...item, cantidad } : item)));
    try {
      await api.put(`/carrito/${id}`, { cantidad });
    } finally {
      bloqueadoSyncCarrito.current = false;
      await cargarCarritoServidor(true);
    }
  };

  const handleToggleSeleccion = (id: number) => {
    setCarrito((prev) =>
      prev.map((item) => (item.id === id ? { ...item, seleccionado: !item.seleccionado } : item))
    );
  };

  const handleToggleSeleccionarTodos = (seleccionar: boolean) => {
    setCarrito((prev) => prev.map((item) => ({ ...item, seleccionado: seleccionar })));
  };

  const handleEliminarItem = async (id: number) => {
    bloqueadoSyncCarrito.current = true;
    setCarrito((prev) => prev.filter((item) => item.id !== id));
    mostrarToast('Producto eliminado del carrito', 'info');
    try {
      await api.delete(`/carrito/${id}`);
    } finally {
      bloqueadoSyncCarrito.current = false;
      await cargarCarritoServidor(true);
    }
  };

  const handlePagoExitoso = async (idsComprados: number[], comprobante: DatosComprobante) => {
    setCarrito((prev) => prev.filter((item) => !idsComprados.includes(item.id)));
    setItemsParaCheckout(null);
    setMostrarCarrito(false);
    setComprobanteActual(comprobante);
    mostrarToast('¡Pedido registrado con éxito!');
    cargarProductos();
    await cargarCarritoServidor();
  };

  const productosFiltrados = productos.filter((prod) => {
    const coincideBusqueda =
      prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (prod.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      categoriaSeleccionada === '' || String(prod.categoria_id) === categoriaSeleccionada;
    const cumpleFavorito = !soloFavoritos || favoritos.includes(prod.id);
    return coincideBusqueda && coincideCategoria && cumpleFavorito;
  });

  const productosRelacionados = productoDetalle
    ? productos
        .filter((p) => p.id !== productoDetalle.id && p.categoria_id === productoDetalle.categoria_id)
        .slice(0, 3)
    : [];

  const totalUnidadesCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="min-h-screen flex flex-col pb-12">
      {/* ================= NAVBAR SUPERIOR GLASSMORPHISM ================= */}
      <nav className="sticky top-0 z-40 bg-[#07241c]/95 backdrop-blur-xl text-white border-b border-emerald-500/20 shadow-lg shadow-emerald-950/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Izquierda: Menú (para clientes y visitantes) + Marca */}
          <div className="flex items-center gap-3">
            {userRol !== 'admin' && (
              <button
                type="button"
                onClick={() => setMenuLateralAbierto((prev) => !prev)}
                title="Menú de Navegación"
                className={`relative w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition cursor-pointer ${
                  menuLateralAbierto
                    ? 'bg-lime-400 text-slate-950 border-lime-300 font-black'
                    : 'bg-white/10 hover:bg-lime-400 hover:text-slate-950 border-white/15 text-white'
                }`}
              >
                {menuLateralAbierto ? '✕' : '☰'}
                {!menuLateralAbierto && totalUnidadesCarrito > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-lime-400 ring-2 ring-[#07241c]" />
                )}
              </button>
            )}

            <div
              onClick={() => {
                setCategoriaSeleccionada('');
                setSoloFavoritos(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-xl shadow-md shadow-lime-500/20 group-hover:rotate-6 transition-transform">
                🌱
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg tracking-tight text-white">
                    AGRO<span className="text-lime-400">INSUMOS</span>
                  </span>
                  <span className="hidden md:inline-block text-[10px] font-extrabold uppercase tracking-widest bg-lime-400/15 text-lime-300 border border-lime-400/30 px-2 py-0.5 rounded-full">
                    {userRol === 'admin' ? 'Admin' : 'Pro'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/70 hidden sm:block leading-none">
                  {userRol === 'admin'
                    ? 'Panel de gestión operativa'
                    : 'Soluciones para el campo'}
                </p>
              </div>
            </div>
          </div>

          {/* Derecha: Sesión / Perfil */}
          <div className="flex items-center gap-2.5">
            {userRol ? (
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 pl-3 pr-1.5 py-1 rounded-2xl">
                <span className="text-xs text-emerald-100 whitespace-nowrap">
                  Hola, <strong className="font-extrabold text-lime-300">{nombreCliente}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  className="bg-white hover:bg-lime-300 text-slate-950 rounded-xl px-3 py-1.5 text-xs font-extrabold transition cursor-pointer"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarLogin(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black shadow-md shadow-lime-400/20 transition cursor-pointer"
              >
                <span>👤</span>
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ================= DRAWER LATERAL FIJO ================= */}
      {menuLateralAbierto && userRol !== 'admin' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex"
          onClick={() => setMenuLateralAbierto(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 max-w-[85vw] h-full bg-[#07241c] text-white p-5 shadow-2xl border-r border-emerald-500/20 flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Cabecera del Drawer */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-lg shadow-md">
                    🌱
                  </div>
                  <div>
                    <span className="font-black text-sm tracking-tight block">
                      AGRO<span className="text-lime-400">INSUMOS</span>
                    </span>
                    <span className="text-[11px] text-emerald-200/70">Menú rápido</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuLateralAbierto(false)}
                  aria-label="Cerrar menú"
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-slate-950 text-white flex items-center justify-center text-sm font-black transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Opciones principales en columna */}
              <nav className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategoriaSeleccionada('');
                    setSoloFavoritos(false);
                    setMenuLateralAbierto(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-extrabold text-emerald-100 flex items-center gap-3 transition cursor-pointer text-left"
                >
                  <span className="text-base">🏠</span>
                  <span>Inicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSoloFavoritos((prev) => !prev);
                    setMenuLateralAbierto(false);
                    document.getElementById('catalogo-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-between transition cursor-pointer ${
                    soloFavoritos
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-emerald-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">❤️</span>
                    <span>Favoritos</span>
                  </span>
                  <span className="bg-black/25 px-2.5 py-0.5 rounded-full text-xs">
                    {favoritos.length}
                  </span>
                </button>

                {userRol === 'cliente' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarMisPedidos(true);
                      setMenuLateralAbierto(false);
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-extrabold text-emerald-100 flex items-center gap-3 transition cursor-pointer text-left"
                  >
                    <span className="text-base">📦</span>
                    <span>Mis Pedidos</span>
                  </button>
                )}

                {/* Carrito siempre visible para visitantes y clientes */}
                <button
                  type="button"
                  onClick={() => {
                    setMostrarCarrito(true);
                    setMenuLateralAbierto(false);
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-between shadow-lg shadow-lime-400/15 transition cursor-pointer mt-1"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🛒</span>
                    <span>Ver Carrito</span>
                  </span>
                  {totalUnidadesCarrito > 0 && (
                    <span className="bg-slate-950 text-lime-300 text-xs font-black px-2.5 py-0.5 rounded-full">
                      {totalUnidadesCarrito}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Pie del Drawer con soporte WhatsApp */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <a
                href="https://wa.me/573151751222?text=Hola,%20necesito%20asesor%C3%ADa%20sobre%20insumos%20agr%C3%ADcolas."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition"
              >
                <span>💬</span>
                <span>Soporte WhatsApp</span>
              </a>
            </div>
          </aside>
        </div>
      )}

      {/* ================= CONTENEDOR PRINCIPAL ================= */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-6 flex flex-col">
        <main className="flex-1">
          {cargando ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-3xl p-4 h-72 animate-pulse border border-slate-200/60"
                >
                  <div className="w-full h-36 bg-slate-200/70 rounded-2xl mb-4" />
                  <div className="h-4 bg-slate-200/70 rounded-lg w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200/70 rounded-lg w-1/2" />
                </div>
              ))}
            </div>
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
              {/* ================= HERO BANNER PRINCIPAL ================= */}
              <div
                style={{
                  backgroundImage:
                    "linear-gradient(110deg, rgba(7, 36, 28, 0.96) 0%, rgba(7, 36, 28, 0.82) 50%, rgba(6, 78, 59, 0.62) 100%), url('https://iqvagro.com/wp-content/uploads/2024/01/para-que-sirve-el-fungicida-1030x579.jpg')",
                }}
                className="relative bg-cover bg-center rounded-[2rem] p-6 sm:p-10 mb-8 text-white overflow-hidden shadow-xl shadow-emerald-950/15 border border-emerald-800/30"
              >
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-lime-400/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-lime-400/15 border border-lime-400/30 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-extrabold text-lime-300 uppercase tracking-wider mb-4">
                    <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                    Abastecimiento Agrícola Directo
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] font-black tracking-tight leading-[1.12]">
                    Potencia el rendimiento de tu{' '}
                    <span className="text-lime-400">cultivo y finca</span>
                  </h1>

                  <p className="text-xs sm:text-base text-emerald-100/85 mt-3 leading-relaxed max-w-xl">
                    Semillas certificadas, fertilizantes de alta eficiencia y maquinaria con despacho inmediato a tu vereda o retiro en tienda.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-6">
                    <a
                      href="#catalogo-grid"
                      className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-lime-400/20 transition"
                    >
                      Explorar Catálogo ↓
                    </a>
                    <a
                      href="https://wa.me/573151751222?text=Hola,%20necesito%20asesor%C3%ADa%20t%C3%A9cnica%20sobre%20insumos."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition"
                    >
                      💬 Asesoría Agronómica
                    </a>
                  </div>
                </div>
              </div>

              {/* ================= BARRA DE EXPLORACIÓN INTELIGENTE ================= */}
              <div
                id="catalogo-grid"
                className="bg-white/95 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200/90 shadow-lg shadow-slate-900/5 mb-6 space-y-3"
              >
                <SearchBar valor={busqueda} onCambio={setBusqueda} />

                {categorias.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setCategoriaSeleccionada('')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                        categoriaSeleccionada === ''
                          ? 'bg-[#07241c] text-lime-300 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Todos ({productos.length})
                    </button>
                    {categorias.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setCategoriaSeleccionada(
                            categoriaSeleccionada === String(cat.id) ? '' : String(cat.id)
                          )
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                          categoriaSeleccionada === String(cat.id)
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}

                {(busqueda || categoriaSeleccionada || soloFavoritos) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {soloFavoritos && (
                      <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold px-3 py-1.5 rounded-xl">
                        ❤️ Viendo solo tus favoritos ({favoritos.length})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda('');
                        setCategoriaSeleccionada('');
                        setSoloFavoritos(false);
                      }}
                      className="flex-1 py-2 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
                    >
                      ✕ Limpiar filtros activos ({productosFiltrados.length} resultados)
                    </button>
                  </div>
                )}
              </div>

              {/* ================= VITRINA DE PRODUCTOS ================= */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {productosFiltrados.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-white rounded-[2rem] border border-slate-200/80 shadow-md text-slate-500 font-semibold">
                    No se encontraron insumos con los filtros actuales.
                  </div>
                ) : (
                  productosFiltrados.map((prod) => {
                    const esFavorito = favoritos.includes(prod.id);
                    const sinStock = Number(prod.stock) === 0;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => setProductoDetalle(prod)}
                        className="group relative bg-white rounded-[1.75rem] overflow-hidden border border-slate-200/90 shadow-md shadow-slate-900/[0.04] hover:shadow-2xl hover:shadow-emerald-950/15 hover:border-emerald-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorito(prod);
                          }}
                          title={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full border border-slate-200 bg-white/95 hover:scale-110 active:scale-95 flex items-center justify-center text-sm shadow-md z-10 transition cursor-pointer"
                        >
                          {esFavorito ? '❤️' : '🤍'}
                        </button>

                        <div>
                          <div className="relative w-full h-36 sm:h-44 bg-gradient-to-br from-[#efeee8] via-slate-50 to-emerald-50/70 flex items-center justify-center overflow-hidden p-4 border-b border-slate-200/60">
                            {prod.imagen_url ? (
                              <img
                                src={prod.imagen_url}
                                alt={prod.nombre}
                                className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-108 transition-transform duration-300"
                              />
                            ) : (
                              <span className="text-4xl opacity-40">📦</span>
                            )}

                            {prod.categoria_nombre && (
                              <span className="absolute bottom-2.5 left-3 bg-[#07241c]/90 backdrop-blur-xs text-lime-300 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-sm">
                                {prod.categoria_nombre}
                              </span>
                            )}
                          </div>

                          <div className="p-3.5 sm:p-4 pb-2">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 capitalize group-hover:text-emerald-700 transition-colors">
                              {prod.nombre}
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {prod.descripcion}
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-3.5 sm:p-4 pt-2.5 bg-[#faf9f5] border-t border-slate-200/60"
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
                            <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              <span className="text-emerald-600">$</span>
                              {Number(prod.precio).toLocaleString('es-CO')}{' '}
                              <span className="text-[10px] font-bold text-slate-400">COP</span>
                            </p>

                            {sinStock ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Agotado
                              </span>
                            ) : prod.stock <= 3 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Quedan {prod.stock}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Stock: {prod.stock}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleComprarAhora(prod)}
                              disabled={sinStock}
                              className="w-full bg-[#07241c] hover:bg-emerald-800 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 text-lime-300 font-extrabold py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-950/15 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                              {sinStock ? 'Sin stock' : 'Comprar Ahora'}
                            </button>

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAgregarAlCarrito(prod)}
                                disabled={sinStock}
                                className="bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-50 text-slate-800 font-bold py-1.5 px-2 rounded-xl text-xs shadow-2xs transition cursor-pointer disabled:cursor-not-allowed"
                              >
                                + Carrito
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePedirWhatsAppProducto(prod)}
                                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold py-1.5 px-2 rounded-xl text-xs transition cursor-pointer"
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

        {/* ================= PIE DE PÁGINA ================= */}
        <footer className="mt-16 bg-[#07241c] text-slate-200 rounded-[2rem] p-6 sm:p-8 text-sm shadow-xl border border-emerald-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-white/10">
            <div>
              <h4 className="text-lime-400 font-black text-base mb-2">🌱 AgroInsumos del Campo</h4>
              <p className="text-emerald-100/75 text-xs sm:text-sm leading-relaxed">
                Fertilizantes, semillas certificadas, herramientas y protección de cultivos con entrega rápida en finca y tienda física.
              </p>
            </div>

            <div>
              <h4 className="text-white font-extrabold text-base mb-2">📍 Punto de Venta y Horarios</h4>
              <p className="text-emerald-100/75 text-xs sm:text-sm leading-relaxed">
                Parque Principal
                <br />
                Lunes a Sábado: 7:00 AM – 6:00 PM
              </p>
            </div>

            <div>
              <h4 className="text-white font-extrabold text-base mb-2">📞 Atención y Domicilios</h4>
              <p className="text-emerald-100/75 text-xs sm:text-sm mb-3">
                Pedidos directos y asesoría técnica por WhatsApp:
              </p>
              <a
                href="https://wa.me/573151751222?text=Hola,%20necesito%20asesor%C3%ADa%20sobre%20insumos%20agr%C3%ADcolas."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-lime-400 hover:bg-lime-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition"
              >
                📲 Escribir al +57 315 175 1222
              </a>
            </div>
          </div>

          <div className="pt-4 text-center text-emerald-200/50 text-xs space-y-1">
            <p>© {new Date().getFullYear()} Sistema de Insumos Agrícolas — Todos los derechos reservados.</p>
            <p>
              Desarrollado por{' '}
              <a
                href="https://github.com/diego05614/insumos.git"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lime-300/80 hover:text-lime-300 underline transition"
              >
                Diego Angel Cristian
              </a>
            </p>
          </div>
        </footer>
      </div>

      {/* ================= MODAL DETALLE DE PRODUCTO ================= */}
      {productoDetalle && (
        <div
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setProductoDetalle(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 capitalize">
                  {productoDetalle.nombre}
                </h2>
                <button
                  type="button"
                  onClick={() => toggleFavorito(productoDetalle)}
                  className="text-xl hover:scale-110 transition cursor-pointer"
                >
                  {favoritos.includes(productoDetalle.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setProductoDetalle(null)}
                className="text-2xl leading-none text-slate-400 hover:text-red-500 transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            {productoDetalle.imagen_url && (
              <div className="w-full h-56 bg-gradient-to-br from-[#efeee8] via-slate-50 to-emerald-50/70 rounded-2xl mb-4 flex items-center justify-center p-4 border border-slate-200/70">
                <img
                  src={productoDetalle.imagen_url}
                  alt={productoDetalle.nombre}
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                />
              </div>
            )}

            {productoDetalle.categoria_nombre && (
              <span className="inline-block bg-[#07241c] text-lime-300 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg">
                {productoDetalle.categoria_nombre}
              </span>
            )}

            <p className="text-slate-600 text-sm leading-relaxed my-3">
              {productoDetalle.descripcion || 'Sin descripción detallada.'}
            </p>

            <div className="flex justify-between items-center p-3.5 bg-[#faf9f5] rounded-2xl border border-slate-200/80 mb-4">
              <span className="text-xl font-black text-emerald-700">
                ${Number(productoDetalle.precio).toLocaleString('es-CO')}{' '}
                <span className="text-xs font-semibold text-slate-400">COP</span>
              </span>
              <span>
                {productoDetalle.stock === 0 ? (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    Agotado
                  </span>
                ) : productoDetalle.stock <= 3 ? (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    ¡Últimas {productoDetalle.stock} uds!
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-600">
                    Disponibles: {productoDetalle.stock}
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <button
                type="button"
                disabled={productoDetalle.stock <= 0}
                onClick={() => {
                  handleAgregarAlCarrito(productoDetalle);
                  setProductoDetalle(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold py-2.5 rounded-2xl text-sm transition cursor-pointer"
              >
                + Carrito
              </button>
              <button
                type="button"
                disabled={productoDetalle.stock <= 0}
                onClick={() => {
                  handleComprarAhora(productoDetalle);
                  setProductoDetalle(null);
                }}
                className="bg-[#07241c] hover:bg-emerald-800 disabled:opacity-50 text-lime-300 font-extrabold py-2.5 rounded-2xl text-sm shadow-md transition cursor-pointer"
              >
                Comprar Ahora
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePedirWhatsAppProducto(productoDetalle)}
              className="w-full py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-sm transition cursor-pointer"
            >
              📲 Consultar por WhatsApp
            </button>

            {productosRelacionados.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3">
                  Productos relacionados en {productoDetalle.categoria_nombre}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {productosRelacionados.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => setProductoDetalle(rel)}
                      className="border border-slate-200 hover:border-emerald-400 rounded-2xl p-2.5 cursor-pointer bg-[#faf9f5] hover:bg-white flex flex-col justify-between transition"
                    >
                      {rel.imagen_url && (
                        <img
                          src={rel.imagen_url}
                          alt={rel.nombre}
                          className="w-full h-20 object-contain rounded-lg mb-1.5"
                        />
                      )}
                      <div className="text-xs font-bold text-slate-900 line-clamp-2 capitalize">
                        {rel.nombre}
                      </div>
                      <div className="text-xs font-extrabold text-emerald-600 mt-1">
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

      {/* ================= TOASTS ================= */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast bg-[#07241c] text-white px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border-l-4 flex items-center gap-2.5 ${
              t.tipo === 'error'
                ? 'border-l-red-500'
                : t.tipo === 'info'
                ? 'border-l-blue-400'
                : 'border-l-lime-400'
            }`}
          >
            <span>{t.tipo === 'success' ? '✅' : t.tipo === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span>{t.texto}</span>
          </div>
        ))}
      </div>

      {/* ================= MODALES SECUNDARIOS ================= */}
      {mostrarLogin && (
        <LoginModal
          onLoginExitoso={handleLoginExitoso}
          onCancelar={() => setMostrarLogin(false)}
        />
      )}

      {mostrarCarrito && (
        <CarritoModal
          carrito={carrito}
          onCerrar={() => setMostrarCarrito(false)}
          onActualizarCantidad={handleActualizarCantidad}
          onToggleSeleccion={handleToggleSeleccion}
          onToggleSeleccionarTodos={handleToggleSeleccionarTodos}
          onEliminarItem={handleEliminarItem}
          onProcederPago={handleProcederPagoDesdeCarrito}
          onMostrarToast={mostrarToast}
        />
      )}

      {itemsParaCheckout && (
        <CheckoutModal
          items={itemsParaCheckout}
          clienteNombrePredeterminado={nombreCliente}
          onCerrar={() => setItemsParaCheckout(null)}
          onPagoExitoso={handlePagoExitoso}
        />
      )}

      {comprobanteActual && (
        <ComprobanteModal
          datos={comprobanteActual}
          onCerrar={() => setComprobanteActual(null)}
        />
      )}

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