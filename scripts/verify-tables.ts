import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function verifyTables() {
  console.log('🔍 Verifying ticket system tables...\n');

  const sql = postgres(DATABASE_URL, { ssl: 'require' });

  try {
    const tables = ['ticket_types', 'seats', 'purchases', 'purchase_items', 'event_attendees'];

    for (const table of tables) {
      const result = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${table}
        ORDER BY ordinal_position
      `;

      console.log(`✅ Table: ${table} (${result.length} columns)`);
      result.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      console.log('');
    }

    // Check indexes
    console.log('📑 Checking indexes...');
    const indexes = await sql`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE tablename IN ('ticket_types', 'seats', 'purchases', 'purchase_items', 'event_attendees')
      ORDER BY tablename, indexname
    `;

    indexes.forEach((idx: any) => {
      console.log(`   ${idx.tablename}.${idx.indexname}`);
    });

    console.log('\n✨ All tables verified successfully!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyTables();
