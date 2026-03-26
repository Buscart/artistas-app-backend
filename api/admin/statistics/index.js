// API de Administración - Estadísticas
// Endpoint: /api/admin/statistics
// Función: Proporcionar datos para el dashboard admin

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    // Ejecutar todas las consultas en paralelo
    const [
      artistsCount,
      contractsCount,
      usersCount,
      totalRevenue,
      recentContracts,
      monthlyGrowth,
      verificationStats
    ] = await Promise.all([
      getArtistsCount(),
      getContractsCount(),
      getUsersCount(),
      getTotalRevenue(),
      getRecentContracts(),
      getMonthlyGrowth(),
      getVerificationStats()
    ])

    res.status(200).json({
      success: true,
      data: {
        stats: {
          artists: artistsCount,
          contracts: contractsCount,
          users: usersCount,
          revenue: totalRevenue
        },
        recentContracts,
        monthlyGrowth,
        verificationStats
      }
    })
  } catch (error) {
    console.error('Error en API admin/statistics:', error)
    res.status(500).json({ error: 'Error obteniendo estadísticas' })
  }
}

// Contar artistas activos
async function getArtistsCount() {
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'artist')
    .eq('status', 'active')

  return count || 0
}

// Contar contratos por estado
async function getContractsCount() {
  const { data } = await supabase
    .from('contracts')
    .select('status')
    .eq('status', 'active')

  return data?.length || 0
}

// Contar usuarios activos
async function getUsersCount() {
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  return count || 0
}

// Calcular ingresos totales
async function getTotalRevenue() {
  const { data } = await supabase
    .from('contracts')
    .select('price')
    .eq('status', 'completed')

  const total = data?.reduce((sum, contract) => sum + parseFloat(contract.price), 0) || 0
  return total
}

// Obtener contratos recientes
async function getRecentContracts() {
  const { data } = await supabase
    .from('contracts')
    .select(`
      *,
      client:users!contracts_client_id_fkey(display_name),
      artist:users!contracts_artist_id_fkey(display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return data || []
}

// Crecimiento mensual
async function getMonthlyGrowth() {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  // Mes actual
  const { count: currentMonthCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(currentYear, currentMonth, 1))
    .lt('created_at', new Date(currentYear, currentMonth + 1, 1))

  // Mes anterior
  const { count: lastMonthCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(currentYear, currentMonth - 1, 1))
    .lt('created_at', new Date(currentYear, currentMonth, 1))

  const growth = lastMonthCount > 0 
    ? ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100 
    : 0

  return {
    currentMonth: currentMonthCount || 0,
    lastMonth: lastMonthCount || 0,
    growthPercentage: growth.toFixed(1)
  }
}

// Estadísticas de verificación
async function getVerificationStats() {
  const { data } = await supabase
    .from('artist_profiles')
    .select('verification_status')

  const stats = {
    pending: 0,
    verified: 0,
    rejected: 0,
    total: data?.length || 0
  }

  data?.forEach(profile => {
    stats[profile.verification_status]++
  })

  return stats
}
