# CreatorPulse AI — Frontend Application

Next.js 15 App Router web application providing the user interface for CreatorPulse AI.

## Tech Stack
- **Framework:** Next.js 15 (App Router, Standalone build)
- **Library:** React 19, TypeScript (Strict mode)
- **Styling:** Tailwind CSS (Dark theme palette: `#0B1020`, card `#151D2E`, accents `#8B5CF6` and `#22D3EE`)
- **Visuals:** Recharts, Lucide React
- **Forms:** React Hook Form, Zod

## Running Locally (PowerShell)
```powershell
npm install
cp .env.example .env.local
npm run dev
```
Open `http://localhost:3000`.

## Production Build & Check
```powershell
npm run build
npm start
```

## Production Docker Deployment
```bash
docker build -t creatorpulse-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://your-backend-api creatorpulse-frontend
```
