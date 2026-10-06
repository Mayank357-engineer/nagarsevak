// ========================================================
// gemma.js — Jan Awaaz: LM Studio / Gemma AI Integration
// ========================================================

const GEMMA_BASE_URL = 'http://localhost:1234/v1';
const GEMMA_API_URL = `${GEMMA_BASE_URL}/chat/completions`;
const GEMMA_MODELS_URL = `${GEMMA_BASE_URL}/models`;
const GEMMA_MODEL = 'google/gemma-4-e2b';

let _gemmaAvailable = null;
let _gemmaCheckTime = 0;
let _gemmaModelId = GEMMA_MODEL;
let _gemmaConnectionError = '';

// ── Check if LM Studio is running ────────────────────────
async function isGemmaAvailable() {
  const now = Date.now();
  if (_gemmaAvailable !== null && (now - _gemmaCheckTime) < 30000) {
    return _gemmaAvailable;
  }
  try {
    const resp = await fetch(GEMMA_MODELS_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    if (!resp.ok) throw new Error(`LM Studio returned ${resp.status}`);
    const data = await resp.json();
    const models = Array.isArray(data.data) ? data.data : [];
    _gemmaModelId = models.find(model => model.id === GEMMA_MODEL)?.id || models[0]?.id || '';
    _gemmaAvailable = Boolean(_gemmaModelId);
    _gemmaConnectionError = _gemmaAvailable ? '' : 'LM Studio did not return any available models.';
  } catch (error) {
    _gemmaAvailable = false;
    _gemmaConnectionError = error.message;
  }
  _gemmaCheckTime = now;
  return _gemmaAvailable;
}

async function refreshGemmaStatus() {
  _gemmaAvailable = null;
  return isGemmaAvailable();
}

function getGemmaConnectionError() {
  return _gemmaConnectionError;
}

// ── Core API call ────────────────────────────────────────
async function callGemma(messages, temperature = 0.7, maxTokens = 1024) {
  if (!await isGemmaAvailable()) {
    throw new Error(_gemmaConnectionError || 'LM Studio is not available.');
  }
  const resp = await fetch(GEMMA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: _gemmaModelId,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false
    }),
    signal: AbortSignal.timeout(90000)
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Gemma API error (${resp.status}): ${detail.slice(0, 300)}`);
  }
  const data = await resp.json();
  const message = data.choices?.[0]?.message;
  const content = typeof message?.content === 'string'
    ? message.content.trim()
    : Array.isArray(message?.content)
      ? message.content.map(part => part.text || '').join('').trim()
      : '';
  if (!content) throw new Error('Gemma returned an empty reply. Check the model output and token limit.');
  return content;
}

async function testGemmaConnection() {
  const response = await callGemma([
    { role: 'system', content: 'Reply with exactly: JAN AWAAZ GEMMA CONNECTED' },
    { role: 'user', content: 'Confirm the connection.' }
  ], 0.1, 512);
  return { model: _gemmaModelId, response };
}

// ── 1. Analyze infrastructure image ─────────────────────
async function analyzeImage(imageBase64) {
  if (!imageBase64) throw new Error('A live camera photo is required for image analysis.');
  const messages = [
    {
      role: 'system',
      content: `Inspect photos for visible public infrastructure problems in India. Do not infer facts that cannot be seen. Return ONLY valid JSON with exactly these fields:
{"is_infrastructure_issue":true,"type":"pothole|broken_streetlight|overflowing_drain|burst_pipeline|garbage","severity":"high|medium|low","description_hindi":"short factual Hindi description","description_english":"short factual English description"}
If none of these problems is clearly visible, set is_infrastructure_issue to false, type to null, severity to "low", and briefly state that the image is unclear or unrelated in both descriptions. Severity guide: high means visible immediate safety/health danger; medium means meaningful hazard or obstruction; low means a minor visible issue.`
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Inspect this live camera photo. Is a listed public infrastructure issue clearly visible? Describe only what the image supports.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    }
  ];
  const result = await callGemma(messages, 0.2, 512);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemma did not return image-analysis JSON.');
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Gemma returned invalid image-analysis JSON: ${error.message}`);
  }
}

// ── 2. Read signboard from image ─────────────────────────
async function readSignboard(imageBase64, nearbyShops) {
  const available = await isGemmaAvailable();
  if (!available) return null;

  try {
    const shopList = nearbyShops.map(s => s.name).join(', ');
    const messages = [
      {
        role: 'system',
        content: `You read shop signboards from photos. If you can read any shop/business name signboard in the image, respond with ONLY the shop name. If it matches any of these nearby shops: [${shopList}], respond with the exact matching name. If no signboard is visible, respond with "NONE".`
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Can you read any shop signboard in this image?' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }
    ];
    const result = await callGemma(messages, 0.2, 100);
    if (result && result.trim() !== 'NONE') {
      const matched = nearbyShops.find(s => 
        result.toLowerCase().includes(s.name.toLowerCase()) || 
        s.name.toLowerCase().includes(result.trim().toLowerCase())
      );
      return matched ? matched.name : { read: result.trim(), verified: false };
    }
  } catch (e) {
    console.warn('Signboard reading failed:', e.message);
  }
  return null;
}

// ── 3. Polish user description ───────────────────────────
async function polishDescription(userText, originalAnalysis) {
  const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant. Take the user's description of a public infrastructure problem and:
1. Polish the language (make it clear, respectful, professional)
2. Remove any abusive, irrelevant, or offensive content
3. Keep the same language (Hindi or English) as the input
4. Keep it concise (2-4 sentences)
5. Do NOT change the factual content
Respond with ONLY the polished text, nothing else.`
      },
      {
        role: 'user',
        content: `Original AI analysis: ${originalAnalysis}\n\nUser's edited description:\n${userText}`
      }
  ];
  return callGemma(messages, 0.4, 256);
}

// ── 4. Moderate comment ──────────────────────────────────
async function moderateComment(text) {
  // First check local bad-word list
  if (containsBadWords(text)) {
    let cleaned = text;
    BAD_WORDS_HI.forEach(w => {
      const regex = new RegExp(w, 'gi');
      cleaned = cleaned.replace(regex, '***');
    });
    return { isClean: false, cleanedText: cleaned };
  }

  const messages = [
      {
        role: 'system',
        content: `Check if this text contains abuse, hate speech, irrelevant content, or offensive language (in Hindi, Hinglish, or English). Respond with JSON: {"isClean": true/false, "cleanedText": "cleaned version if not clean, or original if clean"}`
      },
      { role: 'user', content: text }
  ];
  const result = await callGemma(messages, 0.2, 256);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemma did not return moderation JSON.');
  }
  let moderation;
  try {
    moderation = JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Gemma returned invalid moderation JSON: ${error.message}`);
  }
  if (typeof moderation.isClean !== 'boolean' || typeof moderation.cleanedText !== 'string') {
    throw new Error('Gemma returned incomplete moderation data.');
  }
  return moderation;
}

// ── 5. Chatbot response ──────────────────────────────────
async function chatbotResponse(messages, lang = 'hi') {
  const systemMsg = lang === 'hi'
    ? `आप "जन आवाज़" ऐप के सहायक हैं। आप नागरिकों की सार्वजनिक बुनियादी ढांचे की समस्याओं (गड्ढे, टूटी लाइट, नाला, पाइपलाइन, कूड़ा) को समझने और रिपोर्ट करने में मदद करते हैं।
    
पूछें: 1) क्या समस्या है? 2) कहाँ है? 3) कितनी गंभीर है? 4) कब से है?
सरल हिंदी में बात करें। एक समय में एक छोटा सवाल पूछें। समस्या, जगह, अवधि और जोखिम समझने के बाद ही कहें "रिपोर्ट बनाने के लिए तैयार" और JSON दें: {"ready": true, "type": "...", "severity": "...", "description": "...", "landmark": "..."}। JSON के चारों ओर Markdown या code fence न दें।`
    : `You are the "Jan Awaaz" app assistant. You help citizens report public infrastructure problems (potholes, broken streetlights, drains, pipelines, garbage).

Ask one short question at a time to learn: what the problem is, where it is, how long it has existed, and the safety risk. When you have enough information, say "Ready to create report" and provide JSON: {"ready": true, "type": "...", "severity": "...", "description": "...", "landmark": "..."}.
Do not wrap the JSON in Markdown or code fences.`;

  const fullMessages = [
    { role: 'system', content: systemMsg },
    ...messages
  ];
  return callGemma(fullMessages, 0.4, 768);
}

// ── 6. Generate professional report text ─────────────────
async function generateReportText(analysis, address, landmark, lang = 'hi') {
  const typeLabel = lang === 'hi' ? REPORT_TYPES[analysis.type]?.hi : REPORT_TYPES[analysis.type]?.en;

  const prompt = lang === 'hi'
        ? `एक पेशेवर शिकायत रिपोर्ट लिखें (3-4 वाक्य, हिंदी में):
समस्या: ${typeLabel}
स्थान: ${address}
लैंडमार्क: ${landmark || 'N/A'}
गंभीरता: ${analysis.severity}
विवरण: ${analysis.description_hindi}`
        : `Write a professional complaint report (3-4 sentences, English):
Problem: ${typeLabel}
Location: ${address}
Landmark: ${landmark || 'N/A'}
Severity: ${analysis.severity}
Description: ${analysis.description_english || analysis.description_hindi}`;

  return callGemma([
    { role: 'system', content: 'You write concise, professional infrastructure complaint reports for Indian municipalities. Keep it factual and respectful. Do not add any facts not supplied by the user or photo analysis.' },
    { role: 'user', content: prompt }
  ], 0.5, 384);
}
