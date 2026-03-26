// API de Administración - Empresas
// Endpoint: /api/admin/companies
// Función: Gestión de empresas corporativas

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
        return await getCompanies(req, res)
      case 'POST':
        return await createCompany(req, res)
      case 'PUT':
        return await updateCompany(req, res)
      case 'DELETE':
        return await deleteCompany(req, res)
    }
  } catch (error) {
    console.error('Error en API admin/companies:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET - Obtener todas las empresas
async function getCompanies(req, res) {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    category = '',
    verification_status = ''
  } = req.query

  try {
    let query = supabase
      .from('users')
      .select(`
        *,
        company_profiles(*),
        contracts(count)
      `)
      .eq('role', 'company')

    // Filtros
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('company_profiles.industry', category)
    }

    if (verification_status) {
      query = query.eq('company_profiles.verification_status', verification_status)
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: companies, error, count } = await query

    if (error) throw error

    res.status(200).json({
      success: true,
      data: companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error obteniendo empresas:', error)
    res.status(500).json({ error: 'Error obteniendo empresas' })
  }
}

// POST - Crear nueva empresa
async function createCompany(req, res) {
  const {
    email,
    company_name,
    contact_name,
    phone,
    industry,
    description,
    website,
    employees_count,
    annual_revenue
  } = req.body

  try {
    // Crear usuario
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        display_name: company_name,
        role: 'company'
      }
    })

    if (userError) throw userError

    // Crear perfil de empresa
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .insert({
        user_id: user.user.id,
        company_name,
        contact_name,
        phone,
        industry,
        description,
        website,
        employees_count,
        annual_revenue,
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
    console.error('Error creando empresa:', error)
    res.status(500).json({ error: 'Error creando empresa' })
  }
}

// PUT - Actualizar empresa
async function updateCompany(req, res) {
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

    // Actualizar perfil de empresa si existe
    if (updateData.profile) {
      const { data: profile, error: profileError } = await supabase
        .from('company_profiles')
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
    console.error('Error actualizando empresa:', error)
    res.status(500).json({ error: 'Error actualizando empresa' })
  }
}

// DELETE - Eliminar empresa (soft delete)
async function deleteCompany(req, res) {
  const { id } = req.query

  try {
    const { error } = await supabase
      .from('users')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) throw error

    res.status(200).json({
      success: true,
      message: 'Empresa eliminada correctamente'
    })
  } catch (error) {
    console.error('Error eliminando empresa:', error)
    res.status(500).json({ error: 'Error eliminando empresa' })
  }
}
