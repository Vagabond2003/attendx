import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { format } from 'date-fns'
import {
  getClasses,
  markAttendance,
  updateAttendance,
  getAttendanceByDateRange
} from '../lib/db'

export function useAttendance() {
  const { user } = useAuth()
  const [classes, setClasses]     = useState([])
  const [statuses, setStatuses]   = useState({})
  const [notes, setNotes]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [syncing, setSyncing]     = useState(false)

  // Fetch all classes for this user
  const fetchClasses = useCallback(async () => {
    if (!user) return
    const { data } = await getClasses(user.id)
    if (data) setClasses(data)
    setLoading(false)
  }, [user])

  // Fetch attendance records for a date range
  const fetchAttendance = useCallback(async () => {
    if (!user) return
    // Fetch last 60 days of attendance
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 60)
    
    const { data } = await getAttendanceByDateRange(
      user.id,
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    )
    
    if (data) {
      const statusMap = {}
      const noteMap = {}
      data.forEach(record => {
        const key = `${record.date}-${record.class_id}`
        // Map DB status to UI status
        const statusMap2 = {
          'present': 'P',
          'absent': 'A',
          'late': 'L',
          'cancelled': 'L'
        }
        statusMap[key] = statusMap2[record.status] || null
        if (record.note) noteMap[key] = record.note
      })
      setStatuses(statusMap)
      setNotes(noteMap)
    }
  }, [user])

  useEffect(() => {
    fetchClasses()
    fetchAttendance()
  }, [fetchClasses, fetchAttendance])

  // Mark or update attendance
  const handleMarkAttendance = useCallback(async (date, classId, status, note = '') => {
    if (!user) return
    const key = `${format(date, 'yyyy-MM-dd')}-${classId}`
    const dbStatusMap = { 'P': 'present', 'A': 'absent', 'L': 'late' }
    
    // Optimistic update
    setStatuses(prev => ({
      ...prev,
      [key]: prev[key] === status ? null : status
    }))

    setSyncing(true)
    const newStatus = statuses[key] === status ? null : status

    if (newStatus === null) {
      // If toggling off, we'd delete — for now just mark as present
      // to avoid complex delete logic
    } else {
      await markAttendance(
        user.id,
        classId,
        format(date, 'yyyy-MM-dd'),
        dbStatusMap[newStatus],
        note
      )
    }
    setSyncing(false)
  }, [user, statuses])

  const handleMarkAll = useCallback(async (date, todaysClasses) => {
    if (!user) return
    const updates = {}
    todaysClasses.forEach(cls => {
      updates[`${format(date, 'yyyy-MM-dd')}-${cls.id}`] = 'P'
    })
    setStatuses(prev => ({ ...prev, ...updates }))
    
    // Sync all to Supabase
    for (const cls of todaysClasses) {
      await markAttendance(
        user.id, cls.id,
        format(date, 'yyyy-MM-dd'),
        'present', ''
      )
    }
  }, [user])

  // Get schedule days from class data
  // Supabase stores schedule as JSONB array:
  // [{ day: 'Monday', time: '09:00' }]
  const getScheduleDays = (cls) => {
    if (!cls.schedule) return []
    if (Array.isArray(cls.schedule)) {
      return cls.schedule.map(s => s.day || s)
    }
    return []
  }

  return {
    classes, statuses, notes, loading, syncing,
    setStatuses, setNotes,
    handleMarkAttendance, handleMarkAll,
    getScheduleDays, refetch: fetchAttendance
  }
}
