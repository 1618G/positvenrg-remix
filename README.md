# Positive Energy - Remix App

A full-stack positive energy platform built with Remix, featuring AI companions for emotional support and motivation.

## Features

- 🤖 AI-powered companions with unique personalities
- 💬 Real-time chat functionality
- 🔐 Secure authentication with JWT
- 📱 Responsive design for all devices
- 🧘‍♀️ Mindfulness and meditation guidance
- ⚡ Energy boost and motivation features
- 🌱 Emotional support and self-reflection tools

## Tech Stack

- **Frontend**: Remix (React Router v7)
- **Backend**: Remix Server
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Deployment**: Render

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GEMINI_API_KEY`: Google Gemini API key
- `GEMINI_MODEL`: Gemini model to use (default: gemini-2.5-flash)
- `ADMIN_EMAIL`: Admin user email
- `ADMIN_PASSWORD`: Admin user password
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 10000)

## Database Schema

The app uses Prisma with the following main models:

- **User**: User accounts with authentication
- **Companion**: AI companions with personalities
- **Chat**: Chat sessions between users and companions
- **Message**: Individual messages in chats

## API Routes

- `/` - Homepage
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard
- `/chat/:companionId` - Chat with specific companion

## Testing

Run tests with:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm test:coverage
```

## Deployment

The app is configured for deployment on Render with:

- Build command: `pnpm install && pnpm db:generate && pnpm build`
- Start command: `pnpm start`
- Environment variables configured in Render dashboard

## Development

### Database Commands

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:studio` - Open Prisma Studio

### Code Quality

- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Vitest for testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
