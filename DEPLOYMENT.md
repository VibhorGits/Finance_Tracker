# Deployment Guide for Vercel

## Prerequisites
- GitHub account
- Vercel account
- MongoDB Atlas account
- Google AI Studio account (for Gemini API)

## Environment Variables Setup

### 1. Frontend Environment Variables
In your Vercel project settings, add:
```
VITE_API_BASE_URL=/api
```

### 2. Backend Environment Variables
In your Vercel project settings, add:
```
GOOGLE_API_KEY=your_actual_google_api_key
MONGO_CONNECTION_STRING=your_actual_mongo_connection_string
```

## Getting API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to Vercel environment variables

### MongoDB Connection String
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster or use existing one
3. Go to "Connect" > "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add the full connection string to Vercel environment variables

## Deployment Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: Vite
     - Root Directory: `./` (leave default)
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add environment variables as listed above
   - Click "Deploy"

3. **Update CORS Origin**
   - After deployment, Vercel will provide your app's URL (e.g., `https://your-app.vercel.app`)
   - Update the CORS origins in `api/index.py`:
     ```python
     origins = [
         "http://localhost:5173",
         "http://127.0.0.1:5173",
         "https://your-app.vercel.app",  # Replace with your actual Vercel URL
     ]
     ```
   - Commit and push this change

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API endpoints are accessible at `/api/*`
- [ ] Database connection works
- [ ] AI features work (if using Gemini API)
- [ ] File upload functionality works
- [ ] All environment variables are set correctly

## Troubleshooting

### Build Failures
- Check that all dependencies are listed in `package.json` and `api/requirements.txt`
- Ensure environment variables are set in Vercel dashboard

### API Connection Issues
- Verify `VITE_API_BASE_URL` is set to `/api` in production
- Check CORS settings allow your Vercel domain

### Database Connection Issues
- Ensure MongoDB connection string is correct
- Verify network access is enabled in MongoDB Atlas
- Check that database user has proper permissions

### AI Features Not Working
- Verify Google API key is valid and has quota
- Check that `GOOGLE_API_KEY` environment variable is set