require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq, and } = require('drizzle-orm');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL no está definida');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function deleteCompanies() {
  try {
    // Ver todas las empresas del usuario
    const result = await client`
      SELECT id, company_name, created_at, is_primary
      FROM companies
      WHERE user_id = 'aJKaLH86nfOfMDCFpIBYkal6ZE22'
      ORDER BY created_at ASC
    `;

    console.log('\n📋 Empresas encontradas:');
    result.forEach((company, index) => {
      console.log(`${index + 1}. ID: ${company.id} - ${company.company_name} - Creada: ${company.created_at} - Principal: ${company.is_primary}`);
    });

    if (result.length === 3) {
      // Eliminar las dos primeras (las más antiguas), mantener la última
      const toDelete = result.slice(0, 2);

      console.log('\n🗑️  Eliminando empresas duplicadas...');
      for (const company of toDelete) {
        await client`DELETE FROM companies WHERE id = ${company.id}`;
        console.log(`✅ Eliminada empresa ID ${company.id} - ${company.company_name}`);
      }

      console.log(`\n✅ Se mantiene la empresa ID ${result[2].id} - ${result[2].company_name}`);
    }

    await client.end();
    console.log('\n✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

deleteCompanies();
