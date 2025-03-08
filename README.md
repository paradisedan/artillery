# Artillery RTS Game

A multiplayer Artillery/RTS hybrid game built with Three.js and Supabase.

## Features

- Real-time multiplayer gameplay
- Artillery mechanics with wind effects
- Three unit types in rock-paper-scissors balance:
  - Infantry (strong vs helicopters)
  - Tanks (strong vs infantry)
  - Helicopters (strong vs tanks)
- Procedurally generated terrain
- User authentication and stats tracking
- Weather effects

## Tech Stack

- Three.js for 3D rendering
- Supabase for authentication and real-time features
- Socket.IO for game state synchronization
- Node.js and Express for the server
- Webpack for bundling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   PORT=3000
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Development

- `npm run build` - Build the client-side bundle
- `npm start` - Start the development server
- `npm run dev` - Start with hot reloading

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
