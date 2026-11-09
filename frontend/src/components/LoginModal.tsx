import './AdminPanel.css';
import React, { useState } from 'react';

interface LoginModalProps {
    onLoginExitoso: (rol: 'admin' | 'cliente', nombreUsuario: string) => void;
    onCancelar: () => void;
}

export function LoginModal({ onLoginExitoso, onCancelar }: LoginModalProps) {
    const [esModoAdmin, setEsModoAdmin] = useState<boolean>(false);
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (esModoAdmin) {
            // Credenciales de Administrador
            if (usuario === 'admin' && password === 'admin123') {
                setError('');
                onLoginExitoso('admin', usuario);
            } else {
                setError('Usuario o contraseña de Administrador incorrectos');
            }
        } else {
            // Validación básica para Cliente / Usuario regular
            if (usuario.trim() !== '' && password.trim() !== '') {
                setError('');
                onLoginExitoso('cliente', usuario);
            } else {
                setError('Por favor completa todos los campos');
            }
        }
    };
    

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{esModoAdmin ? 'Iniciar Sesión como Admin' : 'Iniciar Sesión'}</h3>

                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button
                        type="button"
                        className={!esModoAdmin ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => { setEsModoAdmin(false); setError(''); }}
                    >
                        Cliente
                    </button>
                    <button
                        type="button"
                        className={esModoAdmin ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => { setEsModoAdmin(true); setError(''); }}
                    >
                        Administrador
                    </button>
                </div>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Usuario:</label>
                        <input
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onCancelar}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            Ingresar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}