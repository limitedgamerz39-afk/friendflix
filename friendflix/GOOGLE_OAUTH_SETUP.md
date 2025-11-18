# Google OAuth Setup Instructions

To enable Google OAuth login in the Friendflix app, you need to set up OAuth credentials in the Google Cloud Console:

## Backend Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. For application type, select "Web application"
6. Add authorized redirect URIs:
   - http://localhost:5000/auth/google/callback
7. Copy the Client ID and replace `YOUR_GOOGLE_CLIENT_ID` in the backend `.env` file

## Frontend Setup

1. In the Google Cloud Console, create additional OAuth 2.0 Client IDs for:
   - iOS application
   - Android application
2. Copy the respective Client IDs and replace the placeholders in `frontend/Friendflix/config/googleConfig.js`:
   - `iosClientId`
   - `androidClientId`
   - `webClientId`

## Environment Variables

Make sure to update the following files with your actual credentials:

### Backend (.env)
```
GOOGLE_CLIENT_ID=YOUR_WEB_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

### Frontend (config/googleConfig.js)
```javascript
export const GOOGLE_CONFIG = {
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  // ... other config
};
```

## Testing

After setting up the credentials, you can test the Google OAuth login by running both the backend and frontend applications.