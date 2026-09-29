# Veylola AI

React Native + Expo + TypeScript mobile AI app.

## Connect to your API

Create a .env file from .env.example and set:

EXPO_PUBLIC_API_BASE_URL=https://YOUR_RENDER_API

Provider API keys must remain on the server and must never be placed in the mobile app.

## Local Android Video Studio

Veylola now includes a local timeline editor and native FFmpeg renderer.

It supports:
- Image scenes
- Text/title-card scenes
- 9:16, 16:9 and 1:1 projects
- Scene durations from 3–60 seconds
- Cut/fade timeline transitions
- Optional audio track
- H.264 MP4 export
- Android hardware encoder when available, with software fallback
- Saving the rendered MP4 to the Android media library
- Remote AI video as an optional fallback

The local renderer is a media editor/renderer. It does not claim that a phone is running a large generative text-to-video model locally.

### Native build required

The FFmpeg engine uses a native Expo module, so **Expo Go is not sufficient**. Build a native Android development build:

```bash
npm install
npx expo prebuild
npx expo run:android
```

You can also use an EAS development build.

The native FFmpeg module is based on `munim-ffmpeg`, which provides Android hardware H.264 through MediaCodec when available and a software H.264 fallback. Test video encoding on a physical Android device.

## Normal Expo development

For screens that do not use the native video renderer:

```bash
npm install
npx expo start
```

## Project structure

- `app/index.tsx` — main Veylola chat
- `app/video.tsx` — local Video Studio
- `lib/localVideo.ts` — project model and native MP4 renderer
- `lib/api.ts` — Render/API integration

Keep provider API keys on the server. Never put OpenAI, xAI, or other provider secrets in `EXPO_PUBLIC_*` variables.
