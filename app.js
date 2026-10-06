// ========================================================
// app.js — Jan Awaaz: Core Application Logic
// ========================================================

// ── State ────────────────────────────────────────────────
let currentTab = 'feed';
let currentLang = localStorage.getItem('janawaaz_lang') || 'hi';
let userLat = 26.9124;  // Default: Jaipur
let userLng = 75.7873;
let currentRadius = 5;
let map = null;
let adminMap = null;
let markersLayer = null;
let adminMarkersLayer = null;
let reportStep = 1;
let capturedPhoto = null;
let capturedLat = null;
let capturedLng = null;
let capturedAccuracy = null;
let selectedShop = '';
let nearbyShops = [];
let shopVerification = { verified: false, signboard: '' };
let aiAnalysis = null;
let isAdminLoggedIn = false;
let cameraStream = null;
let claimCameraStream = null;
let claimReportId = null;
let claimProofPhoto = null;
let claimProofLat = null;
let claimProofLng = null;

// ── Translations ─────────────────────────────────────────
const T = {
  hi: {
    home: 'होम', report: 'शिकायत करें', help: 'मदद', profile: 'प्रोफाइल',
    nearbyReports: '📋 आस-पास की शिकायतें', searchArea: 'दूसरा इलाका खोजें...',
    search: 'खोजें', noReports: 'इस इलाके में कोई शिकायत नहीं',
    step1Title: '📸 फोटो लें', step2Title: '📍 स्थान की पुष्टि करें', step3Title: '🤖 AI विश्लेषण',
    welcomeTag: 'आपकी आवाज़, आपका इलाका', welcomeLine: 'शहर और गाँव — सुरक्षित रास्ते, बेहतर सुविधाएँ।',
    radiusLabel: 'दूरी चुनें', cameraHelp: 'समस्या की साफ़ तस्वीर लें। गैलरी से फोटो नहीं जोड़ी जा सकती।',
    locationHelp: 'पता और पास की जगह की पुष्टि करें। जरूरत हो तो बोलकर लैंडमार्क जोड़ें।',
    lockedHelp: 'समस्या का प्रकार, गंभीरता, फोटो और स्थान बदले नहीं जा सकते। विवरण साफ़ और तथ्यात्मक रखें।',
    chatHelp: 'समस्या, जगह और जोखिम समझने के लिए हिंदी या English में लिखें या बोलें।',
    chatPlaceholder: 'अपनी समस्या बताएं...',
    profilePrivacy: 'आपकी असली पहचान सार्वजनिक नहीं होती।', demoOnly: 'डेमो · रिपोर्ट केवल इस डिवाइस पर सेव होती हैं',
    distance: '5 किमी',
    assistantTitle: 'जन आवाज़ सहायक',
    captureBtn: 'फोटो खींचें', recaptureBtn: 'दोबारा लें', nextBtn: 'आगे बढ़ें',
    backBtn: 'पीछे जाएं', submitBtn: '✅ शिकायत दर्ज करें',
    gpsWait: 'GPS स्थान ले रहे हैं...', gpsOk: 'स्थान मिला',
    gpsError: 'GPS नहीं मिला', nearShop: 'किस दुकान के पास?',
    otherLandmark: 'अन्य लैंडमार्क (वैकल्पिक)', analyzing: 'AI फोटो का विश्लेषण कर रहा है...',
    detectedType: 'पहचानी गई समस्या', severity: 'गंभीरता', editDesc: 'विवरण संपादित करें (वैकल्पिक)',
    duplicateTitle: '⚠️ पहले से रिपोर्ट है!', duplicateMsg: 'यही समस्या पास में पहले ही रिपोर्ट की जा चुकी है।',
    repostBtn: '🔄 रीपोस्ट: अभी ठीक नहीं हुआ', successMsg: '✅ शिकायत सफलतापूर्वक दर्ज!',
    adminLogin: '🔐 एडमिन लॉगिन', login: 'लॉगिन', username: 'यूज़रनेम', password: 'पासवर्ड',
    totalReports: 'कुल शिकायतें', solved: 'हल %', avgTime: 'औसत समय (दिन)', activeReports: 'सक्रिय',
    loginError: 'गलत यूज़रनेम या पासवर्ड', myReports: 'मेरी शिकायतें',
    like: 'पसंद', dislike: 'नापसंद', repost: 'रीपोस्ट', share: 'शेयर',
    reportDetail: 'शिकायत विवरण', authority: 'जिम्मेदार अधिकारी', contact: 'संपर्क',
    status: 'स्थिति', admin: 'एडमिन', logout: 'लॉगआउट', updateStatus: 'स्थिति बदलें',
    citizenInitiative: 'यह एक नागरिक पहल है, सरकारी वेबसाइट नहीं',
    citizenInitiativeEn: 'This is a citizen initiative, NOT a government website',
    gemmaOnline: 'Gemma AI ऑनलाइन', gemmaOffline: 'Gemma AI ऑफलाइन',
    gemmaTest: 'Gemma जाँचें', gemmaTesting: 'Gemma से जवाब माँग रहे हैं...', gemmaTestOk: 'Gemma ने जवाब दिया',
    alreadyDone: 'आप पहले ही यह कर चुके हैं'
  },
  en: {
    home: 'Home', report: 'Report', help: 'Help', profile: 'Profile',
    nearbyReports: '📋 Nearby Reports', searchArea: 'Search another area...',
    search: 'Search', noReports: 'No reports in this area',
    step1Title: '📸 Take Photo', step2Title: '📍 Confirm Location', step3Title: '🤖 AI Analysis',
    welcomeTag: 'Your voice, your neighbourhood', welcomeLine: 'Cities and villages — safer streets, better services.',
    radiusLabel: 'Choose radius', cameraHelp: 'Take a clear photo of the issue. Gallery uploads are not allowed.',
    locationHelp: 'Confirm the address and a nearby place. You can speak a landmark if needed.',
    lockedHelp: 'Issue type, severity, photo and location are locked. Keep your description clear and factual.',
    chatHelp: 'Type or speak in Hindi or English to describe the issue, location and risk.',
    chatPlaceholder: 'Describe the issue...',
    profilePrivacy: 'Your real identity is not shown publicly.', demoOnly: 'Demo · Reports are stored on this device',
    distance: '5 km',
    assistantTitle: 'Jan Awaaz Assistant',
    captureBtn: 'Capture Photo', recaptureBtn: 'Retake', nextBtn: 'Next',
    backBtn: 'Back', submitBtn: '✅ Submit Report',
    gpsWait: 'Getting GPS location...', gpsOk: 'Location found',
    gpsError: 'GPS not available', nearShop: 'Near which shop?',
    otherLandmark: 'Other landmark (optional)', analyzing: 'AI analyzing photo...',
    detectedType: 'Detected Issue', severity: 'Severity', editDesc: 'Edit description (optional)',
    duplicateTitle: '⚠️ Already Reported!', duplicateMsg: 'This issue has already been reported nearby.',
    repostBtn: '🔄 Repost: Still not fixed', successMsg: '✅ Report submitted successfully!',
    adminLogin: '🔐 Admin Login', login: 'Login', username: 'Username', password: 'Password',
    totalReports: 'Total Reports', solved: 'Solved %', avgTime: 'Avg Time (days)', activeReports: 'Active',
    loginError: 'Wrong username or password', myReports: 'My Reports',
    like: 'Like', dislike: 'Dislike', repost: 'Repost', share: 'Share',
    reportDetail: 'Report Details', authority: 'Responsible Authority', contact: 'Contact',
    status: 'Status', admin: 'Admin', logout: 'Logout', updateStatus: 'Update Status',
    citizenInitiative: 'This is a citizen initiative, NOT a government website',
    citizenInitiativeEn: 'This is a citizen initiative, NOT a government website',
    gemmaOnline: 'Gemma AI Online', gemmaOffline: 'Gemma AI Offline',
    gemmaTest: 'Test Gemma', gemmaTesting: 'Waiting for Gemma reply...', gemmaTestOk: 'Gemma replied',
    alreadyDone: 'You already did this'
  }
};

function t(key) { return T[currentLang][key] || T['en'][key] || key; }

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function reportStatusLabel(report) {
  const overdueUnverifiedClaim = report.status === 'claimed_done' && report.resolvedAt &&
    Date.now() - report.resolvedAt > 7 * 86400000 &&
    (report.verifications || 0) < requiredVerifications(report);
  if (overdueUnverifiedClaim) {
    return currentLang === 'hi' ? 'बिना सत्यापन का दावा' : 'Unverified claim';
  }
  return currentLang === 'hi' ? STATUS_CONFIG[report.status].hi : STATUS_CONFIG[report.status].en;
}

// ── Initialization ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initData();
  updateLangUI();
  const userHandle = document.getElementById('user-handle');
  if (userHandle) userHandle.textContent = getCurrentUser().handle;
  initMap();
  getUserLocation();
  checkGemmaStatus();
  setupEventListeners();
  loadFeed();
});

function setupEventListeners() {
  // Language toggle
  document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);
  document.getElementById('gemma-test-btn')?.addEventListener('click', testGemmaFromUI);

  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // Admin link
  document.getElementById('admin-link')?.addEventListener('click', () => switchTab('admin'));

  // Admin login
  document.getElementById('admin-login-form-fields')?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleAdminLogin();
  });
  document.getElementById('admin-logout-btn')?.addEventListener('click', handleAdminLogout);
  document.getElementById('claim-capture-btn')?.addEventListener('click', captureClaimProof);
  document.getElementById('claim-confirm-btn')?.addEventListener('click', confirmClaimProof);
  document.getElementById('claim-cancel-btn')?.addEventListener('click', closeClaimProof);
  document.getElementById('claim-proof-close')?.addEventListener('click', closeClaimProof);

  // Report flow
  document.getElementById('capture-btn')?.addEventListener('click', capturePhoto);
  document.getElementById('recapture-btn')?.addEventListener('click', startCamera);
  document.getElementById('step1-next')?.addEventListener('click', () => goToReportStep(2));
  document.getElementById('step2-next')?.addEventListener('click', () => goToReportStep(3));
  document.getElementById('step2-back')?.addEventListener('click', () => goToReportStep(1));
  document.getElementById('step3-back')?.addEventListener('click', () => goToReportStep(2));
  document.getElementById('submit-report-btn')?.addEventListener('click', submitReport);

  // Voice input for landmark
  document.getElementById('landmark-mic')?.addEventListener('click', handleLandmarkVoice);

  // Search area
  document.getElementById('search-btn')?.addEventListener('click', searchArea);
  document.getElementById('search-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchArea(); });

  // Radius chips
  document.querySelectorAll('.radius-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.radius-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentRadius = parseInt(chip.dataset.radius);
      loadFeed();
    });
  });

  // Modal close
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('active');
    });
  });

  // Admin filters
  document.getElementById('admin-type-filter')?.addEventListener('change', renderAdminTable);
  document.getElementById('admin-status-filter')?.addEventListener('change', renderAdminTable);
  document.getElementById('admin-severity-filter')?.addEventListener('change', renderAdminTable);
}

// ── Language ─────────────────────────────────────────────
function toggleLanguage() {
  currentLang = currentLang === 'hi' ? 'en' : 'hi';
  localStorage.setItem('janawaaz_lang', currentLang);
  updateLangUI();
  checkGemmaStatus();
  loadFeed();
}

function updateLangUI() {
  const btn = document.getElementById('lang-toggle');
  btn.textContent = currentLang === 'hi' ? 'English' : 'हिंदी';

  // Update all data-t elements
  document.querySelectorAll('[data-t]').forEach(el => {
    el.textContent = t(el.dataset.t);
  });
  document.querySelectorAll('[data-t-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.tPlaceholder);
  });
}

// ── Map ──────────────────────────────────────────────────
function initMap() {
  map = L.map('map').setView([userLat, userLng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function updateMap(reports) {
  markersLayer.clearLayers();

  // User location marker
  const userIcon = L.divIcon({
    className: 'user-marker',
    html: '<div style="width:14px;height:14px;background:#2196F3;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(33,150,243,0.5)"></div>',
    iconSize: [14, 14]
  });
  L.marker([userLat, userLng], { icon: userIcon }).addTo(markersLayer).bindPopup(currentLang === 'hi' ? '📍 आपका स्थान' : '📍 Your Location');

  reports.forEach(r => {
    const typeInfo = REPORT_TYPES[r.type];
    const icon = L.divIcon({
      className: 'report-marker',
      html: `<div style="font-size:24px;text-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer">${typeInfo.emoji}</div>`,
      iconSize: [32, 32]
    });

    const statusLabel = reportStatusLabel(r);
    const typeLabel = currentLang === 'hi' ? typeInfo.hi : typeInfo.en;

    L.marker([r.location.lat, r.location.lng], { icon })
      .addTo(markersLayer)
      .bindPopup(`
        <div style="min-width:180px">
          <strong>${typeInfo.emoji} ${typeLabel}</strong><br>
          <span style="color:${STATUS_CONFIG[r.status].color};font-weight:600">${statusLabel}</span><br>
          <small>${escapeHTML(r.location.address)}</small><br>
          <button onclick="openReportDetail('${r.id}')" style="margin-top:6px;padding:4px 10px;background:#FF9933;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.75rem">${currentLang === 'hi' ? 'विवरण देखें' : 'View Details'}</button>
        </div>
      `);
  });

  if (reports.length > 0) {
    const bounds = reports.map(r => [r.location.lat, r.location.lng]);
    bounds.push([userLat, userLng]);
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

// ── Location ─────────────────────────────────────────────
function getUserLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        map.setView([userLat, userLng], 13);
        loadFeed();
      },
      () => { loadFeed(); }, // Use defaults
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    loadFeed();
  }
}

// ── Feed ─────────────────────────────────────────────────
function loadFeed() {
  const reports = getReportsInRadius(userLat, userLng, currentRadius);
  updateMap(reports);
  renderReportsList(reports);
}

function renderReportsList(reports) {
  const container = document.getElementById('reports-list');

  if (!reports.length) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons">search_off</span><p>${t('noReports')}</p></div>`;
    return;
  }

  // Sort: newest first
  reports.sort((a, b) => b.createdAt - a.createdAt);

  container.innerHTML = reports.map(r => renderReportCard(r)).join('');
}

function renderReportCard(r) {
  const typeInfo = REPORT_TYPES[r.type];
  const typeLabel = currentLang === 'hi' ? typeInfo.hi : typeInfo.en;
  const sevLabel = currentLang === 'hi' ? SEVERITY_CONFIG[r.severity].hi : SEVERITY_CONFIG[r.severity].en;
  const statusLabel = reportStatusLabel(r);
  const desc = currentLang === 'hi' ? r.description_hi : r.description_en;
  const reportText = currentLang === 'hi' ? r.reportText_hi : r.reportText_en;
  const authType = r.authority.type === 'gram_panchayat'
    ? (currentLang === 'hi' ? 'ग्राम पंचायत' : 'Gram Panchayat')
    : (currentLang === 'hi' ? 'नगर पालिका' : 'Nagar Palika');
  const timeAgo = formatTimeAgo(r.createdAt);

  const likedClass = hasInteracted(r.id, 'like') ? 'liked' : '';
  const dislikedClass = hasInteracted(r.id, 'dislike') ? 'disliked' : '';
  const repostedClass = hasInteracted(r.id, 'repost') ? 'reposted' : '';

  return `
    <div class="report-card" data-id="${r.id}">
      <img class="report-card-photo" src="${r.photo}" alt="${typeLabel}" onclick="openReportDetail('${r.id}')" loading="lazy" onerror="this.src='https://picsum.photos/seed/${r.id}/400/300'">
      <div class="report-card-body">
        <div class="report-meta">
          <span class="type-badge">${typeInfo.emoji} ${typeLabel}</span>
          <span class="severity-badge ${r.severity}">${sevLabel}</span>
          <span class="status-badge ${r.status}">${statusLabel}</span>
        </div>
        <p class="report-description">${escapeHTML(reportText || r.reportText || desc)}</p>
        <div class="report-location">
          <span class="material-icons">location_on</span>
          <span>${escapeHTML(r.location.address)}${r.location.nearbyShop ? ` • ${escapeHTML(r.location.nearbyShop)}` : ''}</span>
        </div>
        ${r.location.shopVerified !== undefined ? `<div class="verification-note ${r.location.shopVerified ? 'verified' : ''}">${r.location.shopVerified ? (currentLang === 'hi' ? 'दुकान का बोर्ड मिलान हुआ' : 'Shop signboard matched') : (currentLang === 'hi' ? 'दुकान/लैंडमार्क अप्रमाणित' : 'Nearby place unverified')}</div>` : ''}
        <div class="report-authority">
          <span class="material-icons">account_balance</span>
          <div>
            <strong>${escapeHTML(r.authority.name)}</strong> (${authType})<br>
            ${r.authority.contact ? `<a href="tel:${escapeHTML(r.authority.contact)}">📞 ${escapeHTML(r.authority.contact)}</a>` : `<span>📞 ${currentLang === 'hi' ? 'डेमो में नंबर उपलब्ध नहीं' : 'Contact directory not configured in demo'}</span>`}
          </div>
        </div>
        <div class="report-actions">
          <button class="action-btn ${likedClass}" onclick="handleLike('${r.id}')">
            <span class="material-icons">thumb_up</span> ${r.likes}
          </button>
          <button class="action-btn ${dislikedClass}" onclick="handleDislike('${r.id}')">
            <span class="material-icons">thumb_down</span> ${r.dislikes}
          </button>
          <button class="action-btn ${repostedClass}" onclick="handleRepost('${r.id}')">
            <span class="material-icons">repeat</span> ${r.reposts}
          </button>
          ${r.status === 'claimed_done' ? `<button class="action-btn verify-btn ${hasInteracted(r.id, 'verify') ? 'reposted' : ''}" onclick="confirmReportVerification('${r.id}')" ${hasInteracted(r.id, 'verify') ? 'disabled' : ''}><span class="material-icons">verified</span>${r.verifications || 0}/${requiredVerifications(r)}</button>` : ''}
          <button class="action-btn share-btn" onclick="handleShare('${r.id}')">
            <span class="material-icons">share</span>
          </button>
        </div>
        <div class="report-time">${timeAgo}</div>
      </div>
    </div>
  `;
}

// ── Interactions ─────────────────────────────────────────
function handleLike(id) {
  if (!likeReport(id)) { showToast(t('alreadyDone')); return; }
  loadFeed();
}

function handleDislike(id) {
  if (!dislikeReport(id)) { showToast(t('alreadyDone')); return; }
  loadFeed();
}

function handleRepost(id) {
  if (!repostReport(id)) { showToast(t('alreadyDone')); return; }
  showToast(currentLang === 'hi' ? '🔄 रीपोस्ट किया गया' : '🔄 Reposted');
  loadFeed();
}

function handleShare(id) {
  const r = getReportById(id);
  if (!r) return;
  const link = generateWhatsAppShareLink(r);
  window.open(link, '_blank');
}

function confirmReportVerification(id) {
  const report = getReportById(id);
  if (!report || report.status !== 'claimed_done') return;
  if (Date.now() - report.resolvedAt > 7 * 86400000) {
    showToast(currentLang === 'hi' ? 'सत्यापन की 7 दिन की अवधि समाप्त हो गई' : 'The 7-day verification period has expired');
    loadFeed();
    return;
  }
  if (!navigator.geolocation) {
    showToast(currentLang === 'hi' ? 'सत्यापन के लिए GPS ज़रूरी है' : 'GPS is required to verify');
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const distance = haversineDistance(position.coords.latitude, position.coords.longitude, report.location.lat, report.location.lng);
    if (distance > 500) {
      showToast(currentLang === 'hi' ? 'आप रिपोर्ट की जगह से 500 मीटर से अधिक दूर हैं' : 'You are more than 500 metres from this report');
      return;
    }
    if (!verifyReport(id)) {
      showToast(t('alreadyDone'));
      return;
    }
    showToast(currentLang === 'hi' ? 'सुधार की पुष्टि दर्ज हुई' : 'Your verification was recorded');
    loadFeed();
    if (isAdminLoggedIn) renderAdminDashboard();
  }, (error) => {
    console.error('Verification location lookup failed:', error);
    showToast(currentLang === 'hi' ? 'वर्तमान GPS स्थान नहीं मिला' : 'Could not get your current GPS location');
  }, { enableHighAccuracy: true, timeout: 15000 });
}

// ── Report Detail Modal ──────────────────────────────────
function openReportDetail(id) {
  const r = getReportById(id);
  if (!r) return;

  const typeInfo = REPORT_TYPES[r.type];
  const typeLabel = currentLang === 'hi' ? typeInfo.hi : typeInfo.en;
  const sevLabel = currentLang === 'hi' ? SEVERITY_CONFIG[r.severity].hi : SEVERITY_CONFIG[r.severity].en;
  const statusLabel = reportStatusLabel(r);
  const desc = currentLang === 'hi' ? r.description_hi : r.description_en;

  const body = document.getElementById('detail-modal-body');
  body.innerHTML = `
    <img src="${r.photo}" alt="${typeLabel}" style="width:100%;border-radius:8px;margin-bottom:12px" onerror="this.src='https://picsum.photos/seed/${r.id}/400/300'">
    <div class="report-meta" style="margin-bottom:12px">
      <span class="type-badge">${typeInfo.emoji} ${typeLabel}</span>
      <span class="severity-badge ${r.severity}">${sevLabel}</span>
      <span class="status-badge ${r.status}">${statusLabel}</span>
    </div>
    <p style="margin-bottom:12px;line-height:1.6">${escapeHTML(desc)}</p>
    <div class="report-location" style="margin-bottom:8px">
      <span class="material-icons">location_on</span>
      <span>${escapeHTML(r.location.address)}</span>
    </div>
    ${r.location.nearbyShop ? `<p style="font-size:0.85rem;color:#666;margin-bottom:8px">🏪 ${escapeHTML(r.location.nearbyShop)}</p>` : ''}
    ${r.location.shopVerified !== undefined ? `<p class="verification-note ${r.location.shopVerified ? 'verified' : ''}">${r.location.shopVerified ? (currentLang === 'hi' ? 'दुकान का बोर्ड मिलान हुआ' : 'Shop signboard matched') : (currentLang === 'hi' ? 'दुकान/लैंडमार्क अप्रमाणित' : 'Nearby place unverified')}${r.location.signboardName ? `: ${escapeHTML(r.location.signboardName)}` : ''}</p>` : ''}
    ${r.location.landmark ? `<p style="font-size:0.85rem;color:#666;margin-bottom:12px">📌 ${escapeHTML(r.location.landmark)}</p>` : ''}
    ${r.citizenContext ? `<p style="font-size:0.85rem;color:#666;margin-bottom:12px">💬 ${escapeHTML(r.citizenContext)}</p>` : ''}
    <div class="report-authority" style="margin-bottom:12px">
      <span class="material-icons">account_balance</span>
      <div>
        <strong>${escapeHTML(r.authority.name)}</strong><br>
        ${r.authority.contact ? `<a href="tel:${escapeHTML(r.authority.contact)}">📞 ${escapeHTML(r.authority.contact)}</a>` : `<span>📞 ${currentLang === 'hi' ? 'डेमो में नंबर उपलब्ध नहीं' : 'Contact directory not configured in demo'}</span>`}
      </div>
    </div>
    <div class="status-timeline">
      <div class="timeline-item done"><strong>${currentLang === 'hi' ? 'रिपोर्ट किया' : 'Reported'}</strong><br><small>${formatDate(r.createdAt)}</small></div>
      <div class="timeline-item ${['in_progress','claimed_done','verified_done'].includes(r.status) ? 'done' : ''}"><strong>${currentLang === 'hi' ? 'कार्यवाही जारी' : 'In Progress'}</strong></div>
      <div class="timeline-item ${['claimed_done','verified_done'].includes(r.status) ? 'done' : ''}"><strong>${currentLang === 'hi' ? 'हल किया (दावा)' : 'Claimed Done'}</strong></div>
      <div class="timeline-item ${r.status === 'verified_done' ? 'done' : ''}"><strong>${currentLang === 'hi' ? 'सत्यापित' : 'Verified Done'}</strong></div>
    </div>
    ${r.afterPhoto ? `<div style="margin-top:12px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:6px">${currentLang === 'hi' ? '📸 ठीक होने के बाद की फोटो:' : '📸 After fix photo:'}</p><img src="${r.afterPhoto}" style="width:100%;border-radius:8px" onerror="this.style.display='none'"></div>` : ''}
    <p class="report-time" style="margin-top:12px">👤 ${r.reporterHandle} • ${formatDate(r.createdAt)}</p>
  `;

  document.getElementById('detail-modal').classList.add('active');
}

// ── Tab Navigation ───────────────────────────────────────
function switchTab(tab) {
  if (tab === 'admin' && !isAdminLoggedIn) {
    document.getElementById('admin-login-form').style.display = 'block';
    document.getElementById('admin-dashboard').classList.remove('active');
  }
  currentTab = tab;

  // Sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(`${tab}-section`);
  if (section) section.classList.add('active');

  // Nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Special actions per tab
  if (tab === 'report') {
    goToReportStep(1);
    startCamera();
  } else {
    stopCamera();
  }

  if (tab === 'chatbot') {
    initChatbot();
  }

  if (tab === 'feed') {
    loadFeed();
    setTimeout(() => { if (map) map.invalidateSize(); }, 100);
  }

  if (tab === 'profile') {
    renderProfile();
  }
}

// ── Camera ───────────────────────────────────────────────
async function startCamera() {
  const video = document.getElementById('camera-preview');
  const capturedImg = document.getElementById('captured-image');
  video.style.display = 'block';
  capturedImg.style.display = 'none';
  document.getElementById('capture-btn').style.display = 'flex';
  document.getElementById('recapture-btn').style.display = 'none';
  document.getElementById('step1-next').disabled = true;
  capturedPhoto = null;

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access requires HTTPS or localhost in a supported browser.');
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = cameraStream;
    await video.play();
  } catch (e) {
    console.error('Camera access failed:', e);
    showToast(currentLang === 'hi' ? 'कैमरा नहीं खुला। HTTPS/localhost और अनुमति जाँचें।' : 'Camera unavailable. Check HTTPS/localhost and browser permission.');
  }

  // Get GPS
  getReportGPS();
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
}

function capturePhoto() {
  const video = document.getElementById('camera-preview');
  if (!cameraStream || !video.videoWidth || !video.videoHeight) {
    showToast(currentLang === 'hi' ? 'पहले कैमरा चालू होने दें' : 'Wait for the camera to start first');
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);

  const capturedImg = document.getElementById('captured-image');
  capturedImg.src = capturedPhoto;
  capturedImg.style.display = 'block';
  video.style.display = 'none';
  document.getElementById('capture-btn').style.display = 'none';
  document.getElementById('recapture-btn').style.display = 'flex';
  document.getElementById('step1-next').disabled = capturedLat === null;

  stopCamera();
}

function getReportGPS() {
  const indicator = document.getElementById('gps-indicator');
  indicator.className = 'gps-indicator';
  indicator.innerHTML = `<span class="material-icons">gps_not_fixed</span> ${t('gpsWait')}`;

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        capturedLat = pos.coords.latitude;
        capturedLng = pos.coords.longitude;
        capturedAccuracy = Math.round(pos.coords.accuracy);
        indicator.innerHTML = `<span class="material-icons">gps_fixed</span> ${t('gpsOk')} (±${capturedAccuracy}m)`;
        if (capturedPhoto) document.getElementById('step1-next').disabled = false;
      },
      (err) => {
        indicator.className = 'gps-indicator error';
        indicator.innerHTML = `<span class="material-icons">gps_off</span> ${t('gpsError')}: ${err.message}`;
        capturedLat = capturedLng = capturedAccuracy = null;
        document.getElementById('step1-next').disabled = true;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    indicator.className = 'gps-indicator error';
    indicator.innerHTML = `<span class="material-icons">gps_off</span> ${t('gpsError')}`;
  }
}

// ── Report Steps ─────────────────────────────────────────
function goToReportStep(step) {
  reportStep = step;
  document.querySelectorAll('.report-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`report-step-${step}`).classList.add('active');

  // Step dots
  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.classList.remove('active', 'done');
    if (i + 1 === step) d.classList.add('active');
    if (i + 1 < step) d.classList.add('done');
  });

  if (step === 2) loadLocationStep();
  if (step === 3) runAIAnalysis();
}

// ── Step 2: Location ─────────────────────────────────────
async function loadLocationStep() {
  const addressEl = document.getElementById('location-address');
  const shopsEl = document.getElementById('shop-chips-container');
  nearbyShops = [];

  addressEl.innerHTML = `<span class="material-icons">location_on</span> ${currentLang === 'hi' ? 'पता लोड हो रहा है...' : 'Loading address...'}`;
  shopsEl.innerHTML = '';

  // Reverse geocode
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${capturedLat}&lon=${capturedLng}&accept-language=${currentLang === 'hi' ? 'hi' : 'en'}`, {
      headers: { 'User-Agent': 'JanAwaaz/1.0' }
    });
    if (!resp.ok) throw new Error(`Address lookup failed: ${resp.status}`);
    const data = await resp.json();
    const addressIcon = document.createElement('span');
    addressIcon.className = 'material-icons';
    addressIcon.textContent = 'location_on';
    addressEl.replaceChildren(addressIcon, document.createTextNode(` ${data.display_name || 'Unknown location'}`));
    addressEl.dataset.address = data.display_name || '';
  } catch (e) {
    addressEl.innerHTML = `<span class="material-icons">location_on</span> ${capturedLat.toFixed(4)}, ${capturedLng.toFixed(4)}`;
    addressEl.dataset.address = `${capturedLat.toFixed(4)}, ${capturedLng.toFixed(4)}`;
  }

  // Fetch nearby shops via Overpass
  try {
    const query = `[out:json][timeout:10];(node["shop"](around:200,${capturedLat},${capturedLng});node["amenity"](around:200,${capturedLat},${capturedLng}););out body 10;`;
    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query)
    });
    const data = await resp.json();

    const shops = data.elements
      .filter(e => e.tags && e.tags.name)
      .map(e => ({ name: e.tags.name, type: e.tags.shop || e.tags.amenity }))
      .slice(0, 8);
    nearbyShops = shops;

    if (!resp.ok) throw new Error(`Nearby places request failed: ${resp.status}`);
    shops.forEach(shop => {
      const chip = document.createElement('button');
      chip.className = 'chip shop-chip';
      chip.type = 'button';
      chip.textContent = shop.name;
      chip.addEventListener('click', () => selectShop(chip, shop.name));
      shopsEl.appendChild(chip);
    });
    const otherChip = document.createElement('button');
    otherChip.className = 'chip shop-chip';
    otherChip.type = 'button';
    otherChip.textContent = currentLang === 'hi' ? 'अन्य' : 'Other';
    otherChip.addEventListener('click', () => selectShop(otherChip, ''));
    shopsEl.appendChild(otherChip);
    if (!shops.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'helper-text';
      emptyMessage.textContent = currentLang === 'hi' ? 'पास की दुकान नहीं मिली; अन्य चुनकर लैंडमार्क लिखें।' : 'No nearby shops found. Choose Other and enter a landmark.';
      shopsEl.prepend(emptyMessage);
    }
  } catch (e) {
    console.warn('Nearby places lookup failed:', e);
    shopsEl.textContent = currentLang === 'hi' ? 'दुकान की जानकारी नहीं मिली। लैंडमार्क लिखें।' : 'Nearby places unavailable. Enter a landmark instead.';
  }
}

function selectShop(el, shopName) {
  document.querySelectorAll('.shop-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedShop = shopName;
}

function handleLandmarkVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast(currentLang === 'hi' ? 'वॉइस सपोर्ट नहीं है' : 'Voice not supported');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
  recognition.interimResults = false;

  const micBtn = document.getElementById('landmark-mic');
  micBtn.classList.add('recording');

  recognition.onresult = (event) => {
    document.getElementById('landmark-input').value = event.results[0][0].transcript;
    micBtn.classList.remove('recording');
  };
  recognition.onerror = () => { micBtn.classList.remove('recording'); };
  recognition.onend = () => { micBtn.classList.remove('recording'); };
  recognition.start();
}

// ── Step 3: AI Analysis ──────────────────────────────────
async function runAIAnalysis() {
  showLoading(t('analyzing'));

  let imageBase64 = '';
  if (capturedPhoto && capturedPhoto !== 'demo') {
    imageBase64 = capturedPhoto.split(',')[1] || '';
  }

  try {
    aiAnalysis = await analyzeImage(imageBase64);
    if (aiAnalysis?.is_infrastructure_issue === false) {
      hideLoading();
      showToast(currentLang === 'hi'
        ? 'इस फोटो में सूची की समस्या साफ़ नहीं दिखी। कृपया समस्या की साफ़ फोटो लें।'
        : 'No listed issue is clearly visible. Please retake a clear photo of the problem.');
      goToReportStep(1);
      return;
    }
    const validTypes = Object.keys(REPORT_TYPES);
    const validSeverities = Object.keys(SEVERITY_CONFIG);
    if (aiAnalysis?.is_infrastructure_issue !== true ||
        !validTypes.includes(aiAnalysis?.type) || !validSeverities.includes(aiAnalysis?.severity) ||
        !aiAnalysis.description_hindi || !aiAnalysis.description_english) {
      throw new Error('AI returned incomplete or invalid issue data.');
    }
  } catch (error) {
    hideLoading();
    console.error('Issue analysis failed:', error);
    showToast(`${currentLang === 'hi' ? 'Gemma फोटो का विश्लेषण नहीं कर सका' : 'Gemma could not analyse the photo'}: ${error.message}`);
    goToReportStep(1);
    return;
  }
  shopVerification = { verified: false, signboard: '' };
  try {
    const signboard = await readSignboard(imageBase64, nearbyShops);
    if (typeof signboard === 'string') {
      shopVerification = {
        verified: !selectedShop || selectedShop === signboard,
        signboard
      };
      if (!selectedShop) selectedShop = signboard;
    } else if (signboard && typeof signboard === 'object') {
      shopVerification.signboard = signboard.read || '';
    }
  } catch (error) {
    console.warn('Shop signboard verification failed:', error);
  }
  hideLoading();

  // Display results
  const typeInfo = REPORT_TYPES[aiAnalysis.type];
  const typeLabel = currentLang === 'hi' ? typeInfo.hi : typeInfo.en;
  const sevLabel = currentLang === 'hi' ? SEVERITY_CONFIG[aiAnalysis.severity].hi : SEVERITY_CONFIG[aiAnalysis.severity].en;

  document.getElementById('analysis-type').innerHTML = `${typeInfo.emoji} ${typeLabel}`;
  document.getElementById('analysis-severity').className = `severity-badge ${aiAnalysis.severity}`;
  document.getElementById('analysis-severity').textContent = sevLabel;
  document.getElementById('analysis-description').textContent = currentLang === 'hi'
    ? aiAnalysis.description_hindi
    : (aiAnalysis.description_english || aiAnalysis.description_hindi);

  document.getElementById('edit-description').value = currentLang === 'hi'
    ? aiAnalysis.description_hindi
    : (aiAnalysis.description_english || aiAnalysis.description_hindi);

  // Check for duplicates
  const duplicates = findDuplicates(capturedLat, capturedLng, aiAnalysis.type, 100);
  const dupContainer = document.getElementById('duplicate-warning');
  if (duplicates.length > 0) {
    dupContainer.classList.remove('hidden');
    dupContainer.querySelector('h4').textContent = t('duplicateTitle');
    dupContainer.querySelector('p').textContent = t('duplicateMsg');
    document.getElementById('duplicate-report').innerHTML = renderReportCard(duplicates[0]);
    document.getElementById('submit-report-btn').disabled = true;
    document.getElementById('repost-btn').textContent = t('repostBtn');
    document.getElementById('repost-btn').onclick = () => {
      if (!repostReport(duplicates[0].id)) {
        showToast(t('alreadyDone'));
        return;
      }
      dupContainer.classList.add('hidden');
      document.getElementById('submit-report-btn').disabled = false;
      resetReportFlow();
      switchTab('feed');
      showToast(currentLang === 'hi' ? '🔄 रीपोस्ट किया गया' : '🔄 Reposted successfully');
    };
  } else {
    dupContainer.classList.add('hidden');
    document.getElementById('duplicate-report').innerHTML = '';
    document.getElementById('submit-report-btn').disabled = false;
  }
}

// ── Submit Report ────────────────────────────────────────
async function submitReport() {
  if (!capturedPhoto || capturedLat === null || capturedLng === null || !aiAnalysis) {
    showToast(currentLang === 'hi' ? 'फोटो और GPS स्थान ज़रूरी हैं' : 'A live photo and GPS location are required');
    return;
  }
  if (findDuplicates(capturedLat, capturedLng, aiAnalysis.type, 100).length) {
    showToast(t('duplicateMsg'));
    return;
  }
  showLoading(currentLang === 'hi' ? 'शिकायत दर्ज हो रही है...' : 'Submitting report...');

  let description = document.getElementById('edit-description').value.trim();
  if (!description) {
    hideLoading();
    showToast(currentLang === 'hi' ? 'विवरण खाली नहीं हो सकता' : 'Description cannot be empty');
    return;
  }
  const originalDesc = currentLang === 'hi' ? aiAnalysis.description_hindi : (aiAnalysis.description_english || aiAnalysis.description_hindi);

  // If user edited, polish through Gemma
  if (description !== originalDesc) {
    try {
      description = await polishDescription(description, originalDesc);
    } catch (error) {
      hideLoading();
      console.error('Gemma description polishing failed:', error);
      showToast(`Gemma polish failed: ${error.message}`);
      return;
    }
  }
  let moderation;
  try {
    moderation = await moderateComment(description);
  } catch (error) {
    hideLoading();
    console.error('Gemma moderation failed:', error);
    showToast(`Gemma moderation failed: ${error.message}`);
    return;
  }
  description = moderation.cleanedText;
  if (!description.trim()) {
    hideLoading();
    showToast(currentLang === 'hi' ? 'कृपया साफ़ और उपयोगी विवरण लिखें' : 'Please provide a clear, relevant description');
    return;
  }

  const address = document.getElementById('location-address').dataset.address || `${capturedLat}, ${capturedLng}`;
  const chatDraft = window.janAwaazChatDraft || {};
  const landmark = document.getElementById('landmark-input').value.trim() || chatDraft.landmark || '';

  // Generate professional report text
  const reportAnalysis = { ...aiAnalysis };
  if (currentLang === 'hi') reportAnalysis.description_hindi = description;
  else reportAnalysis.description_english = description;
  let reportText;
  try {
    reportText = await generateReportText(reportAnalysis, address, landmark, currentLang);
  } catch (error) {
    hideLoading();
    console.error('Gemma report generation failed:', error);
    showToast(`Gemma report generation failed: ${error.message}`);
    return;
  }

  // Determine authority
  const isVillage = address.toLowerCase().includes('village') || address.includes('गाँव') || address.includes('ग्राम');
  const authority = isVillage
    ? { name: 'Gram Panchayat (demo)', contact: '', type: 'gram_panchayat' }
    : { name: 'Nagar Palika (demo)', contact: '', type: 'nagar_palika' };

  const report = {
    type: aiAnalysis.type,
    photo: capturedPhoto === 'demo' ? `https://picsum.photos/seed/${Date.now()}/400/300` : capturedPhoto,
    location: {
      lat: capturedLat,
      lng: capturedLng,
      address: address,
      nearbyShop: selectedShop,
      shopVerified: shopVerification.verified,
      signboardName: shopVerification.signboard,
      landmark: landmark
    },
    severity: aiAnalysis.severity,
    description_hi: currentLang === 'hi' ? description : aiAnalysis.description_hindi,
    description_en: currentLang === 'en' ? description : (aiAnalysis.description_english || ''),
    citizenContext: chatDraft.description || '',
    reportText: reportText,
    [currentLang === 'hi' ? 'reportText_hi' : 'reportText_en']: reportText,
    locationAccuracy: capturedAccuracy,
    authority: authority,
    aiAnalysis: aiAnalysis
  };

  addReport(report);
  window.janAwaazChatDraft = null;
  hideLoading();
  showToast(t('successMsg'));
  stopCamera();
  resetReportFlow();
  switchTab('feed');
}

function resetReportFlow() {
  reportStep = 1;
  capturedPhoto = null;
  capturedLat = null;
  capturedLng = null;
  capturedAccuracy = null;
  selectedShop = '';
  nearbyShops = [];
  shopVerification = { verified: false, signboard: '' };
  aiAnalysis = null;
  document.getElementById('duplicate-warning').classList.add('hidden');
  document.getElementById('duplicate-report').innerHTML = '';
  document.getElementById('submit-report-btn').disabled = false;
  document.getElementById('step1-next').disabled = true;
  document.getElementById('captured-image').removeAttribute('src');
  document.getElementById('camera-preview').style.display = 'block';
  document.getElementById('captured-image').style.display = 'none';
  document.getElementById('capture-btn').style.display = 'flex';
  document.getElementById('recapture-btn').style.display = 'none';
  document.getElementById('step1-next').disabled = true;
  document.getElementById('gps-indicator').className = 'gps-indicator';
  document.getElementById('gps-indicator').innerHTML = `<span class="material-icons">gps_not_fixed</span> ${t('gpsWait')}`;
  document.getElementById('landmark-input').value = '';
  document.getElementById('edit-description').value = '';
}

// ── Search ───────────────────────────────────────────────
async function searchArea() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) return;

  showLoading(currentLang === 'hi' ? 'खोज रहे हैं...' : 'Searching...');

  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`, {
      headers: { 'User-Agent': 'JanAwaaz/1.0' }
    });
    const data = await resp.json();

    if (data.length > 0) {
      userLat = parseFloat(data[0].lat);
      userLng = parseFloat(data[0].lon);
      map.setView([userLat, userLng], 13);
      loadFeed();
    } else {
      showToast(currentLang === 'hi' ? 'स्थान नहीं मिला' : 'Location not found');
    }
  } catch (e) {
    showToast(currentLang === 'hi' ? 'खोज विफल' : 'Search failed');
  }

  hideLoading();
}

// ── Profile ──────────────────────────────────────────────
function renderProfile() {
  const user = getCurrentUser();
  document.getElementById('profile-handle').textContent = user.handle;

  const myReports = getReports().filter(r => r.reporterHandle === user.handle);
  document.getElementById('profile-report-count').textContent = myReports.length;

  const totalLikes = myReports.reduce((s, r) => s + r.likes, 0);
  document.getElementById('profile-likes-count').textContent = totalLikes;

  const resolved = myReports.filter(r => r.status === 'verified_done').length;
  document.getElementById('profile-resolved-count').textContent = resolved;

  const listEl = document.getElementById('my-reports-list');
  if (myReports.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><span class="material-icons">description</span><p>${currentLang === 'hi' ? 'आपने अभी तक कोई शिकायत नहीं की' : 'You haven\'t made any reports yet'}</p></div>`;
  } else {
    listEl.innerHTML = myReports.map(r => renderReportCard(r)).join('');
  }
}

// ── Admin ────────────────────────────────────────────────
function handleAdminLogin() {
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;

  if (adminLogin(username, password)) {
    isAdminLoggedIn = true;
    document.getElementById('admin-login-form').style.display = 'none';
    document.getElementById('admin-dashboard').classList.add('active');
    renderAdminDashboard();
  } else {
    showToast(t('loginError'));
  }
}

function handleAdminLogout() {
  isAdminLoggedIn = false;
  document.getElementById('admin-login-form').style.display = 'block';
  document.getElementById('admin-dashboard').classList.remove('active');
  switchTab('feed');
}

function renderAdminDashboard() {
  if (!isAdminLoggedIn) return;
  // Stats
  document.getElementById('admin-total').textContent = totalReports();
  document.getElementById('admin-solved').textContent = solvedPercentage() + '%';
  document.getElementById('admin-avg-time').textContent = avgResolutionTimeDays();

  const active = getReports().filter(r => !['verified_done'].includes(r.status)).length;
  document.getElementById('admin-active').textContent = active;

  // Admin map
  if (!adminMap) {
    adminMap = L.map('admin-map').setView([23.5, 80], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(adminMap);
    adminMarkersLayer = L.layerGroup().addTo(adminMap);
  }

  setTimeout(() => { adminMap.invalidateSize(); }, 100);

  // Plot all reports on admin map
  adminMarkersLayer.clearLayers();
  getReports().forEach(r => {
    const typeInfo = REPORT_TYPES[r.type];
    const icon = L.divIcon({
      className: 'report-marker',
      html: `<div style="font-size:20px">${typeInfo.emoji}</div>`,
      iconSize: [24, 24]
    });
    L.marker([r.location.lat, r.location.lng], { icon }).addTo(adminMarkersLayer)
      .bindPopup(`<strong>${typeInfo.emoji} ${r.location.address}</strong><br>Status: ${r.status}`);
  });

  renderAdminTable();
}

function renderAdminTable() {
  if (!isAdminLoggedIn) return;
  const typeFilter = document.getElementById('admin-type-filter')?.value || 'all';
  const statusFilter = document.getElementById('admin-status-filter')?.value || 'all';
  const sevFilter = document.getElementById('admin-severity-filter')?.value || 'all';

  let reports = getReports();
  if (typeFilter !== 'all') reports = reports.filter(r => r.type === typeFilter);
  if (statusFilter !== 'all') reports = reports.filter(r => r.status === statusFilter);
  if (sevFilter !== 'all') reports = reports.filter(r => r.severity === sevFilter);

  reports.sort((a, b) => b.createdAt - a.createdAt);

  const tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = reports.map(r => {
    const typeInfo = REPORT_TYPES[r.type];
    return `
      <tr>
        <td>${typeInfo.emoji} ${typeInfo.en}</td>
        <td><span class="severity-badge ${r.severity}">${r.severity}</span></td>
        <td>${escapeHTML(r.location.address.substring(0, 30))}${r.location.address.length > 30 ? '…' : ''}${r.location.shopVerified === false ? `<br><small>Place unverified</small>` : ''}${r.citizenContext ? `<br><small>${escapeHTML(r.citizenContext)}</small>` : ''}</td>
        <td><span class="status-badge ${r.status}">${STATUS_CONFIG[r.status].en}</span></td>
        <td>${formatDate(r.createdAt)}</td>
        <td>👍${r.likes} 👎${r.dislikes} 🔄${r.reposts}</td>
        <td>
          <select onchange="adminUpdateStatus('${r.id}', this.value)" ${r.status === 'verified_done' ? 'disabled' : ''}>
            <option value="reported" ${r.status === 'reported' ? 'selected' : ''}>Reported</option>
            <option value="in_progress" ${r.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="claimed_done" ${r.status === 'claimed_done' ? 'selected' : ''}>Claimed Done</option>
            <option value="verified_done" ${r.status === 'verified_done' ? 'selected' : ''} disabled>Verified Done (user confirmations only)</option>
            <option value="reopened" ${r.status === 'reopened' ? 'selected' : ''}>Reopened</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

function adminUpdateStatus(id, newStatus) {
  if (!isAdminLoggedIn) return;
  if (newStatus === 'claimed_done') {
    startClaimProof(id);
    return;
  }
  const updates = { status: newStatus };
  updateReport(id, updates);
  renderAdminDashboard();
  showToast('Status updated');
}

async function startClaimProof(id) {
  const report = getReportById(id);
  if (!report) return;
  claimReportId = id;
  claimProofPhoto = null;
  claimProofLat = claimProofLng = null;
  document.getElementById('claim-camera-preview').style.display = 'block';
  document.getElementById('claim-captured-image').style.display = 'none';
  document.getElementById('claim-captured-image').removeAttribute('src');
  document.getElementById('claim-capture-btn').disabled = true;
  document.getElementById('claim-confirm-btn').disabled = true;
  document.getElementById('claim-gps-indicator').textContent = 'Start the camera, then capture the after photo for a fresh GPS fix.';
  document.getElementById('claim-proof-modal').classList.add('active');
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access requires HTTPS or localhost.');
    }
    claimCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('claim-camera-preview');
    video.srcObject = claimCameraStream;
    await video.play();
    document.getElementById('claim-capture-btn').disabled = false;
  } catch (error) {
    console.error('After-photo camera access failed:', error);
    showToast('Camera unavailable. Check permission and use HTTPS or localhost.');
    closeClaimProof();
  }
}

function captureClaimProof() {
  if (!claimCameraStream || !navigator.geolocation) {
    showToast('Camera and location permission are required.');
    return;
  }
  const captureButton = document.getElementById('claim-capture-btn');
  const indicator = document.getElementById('claim-gps-indicator');
  captureButton.disabled = true;
  indicator.textContent = 'Getting an accurate location…';
  navigator.geolocation.getCurrentPosition((position) => {
    const video = document.getElementById('claim-camera-preview');
    if (!video.videoWidth || !video.videoHeight) {
      captureButton.disabled = false;
      indicator.textContent = 'Camera is not ready; try again.';
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    claimProofPhoto = canvas.toDataURL('image/jpeg', 0.8);
    claimProofLat = position.coords.latitude;
    claimProofLng = position.coords.longitude;
    document.getElementById('claim-captured-image').src = claimProofPhoto;
    document.getElementById('claim-captured-image').style.display = 'block';
    video.style.display = 'none';
    indicator.textContent = `GPS fix captured (±${Math.round(position.coords.accuracy)} m).`;
    document.getElementById('claim-confirm-btn').disabled = false;
  }, (error) => {
    captureButton.disabled = false;
    indicator.textContent = `Could not get GPS: ${error.message}`;
    showToast('A live GPS fix is required for the after photo.');
  }, { enableHighAccuracy: true, timeout: 15000 });
}

function confirmClaimProof() {
  const report = getReportById(claimReportId);
  if (!report || !claimProofPhoto || claimProofLat === null || claimProofLng === null) {
    showToast('Capture an after photo and GPS location first.');
    return;
  }
  const distance = haversineDistance(claimProofLat, claimProofLng, report.location.lat, report.location.lng);
  if (distance > 50) {
    document.getElementById('claim-gps-indicator').textContent = `Too far from the report (${Math.round(distance)} m). Move within 50 m and retake the photo.`;
    document.getElementById('claim-camera-preview').style.display = 'block';
    document.getElementById('claim-captured-image').style.display = 'none';
    document.getElementById('claim-confirm-btn').disabled = true;
    document.getElementById('claim-capture-btn').disabled = false;
    claimProofPhoto = null;
    claimProofLat = claimProofLng = null;
    return;
  }
  updateReport(claimReportId, {
    status: 'claimed_done',
    afterPhoto: claimProofPhoto,
    resolvedAt: Date.now(),
    claimLocation: { lat: claimProofLat, lng: claimProofLng, distanceM: Math.round(distance) }
  });
  closeClaimProof();
  renderAdminDashboard();
  showToast('Claim saved with after photo and location proof.');
}

function closeClaimProof() {
  if (claimCameraStream) {
    claimCameraStream.getTracks().forEach(track => track.stop());
    claimCameraStream = null;
  }
  const video = document.getElementById('claim-camera-preview');
  if (video) video.srcObject = null;
  document.getElementById('claim-proof-modal')?.classList.remove('active');
  claimReportId = null;
  claimProofPhoto = null;
  claimProofLat = claimProofLng = null;
  if (isAdminLoggedIn) renderAdminTable();
}

// ── Gemma Status ─────────────────────────────────────────
async function checkGemmaStatus() {
  const available = await refreshGemmaStatus();
  const el = document.getElementById('gemma-status');
  if (available) {
    el.className = 'gemma-status online';
    el.innerHTML = `<span class="dot-indicator"></span> ${t('gemmaOnline')} · ${escapeHTML(_gemmaModelId)}`;
  } else {
    el.className = 'gemma-status offline';
    el.innerHTML = `<span class="dot-indicator"></span> ${t('gemmaOffline')}`;
    el.title = getGemmaConnectionError();
  }
}

async function testGemmaFromUI() {
  const button = document.getElementById('gemma-test-btn');
  if (!button) return;
  button.disabled = true;
  button.textContent = t('gemmaTesting');
  try {
    const result = await testGemmaConnection();
    showToast(`${t('gemmaTestOk')} (${result.model}): ${result.response}`);
    await checkGemmaStatus();
  } catch (error) {
    console.error('Gemma connection test failed:', error);
    showToast(`Gemma test failed: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = t('gemmaTest');
  }
}

// ── Utilities ────────────────────────────────────────────
function formatDate(ts) {
  return new Date(ts).toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (currentLang === 'hi') {
    if (mins < 60) return `${mins} मिनट पहले`;
    if (hours < 24) return `${hours} घंटे पहले`;
    return `${days} दिन पहले`;
  } else {
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} days ago`;
  }
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading(text) {
  const el = document.getElementById('loading-overlay');
  el.querySelector('.loading-text').textContent = text || '';
  el.classList.add('active');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('active');
}
