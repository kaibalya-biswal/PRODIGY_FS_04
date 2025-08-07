# Real-Time Chat Application

A modern real-time chat application built with React and Supabase, featuring instant messaging, user authentication, and chat rooms.

## Features

- 🔐 **User Authentication**: Sign up and sign in with email/password
- 💬 **Real-Time Messaging**: Instant message delivery using Supabase real-time subscriptions
- 🏠 **Chat Rooms**: Create and join different chat rooms
- 👥 **User Management**: View online users and their profiles
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 🔄 **Auto-scroll**: Messages automatically scroll to bottom
- ⚡ **Real-time Updates**: Live updates for new messages and rooms

## Tech Stack

- **Frontend**: React 18, React Router DOM
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Styling**: CSS3 with modern design patterns
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Prerequisites

Before running this application, you need to:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in Supabase
3. Set up the database tables (see Database Setup below)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd realtime-chat-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Database Setup

### 1. Create Tables

Run the following SQL in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view messages in rooms" ON messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. Enable Real-time

In your Supabase dashboard:
1. Go to Database → Replication
2. Enable real-time for the `messages` and `rooms` tables

### 3. Set up Authentication

1. Go to Authentication → Settings
2. Enable Email authentication
3. Configure your site URL (e.g., `http://localhost:3000`)

## Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings.

## Usage

1. **Sign Up**: Create a new account with email, password, and username
2. **Sign In**: Log in with your credentials
3. **Create Rooms**: Click the "+" button to create new chat rooms
4. **Join Rooms**: Click on any room in the sidebar to join
5. **Send Messages**: Type your message and press Enter or click the send button
6. **View Users**: Switch to the "Users" tab to see online users

## Project Structure

```
src/
├── components/          # React components
│   ├── Chat.js         # Main chat interface
│   ├── Login.js        # Login form
│   ├── Register.js     # Registration form
│   ├── Message.js      # Individual message component
│   ├── CreateRoomModal.js # Room creation modal
│   └── PrivateRoute.js # Protected route wrapper
├── contexts/           # React contexts
│   ├── AuthContext.js  # Authentication state management
│   └── ChatContext.js  # Chat state and real-time logic
├── config/             # Configuration files
│   └── supabase.js     # Supabase client setup
└── App.js              # Main application component
```

## Features in Detail

### Real-Time Messaging
- Uses Supabase real-time subscriptions for instant message delivery
- Messages appear immediately without page refresh
- Auto-scroll to latest messages

### User Authentication
- Secure email/password authentication
- User profiles with avatars
- Session management

### Chat Rooms
- Create custom chat rooms with names and descriptions
- Join existing rooms
- Room-specific message history

### Modern UI/UX
- Clean, modern design with smooth animations
- Responsive layout for all screen sizes
- Intuitive navigation and interactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 