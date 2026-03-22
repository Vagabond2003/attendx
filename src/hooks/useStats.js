import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getAttendanceStats, getClasses } from '../lib/db'

export function useStats() {
  const { user } = useAuth()
  const [statsData, setStatsData] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: classData } = await getClasses(user.id)
    const { data: statsRaw, error } = await getAttendanceStats(user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const classes = classData || []
    const merged = (statsRaw || []).map(s => {
      const cls = classes.find(c => c.id === s.class_id)
      return {
        ...s,
        name: s.class_name || s.name || cls?.name || 'Unknown',
        code: cls?.code || '',
        color: cls?.color || '#4648d4',
        minimum: s.minimum_attendance || cls?.minimum_attendance || 75,
        total: s.total || 0,
        present: s.present || 0,
        absent: s.absent || 0,
        late: s.late || 0,
      }
    })

    setStatsData(merged)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const calcPct = (s) => {
    if (!s.total || s.total === 0) return 0
    return Math.round(((s.present + s.late * 0.5) / s.total) * 100)
  }

  const classesNeeded = (s) => {
    const pct = calcPct(s)
    if (pct >= s.minimum) return null
    if (s.minimum >= 100) return null
    const needed = Math.ceil(
      (s.minimum * s.total - (s.present + s.late * 0.5) * 100) /
      (100 - s.minimum)
    )
    return Math.max(0, needed)
  }

  const canMiss = (s) => {
    const pct = calcPct(s)
    if (pct < s.minimum) return null
    const maxAbsent = Math.floor(s.total * (1 - s.minimum / 100))
    return Math.max(0, maxAbsent - s.absent)
  }

  const totalClasses = statsData.reduce((a, s) => a + s.total, 0)
  const totalPresent = statsData.reduce((a, s) => a + s.present, 0)
  const totalAbsent  = statsData.reduce((a, s) => a + s.absent, 0)
  const overallPct   = totalClasses > 0
    ? Math.round(
        statsData.reduce((a, s) => a + s.present + s.late * 0.5, 0)
        / totalClasses * 100
      )
    : 0

  const barData = statsData.map(s => ({
    name: s.name.split(' ')[0],
    fullName: s.name,
    pct: calcPct(s),
    color: calcPct(s) >= 75 ? '#14a33c'
           : calcPct(s) >= 65 ? '#c96e0a'
           : '#ba1a1a'
  }))

  return {
    statsData, loading, error,
    calcPct, classesNeeded, canMiss,
    totalClasses, totalPresent, totalAbsent,
    overallPct, barData, refetch: fetchStats
  }
}
