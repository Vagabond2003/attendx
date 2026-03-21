import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getClasses, addClass, updateClass, deleteClass
} from '../lib/db'

export function useClasses() {
  const { user } = useAuth()
  const [classes, setClasses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchClasses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await getClasses(user.id)
    if (error) {
      setError(error.message)
    } else {
      setClasses(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleAdd = async (classData) => {
    if (!user) return
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const tempClass = {
      ...classData,
      id: tempId,
      user_id: user.id,
      total_classes: classData.total_classes || 0,
      attended_classes: 0
    }
    setClasses(prev => [...prev, tempClass])

    const { data, error } = await addClass(user.id, classData)
    if (error) {
      // Rollback on error
      setClasses(prev => prev.filter(c => c.id !== tempId))
      setError(error.message)
    } else {
      // Replace temp with real data
      setClasses(prev => prev.map(c =>
        c.id === tempId ? (Array.isArray(data) ? data[0] : data) : c
      ))
    }
  }

  const handleUpdate = async (classId, updates) => {
    if (!user) return
    // Optimistic update
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, ...updates } : c
    ))
    const { error } = await updateClass(classId, updates)
    if (error) {
      setError(error.message)
      fetchClasses() // Refetch to restore correct state
    }
  }

  const handleDelete = async (classId) => {
    if (!user) return
    // Optimistic update
    setClasses(prev => prev.filter(c => c.id !== classId))
    const { error } = await deleteClass(classId)
    if (error) {
      setError(error.message)
      fetchClasses() // Refetch to restore correct state
    }
  }

  return {
    classes, loading, error,
    handleAdd, handleUpdate, handleDelete,
    refetch: fetchClasses
  }
}
