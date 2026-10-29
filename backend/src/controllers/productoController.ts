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
}

// GET: Obtener catálogo de productos
export const getProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM productos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
};

// POST: Crear nuevo producto (Admin)
export const createProducto = async (req: Request, res: Response): Promise<void> => {
  const { nombre, descripcion, precio, stock, imagen_url }: Producto = req.body;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, stock, imagen_url || null]
    );
    res.status(201).json({ id: result.insertId, nombre, precio, stock });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error });
  }
};