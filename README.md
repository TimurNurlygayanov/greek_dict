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

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

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

## Future Enhancements

- Google OAuth integration for user authentication
- Cloud-based progress synchronization
- User accounts and cross-device progress sync

## Technologies Used

- React 18
- React Router DOM
- Vite
- CSS3 (with responsive design)

## Author

Created by [Timur Nurlygaianov](https://www.linkedin.com/in/timur-nurlygaianov/)

## Hosting

This application is hosted on [render.com](https://render.com)

