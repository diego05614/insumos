import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'agroinsumos_pro_clave_secreta_2026';

interface UsuarioRow extends RowDataPacket {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  password: string;
  rol: 'CLIENTE' | 'ADMIN';
}

function firmarTokenUsuario(id: number, usuario: string, rol: 'admin' | 'cliente'): string {
  return jwt.sign({ id, usuario, rol }, JWT_SECRET, { expiresIn: '7d' });
}

// Normaliza números de teléfono: deja solo dígitos y quita prefijo país 57 si viene de 12 dígitos
function normalizarTelefono(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  let digitos = valor.replace(/\D/g, '');
  if (digitos.length === 12 && digitos.startsWith('57')) {
    digitos = digitos.slice(2);
  }
  return digitos;
}

// 1. POST /api/auth/login (acepta correo electrónico O número de teléfono)
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const identificadorRaw = req.body.identificador ?? req.body.email ?? '';
  const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';

  const identificador = String(identificadorRaw).trim();

  if (!identificador || !password) {
    res.status(400).json({ error: 'Ingresa tu correo o teléfono y tu contraseña.' });
    return;
  }

  const esCorreo = identificador.includes('@');
  const emailLimpio = esCorreo ? identificador.toLowerCase() : '';
  const telefonoLimpio = !esCorreo ? normalizarTelefono(identificador) : '';

  if (!esCorreo && telefonoLimpio.length < 7) {
    res.status(400).json({ error: 'Ingresa un correo electrónico o número de teléfono válido.' });
    return;
  }

  try {
    const query = esCorreo
      ? 'SELECT id, nombre, email, telefono, rol FROM usuarios WHERE email = ? AND password = ?'
      : 'SELECT id, nombre, email, telefono, rol FROM usuarios WHERE telefono = ? AND password = ?';
    const param = esCorreo ? emailLimpio : telefonoLimpio;

    const [rows] = await pool.query<UsuarioRow[]>(query, [param, password]);

    if (rows.length === 0) {
      res.status(401).json({ error: 'Correo/teléfono o contraseña incorrectos.' });
      return;
    }

    const usuario = rows[0];
    const rolNormalizado = usuario.rol.toLowerCase() === 'admin' ? 'admin' : 'cliente';
    const token = firmarTokenUsuario(usuario.id, usuario.nombre, rolNormalizado);

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: rolNormalizado,
      token,
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// 2. POST /api/auth/register (acepta correo, teléfono, o ambos)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { nombre, email, telefono, password } = req.body;

  const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
  const emailLimpio = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const telefonoLimpio = normalizarTelefono(telefono);
  const passwordLimpia = typeof password === 'string' ? password.trim() : '';

  if (nombreLimpio.length < 3) {
    res.status(400).json({ error: 'Ingresa tu nombre completo (mínimo 3 caracteres).' });
    return;
  }

  if (!emailLimpio && !telefonoLimpio) {
    res.status(400).json({ error: 'Ingresa al menos un correo electrónico o un número de teléfono.' });
    return;
  }

  if (emailLimpio && (!emailLimpio.includes('@') || !emailLimpio.includes('.'))) {
    res.status(400).json({ error: 'El correo electrónico ingresado no es válido.' });
    return;
  }

  if (telefonoLimpio && telefonoLimpio.length < 7) {
    res.status(400).json({ error: 'El número de teléfono debe tener al menos 7 dígitos.' });
    return;
  }

  if (passwordLimpia.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  try {
    if (emailLimpio) {
      const [existeEmail] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM usuarios WHERE email = ?',
        [emailLimpio]
      );
      if (existeEmail.length > 0) {
        res.status(409).json({ error: 'Este correo ya está registrado. Inicia sesión.' });
        return;
      }
    }

    if (telefonoLimpio) {
      const [existeTel] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM usuarios WHERE telefono = ?',
        [telefonoLimpio]
      );
      if (existeTel.length > 0) {
        res.status(409).json({ error: 'Este número de teléfono ya está registrado. Inicia sesión.' });
        return;
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (nombre, email, telefono, password, rol) VALUES (?, ?, ?, ?, ?)',
      [nombreLimpio, emailLimpio || null, telefonoLimpio || null, passwordLimpia, 'CLIENTE']
    );

    const token = firmarTokenUsuario(result.insertId, nombreLimpio, 'cliente');

    res.status(201).json({
      id: result.insertId,
      nombre: nombreLimpio,
      email: emailLimpio || null,
      telefono: telefonoLimpio || null,
      rol: 'cliente',
      token,
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'No se pudo completar el registro.' });
  }
});

export default router;