# Scripts de Seeding - BuscartPro

Este documento explica cómo usar los scripts de seeding para poblar la base de datos con datos de prueba.

## 📋 Scripts Disponibles

### 1. `seed.ts` - Seed Básico
Crea un usuario de prueba (cliente y artista básicos).

```bash
cd backend
npm run db:seed
```

### 2. `seed-artists.ts` - Seed de Artistas
Genera múltiples perfiles de artistas con datos realistas basados en la jerarquía de categorías del sistema.

```bash
cd backend
npm run db:seed:artists
```

## 🎨 ¿Qué genera el script de artistas?

El script `seed-artists.ts` genera **50 perfiles de artistas** (puedes cambiar el número en la variable `NUM_ARTISTS`) con:

### Datos Generados:
- ✅ Nombres y apellidos variados (colombianos)
- ✅ Ciudades de Colombia (Bogotá, Medellín, Cali, etc.)
- ✅ Categorías, Disciplinas, Roles y Especializaciones reales del sistema
- ✅ Años de experiencia (1-15 años)
- ✅ Nivel de experiencia (principiante, intermedio, profesional, experto)
- ✅ Precios por hora realistas basados en experiencia
- ✅ Biografías generadas automáticamente según el rol
- ✅ Nombres artísticos (50% de los artistas)
- ✅ Ratings entre 3.0 y 5.0
- ✅ Estado de verificación (70% verificados)
- ✅ Disponibilidad de viaje (60% disponibles)
- ✅ Imágenes de perfil de Unsplash
- ✅ Redes sociales (Instagram, Facebook)

### Ejemplos de Artistas Generados:
- Cantantes (Pop, Rock, Jazz, Clásico, etc.)
- Músicos (Banda, Solista, Orquesta)
- DJs (Electrónica, Hip-hop, House)
- Fotógrafos (Bodas, Eventos, Producto, Moda)
- Bailarines (Ballet, Contemporáneo, Folclórico, Urbano)
- Actores (Drama, Comedia, Musical)
- Magos (Escenario, Cerca, Ilusionismo)
- Diseñadores (Gráfico, Moda, Interiores)
- Y muchos más según las categorías disponibles en la BD...

## 🔐 Credenciales de Prueba

Todos los usuarios generados tienen:
- **Contraseña:** `password123`
- **Email:** `nombre.apellido.N@ejemplo.com`

Ejemplos:
- `ana.garcia.0@ejemplo.com`
- `carlos.rodriguez.1@ejemplo.com`
- `maria.martinez.2@ejemplo.com`

## 📊 Requisitos Previos

Antes de ejecutar el script de artistas, asegúrate de que:

1. ✅ La base de datos esté creada
2. ✅ Las migraciones estén aplicadas
3. ✅ **La jerarquía de categorías esté poblada** (categorías, disciplinas, roles, especializaciones)

### Verificar que existen categorías:

```sql
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM disciplines;
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM specializations;
```

Si alguna de estas tablas está vacía, primero necesitas ejecutar los scripts SQL de población:
- `populate_artist_hierarchy.sql`
- `populate_artist_hierarchy_part2.sql`

## 🚀 Flujo Completo de Setup

```bash
# 1. Navegar al directorio del backend
cd backend

# 2. Instalar dependencias (si no lo has hecho)
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos

# 4. Inicializar la base de datos (si es necesario)
npm run db:init

# 5. Aplicar migraciones
npm run db:migrate

# 6. Poblar jerarquía de categorías (ejecutar SQL manualmente o con script)
# Esto debe hacerse antes del seed de artistas

# 7. Ejecutar seed de artistas
npm run db:seed:artists

# 8. (Opcional) Seed básico
npm run db:seed
```

## 🔧 Personalización

### Cambiar el número de artistas generados:

Edita el archivo `scripts/seed-artists.ts` y cambia:

```typescript
const NUM_ARTISTS = 50; // Cambia este número
```

### Añadir más nombres, apellidos o ciudades:

Edita los arrays `FIRST_NAMES`, `LAST_NAMES`, y `CITIES` en el mismo archivo.

### Modificar rangos de precios:

Edita la función `generatePrice()` para ajustar los precios base y multiplicadores.

## ⚠️ Notas Importantes

- El script **omite automáticamente** perfiles duplicados (basado en email único)
- Cada ejecución genera nuevos perfiles con emails únicos usando timestamp
- Los perfiles generados son **realistas** pero ficticios para pruebas
- Se recomienda ejecutar esto solo en **entornos de desarrollo/testing**
- Para producción, usa datos reales ingresados por usuarios

## 🐛 Resolución de Problemas

### Error: "No se encontraron roles en la base de datos"
**Solución:** Ejecuta primero los scripts SQL de población de categorías.

### Error: "Unique constraint violation"
**Solución:** Normal si ejecutas el script varias veces. Los duplicados se omiten automáticamente.

### Error de conexión a la base de datos
**Solución:** Verifica tus credenciales en el archivo `.env` y que la base de datos esté corriendo.

## 📝 Logs

El script muestra información detallada durante la ejecución:
- ✅ Número de categorías, disciplinas, roles encontrados
- ✅ Progreso cada 10 artistas
- ✅ Resumen final con artistas creados y omitidos

## 🎯 Resultado Esperado

Después de ejecutar exitosamente `npm run db:seed:artists`, deberías tener:

- 50 usuarios con `userType = 'artist'`
- 50 perfiles en la tabla `artists`
- Distribución variada de categorías, disciplinas y roles
- Perfiles listos para probar funcionalidades de búsqueda y filtrado

¡Disfruta probando tu plataforma con datos realistas! 🎉
