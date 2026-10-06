// ========================================================
// chatbot.js — Jan Awaaz: Guided Chatbot Module
// ========================================================

let chatMessages = [];
let chatInitialized = false;
let chatReportDraft = null;

function initChatbot() {
  if (chatInitialized) return;
  chatInitialized = true;

  const sendBtn = document.getElementById('chat-send-btn');
  const input = document.getElementById('chat-input');
  const micBtn = document.getElementById('chat-mic-btn');

  sendBtn.addEventListener('click', () => handleChatSend());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleChatSend(); });
  micBtn.addEventListener('click', () => handleChatVoice());

  // Send greeting
  const lang = localStorage.getItem('janawaaz_lang') || 'hi';
  const greeting = lang === 'hi'
    ? 'नमस्ते! 🙏 मैं जन आवाज़ सहायक हूँ। मैं आपकी समस्या समझने और रिपोर्ट बनाने में मदद करूँगा। बताइए, क्या परेशानी है?'
    : 'Hello! 🙏 I\'m the Jan Awaaz assistant. I\'ll help you understand your problem and create a report. What issue are you facing?';
  renderChatMessage(greeting, 'bot');
  renderQuickReplies();
}

function handleChatSend() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  renderChatMessage(text, 'user');
  chatMessages.push({ role: 'user', content: text });

  showChatTyping();
  const sendBtn = document.getElementById('chat-send-btn');
  const micBtn = document.getElementById('chat-mic-btn');
  sendBtn.disabled = true;
  micBtn.disabled = true;

  const lang = localStorage.getItem('janawaaz_lang') || 'hi';
  chatbotResponse(chatMessages, lang).then(response => {
    hideChatTyping();
    renderChatMessage(response, 'bot');
    chatMessages.push({ role: 'assistant', content: response });

    // Check if chatbot says report is ready
    try {
      const jsonMatch = response.match(/\{[\s\S]*"ready"\s*:\s*true[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
          const type = Object.keys(REPORT_TYPES).find(key =>
            key.toLowerCase() === String(data.type).toLowerCase() ||
            REPORT_TYPES[key].en.toLowerCase() === String(data.type).toLowerCase()
          );
          const severity = Object.keys(SEVERITY_CONFIG).find(key =>
            key.toLowerCase() === String(data.severity).toLowerCase()
          );
          if (!type || !severity || typeof data.description !== 'string' || !data.description.trim()) {
            throw new Error('Assistant report summary is missing valid type, severity, or description.');
          }
          chatReportDraft = {
            ready: true,
            type,
            severity,
            description: data.description.trim(),
            landmark: typeof data.landmark === 'string' ? data.landmark.trim() : ''
          };
          renderChatReportButton(data);
        }
    } catch (error) {
        console.warn('Could not read the assistant report summary:', error);
    }

    renderQuickReplies();
  }).catch(error => {
    hideChatTyping();
    console.error('Assistant response failed:', error);
    renderChatMessage(
      lang === 'hi'
        ? `Gemma से जवाब नहीं मिला। LM Studio server और CORS जाँचें। (${error.message})`
        : `Could not get a Gemma reply. Check the LM Studio server and CORS. (${error.message})`,
      'bot'
    );
  }).finally(() => {
    sendBtn.disabled = false;
    micBtn.disabled = false;
  });
}

function handleChatVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    const lang = localStorage.getItem('janawaaz_lang') || 'hi';
    showToast(lang === 'hi' ? 'आपका ब्राउज़र वॉइस सपोर्ट नहीं करता' : 'Your browser does not support voice input');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  const lang = localStorage.getItem('janawaaz_lang') || 'hi';
  recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  recognition.interimResults = false;

  const micBtn = document.getElementById('chat-mic-btn');
  micBtn.classList.add('recording');
  micBtn.innerHTML = '<span class="material-icons">mic</span>';

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById('chat-input').value = text;
    micBtn.classList.remove('recording');
    handleChatSend();
  };

  recognition.onerror = () => {
    micBtn.classList.remove('recording');
    showToast(lang === 'hi' ? 'वॉइस पहचान विफल' : 'Voice recognition failed');
  };

  recognition.onend = () => { micBtn.classList.remove('recording'); };

  recognition.start();
}

function renderChatMessage(text, sender) {
  const container = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  // Simple markdown-like formatting
  let formatted = text
    .replace(/\{[\s\S]*?"ready"\s*:\s*true[\s\S]*?\}/g, '')
    .replace(/```(?:json)?/gi, '')
    .trim();
  formatted = escapeChatHTML(formatted)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  bubble.innerHTML = `
    <div class="bubble-content">${formatted}</div>
    <div class="bubble-time">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function escapeChatHTML(text) {
  return text.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function renderQuickReplies() {
  const container = document.getElementById('chat-quick-replies');
  container.innerHTML = '';

  const lang = localStorage.getItem('janawaaz_lang') || 'hi';
  const userMsgCount = chatMessages.filter(m => m.role === 'user').length;

  let replies = [];
  if (lang === 'hi') {
    if (userMsgCount === 0) {
      replies = ['गड्ढा है 🕳️', 'लाइट खराब है 💡', 'नाला भरा है 🌊', 'पाइप टूटा है 💧', 'कूड़ा जमा है 🗑️'];
    } else if (userMsgCount === 1) {
      replies = ['मुख्य सड़क पर', 'गली में', 'बाज़ार के पास'];
    } else if (userMsgCount === 2) {
      replies = ['🔴 बहुत गंभीर', '🟡 मध्यम', '🟢 छोटी समस्या'];
    }
  } else {
    if (userMsgCount === 0) {
      replies = ['Pothole 🕳️', 'Broken Light 💡', 'Drain Issue 🌊', 'Pipeline Leak 💧', 'Garbage 🗑️'];
    } else if (userMsgCount === 1) {
      replies = ['On main road', 'In the lane', 'Near market'];
    } else if (userMsgCount === 2) {
      replies = ['🔴 Very Serious', '🟡 Medium', '🟢 Minor Issue'];
    }
  }

  replies.forEach(text => {
    const chip = document.createElement('button');
    chip.className = 'quick-reply-chip';
    chip.textContent = text;
    chip.onclick = () => {
      document.getElementById('chat-input').value = text;
      handleChatSend();
    };
    container.appendChild(chip);
  });
}

function renderChatReportButton(data) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-action-btn-wrap';
  const lang = localStorage.getItem('janawaaz_lang') || 'hi';
  div.innerHTML = `<button class="btn-primary chat-create-report" onclick="switchToReportFromChat()">
    <span class="material-icons">camera_alt</span>
    ${lang === 'hi' ? 'फोटो लेकर रिपोर्ट बनाएँ' : 'Take Photo & Create Report'}
  </button>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function switchToReportFromChat() {
  window.janAwaazChatDraft = chatReportDraft;
  switchTab('report');
}

function showChatTyping() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-bubble bot typing-indicator';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="bubble-content"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideChatTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function resetChatbot() {
  chatMessages = [];
  chatInitialized = false;
  chatReportDraft = null;
  const container = document.getElementById('chat-messages');
  if (container) container.innerHTML = '';
  const qr = document.getElementById('chat-quick-replies');
  if (qr) qr.innerHTML = '';
}
