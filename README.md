# React Network DevTools

A lightweight Network tab for your React development environment. Debug API requests without leaving your application.

![React Network DevTools](https://img.shields.io/badge/React-18%2B-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🔍 **Auto Capture** - Automatically intercepts fetch & XHR requests
- 📋 **Inspect Everything** - View request/response bodies, headers, timing
- 🔒 **Security** - Sensitive data like tokens are masked automatically
- ⚡ **Zero Config** - Works out of the box with no modifications needed
- 🎯 **Filter & Search** - Filter by method, status, errors, or slow requests
- 📦 **Lightweight** - Minimal dependencies, scoped CSS, no conflicts

## 🚀 Quick Start

### Installation

```bash
npm install react-network-devtools
```

### Usage

```tsx
import { NetworkDevTools } from 'react-network-devtools';

function App() {
  return (
    <>
      <YourApp />
      
      {process.env.NODE_ENV === 'development' && (
        <NetworkDevTools />
      )}
    </>
  );
}
```

### Vite

```tsx
{import.meta.env.DEV && <NetworkDevTools />}
```

### Next.js

```tsx
// app/devtools.tsx
'use client';
import { NetworkDevTools } from 'react-network-devtools';

export default function DevTools() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <NetworkDevTools />;
}
```

## 🎮 Live Demo

This repository includes a playground to test all features:

```bash
git clone https://github.com/YOUR_USERNAME/react-network-devtools.git
cd react-network-devtools
npm install
npm run dev
```

Then open `http://localhost:5173` and click the ⚡ button to see the DevTools in action.

## ⚙️ Configuration

```tsx
<NetworkDevTools
  position="bottom-right"        // 'bottom-left' | 'bottom-right'
  maxRequests={500}              // Max requests to store
  maxBodySize={1_000_000}        // Max response body size (bytes)
  slowRequestThreshold={1000}    // Mark slow requests (ms)
  captureBodies={true}           // Capture request/response bodies
  captureHeaders={true}          // Capture headers
  maskSensitiveData={true}       // Mask sensitive data
  defaultOpen={false}            // Start with panel open
/>
```

## 📦 What Gets Captured

✅ All fetch requests  
✅ All XMLHttpRequest (including Axios)  
✅ Request/response bodies  
✅ Headers  
✅ Timing & duration  
✅ Errors (4xx, 5xx, network errors)  
✅ Aborted requests  

## 🔒 Security

Sensitive data is automatically masked:
- `authorization`
- `cookie` / `set-cookie`
- `password`
- `token` / `access_token` / `refresh_token`
- `api_key` / `apikey`
- `secret`

Example:
```
Authorization: Bearer •••••••••••
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build
npm run build

# Type check
npm run typecheck
```

## 📋 Testing from GitHub

To test this package in your own project before npm publish:

### Option 1: Install via Git

```bash
npm install github:YOUR_USERNAME/react-network-devtools
```

### Option 2: Link Locally

```bash
# In this repo
npm link

# In your project
npm link react-network-devtools
```

### Option 3: Copy Files

Copy these folders into your project:
- `src/components/`
- `src/hooks/`
- `src/core/`
- `src/types/`
- `src/styles/`

Then import directly:
```tsx
import { NetworkDevTools } from './components/NetworkDevTools';
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © Your Name

## 🐛 Known Limitations (v0.1)

- Development only (not for production)
- No React Query/SWR/Apollo integration yet
- No request replay feature
- No network waterfall visualization

## 🗺️ Roadmap

- [ ] React Query integration
- [ ] Request replay
- [ ] Copy as cURL
- [ ] Network waterfall chart
- [ ] Performance profiling
- [ ] Chrome extension

## 📞 Support

- Open an issue on GitHub
- Questions? Ask in Discussions

---

**Made with ❤️ for React developers**
