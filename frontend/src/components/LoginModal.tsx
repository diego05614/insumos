import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginModalProps {
  onLoginExitoso: (rol: 'admin' | 'cliente', nombreUsuario: string) => void;
  onCancelar: () => void;
}

export function LoginModal({ onLoginExitoso, onCancelar }: LoginModalProps) {
  const [esRegistro, setEsRegistro] = useState<boolean>(false);
  const [metodoRegistro, setMetodoRegistro] = useState<'telefono' | 'email'>('telefono');
  const [nombre, setNombre] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState('');

  const passwordLimpia = password.trim();
  const longitudValida = passwordLimpia.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (esRegistro && nombre.trim().length < 3) {
      setError('Ingresa tu nombre completo (mínimo 3 caracteres).');
      return;
    }

    if (esRegistro) {
      if (metodoRegistro === 'telefono' && telefono.replace(/\D/g, '').length < 7) {
        setError('Ingresa un número de teléfono válido (mínimo 7 dígitos).');
        return;
      }
      if (metodoRegistro === 'email' && (!email.trim().includes('@') || !email.trim().includes('.'))) {
        setError('Ingresa un correo electrónico válido.');
        return;
      }
    } else if (!identificador.trim()) {
      setError('Ingresa tu correo electrónico o número de teléfono.');
      return;
    }

    if (!longitudValida) {
      setError('La contraseña debe tener al menos 6 caracteres sin espacios.');
      return;
    }

    setCargando(true);

    try {
      const endpoint = esRegistro ? '/auth/register' : '/auth/login';
      const payload = esRegistro
        ? {
            nombre: nombre.trim(),
            email: metodoRegistro === 'email' ? email.trim().toLowerCase() : '',
            telefono: metodoRegistro === 'telefono' ? telefono.trim() : '',
            password: passwordLimpia,
          }
        : {
            identificador: identificador.trim(),
            password: passwordLimpia,
          };

      const res = await api.post(endpoint, payload);

      if (res.data.token) {
        localStorage.setItem('insumos_token', res.data.token);
      }

      onLoginExitoso(res.data.rol, res.data.nombre);
    } catch (err: any) {
      const mensajeError =
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        (esRegistro
          ? 'No se pudo completar el registro. Verifica tus datos.'
          : 'Correo/teléfono o contraseña incorrectos.');
      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onCancelar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl border border-slate-200/90 relative"
      >
        {/* Cabecera estilo AgroInsumos Pro */}
        <div className="bg-[#07241c] text-white px-7 pt-7 pb-6 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-lime-400/15 rounded-full blur-2xl pointer-events-none" />

          <button
            type="button"
            onClick={onCancelar}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-lime-400 hover:text-slate-950 text-white/80 flex items-center justify-center text-lg leading-none transition cursor-pointer"
          >
            ×
          </button>

          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-lime-400/20">
            🌱
          </div>

          <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime-300 bg-white/10 border border-lime-400/20 px-2.5 py-0.5 rounded-full mb-1.5">
            {esRegistro ? 'Nuevo Cliente' : 'Acceso Seguro'}
          </span>

          <h3 className="text-xl font-black text-white tracking-tight">
            {esRegistro ? 'Crear Cuenta' : 'Bienvenido de nuevo'}
          </h3>
          <p className="text-xs text-emerald-100/75 mt-1">
            {esRegistro
              ? 'Regístrate con tu celular o correo electrónico'
              : 'Ingresa con tu correo o número de teléfono'}
          </p>
        </div>

        {/* Cuerpo del formulario */}
        <div className="p-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3.5 py-2.5 rounded-2xl mb-4 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {esRegistro && (
              <>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos Mendoza"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                  />
                </div>

                {/* Selector rápido: Teléfono o Correo */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    ¿Cómo prefieres registrarte?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMetodoRegistro('telefono');
                        setError('');
                      }}
                      className={`py-2 px-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                        metodoRegistro === 'telefono'
                          ? 'bg-[#07241c] border-[#07241c] text-lime-300 shadow-sm'
                          : 'bg-[#faf9f5] hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      📱 Con Teléfono
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMetodoRegistro('email');
                        setError('');
                      }}
                      className={`py-2 px-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                        metodoRegistro === 'email'
                          ? 'bg-[#07241c] border-[#07241c] text-lime-300 shadow-sm'
                          : 'bg-[#faf9f5] hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      📧 Con Correo
                    </button>
                  </div>
                </div>
              </>
            )}

            {!esRegistro ? (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Correo electrónico o teléfono
                </label>
                <input
                  type="text"
                  placeholder="Ej. 300 123 4567 o ejemplo@gmail.com"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                />
              </div>
            ) : metodoRegistro === 'telefono' ? (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Número de teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Ej. 300 123 4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  Contraseña
                </label>
                {password.length > 0 && (
                  <span
                    className={`text-[11px] font-bold ${
                      longitudValida ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {longitudValida
                      ? '✓ Longitud válida'
                      : `Faltan ${6 - passwordLimpia.length} caracteres`}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-2xl border border-slate-200 bg-[#faf9f5] focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((prev) => !prev)}
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-1 rounded-lg transition cursor-pointer"
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={onCancelar}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando || !longitudValida}
                className="flex-1 bg-[#07241c] hover:bg-emerald-900 disabled:opacity-50 text-lime-300 font-black py-2.5 rounded-2xl text-sm shadow-lg shadow-emerald-950/20 transition cursor-pointer disabled:cursor-not-allowed"
              >
                {cargando ? 'Verificando...' : esRegistro ? 'Registrarme' : 'Ingresar'}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            {esRegistro ? (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setEsRegistro(false);
                    setError('');
                  }}
                  className="text-emerald-800 hover:text-emerald-950 font-black underline cursor-pointer"
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
                  className="text-emerald-800 hover:text-emerald-950 font-black underline cursor-pointer"
                >
                  Regístrate con teléfono o correo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}