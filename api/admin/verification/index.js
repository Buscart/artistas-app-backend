// API de Administración - Verificación KYC
// Endpoint: /api/admin/verification
// Función: Gestionar verificación de documentos KYC

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PUT'].includes(req.method)) {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getVerifications(req, res)
      case 'POST':
        return await updateVerification(req, res)
      case 'PUT':
        return await reviewVerification(req, res)
    }
  } catch (error) {
    console.error('Error en API admin/verification:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET - Obtener verificaciones pendientes
async function getVerifications(req, res) {
  const { 
    page = 1, 
    limit = 10, 
    status = 'pending',
    type = 'artist'
  } = req.query

  try {
    let query = supabase
      .from('verification_documents')
      .select(`
        *,
        user:users(display_name, email, role),
        artist_profile:artist_profiles(category)
      `)
      .eq('status', status)

    if (type === 'artist') {
      query = query.eq('document_type', 'artist_kyc')
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: verifications, error, count } = await query

    if (error) throw error

    res.status(200).json({
      success: true,
      data: verifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error obteniendo verificaciones:', error)
    res.status(500).json({ error: 'Error obteniendo verificaciones' })
  }
}

// POST - Subir documentos de verificación
async function updateVerification(req, res) {
  const {
    user_id,
    document_type,
    document_url,
    document_number,
    expiry_date
  } = req.body

  try {
    const { data, error } = await supabase
      .from('verification_documents')
      .insert({
        user_id,
        document_type,
        document_url,
        document_number,
        expiry_date,
        status: 'pending',
        created_at: new Date()
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error subiendo documento:', error)
    res.status(500).json({ error: 'Error subiendo documento' })
  }
}

// PUT - Revisar y aprobar/rechazar verificación
async function reviewVerification(req, res) {
  const { id } = req.query
  const {
    status,
    reviewed_by,
    rejection_reason,
    admin_notes
  } = req.body

  try {
    // Actualizar documento de verificación
    const { data: document, error: docError } = await supabase
      .from('verification_documents')
      .update({
        status,
        reviewed_by,
        rejection_reason,
        admin_notes,
        reviewed_at: new Date()
      })
      .eq('id', id)
      .select()
      .single()

    if (docError) throw docError

    // Si es aprobado, actualizar el perfil del artista
    if (status === 'approved') {
      const { error: profileError } = await supabase
        .from('artist_profiles')
        .update({
          verification_status: 'verified',
          verified_at: new Date()
        })
        .eq('user_id', document.user_id)

      if (profileError) throw profileError

      // Crear notificación
      await supabase
        .from('notifications')
        .insert({
          user_id: document.user_id,
          title: '¡Verificación Aprobada!',
          body: 'Tu cuenta ha sido verificada exitosamente. Ahora puedes acceder a todas las funcionalidades.',
          data: { type: 'verification_approved' }
        })
    } else if (status === 'rejected') {
      // Actualizar perfil como rechazado
      await supabase
        .from('artist_profiles')
        .update({
          verification_status: 'rejected'
        })
        .eq('user_id', document.user_id)

      // Crear notificación
      await supabase
        .from('notifications')
        .insert({
          user_id: document.user_id,
          title: 'Verificación Requerida',
          body: `Tu verificación necesita atención: ${rejection_reason}`,
          data: { type: 'verification_rejected', reason: rejection_reason }
        })
    }

    res.status(200).json({
      success: true,
      data: document,
      message: status === 'approved' 
        ? 'Verificación aprobada correctamente' 
        : 'Verificación rechazada'
    })
  } catch (error) {
    console.error('Error revisando verificación:', error)
    res.status(500).json({ error: 'Error revisando verificación' })
  }
}
