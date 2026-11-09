import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  categoria_id?: number | null;
}
// GET /api/productos
export const getProductos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT p.*, c.nombre AS categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
};

// GET /api/productos/:id

export const getProductoById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const query = `
      SELECT p.*, c.nombre AS categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error });
  }
};
// POST /api/productos
export const createProducto = async (req: Request, res: Response): Promise<void> => {
  const { nombre, descripcion, precio, stock, imagen_url, categoria_id }: Producto = req.body;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria_id) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, stock, imagen_url || null, categoria_id || null]
    );
    res.status(201).json({ id: result.insertId, nombre, precio, stock, categoria_id });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error });
  }
};

// PUT /api/productos/:id
export const updateProducto = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, imagen_url, categoria_id }: Producto = req.body;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ?, categoria_id = ? WHERE id = ?',
      [nombre, descripcion, precio, stock, imagen_url || null, categoria_id || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.json({ id: Number(id), nombre, descripcion, precio, stock, imagen_url, categoria_id });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar producto', error });
  }
};

// DELETE /api/productos/:id
export const deleteProducto = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  try {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM productos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.json({ message: 'Producto eliminado correctamente', id: Number(id) });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar producto', error });
  }
};