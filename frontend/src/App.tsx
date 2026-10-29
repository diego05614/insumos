import { useEffect, useState } from 'react';
import { api } from './services/api';
import { ShoppingCart, Leaf } from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url?: string;
}

export function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Producto[]>([]);

  useEffect(() => {
    api.get('/productos')
      .then((res) => {
        // Aseguramos que asignamos un arreglo independientemente de la estructura de la respuesta
        if (Array.isArray(res.data)) {
          setProductos(res.data);
        } else if (res.data && Array.isArray((res.data as any).productos)) {
          setProductos((res.data as any).productos);
        } else {
          setProductos([]);
        }
      })
      .catch((err) => {
        console.error('Error al obtener productos:', err);
        setProductos([]);
      });
  }, []);

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito([...carrito, producto]);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h1 style={{ color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Leaf /> Insumos Agrícolas
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <ShoppingCart /> Carrito: {carrito.length} ítem(s)
        </div>
      </header>

      <h2 style={{ marginTop: '20px' }}>Catálogo de Productos</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {Array.isArray(productos) && productos.map((prod) => (
          <div key={prod.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h3>{prod.nombre}</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>{prod.descripcion}</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
              ${Number(prod.precio).toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: prod.stock > 0 ? 'green' : 'red' }}>
              Disponible: {prod.stock} unidades
            </p>
            <button 
              onClick={() => agregarAlCarrito(prod)}
              disabled={prod.stock <= 0}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '10px'
              }}>
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;