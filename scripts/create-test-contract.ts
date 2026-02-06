/**
 * Script para crear un contrato de prueba
 *
 * Uso: npx tsx scripts/create-test-contract.ts
 */

import { db } from '../src/db.js';
import { users } from '../src/schema/users.js';
import { userContracts } from '../src/schema/contracts.js';
import { eq, or } from 'drizzle-orm';

async function main() {
  console.log('🔍 Buscando usuarios...');

  // Buscar a Wendy
  const [wendy] = await db.select()
    .from(users)
    .where(or(
      eq(users.email, 'wendy.nietov@gmail.com'),
      eq(users.id, 'aJKaLH86nfOfMDCFpIBYkal6ZE22')
    ))
    .limit(1);

  if (!wendy) {
    console.error('❌ Usuario Wendy no encontrado');
    process.exit(1);
  }

  console.log('✅ Usuario encontrado:', wendy.displayName || wendy.email);

  // Buscar otro usuario para ser el cliente
  const [client] = await db.select()
    .from(users)
    .where(eq(users.email, 'test@test.com'))
    .limit(1);

  // Si no hay otro usuario, crear un contrato donde Wendy sea cliente y artista a la vez (para testing)
  const artistId = wendy.id;
  const clientId = client?.id || wendy.id;

  console.log('📝 Creando contrato de prueba...');

  // Crear contrato de prueba
  const [newContract] = await db.insert(userContracts).values({
    userId: clientId,
    artistId: artistId,
    serviceType: 'service',
    serviceName: 'Sesión Fotográfica Profesional',
    description: 'Sesión de fotos de 2 horas, incluye 20 fotos editadas en alta resolución.',
    amount: '500000', // 500,000 COP
    status: 'pending',
    paymentStatus: 'pending',
    serviceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
    clientSigned: false,
    artistSigned: false,
    contractTerms: `
CONTRATO DE PRESTACIÓN DE SERVICIOS FOTOGRÁFICOS

1. PARTES
Este contrato se celebra entre el CLIENTE (contratante) y el ARTISTA (prestador del servicio) a través de la plataforma BuscartPro.

2. OBJETO DEL CONTRATO
El ARTISTA se compromete a prestar el servicio de: Sesión Fotográfica Profesional
Descripción: Sesión de fotos de 2 horas, incluye 20 fotos editadas en alta resolución.

3. FECHA Y LUGAR
Fecha del servicio: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO')}

4. VALOR Y FORMA DE PAGO
Valor total del servicio: $500.000 COP
El pago se realizará a través de la plataforma BuscartPro.

5. OBLIGACIONES DEL ARTISTA
- Prestar el servicio acordado en la fecha y hora establecidas
- Cumplir con los estándares de calidad profesional
- Comunicar cualquier inconveniente con anticipación
- Entregar las fotos editadas en un plazo máximo de 5 días hábiles

6. OBLIGACIONES DEL CLIENTE
- Realizar el pago acordado
- Proporcionar las condiciones necesarias para la prestación del servicio
- Comunicar cualquier cambio con anticipación

7. CANCELACIÓN
- Cancelación con más de 48 horas: Reembolso del 100%
- Cancelación entre 24-48 horas: Reembolso del 50%
- Cancelación con menos de 24 horas: Sin reembolso

8. RESOLUCIÓN DE CONFLICTOS
Cualquier disputa será mediada por BuscartPro. En caso de no llegar a acuerdo, se someterá a las leyes colombianas.

Al firmar este contrato, ambas partes aceptan los términos y condiciones aquí establecidos.

Fecha de generación: ${new Date().toLocaleDateString('es-CO')}
    `.trim(),
    metadata: {
      location: 'Bogotá, Colombia',
      category: 'Fotografía',
    },
  }).returning();

  console.log('✅ Contrato creado:');
  console.log('   ID:', newContract.id);
  console.log('   Servicio:', newContract.serviceName);
  console.log('   Monto:', newContract.amount);
  console.log('   Estado:', newContract.status);
  console.log('   Fecha de servicio:', newContract.serviceDate);

  console.log('\n🎉 ¡Contrato de prueba creado exitosamente!');
  console.log('   Puedes verlo en: /author-portal/contracts/' + newContract.id);

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
