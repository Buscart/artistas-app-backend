import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Starting ticket system migration...');

  const sql = postgres(DATABASE_URL, {
    ssl: 'require',
  });

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', 'add_events_ticket_system.sql');
    console.log('📄 Reading migration file from:', migrationPath);

    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    console.log('⚙️  Executing migration...');
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('   - ticket_types');
    console.log('   - seats');
    console.log('   - purchases');
    console.log('   - purchase_items');
    console.log('   - event_attendees');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
