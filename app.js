// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// App State
let currentDirection = 'en-th'; // 'en-th' or 'th-en'
let apiKey = localStorage.getItem('openai_api_key') || '';
let darkMode = localStorage.getItem('dark_mode') === 'true';

// Constants
const MIN_API_KEY_LENGTH = 40;
const MAX_CHAR_COUNT = 5000;

// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const statusMsg = document.getElementById('statusMsg');
const swapBtn = document.getElementById('swapBtn');
const sourceLangText = document.getElementById('sourceLangText');
const targetLangText = document.getElementById('targetLangText');
const charCount = document.getElementById('charCount');
const loadingIndicator = document.getElementById('loadingIndicator');
const themeToggle = document.getElementById('themeToggle');
const fullscreenView = document.getElementById('fullscreenView');
const fullscreenText = document.getElementById('fullscreenText');
const exitFullscreen = document.getElementById('exitFullscreen');

// Initialize
apiKeyInput.value = apiKey;
updateLanguageLabels();
updateCharCount();

// Apply saved theme
if (darkMode) {
    document.body.classList.add('dark-mode');
}

// Event Listeners
swapBtn.addEventListener('click', swapLanguages);
translateBtn.addEventListener('click', translateText);
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearInput);
fullscreenBtn.addEventListener('click', enterFullscreen);
exitFullscreen.addEventListener('click', exitFullscreenMode);
saveApiKeyBtn.addEventListener('click', saveApiKey);
themeToggle.addEventListener('click', toggleTheme);

// Character count
inputText.addEventListener('input', () => {
    updateCharCount();
    // Clear output when input changes
    outputText.textContent = '';
    copyBtn.style.display = 'none';
    fullscreenBtn.style.display = 'none';
});

// Allow Enter key to trigger translation (with Shift+Enter for new line)
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
        e.preventDefault();
        translateText();
    }
});

// Functions
function updateLanguageLabels() {
    if (currentDirection === 'en-th') {
        sourceLangText.textContent = 'English';
        targetLangText.textContent = 'Thai';
        inputText.placeholder = 'Enter text';
    } else {
        sourceLangText.textContent = 'Thai';
        targetLangText.textContent = 'English';
        inputText.placeholder = 'ป้อนข้อความ';
    }
}

function swapLanguages() {
    currentDirection = currentDirection === 'en-th' ? 'th-en' : 'en-th';
    updateLanguageLabels();
    
    // Swap input and output
    const inputValue = inputText.value;
    const outputValue = outputText.textContent;
    inputText.value = outputValue;
    outputText.textContent = inputValue;
    
    // Update UI
    updateCharCount();
    if (outputValue) {
        copyBtn.style.display = 'block';
        fullscreenBtn.style.display = 'block';
    } else {
        copyBtn.style.display = 'none';
        fullscreenBtn.style.display = 'none';
    }
}

function updateCharCount() {
    const count = inputText.value.length;
    charCount.textContent = `${count} / ${MAX_CHAR_COUNT}`;
    
    if (count > MAX_CHAR_COUNT) {
        charCount.style.color = 'var(--error-color)';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
}

function clearInput() {
    inputText.value = '';
    updateCharCount();
    outputText.textContent = '';
    copyBtn.style.display = 'none';
    fullscreenBtn.style.display = 'none';
}

async function translateText() {
    const text = inputText.value.trim();
    
    if (!text) {
        showStatus('Please enter some text to translate.', 'error');
        return;
    }
    
    if (text.length > MAX_CHAR_COUNT) {
        showStatus(`Text is too long. Maximum ${MAX_CHAR_COUNT} characters allowed.`, 'error');
        return;
    }
    
    if (!apiKey) {
        showStatus('Please set your OpenAI API key in the settings below.', 'error');
        return;
    }
    
    // Show loading state
    translateBtn.disabled = true;
    loadingIndicator.classList.add('active');
    outputText.textContent = '';
    copyBtn.style.display = 'none';
    fullscreenBtn.style.display = 'none';
    
    try {
        const translation = await callOpenAI(text);
        outputText.textContent = translation;
        copyBtn.style.display = 'block';
        fullscreenBtn.style.display = 'block';
        showStatus('Translation completed successfully!', 'success', 2000);
    } catch (error) {
        console.error('Translation error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        outputText.textContent = '';
    } finally {
        translateBtn.disabled = false;
        loadingIndicator.classList.remove('active');
    }
}

async function callOpenAI(text) {
    const systemPrompt = currentDirection === 'en-th'
        ? 'You are a professional translator. Translate the following English text to Thai. Provide only the translation without any explanations or additional text.'
        : 'You are a professional translator. Translate the following Thai text to English. Provide only the translation without any explanations or additional text.';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-5.2',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_completion_tokens: 1000
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message;
        
        // Provide user-friendly error messages based on status code
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
        } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status >= 500) {
            throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
        } else {
            throw new Error(errorMessage || `API request failed with status ${response.status}`);
        }
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.choices?.[0]?.message?.content) {
        throw new Error('Unexpected API response format. Please try again.');
    }
    
    return data.choices[0].message.content.trim();
}

function copyToClipboard() {
    const text = outputText.textContent;
    
    if (!text) return;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showStatus('Copied to clipboard!', 'success', 2000);
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>`;
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        })
        .catch(error => {
            console.error('Copy failed:', error);
            showStatus('Failed to copy to clipboard.', 'error');
        });
}

function enterFullscreen() {
    const text = outputText.textContent;
    if (!text) return;
    
    fullscreenText.textContent = text;
    fullscreenView.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function exitFullscreenMode() {
    fullscreenView.classList.remove('active');
    document.body.style.overflow = '';
}

// Close fullscreen on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenView.classList.contains('active')) {
        exitFullscreenMode();
    }
});

function toggleTheme() {
    darkMode = !darkMode;
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('dark_mode', darkMode);
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    
    if (!key) {
        showStatus('Please enter an API key.', 'error');
        return;
    }
    
    if (!key.startsWith('sk-')) {
        showStatus('Invalid API key format. OpenAI keys start with "sk-".', 'error');
        return;
    }
    
    // Additional validation: OpenAI API keys typically have a minimum length
    if (key.length < MIN_API_KEY_LENGTH) {
        showStatus('API key appears too short. Please check and try again.', 'error');
        return;
    }
    
    apiKey = key;
    localStorage.setItem('openai_api_key', key);
    showStatus('API key saved successfully!', 'success', 2000);
}

function showStatus(message, type = 'info', duration = 5000) {
    statusMsg.textContent = message;
    statusMsg.className = `status-msg show ${type}`;
    
    if (duration > 0) {
        setTimeout(() => {
            statusMsg.classList.remove('show');
        }, duration);
    }
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner if desired
    console.log('PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
});
