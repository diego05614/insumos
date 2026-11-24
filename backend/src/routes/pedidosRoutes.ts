import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { verificarToken, soloAdmin } from '../middlewares/authMiddleware';

const router = Router();

interface PedidoDbRow extends RowDataPacket {
  id: number;
  usuario_id: number | null;
  cliente_nombre: string;
  direccion: string;
  telefono: string | null;
  metodo_pago: string;
  total: number;
  estado?: string;
  items?: DetallePedidoDbRow[];
}

interface DetallePedidoDbRow extends RowDataPacket {
  id: number;
  pedido_id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// 1. GET /api/pedidos (Solo Admin: historial completo de ventas)
router.get('/', verificarToken, soloAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [pedidos] = await pool.query<PedidoDbRow[]>(
      'SELECT * FROM pedidos ORDER BY id DESC'
    );

    for (const pedido of pedidos) {
      const [items] = await pool.query<DetallePedidoDbRow[]>(
        `SELECT dp.*, p.nombre AS producto_nombre
         FROM detalle_pedidos dp
         LEFT JOIN productos p ON dp.producto_id = p.id
         WHERE dp.pedido_id = ?`,
        [pedido.id]
      );
      pedido.items = items;
    }

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener el historial de ventas.' });
  }
});

// 2. GET /api/pedidos/mis-pedidos (Cliente autenticado: solo sus propias compras)
router.get('/mis-pedidos', verificarToken, async (req: Request, res: Response): Promise<void> => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    res.status(401).json({ error: 'Usuario no autenticado.' });
    return;
  }

  try {
    const [pedidos] = await pool.query<PedidoDbRow[]>(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC',
      [usuarioId]
    );

    for (const pedido of pedidos) {
      const [items] = await pool.query<DetallePedidoDbRow[]>(
        `SELECT dp.*, p.nombre AS producto_nombre
         FROM detalle_pedidos dp
         LEFT JOIN productos p ON dp.producto_id = p.id
         WHERE dp.pedido_id = ?`,
        [pedido.id]
      );
      pedido.items = items;
    }

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos del cliente:', error);
    res.status(500).json({ error: 'Error al consultar tus pedidos.' });
  }
});

// 3. GET /api/pedidos/resumen (Solo Admin: analítica y cierre)
router.get('/resumen', verificarToken, soloAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalesRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COALESCE(SUM(total), 0) AS totalVendido,
        COUNT(*) AS totalPedidos
       FROM pedidos
       WHERE COALESCE(estado, '') != 'Anulada'`
    );

    const [topProductos] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.nombre,
        SUM(dp.cantidad) AS unidadesVendidas,
        SUM(dp.subtotal) AS ingresos
       FROM detalle_pedidos dp
       INNER JOIN pedidos ped ON dp.pedido_id = ped.id
       INNER JOIN productos p ON dp.producto_id = p.id
       WHERE COALESCE(ped.estado, '') != 'Anulada'
       GROUP BY p.id, p.nombre
       ORDER BY unidadesVendidas DESC
       LIMIT 5`
    );

    const [ventasPorCategoria] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COALESCE(c.nombre, 'Sin categoría') AS categoria,
        SUM(dp.cantidad) AS unidades,
        SUM(dp.subtotal) AS ingresos
       FROM detalle_pedidos dp
       INNER JOIN pedidos ped ON dp.pedido_id = ped.id
       INNER JOIN productos p ON dp.producto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE COALESCE(ped.estado, '') != 'Anulada'
       GROUP BY c.id, c.nombre
       ORDER BY ingresos DESC`
    );

    res.json({
      totalVendido: Number(totalesRows[0]?.totalVendido || 0),
      totalPedidos: Number(totalesRows[0]?.totalPedidos || 0),
      topProductos,
      ventasPorCategoria,
    });
  } catch (error) {
    console.error('Error al generar resumen de ventas:', error);
    res.status(500).json({ error: 'Error al generar el resumen de ventas.' });
  }
});

// 4. POST /api/pedidos (Cliente autenticado en checkout o Admin en POS)
router.post('/', verificarToken, async (req: Request, res: Response): Promise<void> => {
  const { cliente_nombre, direccion, telefono, metodo_pago, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'El pedido debe incluir al menos un producto.' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let totalCalculado = 0;
    const itemsProcesados: { producto_id: number; cantidad: number; precio: number; subtotal: number }[] = [];

    for (const item of items) {
      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error('Las cantidades de los productos deben ser números enteros mayores a 0.');
      }

      const [prodRows] = await connection.query<RowDataPacket[]>(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = ? AND activo = 1 FOR UPDATE',
        [item.producto_id]
      );

      if (prodRows.length === 0) {
        throw new Error(`Producto ID ${item.producto_id} no encontrado.`);
      }

      const prod = prodRows[0];
      if (prod.stock < cantidad) {
        throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}.`);
      }

      const subtotal = Number(prod.precio) * cantidad;
      totalCalculado += subtotal;

      itemsProcesados.push({
        producto_id: prod.id,
        cantidad,
        precio: Number(prod.precio),
        subtotal,
      });

      await connection.query(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [cantidad, prod.id]
      );
    }

    const esAdminPos = req.usuario?.rol === 'admin';
    const usuarioIdPedido = !esAdminPos && req.usuario?.id ? req.usuario.id : null;
    const nombreFinal =
      cliente_nombre?.trim() || req.usuario?.usuario || 'Cliente Mostrador';
    const direccionFinal = direccion?.trim() || 'Venta en mostrador (Tienda)';
    const telefonoFinal = telefono?.trim() || null;

    const [pedidoResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO pedidos (usuario_id, cliente_nombre, direccion, telefono, metodo_pago, total, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        usuarioIdPedido,
        nombreFinal,
        direccionFinal,
        telefonoFinal,
        metodo_pago || 'efectivo',
        totalCalculado,
        'Confirmado',
      ]
    );

    const pedidoId = pedidoResult.insertId;

    for (const it of itemsProcesados) {
      await connection.query(
        'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [pedidoId, it.producto_id, it.cantidad, it.precio, it.subtotal]
      );
    }

    // Si es una compra online de cliente autenticado, vacía su carrito en MySQL
    if (usuarioIdPedido) {
      await connection.query('DELETE FROM carrito_items WHERE usuario_id = ?', [usuarioIdPedido]);
    }

    await connection.commit();
    res.status(201).json({
      mensaje: 'Pedido registrado con éxito.',
      pedido_id: pedidoId,
      total_pagado: totalCalculado,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar pedido:', error);
    res.status(400).json({ error: error.message || 'No se pudo procesar el pedido.' });
  } finally {
    connection.release();
  }
});

// 5. PUT /api/pedidos/:id/anular (Solo Admin)
router.put('/:id/anular', verificarToken, soloAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [pedidoRows] = await connection.query<RowDataPacket[]>(
      'SELECT estado FROM pedidos WHERE id = ?',
      [id]
    );

    if (pedidoRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Venta no encontrada.' });
      return;
    }

    if (pedidoRows[0].estado === 'Anulada') {
      await connection.rollback();
      res.status(400).json({ error: 'Esta venta ya fue anulada anteriormente.' });
      return;
    }

    const [detalles] = await connection.query<DetallePedidoDbRow[]>(
      'SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?',
      [id]
    );

    for (const item of detalles) {
      await connection.query(
        'UPDATE productos SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    await connection.query('UPDATE pedidos SET estado = ? WHERE id = ?', ['Anulada', id]);

    await connection.commit();
    res.json({ mensaje: 'Venta anulada y stock restaurado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al anular venta:', error);
    res.status(500).json({ error: 'No se pudo anular la venta.' });
  } finally {
    connection.release();
  }
});

// 6. DELETE /api/pedidos/:id (Solo Admin)
router.delete('/:id', verificarToken, soloAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM detalle_pedidos WHERE pedido_id = ?', [id]);

    const [result] = await connection.query<ResultSetHeader>('DELETE FROM pedidos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Registro de venta no encontrado.' });
      return;
    }

    await connection.commit();
    res.json({ mensaje: 'Registro eliminado correctamente.', id: Number(id) });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar registro de venta:', error);
    res.status(500).json({ error: 'Error interno al eliminar el registro.' });
  } finally {
    connection.release();
  }
});

export default router;