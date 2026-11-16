import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

const router = Router();

interface UsuarioRow extends RowDataPacket {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: 'CLIENTE' | 'ADMIN';
}

// 1. POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
    return;
  }

  try {
    const [rows] = await pool.query<UsuarioRow[]>(
      'SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND password = ?',
      [email.trim().toLowerCase(), password]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
      return;
    }

    const usuario = rows[0];
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.toLowerCase(), // devuelve 'admin' o 'cliente'
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// 2. POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    res.status(400).json({ error: 'Completa nombre, correo y contraseña.' });
    return;
  }

  const emailLimpio = email.trim().toLowerCase();

  try {
    const [existentes] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE email = ?',
      [emailLimpio]
    );

    if (existentes.length > 0) {
      res.status(409).json({ error: 'Este correo ya está registrado. Inicia sesión.' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre.trim(), emailLimpio, password, 'CLIENTE']
    );

    res.status(201).json({
      id: result.insertId,
      nombre: nombre.trim(),
      email: emailLimpio,
      rol: 'cliente',
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'No se pudo completar el registro.' });
  }
});

export default router;