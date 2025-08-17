import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let auth: any;

try {
  // Cargar credenciales desde el archivo JSON
  const credentialsPath = path.join(__dirname, 'firebase-credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error('No se encontró el archivo de credenciales de Firebase');
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  
  // Inicializar Firebase Admin con las credenciales
  initializeApp({
    credential: cert(serviceAccount)
  });

  auth = getAuth();
  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  No se pudo inicializar Firebase Admin. Usando mock en desarrollo:', (error as Error).message);
    auth = {
      async verifyIdToken(_token: string) {
        return { uid: 'dev-user' };
      },
    };
  } else {
    console.error('❌ Error crítico al inicializar Firebase Admin:', error);
    throw error;
  }
}

export { auth };