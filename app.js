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

// Constants
const MIN_API_KEY_LENGTH = 40;

// DOM Elements
const enToThBtn = document.getElementById('enToTh');
const thToEnBtn = document.getElementById('thToEn');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const statusMsg = document.getElementById('statusMsg');
const inputLabel = document.getElementById('inputLabel');
const outputLabel = document.getElementById('outputLabel');

// Initialize
apiKeyInput.value = apiKey;

// Event Listeners
enToThBtn.addEventListener('click', () => {
    setDirection('en-th');
});

thToEnBtn.addEventListener('click', () => {
    setDirection('th-en');
});

translateBtn.addEventListener('click', translateText);

copyBtn.addEventListener('click', copyToClipboard);

saveApiKeyBtn.addEventListener('click', saveApiKey);

// Allow Enter key to trigger translation (with Shift+Enter for new line)
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        translateText();
    }
});

// Functions
function setDirection(direction) {
    currentDirection = direction;
    
    if (direction === 'en-th') {
        enToThBtn.classList.add('active');
        thToEnBtn.classList.remove('active');
        inputLabel.textContent = 'Enter English text:';
        outputLabel.textContent = 'Thai Translation:';
        inputText.placeholder = 'Type or paste English text here...';
    } else {
        thToEnBtn.classList.add('active');
        enToThBtn.classList.remove('active');
        inputLabel.textContent = 'Enter Thai text:';
        outputLabel.textContent = 'English Translation:';
        inputText.placeholder = 'พิมพ์หรือวางข้อความภาษาไทยที่นี่...';
    }
    
    // Clear previous translation
    outputText.textContent = '';
    copyBtn.style.display = 'none';
}

async function translateText() {
    const text = inputText.value.trim();
    
    if (!text) {
        showStatus('Please enter some text to translate.', 'error');
        return;
    }
    
    if (!apiKey) {
        showStatus('Please set your OpenAI API key in the settings below.', 'error');
        return;
    }
    
    // Show loading state
    translateBtn.disabled = true;
    translateBtn.classList.add('loading');
    outputText.textContent = '';
    copyBtn.style.display = 'none';
    
    try {
        const translation = await callOpenAI(text);
        outputText.textContent = translation;
        copyBtn.style.display = 'block';
        showStatus('Translation completed successfully!', 'success', 2000);
    } catch (error) {
        console.error('Translation error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        outputText.textContent = '';
    } finally {
        translateBtn.disabled = false;
        translateBtn.classList.remove('loading');
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
            model: 'gpt-4o',
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
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
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
            copyBtn.textContent = '✓ Copied';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
            }, 2000);
        })
        .catch(error => {
            console.error('Copy failed:', error);
            showStatus('Failed to copy to clipboard.', 'error');
        });
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
