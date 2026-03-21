import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { format } from 'date-fns'
import {
  getClasses,
  getAttendanceStats,
  getAttendanceByDateRange
} from '../lib/db'

export function useDashboard() {
  const { user } = useAuth()
  const [classes, setClasses]           = useState([])
  const [stats, setStats]               = useState([])
  const [recentActivity, setRecent]     = useState([])
  const [loading, setLoading]           = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Fetch classes
    const { data: classData } = await getClasses(user.id)
    const allClasses = classData || []
    setClasses(allClasses)

    // Fetch attendance stats
    const { data: statsData } = await getAttendanceStats(user.id)
    setStats(statsData || [])

    // Fetch recent attendance (last 7 days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    const { data: recentData } = await getAttendanceByDateRange(
      user.id,
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    )

    if (recentData) {
      // Join with class names and format for display
      const activity = recentData
        .slice(0, 5)
        .map(record => {
          const cls = allClasses.find(c => c.id === record.class_id)
          const statusMap = {
            'present': { label: 'Marked Present', dot: 'p' },
            'absent':  { label: 'Marked Absent',  dot: 'a' },
            'late':    { label: 'Marked Late',     dot: 'l' },
          }
          const mapped = statusMap[record.status] || {
            label: 'Marked', dot: 'p'
          }
          
          // Format relative date safely assuming DB YYYY-MM-DD
          const recordDate = new Date(record.date + 'T00:00:00')
          const today = new Date()
          const diffDays = Math.floor(
            (today - recordDate) / (1000*60*60*24)
          )
          const relDate = diffDays === 0 ? 'Today'
            : diffDays === 1 ? 'Yesterday'
            : `${diffDays} days ago`
          
          return {
            id: record.id,
            action: mapped.label,
            subject: cls?.name || 'Unknown',
            meta: `${relDate}`,
            time: relDate,
            dot: mapped.dot
          }
        })
      setRecent(activity)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Computed values from stats
  const overallStats = {
    totalClasses: stats.reduce((a, s) => a + (s.total || 0), 0),
    totalPresent: stats.reduce((a, s) => a + (s.present || 0), 0),
    totalAbsent:  stats.reduce((a, s) => a + (s.absent || 0), 0),
    overallPct: stats.length > 0
      ? Math.round(
          stats.reduce((a, s) => a + (s.present || 0) + (s.late || 0) * 0.5, 0) /
          Math.max(stats.reduce((a, s) => a + (s.total || 0), 0), 1) * 100
        )
      : 0
  }

  // At-risk subjects
  const atRiskClasses = stats.filter(s => {
    const pct = Math.round(
      ((s.present || 0) + (s.late || 0) * 0.5) /
      Math.max(s.total || 1, 1) * 100
    )
    const minimum = s.minimum_attendance || 75
    return pct < minimum
  }).map(s => {
    const pct = Math.round(
      ((s.present || 0) + (s.late || 0) * 0.5) /
      Math.max(s.total || 1, 1) * 100
    )
    const minimum = s.minimum_attendance || 75
    const needed = Math.ceil(
      (minimum * Math.max(s.total || 1, 1) -
      ((s.present || 0) + (s.late || 0) * 0.5) * 100) /
      (100 - minimum)
    )
    return {
      ...s,
      pct,
      needed: Math.max(0, needed)
    }
  })

  // Today's classes
  const todayName = format(new Date(), 'EEEE')
  const todaysClasses = classes.filter(cls => {
    if (!cls.schedule) return false
    if (Array.isArray(cls.schedule)) {
      return cls.schedule.some(s =>
        (s.day || s) === todayName
      )
    }
    return false
  })

  // Get display name from user metadata
  const displayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'there'
  
  const firstName = displayName.split(' ')[0]

  return {
    classes, stats, recentActivity,
    loading, overallStats, atRiskClasses,
    todaysClasses, firstName, refetch: fetchAll
  }
}
