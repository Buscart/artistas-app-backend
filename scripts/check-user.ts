import { db } from '../src/db';
import { users } from '../src/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkUser() {
  try {
    console.log('🔍 Buscando usuario cliente@ejemplo.com...');
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'cliente@ejemplo.com'))
      .limit(1);

    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        hasPassword: !!user.password
      });
    } else {
      console.log('❌ Usuario no encontrado');
    }
  } catch (error) {
    console.error('❌ Error al buscar el usuario:', error);
  } finally {
    process.exit(0);
  }
}

checkUser();
