import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';

// Cargar variables de entorno
dotenv.config({ path: '../../.env' });

// Verificar que DATABASE_URL esté definida
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno');
  console.log('💡 Asegúrate de tener un archivo .env en la raíz del proyecto con DATABASE_URL');
  process.exit(1);
}

// Mostrar información de la URL de conexión (sin credenciales)
const dbUrl = new URL(process.env.DATABASE_URL);
const safeUrl = `${dbUrl.protocol}//${dbUrl.hostname}${dbUrl.pathname}`;

console.log('🔍 Variables de entorno cargadas correctamente');
console.log('🔹 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 Base de datos:', safeUrl);

// Función para verificar la resolución DNS
async function checkDns(hostname: string): Promise<void> {
  try {
    const resolve4 = promisify(dns.resolve4);
    const resolve6 = promisify(dns.resolve6);
    
    console.log('\n🔍 Verificando resolución DNS...');
    
    try {
      const ipv4 = await resolve4(hostname);
      console.log(`✅ Resolución IPv4 exitosa: ${ipv4[0]}`);
    } catch (err) {
      console.warn('⚠️  No se pudo resolver la dirección IPv4:', err.message);
    }
    
    try {
      const ipv6 = await resolve6(hostname);
      console.log(`✅ Resolución IPv6 exitosa: ${ipv6[0]}`);
    } catch (err) {
      console.warn('⚠️  No se pudo resolver la dirección IPv6:', err.message);
    }
  } catch (error) {
    console.error('❌ Error al verificar DNS:', error.message);
  }
}

// Función para verificar la conectividad de red
async function checkNetworkConnectivity(hostname: string, port: number): Promise<void> {
  const net = await import('net');
  
  return new Promise((resolve) => {
    console.log(`\n🔍 Probando conexión a ${hostname}:${port}...`);
    
    const socket = net.createConnection({
      host: hostname,
      port: port,
      timeout: 10000
    });
    
    socket.on('connect', () => {
      console.log(`✅ Conexión TCP establecida con ${hostname}:${port}`);
      socket.destroy();
      resolve();
    });
    
    socket.on('error', (err) => {
      console.error(`❌ Error de conexión a ${hostname}:${port}:`, err.message);
      resolve();
    });
    
    socket.on('timeout', () => {
      console.error(`⏱️  Timeout al conectar a ${hostname}:${port}`);
      socket.destroy();
      resolve();
    });
  });
}

async function testConnection() {
  try {
    // Extraer información de la URL de conexión
    const dbUrl = new URL(process.env.DATABASE_URL || '');
    const hostname = dbUrl.hostname;
    const port = dbUrl.port ? parseInt(dbUrl.port, 10) : 5432; // Puerto por defecto de PostgreSQL
    
    console.log('🔍 Iniciando pruebas de conexión...');
    console.log(`🔗 Host: ${hostname}, Puerto: ${port}`);
    
    // 1. Verificar resolución DNS
    await checkDns(hostname);
    
    // 2. Verificar conectividad de red
    await checkNetworkConnectivity(hostname, port);
    
    // 3. Mostrar información del entorno
    console.log('\n📋 Información del entorno:');
    console.log(`- Node.js: ${process.version}`);
    console.log(`- Plataforma: ${process.platform} ${process.arch}`);
    console.log(`- Tiempo de espera: ${process.env.PG_TIMEOUT || 'No definido'}`);
    
    // 4. Probar conexión a la base de datos
    console.log('\n🔄 Probando conexión a PostgreSQL...');
    const startTime = Date.now();
    const result = await db.execute(sql`SELECT 1 + 1 as result`);
    const endTime = Date.now();
    
    console.log(`✅ Conexión exitosa a la base de datos (${endTime - startTime}ms)`);
    console.log('🔹 Resultado de la consulta:', result);
    
    // 5. Probar listado de tablas
    try {
      console.log('\n🔄 Listando tablas...');
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('📋 Tablas en la base de datos:');
      const tableRows = (tables as unknown as { table_name: string }[]).map(t => t.table_name);
      if (tableRows.length > 0) {
        console.table(tableRows);
      } else {
        console.log('ℹ️ No se encontraron tablas en la base de datos');
      }
      
    } catch (error) {
      console.warn('⚠️ No se pudieron listar las tablas (puede ser normal si no hay tablas aún):');
      console.warn(error.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error al conectar a la base de datos:');
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔍 Posibles soluciones:');
      console.error('1. Verifica que el servidor de la base de datos esté en ejecución');
      console.error('2. Verifica que el host y puerto sean correctos');
      console.error('3. Verifica que el firewall permita la conexión');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n🔍 La conexión ha excedido el tiempo de espera');
      console.error('1. Verifica tu conexión a internet');
      console.error('2. Intenta aumentar el tiempo de espera con PG_TIMEOUT=10000');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 No se pudo resolver el host de la base de datos');
      console.error('1. Verifica que la URL de conexión sea correcta');
      console.error('2. Verifica tu conexión a internet');
    } else if (error.message.includes('no pg_hba.conf entry')) {
      console.error('\n🔍 Error de autenticación');
      console.error('1. Verifica el usuario y contraseña en la URL de conexión');
      console.error('2. Verifica que el usuario tenga permisos para conectarse desde tu IP');
    } else if (error.code === 'ECONNRESET') {
      console.error('\n🔍 La conexión fue reiniciada por el servidor');
      console.error('1. Verifica que la URL de conexión sea correcta');
      console.error('2. Verifica que el servidor de la base de datos esté configurado correctamente');
      console.error('3. Intenta usar una versión diferente del cliente PostgreSQL');
    }
    
    process.exit(1);
  } finally {
    console.log('\n🏁 Prueba de conexión finalizada');
    process.exit(0);
  }
}

testConnection();
