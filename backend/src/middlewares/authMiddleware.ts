import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayloadUsuario {
    id: number;
    usuario: string;
    rol: 'admin' | 'cliente';
}

declare global {
    namespace Express {
        interface Request {
            usuario?: JwtPayloadUsuario;
            sessionId?: string;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'agroinsumos_pro_clave_secreta_2026';

// Obligatorio: exige JWT válido (para checkout/pedidos, perfil y rutas admin)
export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Acceso denegado. Inicia sesión para continuar.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadUsuario;
        req.usuario = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' });
    }
};

// Obligatorio para administración: exige rol 'admin'
export const soloAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario || req.usuario.rol !== 'admin') {
        res.status(403).json({ error: 'Acceso restringido. Se requieren permisos de administrador.' });
        return;
    }
    next();
};

// Híbrido para el carrito: acepta JWT válido O encabezado 'x-session-id' sin exigir login
export const identificarCliente = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const sessionHeader = req.headers['x-session-id'];

    if (typeof sessionHeader === 'string' && sessionHeader.trim().length > 0) {
        req.sessionId = sessionHeader.trim().slice(0, 64);
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadUsuario;
            req.usuario = decoded;
        } catch {
            // Si el token expiró pero trae sessionId, puede seguir operando como invitado
        }
    }

    if (!req.usuario && !req.sessionId) {
        res.status(400).json({
            error: 'Se requiere iniciar sesión o enviar el identificador de sesión (x-session-id).',
        });
        return;
    }

    next();
};