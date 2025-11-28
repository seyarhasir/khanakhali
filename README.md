# Manzil

A Next.js web application for browsing and managing home listings. This website shares the same Firebase backend as the React Native mobile app.

**Website**: [asanmanzil.com](https://asanmanzil.com)

## Features

- 🏠 **Browse Listings**: View all active property listings (no authentication required)
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔐 **Admin Authentication**: Login required only for admin access
- 🔧 **Admin Dashboard**: Create, edit, and delete listings (admin only)
- 🎨 **Modern UI**: Clean, modern design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (same as your React Native app)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
   ```

   > **Note**: These are the same values from your React Native app, but with `NEXT_PUBLIC_` prefix instead of `EXPO_PUBLIC_`.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
home-listing-website/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin pages
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── listings/          # Listing detail pages
│   ├── profile/           # User profile page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Layout components (Navbar, etc.)
│   ├── listings/         # Listing-related components
│   ├── providers/        # Context providers
│   └── ui/               # Reusable UI components
├── lib/                   # Core libraries
│   ├── firebase/         # Firebase configuration
│   ├── services/         # API services (auth, listings)
│   ├── store/            # Zustand stores
│   └── types/             # TypeScript types
└── public/                # Static assets
```

## Pages

- **Home** (`/`): Browse all active listings (public, no auth required)
- **Listing Detail** (`/listings/[id]`): View detailed listing information (public, no auth required)
- **Admin Login** (`/login`): Sign in as admin to access admin features
- **Admin Dashboard** (`/admin`): Manage listings (admin only, requires authentication)
- **New Listing** (`/admin/listings/new`): Create a new listing (admin only)
- **Edit Listing** (`/admin/listings/[id]/edit`): Edit an existing listing (admin only)
- **Admin Profile** (`/profile`): View admin profile (admin only)

## Shared Backend

This website uses the **same Firebase backend** as your React Native app:

- ✅ Same Firestore database
- ✅ Same storage bucket
- ✅ Same user roles and permissions

**Note**: On the website, authentication is **admin-only**. Regular users can browse listings without signing in. Admins can manage listings from either the mobile app or the website.

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables
4. Deploy!

## Development Notes

- All components are client-side (`'use client'`) where needed for interactivity
- Firebase is initialized only on the client side
- The design system matches the mobile app's color palette
- Images from Firebase Storage are configured in `next.config.ts`

## Troubleshooting

### Firebase not initializing
- Make sure all environment variables are set correctly
- Check that your Firebase project is active
- Verify the variable names use `NEXT_PUBLIC_` prefix

### Images not loading
- Check that your Firebase Storage rules allow public read access
- Verify the image URLs in Firestore are correct
- Check `next.config.ts` for proper image domain configuration

## License

Private project
