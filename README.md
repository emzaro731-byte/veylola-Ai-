# Veylola AI

React Native + Expo + TypeScript mobile AI app.

## Connect to your API

Create a .env file from .env.example and set:

EXPO_PUBLIC_DESTINY_API_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1

The app calls your Supabase Edge Functions:
- POST /destiny-ai
- POST /image-generate
- POST /video-generate
- POST /music-generate

Provider API keys must remain in Supabase secrets and must never be placed in the mobile app.

## Run

npm install
npx expo start
