# Nexus Frontend

This is the React + Vite frontend for the Nexus AI Chat Application.

## Setup

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com), enable **Email** (and any other sign-in methods you want).
2. Go to **API Keys** and copy the **Publishable key** → goes in `.env` as `VITE_CLERK_PUBLISHABLE_KEY`.

```bash
npm install

cp .env.example .env             # Windows: copy .env.example .env
# edit .env: add VITE_CLERK_PUBLISHABLE_KEY

npm run dev
```

Open `http://localhost:5173`. You'll land on Clerk's sign-up screen first —
create an account, and you're dropped into the chat UI with 100 credits.

## Deployment (Vercel)

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and import your repository.
3. Select the `frontend` directory as the Root Directory.
4. Framework Preset should automatically be detected as Vite.
5. Add the following Environment Variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key.
   - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://your-backend-url.onrender.com`).
6. Deploy!
