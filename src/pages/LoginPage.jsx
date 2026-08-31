/**
 * LoginPage.jsx - Pantalla de login con autenticación Supabase
 * Email + contraseña, redirección según rol
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('Credenciales incorrectas. Por favor inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Guardar información del usuario en el store
        setUser({
          id: data.user.id,
          email: data.user.email,
          nombre: data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || 'Usuario',
          rol: data.user.user_metadata?.rol || 'toma_pedidos',
        });

        // Redirigir según rol
        const role = data.user.user_metadata?.rol || 'toma_pedidos';
        switch (role) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'socio':
            navigate('/dashboard');
            break;
          case 'toma_pedidos':
            navigate('/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error en login:', err);
      alert('Error inesperado. Por favor inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-amber-600 mx-auto flex items-center justify-center text-2xl font-bold text-white mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path className="stroke-2" d="M12 7v6m4 4h4m-4-4h4m-6-6l-6 6m6-6l6 6m2-6l-6-6m6 6l-6-6m6 6l6-6"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">La Barrita de Carnitas</h2>
          <p className="text-gray-500 mt-2">Sistema POS - Inicio de sesión</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              placeholder="juan@labarrita.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-lg font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿No tienes cuenta? <a href="#" className="text-amber-600 hover underline" onClick={() => window.alert('Funcionalidad de registro por venir')}>Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  );
}