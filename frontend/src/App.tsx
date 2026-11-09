import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { Producto } from './types/producto';
import type { Categoria } from './types/categoria'; 
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { SearchBar } from './components/Searchbar';
import './App.css';

export function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  
  // Estado de autenticación: null (invitado), 'cliente' o 'admin'
  const [userRol, setUserRol] = useState<'admin' | 'cliente' | null>(null);
  const [nombreCliente, setNombreCliente] = useState<string>('');
  const [mostrarLogin, setMostrarLogin] = useState<boolean>(false);

  const cargarProductos = async () => {
    try {
      const respuesta = await api.get('/productos');
      setProductos(respuesta.data);
      console.log(respuesta.data[0]); // PRUEBA: borrar después
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
  }, []);

  const handleLoginExitoso = (rol: 'admin' | 'cliente', usuario: string) => {
    setUserRol(rol);
    setNombreCliente(usuario);
    setMostrarLogin(false);
  };

  const handleCerrarSesion = () => {
    setUserRol(null);
    setNombreCliente('');
  };

  // Filtrado dinámico por texto de búsqueda y por categoría seleccionada
  const productosFiltrados = productos.filter((prod) => {
    const coincideBusqueda =
      prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (prod.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase()); // CORREGIDO: evita error si la descripción es null
    
    const coincideCategoria = categoriaSeleccionada === '' || 
      String(prod.categoria_id) === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });

  return (
 <div className="app-container">
  <header className="header-banner">
    <div className="banner-brand">
      <div className="banner-icon">🌱</div>
      <div>
        <h1 className="banner-title">Sistema de Insumos Agrícolas</h1>
        <p className="banner-subtitle">Catálogo y gestión de productos de insumos</p>
      </div>
    </div>

    <div className="banner-user-actions">
      {userRol ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Bienvenido, <strong>{nombreCliente}</strong> ({userRol})</span>
          <button className="btn-secondary" onClick={handleCerrarSesion}>
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <button className="btn-primary" onClick={() => setMostrarLogin(true)}>
          Iniciar Sesión
        </button>
      )}
    </div>
  </header>


      <main>
        {cargando ? (
          <p>Cargando insumos...</p>
        ) : userRol === 'admin' ? (
          /* Panel exclusivo para el Administrador */
          <AdminPanel 
            productos={productos} 
            cargarProductos={cargarProductos}
            categorias={categorias}
            cargarCategorias={cargarCategorias}
          />
        ) : (
          /* Vista de Catálogo (para Clientes y Visitantes) */
          <section>
            <h2>Catálogo de Productos</h2>

            {/* Barra de Búsqueda y Filtro por Categorías */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                {/* CORREGIDO: las props son valor y onCambio */}
                <SearchBar valor={busqueda} onCambio={setBusqueda} />
              </div>

              <select 
                value={categoriaSeleccionada} 
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Cuadrícula del Catálogo */}
            <div className="catalogo-grid">
              {productosFiltrados.length === 0 ? (
                <p>No se encontraron productos coincidentes.</p>
              ) : (
                productosFiltrados.map((prod) => (
                  <div key={prod.id} className="producto-card">
                    <div>
                      {prod.imagen_url && (
                        <img src={prod.imagen_url} alt={prod.nombre} className="producto-img" />
                      )}
                      <h3>{prod.nombre}</h3>
                      {prod.categoria_nombre && (
                        <span className="categoria-tag" style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                          {prod.categoria_nombre}
                        </span>
                      )}
                      <p>{prod.descripcion}</p>
                    </div>
                    <div>
                      <p className="precio-tag">
                        <strong>Precio:</strong> ${Number(prod.precio).toFixed(2)}
                      </p>
                      <p><small>Disponibles: {prod.stock}</small></p>
                      <button 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: '10px' }}
                        onClick={() => {
                          if (userRol !== 'cliente') {
                            alert('Por favor inicia sesión como Cliente para realizar compras.');
                            setMostrarLogin(true);
                          } else {
                            alert(`¡Producto "${prod.nombre}" añadido al carrito!`);
                          }
                        }}
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* Modal de autenticación */}
      {mostrarLogin && (
        <LoginModal
          onLoginExitoso={handleLoginExitoso}
          onCancelar={() => setMostrarLogin(false)}
        />
      )}
    </div>
  );
}

export default App;