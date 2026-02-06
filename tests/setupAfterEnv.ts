// Configuración que se ejecuta después de configurar el entorno de prueba
import { jest, beforeEach } from '@jest/globals';
import { mockSupabaseClient } from '../src/__mocks__/@supabase/supabase-js';

// Configurar mocks globales
global.console = {
  ...console,
  // Sobrescribir console.log para evitar ruido en las pruebas
  log: jest.fn() as typeof console.log,
  debug: jest.fn() as typeof console.debug,
  info: jest.fn() as typeof console.info,
  // Mantener los logs de error y warn visibles
  error: console.error,
  warn: console.warn,
};

// Limpiar mocks antes de cada prueba
beforeEach(() => {
  jest.clearAllMocks();
});

// Configurar variables de entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
