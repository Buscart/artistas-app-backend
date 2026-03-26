// API de Administración - Artistas
// Endpoint: /api/admin/artists
// Función: Gestión completa de artistas para panel admin

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Solo permitir métodos GET, POST, PUT, DELETE
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getArtists(req, res)
      case 'POST':
        return await createArtist(req, res)
      case 'PUT':
        return await updateArtist(req, res)
      case 'DELETE':
        return await deleteArtist(req, res)
    }
  } catch (error) {
    console.error('Error en API admin/artists:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET - Obtener todos los artistas con filtros
async function getArtists(req, res) {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    category = '',
    verification_status = '',
    status = 'active'
  } = req.query

  try {
    let query = supabase
      .from('users')
      .select(`
        *,
        artist_profiles(*),
        contracts(count),
        reviews(rating)
      `)
      .eq('role', 'artist')
      .eq('status', status)

    // Filtros
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('artist_profiles.category', category)
    }

    if (verification_status) {
      query = query.eq('verification_status', verification_status)
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: artists, error, count } = await query

    if (error) throw error

    res.status(200).json({
      success: true,
      data: artists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error obteniendo artistas:', error)
    res.status(500).json({ error: 'Error obteniendo artistas' })
  }
}

// POST - Crear nuevo artista
async function createArtist(req, res) {
  const {
    email,
    display_name,
    phone,
    category,
    bio,
    experience_years,
    location,
    profile_image
  } = req.body

  try {
    // Crear usuario
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        display_name,
        role: 'artist'
      }
    })

    if (userError) throw userError

    // Crear perfil de artista
    const { data: profile, error: profileError } = await supabase
      .from('artist_profiles')
      .insert({
        user_id: user.user.id,
        category,
        bio,
        experience_years,
        location,
        profile_image,
        verification_status: 'pending'
      })
      .select()
      .single()

    if (profileError) throw profileError

    res.status(201).json({
      success: true,
      data: {
        user: user.user,
        profile
      }
    })
  } catch (error) {
    console.error('Error creando artista:', error)
    res.status(500).json({ error: 'Error creando artista' })
  }
}

// PUT - Actualizar artista
async function updateArtist(req, res) {
  const { id } = req.query
  const updateData = req.body

  try {
    // Actualizar usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .update(updateData.user || {})
      .eq('id', id)
      .select()
      .single()

    if (userError) throw userError

    // Actualizar perfil de artista si existe
    if (updateData.profile) {
      const { data: profile, error: profileError } = await supabase
        .from('artist_profiles')
        .update(updateData.profile)
        .eq('user_id', id)
        .select()
        .single()

      if (profileError) throw profileError

      res.status(200).json({
        success: true,
        data: { user, profile }
      })
    } else {
      res.status(200).json({
        success: true,
        data: { user }
      })
    }
  } catch (error) {
    console.error('Error actualizando artista:', error)
    res.status(500).json({ error: 'Error actualizando artista' })
  }
}

// DELETE - Eliminar artista (soft delete)
async function deleteArtist(req, res) {
  const { id } = req.query

  try {
    // Soft delete - cambiar status a inactive
    const { error } = await supabase
      .from('users')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) throw error

    res.status(200).json({
      success: true,
      message: 'Artista eliminado correctamente'
    })
  } catch (error) {
    console.error('Error eliminando artista:', error)
    res.status(500).json({ error: 'Error eliminando artista' })
  }
}
