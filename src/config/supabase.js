import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please create a .env file with:')
  console.error('REACT_APP_SUPABASE_URL=your_supabase_project_url')
  console.error('REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.error('See setup-env.md for detailed instructions.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database schema setup
export const setupDatabase = async () => {
  // Create tables if they don't exist
  const { error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (usersError && usersError.code === '42P01') {
    // Table doesn't exist, create it
    console.log('Setting up database tables...')
  }
}

// Helper functions for database operations
export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
  
  return { data, error }
}

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('username')
  
  return { data, error }
}

export const createMessage = async (messageData) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData])
    .select()
  
  return { data, error }
}

export const getMessages = async (roomId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, users(username, avatar_url)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
  
  return { data, error }
}

export const createRoom = async (roomData) => {
  const { data, error } = await supabase
    .from('rooms')
    .insert([roomData])
    .select()
  
  return { data, error }
}

export const getRooms = async () => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// User Presence Functions
export const updateUserPresence = async (presenceData) => {
  const { data, error } = await supabase
    .from('user_presence')
    .upsert([presenceData])
    .select()
  
  return { data, error }
}

export const getUserPresence = async (userId) => {
  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const getAllUserPresence = async () => {
  const { data, error } = await supabase
    .from('user_presence')
    .select('*, users(username, avatar_url)')
    .order('updated_at', { ascending: false })
  
  return { data, error }
}

export const updateTypingStatus = async (userId, isTyping, roomId = null) => {
  const { data, error } = await supabase
    .from('user_presence')
    .update({ 
      is_typing: isTyping, 
      current_room: roomId,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
  
  return { data, error }
} 