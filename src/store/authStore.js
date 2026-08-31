/**
 * authStore.js - Store global usando Zustand para gestión de estado
 * Maneja: autenticación, rol de usuario, notificaciones, tema
 * Persiste en localStorage del navegador
 */

import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Estado inicial del usuario
const initialState = {
  user: null,
  userRole: 'toma_pedidos', // Rol por defecto
  isLoggedIn: false,
  token: null,
  theme: 'light', // o 'dark'
  notifications: 0,
};

// Crear store con persistencia
export const useStore = create(
  persist(
    (set) => ({
      ...initialState,

      // Actions
      login: async (userData) => {
        try {
          set({ 
            user: userData.user,
            userRole: userData.rol,
            isLoggedIn: true,
            token: userData.token,
          });
          // Persistir rol en localStorage
          localStorage.setItem('userRole', userData.rol);
          localStorage.setItem('userName', userData.nombre);
          return true;
        } catch (error) {
          console.error('Error en login:', error);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          userRole: 'toma_pedidos',
          isLoggedIn: false,
          token: null,
        });
        // Limpiar localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
      },

      setUser: (userData) => {
        set({ user: userData });
      },

      setRole: (role) => {
        set({ userRole: role });
        localStorage.setItem('userRole', role);
      },

      toggleTheme: () => {
        set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        }));
        document.documentElement.classList.toggle('dark', state.theme === 'dark');
      },

      updateNotifications: (count) => {
        set({ notifications: count });
      },

      refreshUser: async () => {
        // Cargar datos del usuario desde Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Obtener rol del usuario
            const { data: usuario } = await supabase
              .from('usuarios')
              .select('rol, nombre')
              .eq('id', user.id)
              .single();

            if (usuario) {
              set({
                user: {
                  id: user.id,
                  email: user.email,
                  nombre: usuario.nombre,
                  rol: usuario.rol,
                },
                userRole: usuario.rol,
                isLoggedIn: true,
              });
            }
          }
        } catch (error) {
          console.error('Error refrescando usuario:', error);
        }
      },
    }),
    {
      name: 'labarrita-auth',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir lo esencial
      partialize: (state) => ({
        userRole: state.userRole,
        isLoggedIn: state.isLoggedIn,
        theme: state.theme,
        notifications: state.notifications,
      }),
    }
  )
);