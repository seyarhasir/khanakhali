# Setup Guide for Home Listing Website

## Quick Start

1. **Navigate to the website directory**:
   ```bash
   cd home-listing-website
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env.local
   ```

4. **Add your Firebase credentials**:
   Open `.env.local` and add your Firebase configuration values. These are the same values from your React Native app, but with `NEXT_PUBLIC_` prefix instead of `EXPO_PUBLIC_`.

   Example:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## What's Included

✅ **Complete Next.js website** with:
- Home page with listing grid (public, no auth required)
- Listing detail pages (public, no auth required)
- Admin authentication (admin-only login)
- Admin dashboard
- Create/edit listing forms (admin only)

✅ **Same Firebase backend** as your React Native app:
- Shared Firestore database
- Shared storage bucket
- Admin accounts can manage listings from website

✅ **Modern UI** with:
- Tailwind CSS styling
- Responsive design
- Same color palette as mobile app

## Project Structure

```
home-listing-website/
├── app/                      # Next.js pages (App Router)
│   ├── admin/               # Admin pages
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── listings/[id]/      # Listing detail
│   ├── profile/             # User profile
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── layout/             # Navbar, etc.
│   ├── listings/           # ListingCard
│   ├── providers/          # AuthProvider
│   └── ui/                 # Button, Input
├── lib/                     # Core libraries
│   ├── firebase/           # Firebase config
│   ├── services/           # API services
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript types
└── public/                  # Static assets
```

## Key Differences from Mobile App

1. **Framework**: Next.js instead of React Native/Expo
2. **Navigation**: Next.js routing instead of React Navigation
3. **UI Components**: HTML elements instead of React Native components
4. **Image Handling**: Next.js Image component instead of React Native Image
5. **Environment Variables**: `NEXT_PUBLIC_` prefix instead of `EXPO_PUBLIC_`

## Testing the Website

1. **Browse listings** on the home page (no login required)
2. **View listing details** by clicking on any listing (no login required)
3. **Sign in as admin** to access the admin dashboard (admin accounts only)
4. **Create/edit listings** from the admin dashboard (admin only)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Build for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Firebase not working
- Check that all environment variables are set in `.env.local`
- Make sure variable names use `NEXT_PUBLIC_` prefix
- Verify Firebase project is active

### Images not loading
- Check Firebase Storage rules allow public read
- Verify image URLs in Firestore are correct
- Check browser console for CORS errors

### Authentication issues
- Clear browser cache and cookies
- Check Firebase Auth is enabled in Firebase Console
- Verify email/password provider is enabled

## Next Steps

- Add image upload functionality for admin
- Add search and filter functionality
- Add favorites/saved listings
- Add contact form for listings
- Add pagination for listings
- Add SEO optimization

