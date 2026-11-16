import './AdminPanel.css';
import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginModalProps {
    onLoginExitoso: (rol: 'admin' | 'cliente', nombreUsuario: string) => void;
    onCancelar: () => void;
}

export function LoginModal({ onLoginExitoso, onCancelar }: LoginModalProps) {
    const [esRegistro, setEsRegistro] = useState<boolean>(false);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState<boolean>(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            if (esRegistro) {
                const res = await api.post('/auth/register', {
                    nombre: nombre.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                });
                onLoginExitoso(res.data.rol, res.data.nombre);
            } else {
                const res = await api.post('/auth/login', {
                    email: email.trim().toLowerCase(),
                    password,
                });
                onLoginExitoso(res.data.rol, res.data.nombre);
            }
        } catch (err: any) {
            const mensajeError =
                err.response?.data?.error ||
                (esRegistro
                    ? 'No se pudo completar el registro. Verifica tus datos.'
                    : 'Correo o contraseña incorrectos.');
            setError(mensajeError);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancelar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</h3>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    {esRegistro && (
                        <div className="form-group">
                            <label>Nombre completo:</label>
                            <input
                                type="text"
                                placeholder="Ej. Carlos Mendoza"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Correo electrónico (Gmail):</label>
                        <input
                            type="email"
                            placeholder="ejemplo@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña:</label>
                        <input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onCancelar}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={cargando}>
                            {cargando ? 'Verificando...' : esRegistro ? 'Registrarme' : 'Ingresar'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '0.86rem', color: '#475569' }}>
                    {esRegistro ? (
                        <>
                            ¿Ya tienes cuenta?{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setEsRegistro(false);
                                    setError('');
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#16a34a',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                Inicia sesión
                            </button>
                        </>
                    ) : (
                        <>
                            ¿No tienes cuenta?{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setEsRegistro(true);
                                    setError('');
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#16a34a',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                Regístrate con tu correo
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}