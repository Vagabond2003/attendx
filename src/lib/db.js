import { supabase } from './supabaseClient';
import { format } from 'date-fns';

/**
 * Executes a Supabase query with retry logic to handle transient network errors.
 * @param {Function} fn - Async function returning { data, error }
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<any>} The result of the query
 */
async function queryWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      if (result.error && result.error.message.includes('FetchError')) {
        throw result.error;
      }
      return result;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// --------------------------------------------------------------------------------
// PART 1: AUTH FUNCTIONS
// --------------------------------------------------------------------------------

/**
 * Creates a new user with email and password.
 * @param {string} email - User's email
 * @param {string} password - User's password (min 6 characters)
 * @param {string} fullName - User's full name
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function signUpWithEmail(email, password, fullName) {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { success: false, data: null, error: 'Invalid email format' };
    if (password.length < 6) return { success: false, data: null, error: 'Password too weak' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) {
      if (error.message.includes('already registered')) return { success: false, data: null, error: 'Email already registered' };
      console.error('signUpWithEmail error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data: data.user, error: null };
  } catch (err) {
    console.error('Unexpected error in signUpWithEmail:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Logs in a user with email and password.
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login')) {
        console.log('Login failed for credentials:', { email, password: '***' });
        return { success: false, data: null, error: 'Invalid login credentials' };
      }
      console.error('signInWithEmail error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data: data.user, error: null };
  } catch (err) {
    console.error('Unexpected error in signInWithEmail:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Redirects to Google OAuth login.
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      if (error.message.includes('not configured')) return { success: false, data: null, error: 'OAuth not configured. Verify Supabase dashboard.' };
      console.error('signInWithGoogle error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Unexpected error in signInWithGoogle:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Logs out the current user.
 * @returns {Promise<{success: boolean, data: null, error: null}>}
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
    return { success: true, data: null, error: null };
  } catch (err) {
    console.error('Unexpected error in signOut:', err);
    return { success: true, data: null, error: null }; // Always succeeds as requested
  }
}

/**
 * Returns the currently authenticated user or null.
 * @returns {Promise<{success: boolean, data: object|null, error: null}>}
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return { success: true, data: user, error: null };
  } catch (err) {
    // Returning null if not logged in is correct behavior
    return { success: true, data: null, error: null };
  }
}

/**
 * Listens to authentication state changes.
 * @param {Function} callback - Callback returning the user object
 * @returns {Function|{success: boolean, data: null, error: string}} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (typeof callback !== 'function') {
    console.error('onAuthStateChange error: callback is not a function');
    return { success: false, data: null, error: 'Callback must be a function' };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  return () => subscription.unsubscribe();
}

// --------------------------------------------------------------------------------
// PART 2: CLASS FUNCTIONS
// --------------------------------------------------------------------------------

/**
 * Fetches all classes for a specified user.
 * @param {string} userId - Auth user ID
 * @returns {Promise<{success: boolean, data: array, error: string|null}>}
 */
export async function getClasses(userId) {
  try {
    if (!userId) return { success: false, data: [], error: 'userId is required' };
    
    const { data, error } = await queryWithRetry(() => supabase.from('classes').select('*').eq('user_id', userId).order('created_at', { ascending: true }));
    if (error) {
      console.error('getClasses error:', error);
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getClasses:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Creates a new class for the user.
 * @param {string} userId - Auth user ID
 * @param {object} classData - { name, code, teacher, total_classes, minimum_attendance, color }
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function addClass(userId, classData) {
  try {
    if (!userId) return { success: false, data: null, error: 'userId is required' };
    if (!classData || !classData.name) return { success: false, data: null, error: 'Class name is required' };
    if (classData.total_classes !== undefined && classData.total_classes <= 0) return { success: false, data: null, error: 'Total classes must be > 0' };

    const { data, error } = await supabase.from('classes').insert([{
      user_id: userId,
      name: classData.name,
      code: classData.code || null,
      teacher: classData.teacher || null,
      total_classes: classData.total_classes || 0,
      minimum_attendance: classData.minimum_attendance || 75,
      color: classData.color || '#6366f1',
      schedule: classData.schedule || []
    }]).select().single();

    if (error) {
      console.error('addClass error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Unexpected error in addClass:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Fetches a single class by ID.
 * @param {string} classId - Class UUID
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function getClassById(classId) {
  try {
    if (!classId) return { success: false, data: null, error: 'classId is required' };
    const { data, error } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (error) {
      if (error.code === 'PGRST116') return { success: true, data: null, error: null }; // Not found (0 rows)
      console.error('getClassById error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Unexpected error in getClassById:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Updates an existing class.
 * @param {string} classId - Class UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function updateClass(classId, updates) {
  try {
    const existing = await getClassById(classId);
    if (!existing.success || !existing.data) return { success: false, data: null, error: 'Class not found' };

    const { data, error } = await supabase.from('classes').update(updates).eq('id', classId).select().single();
    if (error) {
      console.error('updateClass error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Unexpected error in updateClass:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Deletes a class and all associated records.
 * @param {string} classId - Class UUID
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteClass(classId) {
  try {
    const existing = await getClassById(classId);
    if (!existing.success || !existing.data) return { success: false, data: null, error: 'Class not found' };

    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) {
      console.error('deleteClass error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data: null, error: null };
  } catch (err) {
    console.error('Unexpected error in deleteClass:', err);
    return { success: false, data: null, error: err.message };
  }
}

// --------------------------------------------------------------------------------
// PART 3: ATTENDANCE FUNCTIONS
// --------------------------------------------------------------------------------

/**
 * Fetches attendance records for a class.
 * @param {string} classId - Class UUID
 * @returns {Promise<{success: boolean, data: array, error: string|null}>}
 */
export async function getAttendanceByClass(classId) {
  try {
    if (!classId) return { success: false, data: [], error: 'classId is required' };
    const { data, error } = await queryWithRetry(() => supabase.from('attendance_records').select('*').eq('class_id', classId).order('date', { ascending: false }));
    if (error) {
      console.error('getAttendanceByClass error:', error);
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getAttendanceByClass:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Fetches attendance records for a specific date.
 * @param {string} userId - User ID
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {Promise<{success: boolean, data: array, error: string|null}>}
 */
export async function getAttendanceByDate(userId, date) {
  try {
    if (!userId) return { success: false, data: [], error: 'userId is required' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, data: [], error: 'Invalid date format' };

    const { data, error } = await queryWithRetry(() => supabase.from('attendance_records').select('*').eq('user_id', userId).eq('date', date));
    if (error) {
      console.error('getAttendanceByDate error:', error);
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getAttendanceByDate:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Fetches attendance records for a date range.
 * @param {string} userId - User ID
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate - 'YYYY-MM-DD'
 * @returns {Promise<{success: boolean, data: array, error: string|null}>}
 */
export async function getAttendanceByDateRange(userId, startDate, endDate) {
  try {
    if (!userId) return { success: false, data: [], error: 'userId is required' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { success: false, data: [], error: 'Invalid date format' };
    if (startDate > endDate) return { success: false, data: [], error: 'Invalid date range: startDate must be before endDate' };

    const { data, error } = await queryWithRetry(() => supabase.from('attendance_records')
      .select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate).order('date', { ascending: true }));
      
    if (error) {
      console.error('getAttendanceByDateRange error:', error);
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getAttendanceByDateRange:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Marks attendance or updates if exists.
 * @param {string} userId - User ID
 * @param {string} classId - Class UUID
 * @param {string} date - 'YYYY-MM-DD'
 * @param {string} status - 'present', 'absent', or 'cancelled'
 * @param {string} note - Optional note
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function markAttendance(userId, classId, date, status, note = '') {
  try {
    const validStatuses = ['present', 'absent', 'cancelled'];
    if (!validStatuses.includes(status)) return { success: false, data: null, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
    
    const cls = await getClassById(classId);
    if (!cls.success || !cls.data) return { success: false, data: null, error: 'Class not found' };

    const existingRes = await getAttendanceByClass(classId);
    const existingRecord = existingRes.data?.find(r => r.date === date);

    if (existingRecord) {
      return await updateAttendance(existingRecord.id, status, note);
    }

    const { data, error } = await supabase.from('attendance_records').insert([{
      user_id: userId,
      class_id: classId,
      date,
      status,
      note
    }]).select().single();

    if (error) {
      console.error('markAttendance error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Unexpected error in markAttendance:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Updates an attendance record.
 * @param {string} recordId - Record UUID
 * @param {string} status - 'present', 'absent', or 'cancelled'
 * @param {string} note - Optional note
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function updateAttendance(recordId, status, note) {
  try {
    const validStatuses = ['present', 'absent', 'cancelled'];
    if (status && !validStatuses.includes(status)) return { success: false, data: null, error: 'Invalid status' };

    const { data: record, error: findError } = await supabase.from('attendance_records').select('id').eq('id', recordId).single();
    if (findError) return { success: false, data: null, error: 'Record not found' };

    const updates = { status };
    if (note !== undefined) updates.note = note;

    const { data, error } = await supabase.from('attendance_records').update(updates).eq('id', recordId).select().single();
    if (error) {
      console.error('updateAttendance error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Unexpected error in updateAttendance:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Deletes an attendance record.
 * @param {string} recordId - Record UUID
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteAttendance(recordId) {
  try {
    const { data: record, error: findError } = await supabase.from('attendance_records').select('id').eq('id', recordId).single();
    if (findError) return { success: false, data: null, error: 'Record not found' };

    const { error } = await supabase.from('attendance_records').delete().eq('id', recordId);
    if (error) {
      console.error('deleteAttendance error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data: null, error: null };
  } catch (err) {
    console.error('Unexpected error in deleteAttendance:', err);
    return { success: false, data: null, error: err.message };
  }
}

// --------------------------------------------------------------------------------
// PART 4: STUDY SESSION FUNCTIONS
// --------------------------------------------------------------------------------

/**
 * Fetches all study sessions for a user.
 * @param {string} userId - Auth user ID
 * @returns {Promise<{success: boolean, data: array, error: string|null}>}
 */
export async function getStudySessions(userId) {
  try {
    if (!userId) return { success: false, data: [], error: 'userId is required' };
    const { data, error } = await queryWithRetry(() => supabase.from('study_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }));
    if (error) {
      console.error('getStudySessions error:', error);
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getStudySessions:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Fetches all study sessions for a specific class.
 * @param {string} classId - Class UUID
 * @returns {Promise<{success: boolean, data: array, error: string|null}>}
 */
export async function getStudySessionsByClass(classId) {
  try {
    if (!classId) return { success: false, data: [], error: 'classId is required' };
    const { data, error } = await queryWithRetry(() => supabase.from('study_sessions').select('*').eq('class_id', classId).order('created_at', { ascending: false }));
    if (error) {
      console.error('getStudySessionsByClass error:', error);
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getStudySessionsByClass:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Creates a new study session.
 * @param {string} userId - User ID
 * @param {object} sessionData - { classId?, topic, duration_minutes, date, notes? }
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function addStudySession(userId, sessionData) {
  try {
    if (!userId) return { success: false, data: null, error: 'userId is required' };
    if (!sessionData.topic) return { success: false, data: null, error: 'topic is required' };
    if (!sessionData.duration_minutes || sessionData.duration_minutes <= 0) return { success: false, data: null, error: 'duration_minutes must be positive' };

    const { data, error } = await supabase.from('study_sessions').insert([{
      user_id: userId,
      class_id: sessionData.classId || null,
      topic: sessionData.topic,
      duration_minutes: sessionData.duration_minutes,
      date: sessionData.date || format(new Date(), 'yyyy-MM-dd'),
      notes: sessionData.notes || null
    }]).select().single();

    if (error) {
      console.error('addStudySession error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Unexpected error in addStudySession:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Deletes a study session.
 * @param {string} sessionId - Session UUID
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteStudySession(sessionId) {
  try {
    const { data: record, error: findError } = await supabase.from('study_sessions').select('id').eq('id', sessionId).single();
    if (findError) return { success: false, data: null, error: 'Session not found' };

    const { error } = await supabase.from('study_sessions').delete().eq('id', sessionId);
    if (error) {
      console.error('deleteStudySession error:', error);
      return { success: false, data: null, error: error.message };
    }
    return { success: true, data: null, error: null };
  } catch (err) {
    console.error('Unexpected error in deleteStudySession:', err);
    return { success: false, data: null, error: err.message };
  }
}

// --------------------------------------------------------------------------------
// PART 5: STATISTICS FUNCTIONS
// --------------------------------------------------------------------------------

/**
 * Returns per-class attendance statistics.
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: array, error: string|null}>}
 */
export async function getAttendanceStats(userId) {
  try {
    if (!userId) return { success: false, data: [], error: 'userId is required' };
    
    const [classesRes, attendanceRes] = await Promise.all([
      getClasses(userId),
      queryWithRetry(() => supabase.from('attendance_records').select('*').eq('user_id', userId))
    ]);

    if (!classesRes.success) return classesRes;
    if (classesRes.data.length === 0) return { success: true, data: [], error: null };

    const records = attendanceRes.data || [];
    
    const stats = classesRes.data.map(cls => {
      const clsRecords = records.filter(r => r.class_id === cls.id);
      const present = clsRecords.filter(r => r.status === 'present').length;
      const absent = clsRecords.filter(r => r.status === 'absent').length;
      const cancelled = clsRecords.filter(r => r.status === 'cancelled').length;
      const total = present + absent + cancelled;

      let percentage = 0;
      if (total > 0) {
        percentage = Math.round((present / total) * 100 * 10) / 10;
      }

      return {
        classId: cls.id,
        name: cls.name,
        total,
        present,
        absent,
        cancelled,
        percentage
      };
    });

    return { success: true, data: stats, error: null };
  } catch (err) {
    console.error('Unexpected error in getAttendanceStats:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Returns overall attendance percentage across ALL classes.
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: number, error: string|null}>}
 */
export async function calculateOverallAttendance(userId) {
  try {
    const statsRes = await getAttendanceStats(userId);
    if (!statsRes.success) return { success: false, data: 0, error: statsRes.error };
    if (statsRes.data.length === 0) return { success: true, data: 0, error: null };

    const totalPresent = statsRes.data.reduce((sum, cls) => sum + cls.present, 0);
    const totalClasses = statsRes.data.reduce((sum, cls) => sum + cls.total, 0);

    if (totalClasses === 0) return { success: true, data: 0, error: null };
    
    const percentage = Math.round((totalPresent / totalClasses) * 100 * 10) / 10;
    return { success: true, data: percentage, error: null };
  } catch (err) {
    console.error('Unexpected error in calculateOverallAttendance:', err);
    return { success: false, data: 0, error: err.message };
  }
}

/**
 * Returns how many more classes need to be attended to reach 75%.
 * @param {string} classId - Class UUID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function getAttendanceStatusForClass(classId, userId) {
  try {
    const [clsRes, statsRes] = await Promise.all([
      getClassById(classId),
      getAttendanceStats(userId)
    ]);

    if (!clsRes.success || !clsRes.data) return { success: false, data: null, error: 'Class not found' };
    
    const cls = clsRes.data;
    if (!cls.total_classes || cls.total_classes <= 0) {
      return { success: false, data: null, error: 'Total classes not set for this course' };
    }

    const clsStats = statsRes.data.find(s => s.classId === classId);
    const presentCount = clsStats ? clsStats.present : 0;
    const targetPercentage = cls.minimum_attendance || 75;

    const needed = Math.ceil(((targetPercentage / 100) * cls.total_classes) - presentCount);
    
    return { 
      success: true, 
      data: {
        needed: Math.max(0, needed),
        remaining: Math.max(0, cls.total_classes - (clsStats ? clsStats.total : 0)),
        willReach75Percent: needed <= 0
      }, 
      error: null 
    };
  } catch (err) {
    console.error('Unexpected error in getAttendanceStatusForClass:', err);
    return { success: false, data: null, error: err.message };
  }
}
