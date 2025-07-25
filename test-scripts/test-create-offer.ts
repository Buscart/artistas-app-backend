import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

// Usar 127.0.0.1 explícitamente para forzar IPv4
const API_BASE_URL = 'http://127.0.0.1:5001/api/v1';

// Credenciales del usuario cliente
const clientCredentials = {
  email: 'cliente@ejemplo.com',
  password: 'password123'
};

// Datos de la oferta a crear
const offerData = {
  category: 'Música',
  description: 'Necesito un cantante para una boda el próximo mes',
  budgetMin: 500000,
  budgetMax: 1000000,
  modality: 'presencial',
  eventDate: '2025-08-15T19:00:00.000Z',
  location: 'Bogotá, Colombia'
};

async function testCreateOffer() {
  try {
    console.log('🔑 Iniciando prueba de autenticación...');
    console.log('📡 URL de la API:', API_BASE_URL);
    console.log('👤 Credenciales:', JSON.stringify(clientCredentials, null, 2));
    
    // 1. Verificar conexión con el servidor
    try {
      console.log('\n🔄 Verificando conexión con el servidor...');
      const healthCheck = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);
      console.log('✅ Estado del servidor:', healthCheck.data);
    } catch (healthError) {
      console.error('❌ No se pudo conectar al servidor:', healthError.message);
      // Verificar si es un error de Axios de manera segura
      if (healthError && healthError.response) {
        const axiosError = healthError as any;
        console.error('📌 Detalles del error de conexión:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: axiosError.config?.headers
          }
        });
      }
      return;
    }
    
    // 2. Iniciar sesión para obtener el token
    console.log('\n🔑 Intentando autenticación...');
    // Usar tipo any temporalmente para evitar problemas de tipado
    const loginResponse = await axios({
      method: 'post',
      url: `${API_BASE_URL}/auth/login`,
      data: clientCredentials,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: (status) => status < 500
    });
    
    // Asegurar que la respuesta tenga el formato esperado
    const loginData = loginResponse.data as { token?: string; [key: string]: any };
    
    console.log('📨 Respuesta de autenticación:', {
      status: loginResponse.status,
      statusText: loginResponse.statusText,
      headers: loginResponse.headers,
      data: loginData
    });
    
    if (loginResponse.status !== 200 || !loginData.token) {
      console.error('❌ Error en la autenticación:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Autenticación exitosa');
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    
    // 3. Crear una oferta
    console.log('\n📝 Creando oferta...');
    console.log('📤 Datos de la oferta:', JSON.stringify(offerData, null, 2));
    
    const createOfferResponse = await axios.post(
      `${API_BASE_URL}/offers`,
      offerData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status < 500 // No lanzar error para códigos 4xx
      }
    );
    
    console.log('📨 Respuesta de creación de oferta:', {
      status: createOfferResponse.status,
      statusText: createOfferResponse.statusText,
      headers: createOfferResponse.headers,
      data: createOfferResponse.data
    });
    
    if (createOfferResponse.status >= 200 && createOfferResponse.status < 300) {
      console.log('✅ Oferta creada exitosamente!');
      console.log('📦 Detalles de la oferta:', JSON.stringify(createOfferResponse.data, null, 2));
    } else {
      console.error('❌ Error al crear la oferta:', createOfferResponse.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error en la prueba:');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    
    // Verificar si es un error de Axios de manera segura
    if (error && error.config) {
      const axiosError = error as any;
      console.error('📌 Error de Axios:', {
        code: axiosError.code,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          data: axiosError.config?.data,
          headers: axiosError.config?.headers
        },
        response: axiosError.response ? {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          headers: axiosError.response.headers,
          data: axiosError.response.data
        } : 'No hay respuesta del servidor'
      });
    } else if (error.response) {
      console.error('📌 Error en la respuesta del servidor:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('📌 No se recibió respuesta del servidor:', error.request);
    } else {
      console.error('📌 Error inesperado:', error);
    }
    
    console.error('\n🔍 Stack trace:', error.stack || 'No disponible');
  }
}

// Ejecutar la prueba
testCreateOffer();
