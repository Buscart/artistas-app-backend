# BuscartPro Backend

Este es el backend de la aplicación BuscartPro, construido con Node.js, Express, TypeScript y PostgreSQL con Drizzle ORM.

## Sistema de Guardado de Contenido

### 1. Favoritos

Los favoritos están diseñados para guardar referencias a perfiles de artistas, eventos y lugares (venues).

**Características principales:**
- Tipos soportados: `artist`, `event`, `venue`
- Almacenamiento en la tabla `favorites`
- Rutas bajo `/api/favorites`

**Ejemplo de uso:**
```typescript
// Agregar a favoritos
POST /api/favorites
{
  "type": "artist", // o "event", "venue"
  "id": 123
}

// Obtener favoritos de un usuario
GET /api/favorites

// Eliminar de favoritos
DELETE /api/favorites/:id
```

### 2. Elementos Guardados (Saved Items)

Los elementos guardados están diseñados específicamente para guardar posts del blog.

**Características principales:**
- Tabla dedicada: `saved_items`
- Rutas bajo `/api/saved-items`
- Incluye notas opcionales para cada elemento guardado

**Ejemplo de uso:**
```typescript
// Guardar un post
POST /api/saved-items
{
  "postId": 456,
  "notes": "Artículo interesante sobre música"
}

// Obtener elementos guardados
GET /api/saved-items

// Actualizar notas
PATCH /api/saved-items/:id
{
  "notes": "Actualización de notas"
}

// Eliminar elemento guardado
DELETE /api/saved-items/:id
```

## Estructura de la Base de Datos

### Tabla `favorites`
- `id`: Identificador único
- `userId`: ID del usuario que guardó el favorito
- `type`: Tipo de favorito ('artist', 'event', 'venue')
- `artistId`: ID del artista (si aplica)
- `eventId`: ID del evento (si aplica)
- `venueId`: ID del lugar (si aplica)
- `createdAt`: Fecha de creación

### Tabla `saved_items`
- `id`: Identificador único
- `userId`: ID del usuario que guardó el elemento
- `postId`: ID del post guardado
- `notes`: Notas opcionales
- `savedAt`: Fecha de guardado

## Consideraciones de Implementación

1. **Separación de responsabilidades**:
   - Los favoritos son para perfiles (artistas, eventos, lugares)
   - Los elementos guardados son específicamente para contenido del blog

2. **Rendimiento**:
   - Índices en campos de búsqueda frecuente (userId, type, postId)
   - Consultas optimizadas para carga rápida

3. **Seguridad**:
   - Todas las rutas requieren autenticación
   - Los usuarios solo pueden acceder a sus propios favoritos y elementos guardados
