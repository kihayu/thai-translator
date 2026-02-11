# Thai Translator 🇹🇭

A mobile-optimized Progressive Web App (PWA) for translating text between English and Thai using OpenAI's GPT technology.

## Features

- ✨ **Bidirectional Translation**: Translate from English to Thai and vice versa
- 📱 **Mobile-Optimized**: Responsive design optimized for mobile phones
- 🚀 **PWA Support**: Install on your phone for quick access like a native app
- 🔒 **Privacy-First**: Your API key is stored locally in your browser
- 💨 **Fast & Simple**: Clean interface focused on translation
- 📴 **Offline Ready**: Service worker caching for faster load times

## Getting Started

### 1. Get an OpenAI API Key

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Navigate to API keys section
3. Create a new API key (starts with `sk-`)

### 2. Use the Website

#### Option A: Deploy to GitHub Pages

1. Go to your repository Settings
2. Navigate to Pages
3. Select the branch (usually `main`) and root folder
4. Save and wait for deployment
5. Access your site at `https://yourusername.github.io/thai-translator/`

#### Option B: Run Locally

1. Clone this repository
2. Open `index.html` in a web browser
3. Or use a simple HTTP server:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   ```
4. Open `http://localhost:8000` in your browser

### 3. Configure API Key

1. Open the website
2. Click on "⚙️ API Settings"
3. Paste your OpenAI API key
4. Click "Save Key"

Your API key is stored securely in your browser's local storage and is never sent anywhere except directly to OpenAI.

## Installing as PWA on Mobile

### iOS (iPhone/iPad)
1. Open the website in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it and tap "Add"

### Android
1. Open the website in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Confirm the installation

## Usage

1. Select translation direction (English → Thai or Thai → English)
2. Type or paste your text
3. Click "Translate" or press Enter
4. Copy the translation with the copy button

## Privacy & Security

- Your API key is stored only in your browser's local storage
- No data is sent to any server except OpenAI
- All translations are processed through OpenAI's API
- The app works entirely client-side

## Technologies Used

- HTML5, CSS3, JavaScript (Vanilla)
- OpenAI GPT-3.5-turbo API
- Service Workers for PWA functionality
- Local Storage for API key management

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.