# 📚 APIs de Administración - Documentación

## 🎯 Propósito
Estas APIs están diseñadas específicamente para el panel de administración y no afectan las funcionalidades existentes de la web y la app.

## 🔐 Seguridad
- Todas las APIs requieren autenticación de administrador
- Usan `SUPABASE_SERVICE_ROLE_KEY` para acceso completo
- Rutas separadas: `/api/admin/*` vs `/api/*`

## 📋 Endpoints Disponibles

### 🎭 **Artistas**
```
GET    /api/admin/artists          - Listar todos los artistas
POST   /api/admin/artists          - Crear nuevo artista
PUT    /api/admin/artists?id=X     - Actualizar artista
DELETE /api/admin/artists?id=X     - Eliminar artista (soft delete)
```

**Query Parameters (GET):**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Buscar por nombre o email
- `category` - Filtrar por categoría
- `verification_status` - pending/verified/rejected
- `status` - active/inactive

### 👥 **Usuarios**
```
GET    /api/admin/users            - Listar todos los usuarios
POST   /api/admin/users            - Crear nuevo usuario
PUT    /api/admin/users?id=X       - Actualizar usuario
DELETE /api/admin/users?id=X       - Eliminar usuario (soft delete)
```

**Query Parameters (GET):**
- `page`, `limit`, `search`
- `role` - client/artist/company/admin
- `status` - active/inactive

### 📊 **Estadísticas**
```
GET    /api/admin/statistics       - Dashboard data
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "artists": 142,
      "contracts": 38,
      "users": 1204,
      "revenue": 248500
    },
    "recentContracts": [...],
    "monthlyGrowth": {...},
    "verificationStats": {...}
  }
}
```

### ✅ **Verificación KYC**
```
GET    /api/admin/verification     - Verificaciones pendientes
POST   /api/admin/verification     - Subir documentos
PUT    /api/admin/verification?id=X - Aprobar/rechazar
```

**PUT Body:**
```json
{
  "status": "approved|rejected",
  "reviewed_by": "admin_user_id",
  "rejection_reason": "Documento ilegible",
  "admin_notes": "Revisado manualmente"
}
```

### 🏢 **Empresas**
```
GET    /api/admin/companies       - Listar empresas
POST   /api/admin/companies       - Crear empresa
PUT    /api/admin/companies?id=X  - Actualizar empresa
DELETE /api/admin/companies?id=X  - Eliminar empresa
```

## 🔧 Estructura de Datos

### Artist Profile
```json
{
  "user_id": "uuid",
  "category": "mariachi|dj|trio|comedia|danza",
  "bio": "Biografía del artista",
  "experience_years": 5,
  "location": "Ciudad, País",
  "profile_image": "url",
  "portfolio_images": ["url1", "url2"],
  "verification_status": "pending|verified|rejected"
}
```

### Company Profile
```json
{
  "user_id": "uuid",
  "company_name": "Empresa S.A.",
  "contact_name": "Juan Pérez",
  "industry": "eventos|corporativo|entretenimiento",
  "description": "Descripción de la empresa",
  "website": "https://empresa.com",
  "employees_count": 50,
  "annual_revenue": 1000000
}
```

## 🚀 Implementación en Admin Panel

### Ejemplo de uso en frontend:
```typescript
// Obtener artistas
const response = await fetch('/api/admin/artists?category=mariachi&verification_status=pending')
const { data } = await response.json()

// Aprobar verificación
await fetch('/api/admin/verification?id=123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'approved',
    reviewed_by: 'admin_id'
  })
})
```

## ⚠️ Notas Importantes
- Estas APIs son **SOLO** para el panel admin
- **NO modifican** las APIs públicas existentes
- Usan **soft delete** para mantener integridad de datos
- Generan **notificaciones automáticas** al cambiar estados
