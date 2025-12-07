# CurioKids Project Structure Documentation

## Overview

CurioKids is a React Native mobile application built with Expo, designed as an educational learning platform for children with parent supervision. The app allows parents to create accounts and generate unique link keys that their children can use to register and access learning content. The platform includes features like course management, leaderboards, and separate dashboards for parents and children.

## Technology Stack

### Core Technologies
- **React Native**: v0.81.5 - Mobile app framework
- **React**: v19.1.0 - UI library
- **Expo**: v~54.0.26 - Development platform and toolchain
- **TypeScript**: v~5.9.2 - Type-safe JavaScript

### Key Libraries
- **Firebase**: v12.6.0 - Backend services (authentication, Firestore database)
- **Expo Router**: v~6.0.16 - File-based routing
- **NativeWind**: v4.2.1 - Tailwind CSS for React Native
- **React Navigation**: v7.x - Navigation components
- **React Native Reanimated**: v~4.1.1 - Animations
- **React Native Gesture Handler**: v~2.28.0 - Touch gesture handling

### Development Tools
- **ESLint**: v9.25.0 - Code linting
- **Babel**: Transpilation with Expo presets
- **Metro**: JavaScript bundler
- **Tailwind CSS**: v3.4.18 - Utility-first CSS

## Project Structure

```
CurioKids/
│
├── .git/                          # Git repository data
├── .idea/                         # IDE configuration (IntelliJ/WebStorm)
├── .vscode/                       # VS Code workspace settings
│
├── app/                           # Main application code (file-based routing)
│   ├── (tabs)/                    # Tab navigation group
│   │   ├── _layout.tsx           # Tab navigator configuration
│   │   ├── dashboard.tsx         # Main dashboard (role-based routing)
│   │   ├── leaderboard.tsx       # Leaderboard screen
│   │   ├── profile.tsx           # User profile screen
│   │   └── courses.tsx           # Courses listing screen
│   │
│   ├── child/                     # Child-specific screens
│   │   ├── registration.tsx      # Child registration (requires parent key)
│   │   ├── dashboard.tsx         # Child-specific dashboard
│   │   └── profile.tsx           # Child profile view
│   │
│   ├── parent/                    # Parent-specific screens
│   │   ├── registration.tsx      # Parent registration (generates link key)
│   │   ├── dashboard.tsx         # Parent-specific dashboard
│   │   └── profile.tsx           # Parent profile view
│   │
│   ├── _layout.tsx               # Root layout component
│   ├── index.tsx                 # Landing/welcome screen
│   ├── login.tsx                 # Login screen
│   ├── courses.tsx               # Courses screen
│   ├── leaderboard.tsx           # Standalone leaderboard
│   └── globals.css               # Global Tailwind CSS styles
│
├── assets/                        # Static assets
│   └── images/                   # Images and icons
│       ├── icon.png              # App icon
│       ├── splash-icon.png       # Splash screen icon
│       ├── favicon.png           # Web favicon
│       ├── android-icon-foreground.png
│       ├── android-icon-background.png
│       └── android-icon-monochrome.png
│
├── config/                        # Configuration files
│   └── firebase.js               # Firebase initialization and configuration
│
├── .gitignore                    # Git ignore rules
├── app.json                      # Expo app configuration
├── babel.config.js               # Babel transpiler configuration
├── eslint.config.js              # ESLint linting rules
├── metro.config.js               # Metro bundler configuration
├── nativewind-env.d.ts          # NativeWind type definitions
├── package.json                  # NPM dependencies and scripts
├── package-lock.json            # Locked dependency versions
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript compiler configuration
└── README.md                    # Project setup instructions
```

## Key Directories Explained

### `/app` - Application Source Code

This directory contains all the application screens and logic using Expo Router's file-based routing system. The structure of files and folders directly maps to the app's navigation structure.

#### File-Based Routing
- Files named `_layout.tsx` define layout wrappers for their directory
- Folders wrapped in parentheses like `(tabs)` are route groups that don't appear in URLs
- `index.tsx` serves as the default route for its directory level

#### Screen Organization
- **Root screens**: Welcome, login, and top-level navigation
- **Tab screens**: Main navigation after authentication (dashboard, leaderboard, profile, courses)
- **Role-based screens**: Separate registration, dashboard, and profile views for parents and children

### `/config` - Configuration Files

Contains Firebase configuration for backend services:
- Authentication setup with AsyncStorage persistence
- Firestore database initialization
- API keys and project identifiers

### `/assets` - Static Resources

Stores images, icons, and other static files:
- App icons for different platforms (iOS, Android, Web)
- Splash screen assets
- Adaptive icons with foreground, background, and monochrome variants

## Configuration Files

### `package.json`
Defines project metadata, dependencies, and npm scripts:
- `start`: Launch Expo development server
- `android`: Run on Android emulator
- `ios`: Run on iOS simulator
- `web`: Run in web browser
- `lint`: Run ESLint checks

### `app.json`
Expo-specific configuration:
- App name and slug
- Platform-specific settings (iOS, Android, Web)
- Icon and splash screen configurations
- Plugins (expo-router, expo-splash-screen)
- Experimental features (typed routes, React compiler)

### `tsconfig.json`
TypeScript configuration:
- Strict type checking enabled
- Path aliases: `@/*` maps to project root
- Includes all `.ts` and `.tsx` files

### `tailwind.config.js`
Tailwind CSS customization:
- Custom color palette:
  - Primary: `#F0E491` (light yellow)
  - Secondary: `#BBC863` (olive green)
  - Ternary: `#658C58` (sage green)
  - Base: `#31694E` (dark green)
- Content paths for component scanning

### `babel.config.js`
Babel transpilation setup:
- Expo preset with NativeWind JSX support
- React Native Reanimated plugin

### `metro.config.js`
Metro bundler configuration:
- NativeWind integration
- Global CSS file import

## Application Features

### Authentication & User Management
- **Parent Registration**: Creates account with unique link key
- **Child Registration**: Requires parent's link key to associate accounts
- **Login**: Email/password authentication with role-based routing
- **User Roles**: Separate experiences for "parent" and "child" users

### Navigation Structure
- **Welcome Screen**: Entry point with login/registration options
- **Tab Navigation**: Main navigation bar with 4 tabs:
  1. Dashboard (role-specific content)
  2. Leaderboard (competition rankings)
  3. Profile (user information)
  4. Courses (learning content)

### Firebase Integration
- **Authentication**: User signup/signin with email and password
- **Firestore Database**: 
  - User profiles with roles (parent/child)
  - Parent-child account linking via unique keys
  - Timestamps for account creation

### Design System
- **Color Theme**: Green and yellow palette for educational, child-friendly interface
- **Styling**: Tailwind CSS utility classes via NativeWind
- **Components**: React Native core components (View, Text, Button, TextInput)
- **Icons**: Ionicons from @expo/vector-icons

## Development Workflow

### Getting Started
1. Install dependencies: `npm install`
2. Start development server: `npx expo start`
3. Run on platform: `npm run android` / `npm run ios` / `npm run web`

### File-Based Routing
When you create a new file in the `/app` directory:
- `app/newscreen.tsx` → Available at `/newscreen`
- `app/folder/screen.tsx` → Available at `/folder/screen`
- `app/folder/index.tsx` → Available at `/folder`

### Adding New Screens
1. Create `.tsx` file in appropriate `/app` subdirectory
2. Export default React component
3. Use `router.push()` or `router.replace()` to navigate
4. Add navigation tab if needed in `app/(tabs)/_layout.tsx`

### Styling Components
Use Tailwind CSS classes via the `className` prop:
```tsx
<View className="flex-1 justify-center items-center">
  <Text className="text-xl font-bold text-primary">Hello</Text>
</View>
```

### Code Quality
- Run linter: `npm run lint`
- TypeScript checks: Type errors will appear in IDE
- ESLint: Configured with Expo's recommended rules

## Data Models

### User Document (Firestore)
```typescript
// Parent User
{
  role: "parent",
  email: string,
  name: string,
  linkKey: string,        // Unique 6-character key
  createdAt: Timestamp
}

// Child User
{
  role: "child",
  email: string,
  name: string,
  parentUid: string,      // Reference to parent user
  createdAt: Timestamp
}
```

## Security Considerations

### Firebase Configuration
- Firebase credentials are currently stored in `config/firebase.js`
- For production, consider using environment variables
- Firestore security rules should be configured in Firebase Console

### Authentication Flow
1. User registers/logs in via Firebase Auth
2. User document created/read from Firestore
3. Role determines which screens are accessible
4. Parent-child linking validated via unique keys

## Platform Support

### iOS
- Supports tablets
- Uses adaptive icons

### Android
- Adaptive icons configured
- Edge-to-edge display enabled
- Predictive back gesture disabled

### Web
- Static output for deployment
- Custom favicon configured

## Future Enhancements

Based on the current structure, the app appears to be designed for:
- Course/lesson content delivery
- Progress tracking
- Competitive leaderboards
- Parent oversight of child's learning
- Multi-platform deployment (mobile and web)

## Getting Help

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Firebase Docs**: https://firebase.google.com/docs
- **NativeWind Docs**: https://www.nativewind.dev/

## Notes

- The app uses Expo's "New Architecture" (enabled in `app.json`)
- TypeScript strict mode is enabled for type safety
- React 19 is used with the experimental React Compiler
- File-based routing simplifies navigation structure
- The color scheme suggests an educational, nature-themed design
