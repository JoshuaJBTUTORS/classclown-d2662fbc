
# Agora Token Service

A Node.js service deployed on Vercel for generating Agora RTC and RTM tokens.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables in Vercel dashboard:
- `AGORA_APP_ID` - Your Agora App ID
- `AGORA_APP_CERTIFICATE` - Your Agora App Certificate

3. Deploy to Vercel:
```bash
vercel --prod
```

## Usage

POST to `/api/generate-tokens` with:
```json
{
  "appId": "your_app_id",
  "appCertificate": "your_app_certificate", 
  "channelName": "channel_name",
  "uid": 12345,
  "userRole": "tutor" | "student"
}
```

Returns:
```json
{
  "success": true,
  "rtcToken": "generated_rtc_token",
  "rtmToken": "generated_rtm_token",
  "uid": 12345,
  "channelName": "channel_name",
  "role": "tutor"
}
```

## Environment Variables

After deploying to Vercel, you need to:
1. Set `VERCEL_TOKEN_SERVICE_URL` in your Supabase Edge Function secrets to point to your deployed Vercel service
2. Set `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` in Vercel environment variables
