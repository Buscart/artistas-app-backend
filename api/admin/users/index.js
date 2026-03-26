// API de Administración - Usuarios
// Endpoint: /api/admin/users
// Función: Gestión completa de usuarios para panel admin

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getUsers(req, res)
      case 'POST':
        return await createUser(req, res)
      case 'PUT':
        return await updateUser(req, res)
      case 'DELETE':
        return await deleteUser(req, res)
    }
  } catch (error) {
    console.error('Error en API admin/users:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET - Obtener todos los usuarios
async function getUsers(req, res) {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    role = '',
    status = 'active'
  } = req.query

  try {
    let query = supabase
      .from('users')
      .select(`
        *,
        artist_profiles(*),
        client_profiles(*)
      `)
      .eq('status', status)

    // Filtros
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: users, error, count } = await query

    if (error) throw error

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    res.status(500).json({ error: 'Error obteniendo usuarios' })
  }
}

// POST - Crear nuevo usuario
async function createUser(req, res) {
  const {
    email,
    display_name,
    phone,
    role,
    password = Math.random().toString(36).slice(-8)
  } = req.body

  try {
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name,
        role
      }
    })

    if (error) throw error

    res.status(201).json({
      success: true,
      data: user.user
    })
  } catch (error) {
    console.error('Error creando usuario:', error)
    res.status(500).json({ error: 'Error creando usuario' })
  }
}

// PUT - Actualizar usuario
async function updateUser(req, res) {
  const { id } = req.query
  const updateData = req.body

  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    res.status(500).json({ error: 'Error actualizando usuario' })
  }
}

// DELETE - Eliminar usuario (soft delete)
async function deleteUser(req, res) {
  const { id } = req.query

  try {
    const { error } = await supabase
      .from('users')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) throw error

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    res.status(500).json({ error: 'Error eliminando usuario' })
  }
}
