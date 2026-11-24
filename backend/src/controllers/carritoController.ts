import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

interface CarritoDbRow extends RowDataPacket {
  id: number;
  producto_id: number;
  cantidad: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string | null;
  categoria_nombre: string | null;
}

// Helper interno para construir el filtro SQL según usuario autenticado o visitante
function obtenerFiltroPropietario(req: Request): { columna: 'usuario_id' | 'session_id'; valor: number | string } | null {
  if (req.usuario?.id) {
    return { columna: 'usuario_id', valor: req.usuario.id };
  }
  if (req.sessionId) {
    return { columna: 'session_id', valor: req.sessionId };
  }
  return null;
}

// GET /api/carrito - Obtener ítems del carrito (usuario o invitado)
export const getCarrito = async (req: Request, res: Response): Promise<void> => {
  const prop = obtenerFiltroPropietario(req);
  if (!prop) {
    res.status(400).json({ error: 'Identificador de carrito no válido.' });
    return;
  }

  try {
    const [rows] = await pool.query<CarritoDbRow[]>(
      `SELECT 
        ci.id,
        ci.producto_id,
        ci.cantidad,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.imagen_url,
        c.nombre AS categoria_nombre
      FROM carrito_items ci
      INNER JOIN productos p ON ci.producto_id = p.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE ci.${prop.columna} = ? AND p.activo = 1
      ORDER BY ci.id DESC`,
      [prop.valor]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ error: 'Error al obtener el carrito.' });
  }
};

// POST /api/carrito - Agregar producto o sumar cantidad (sin requerir login)
export const agregarAlCarrito = async (req: Request, res: Response): Promise<void> => {
  const prop = obtenerFiltroPropietario(req);
  if (!prop) {
    res.status(400).json({ error: 'Identificador de carrito no válido.' });
    return;
  }

  const productoId = Number(req.body.producto_id);
  const cantidad = req.body.cantidad !== undefined ? Number(req.body.cantidad) : 1;

  if (!Number.isInteger(productoId) || productoId <= 0) {
    res.status(400).json({ error: 'ID de producto inválido.' });
    return;
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    res.status(400).json({ error: 'La cantidad debe ser un entero mayor a 0.' });
    return;
  }

  try {
    const [prodRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nombre, stock FROM productos WHERE id = ? AND activo = 1',
      [productoId]
    );

    if (prodRows.length === 0) {
      res.status(404).json({ error: 'Producto no encontrado o descontinuado.' });
      return;
    }

    const stockDisponible = Number(prodRows[0].stock);
    if (stockDisponible <= 0) {
      res.status(400).json({ error: `El producto "${prodRows[0].nombre}" está agotado.` });
      return;
    }

    const [existenteRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, cantidad FROM carrito_items WHERE ${prop.columna} = ? AND producto_id = ?`,
      [prop.valor, productoId]
    );

    const cantidadActual = existenteRows.length > 0 ? Number(existenteRows[0].cantidad) : 0;
    const nuevaCantidad = cantidadActual + cantidad;

    if (nuevaCantidad > stockDisponible) {
      res.status(400).json({
        error: `Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles.`,
      });
      return;
    }

    if (existenteRows.length > 0) {
      await pool.query('UPDATE carrito_items SET cantidad = ? WHERE id = ?', [
        nuevaCantidad,
        existenteRows[0].id,
      ]);
    } else {
      await pool.query(
        `INSERT INTO carrito_items (${prop.columna}, producto_id, cantidad) VALUES (?, ?, ?)`,
        [prop.valor, productoId, cantidad]
      );
    }

    res.status(201).json({
      mensaje: 'Producto agregado al carrito.',
      producto_id: productoId,
      cantidad: nuevaCantidad,
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ error: 'No se pudo agregar el producto al carrito.' });
  }
};

// PUT /api/carrito/:productoId - Actualizar cantidad exacta
export const actualizarCantidadCarrito = async (req: Request, res: Response): Promise<void> => {
  const prop = obtenerFiltroPropietario(req);
  if (!prop) {
    res.status(400).json({ error: 'Identificador de carrito no válido.' });
    return;
  }

  const productoId = Number(req.params.productoId);
  const cantidad = Number(req.body.cantidad);

  if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad)) {
    res.status(400).json({ error: 'Datos de actualización inválidos.' });
    return;
  }

  try {
    if (cantidad <= 0) {
      await pool.query(
        `DELETE FROM carrito_items WHERE ${prop.columna} = ? AND producto_id = ?`,
        [prop.valor, productoId]
      );
      res.json({ mensaje: 'Producto eliminado del carrito.', producto_id: productoId, cantidad: 0 });
      return;
    }

    const [prodRows] = await pool.query<RowDataPacket[]>(
      'SELECT stock FROM productos WHERE id = ? AND activo = 1',
      [productoId]
    );

    if (prodRows.length === 0) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const stockDisponible = Number(prodRows[0].stock);
    if (cantidad > stockDisponible) {
      res.status(400).json({
        error: `Stock máximo disponible: ${stockDisponible} unidades.`,
      });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE carrito_items SET cantidad = ? WHERE ${prop.columna} = ? AND producto_id = ?`,
      [cantidad, prop.valor, productoId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'El producto no está en el carrito.' });
      return;
    }

    res.json({
      mensaje: 'Cantidad actualizada.',
      producto_id: productoId,
      cantidad,
    });
  } catch (error) {
    console.error('Error al actualizar cantidad en carrito:', error);
    res.status(500).json({ error: 'Error al actualizar el carrito.' });
  }
};

// POST /api/carrito/sincronizar - Fusiona carrito de invitado (session_id) con usuario_id al iniciar sesión
export const sincronizarCarrito = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    res.status(401).json({ error: 'Debes iniciar sesión para sincronizar el carrito.' });
    return;
  }

  const sessionId =
    typeof req.body.session_id === 'string' && req.body.session_id.trim()
      ? req.body.session_id.trim()
      : req.sessionId;

  if (!sessionId) {
    res.json({ mensaje: 'No había carrito de invitado pendiente por sincronizar.' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [itemsInvitado] = await connection.query<RowDataPacket[]>(
      'SELECT id, producto_id, cantidad FROM carrito_items WHERE session_id = ?',
      [sessionId]
    );

    for (const item of itemsInvitado) {
      const [prodRows] = await connection.query<RowDataPacket[]>(
        'SELECT stock FROM productos WHERE id = ? AND activo = 1',
        [item.producto_id]
      );

      if (prodRows.length === 0 || Number(prodRows[0].stock) <= 0) {
        continue;
      }

      const stockMax = Number(prodRows[0].stock);
      const [itemUsuario] = await connection.query<RowDataPacket[]>(
        'SELECT id, cantidad FROM carrito_items WHERE usuario_id = ? AND producto_id = ?',
        [usuarioId, item.producto_id]
      );

      if (itemUsuario.length > 0) {
        const sumaAjustada = Math.min(
          Number(itemUsuario[0].cantidad) + Number(item.cantidad),
          stockMax
        );
        await connection.query('UPDATE carrito_items SET cantidad = ? WHERE id = ?', [
          sumaAjustada,
          itemUsuario[0].id,
        ]);
      } else {
        const cantidadAjustada = Math.min(Number(item.cantidad), stockMax);
        await connection.query(
          'INSERT INTO carrito_items (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
          [usuarioId, item.producto_id, cantidadAjustada]
        );
      }
    }

    // Limpiar los registros temporales del invitado una vez fusionados
    await connection.query('DELETE FROM carrito_items WHERE session_id = ?', [sessionId]);

    await connection.commit();
    res.json({ mensaje: 'Carrito sincronizado con tu cuenta.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al sincronizar carrito:', error);
    res.status(500).json({ error: 'No se pudo sincronizar el carrito.' });
  } finally {
    connection.release();
  }
};

// DELETE /api/carrito/:productoId - Quitar un producto específico
export const eliminarDelCarrito = async (req: Request, res: Response): Promise<void> => {
  const prop = obtenerFiltroPropietario(req);
  if (!prop) {
    res.status(400).json({ error: 'Identificador de carrito no válido.' });
    return;
  }

  const productoId = Number(req.params.productoId);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    res.status(400).json({ error: 'ID de producto inválido.' });
    return;
  }

  try {
    await pool.query(
      `DELETE FROM carrito_items WHERE ${prop.columna} = ? AND producto_id = ?`,
      [prop.valor, productoId]
    );
    res.json({ mensaje: 'Producto eliminado del carrito.' });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ error: 'Error al eliminar el producto del carrito.' });
  }
};

// DELETE /api/carrito - Vaciar todo el carrito
export const vaciarCarrito = async (req: Request, res: Response): Promise<void> => {
  const prop = obtenerFiltroPropietario(req);
  if (!prop) {
    res.status(400).json({ error: 'Identificador de carrito no válido.' });
    return;
  }

  try {
    await pool.query(`DELETE FROM carrito_items WHERE ${prop.columna} = ?`, [prop.valor]);
    res.json({ mensaje: 'Carrito vaciado correctamente.' });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({ error: 'Error al vaciar el carrito.' });
  }
};