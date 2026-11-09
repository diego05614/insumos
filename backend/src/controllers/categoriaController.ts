import { Request, Response } from 'express';
import { pool } from '../config/db'; // Ajusta la ruta a tu pool de MySQL

// GET /api/categorias
export const getCategorias = async (_req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categorias ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
};

// POST /api/categorias
export const createCategoria = async (req: Request, res: Response) => {
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
    }

    try {
        const [result]: any = await pool.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: result.insertId, nombre });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ error: 'Error al crear la categoría' });
    }
};

// PUT /api/categorias/:id
export const updateCategoria = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { nombre } = req.body;

    try {
        await pool.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id]);
        res.json({ message: 'Categoría actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
};

// DELETE /api/categorias/:id
export const deleteCategoria = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
};