# Ellinaki - Learn Greek Words Easily

A modern web application for learning Greek words, designed to help you prepare for B2 Greek exams.

## Features

- **Interactive Dictionary**: Search for Greek words and their English translations
- **Flashcard Games**: Three different game modes to practice vocabulary
  - Greek → English: See the Greek word and guess the translation
  - English → Greek: See the translation and remember the Greek word
  - Multiple Choice: Choose the correct translation from three options
- **Progress Tracking**: Monitor your daily exercises and memorized words
- **Responsive Design**: Works seamlessly on both mobile and desktop devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Cloud Console account (for OAuth setup - optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Set up Google OAuth:
   - See [Google OAuth Setup](#google-oauth-setup) section below
   - Create `.env` file with `VITE_GOOGLE_CLIENT_ID`

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

**Note**: The app works without Google OAuth, but user progress will only be stored locally. For cross-device sync, set up Google OAuth.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to render.com or any other hosting service.

## Deployment to Render.com

The application is configured for easy deployment on Render.com. You have two options:

### Option 1: Using render.yaml (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. In Render.com dashboard, click "New" → "Blueprint"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file and configure the service

### Option 2: Manual Setup

1. Push your code to a Git repository
2. In Render.com dashboard, click "New" → "Web Service"
3. Connect your repository
4. Configure the service:
   - **Name**: ellinaki (or any name you prefer)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: (leave empty, or set to root if needed)

The application will be automatically deployed and you'll get a URL like `https://ellinaki.onrender.com`

### Important Notes

- The app uses Express server to handle React Router client-side routing
- **Persistent Storage**: User progress is stored on a persistent disk at `/data` (configured in `render.yaml`)
  - The disk is automatically mounted when using Blueprint deployment
  - For manual setup, add a disk in Render.com dashboard: Settings → Disks → Add Disk
    - Mount path: `/data`
    - Size: 1GB (or more if needed)
- Environment variables can be set in Render.com dashboard under "Environment"
- The `dictionary.json` file is included in the build, so no additional setup is needed
- Progress data is stored in `/data/progress.json` and persists across deployments

## Project Structure

```
greek_dict/
├── src/
│   ├── components/      # Reusable components (Navigation)
│   ├── pages/          # Page components (Landing, Dictionary, Flashcards, Progress, About)
│   ├── utils/          # Utility functions (storage management)
│   ├── dictionary.json # Greek words database
│   ├── App.jsx         # Main app component with routing
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── package.json        # Dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Google OAuth Setup

To enable Google authentication, you need to set up OAuth 2.0 credentials:

### Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in the required information (App name, User support email, Developer contact)
     - Add scopes: `email`, `profile`
     - Add test users if needed (for testing before publishing)
   - Application type: "Web application"
   - Name: "Ellinaki Web Client" (or any name)
   - Authorized JavaScript origins:
     - For development: `http://localhost:5173`
     - For production: `https://your-domain.onrender.com` (your Render.com URL)
   - Authorized redirect URIs:
     - For development: `http://localhost:5173`
     - For production: `https://your-domain.onrender.com`
   - Click "Create"
5. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### Step 2: Configure Environment Variables

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Client ID:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

3. For production on Render.com:
   - Go to your service settings in Render.com dashboard
   - Navigate to "Environment" section
   - Add environment variable:
     - Key: `VITE_GOOGLE_CLIENT_ID`
     - Value: your Google Client ID

### Step 3: Restart the Application

- For development: restart `npm run dev`
- For production: redeploy on Render.com

### Important Notes

- The `.env` file is already in `.gitignore` and won't be committed
- Never commit your Client ID to version control
- Make sure to add both development and production URLs to authorized origins in Google Console
- The app will work without Google Auth (using temporary user IDs), but progress won't sync across devices

## Technologies Used

- React 18
- React Router DOM
- Vite
- CSS3 (with responsive design)

## Author

Created by [Timur Nurlygaianov](https://www.linkedin.com/in/timur-nurlygaianov/)

## Hosting

This application is hosted on [render.com](https://render.com)

