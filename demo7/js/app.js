/**
 * Fast-Service Technics Repair - Core App Logic
 * Parses values.txt, updates services & prices dynamically, handles Captcha & Forms (with Airgap fallback)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Detect Active Language & Resolve Paths
  const lang = detectLanguage();
  const relPrefix = getRelativePrefix();
  
  // Initialize dynamic components
  initPricingAndServices(lang, relPrefix);
  initLanguageSwitcher(lang);
  initCaptcha();
  initContactForm(lang);
});

/**
 * Detect current language based on the URL folder path
 */
function detectLanguage() {
  const path = window.location.pathname;
  if (path.includes('/eng/')) return 'EN';
  if (path.includes('/rus/')) return 'RU';
  return 'ET'; // Default is Estonian
}

/**
 * Check if the current page is nested in a subfolder and return relative path prefix
 */
function getRelativePrefix() {
  const path = window.location.pathname;
  if (path.includes('/eng/') || path.includes('/rus/') || path.includes('/est/')) {
    return '../';
  }
  return '';
}

/**
 * Language string helper library
 */
const STRINGS = {
  ET: {
    from: 'alates',
    priceSuffix: '€',
    rangeConnector: ' - ',
    fallbackSubject: 'Remondipäring',
    captchaError: 'Vigane turvakood! Palun proovige uuesti.',
    formSuccess: 'Täname! Teie sõnum on edastatud ja me võtame teiega peagi ühendust.',
    formError: 'Saatmise viga. Kontrollige võrguühendust või kasutage e-kirja saatmise võimalust.',
    offlineSubject: 'Fast-Service Remondipäring'
  },
  EN: {
    from: 'from',
    priceSuffix: '€',
    rangeConnector: ' - ',
    fallbackSubject: 'Repair Inquiry',
    captchaError: 'Incorrect security code! Please try again.',
    formSuccess: 'Thank you! Your message has been sent. We will contact you shortly.',
    formError: 'Submission failed. Please check your network connection or use the direct email option.',
    offlineSubject: 'Fast-Service Repair Inquiry'
  },
  RU: {
    from: 'от',
    priceSuffix: '€',
    rangeConnector: ' - ',
    fallbackSubject: 'Запрос на ремонт',
    captchaError: 'Неверный проверочный код! Пожалуйста, попробуйте еще раз.',
    formSuccess: 'Спасибо! Ваше сообщение отправлено, мы свяжемся с вами в ближайшее время.',
    formError: 'Ошибка отправки. Проверьте подключение к сети или отправьте письмо напрямую.',
    offlineSubject: 'Fast-Service Запрос на ремонт'
  }
};

/**
 * Fetch and Parse values.txt, then populate dynamic elements
 */
function initPricingAndServices(lang, relPrefix) {
  const valuesUrl = `${relPrefix}values.txt`;
  
  fetch(valuesUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load values.txt');
      return response.text();
    })
    .then(text => {
      const services = parseValuesTxt(text);
      populateDOMValues(services, lang);
    })
    .catch(err => {
      console.warn('Values loader error (running in strict airgap or direct local file?):', err);
      // If values.txt failed to fetch (e.g. run locally on file:// without local server), 
      // the DOM will show the default fallback prices pre-filled in the HTML.
    });
}

/**
 * Parses values.txt INI structure
 */
function parseValuesTxt(text) {
  const lines = text.split('\n');
  const services = {};
  let inServicesSection = false;
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    
    if (line === '[services]') {
      inServicesSection = true;
      continue;
    }
    
    if (line.startsWith('[') && line.endsWith(']')) {
      inServicesSection = false;
      continue;
    }
    
    if (inServicesSection && line.includes('=')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const valuePart = parts[1].trim();
      
      // Spec format: Price_Spec | Est_Time | Eng_Time | Rus_Time | Est_Name | Eng_Name | Rus_Name
      const specParts = valuePart.split('|').map(p => p.trim());
      
      if (specParts.length >= 7) {
        services[key] = {
          priceSpec: specParts[0],
          timeET: specParts[1],
          timeEN: specParts[2],
          timeRU: specParts[3],
          nameET: specParts[4],
          nameEN: specParts[5],
          nameRU: specParts[6]
        };
      }
    }
  }
  
  return services;
}

/**
 * Format price according to language requirements
 */
function formatPriceSpec(priceSpec, lang) {
  const langStrings = STRINGS[lang];
  
  // Starting price (e.g. "80+")
  if (priceSpec.endsWith('+')) {
    const amount = priceSpec.slice(0, -1);
    if (lang === 'RU') {
      return `${langStrings.from} ${amount} ${langStrings.priceSuffix}`;
    }
    return `${langStrings.from} ${amount} ${langStrings.priceSuffix}`;
  }
  
  // Price Range (e.g. "15-30")
  if (priceSpec.includes('-')) {
    const range = priceSpec.split('-');
    return `${range[0]}${langStrings.priceSuffix}${langStrings.rangeConnector}${range[1]}${langStrings.priceSuffix}`;
  }
  
  // Static Price (e.g. "10")
  return `${priceSpec} ${langStrings.priceSuffix}`;
}

/**
 * Inject the parsed values into the DOM elements
 */
function populateDOMValues(services, lang) {
  // Update prices
  document.querySelectorAll('[data-service-price]').forEach(el => {
    const key = el.getAttribute('data-service-price');
    if (services[key]) {
      el.textContent = formatPriceSpec(services[key].priceSpec, lang);
    }
  });

  // Update estimated times
  document.querySelectorAll('[data-service-time]').forEach(el => {
    const key = el.getAttribute('data-service-time');
    if (services[key]) {
      if (lang === 'EN') el.textContent = services[key].timeEN;
      else if (lang === 'RU') el.textContent = services[key].timeRU;
      else el.textContent = services[key].timeET;
    }
  });

  // Update names
  document.querySelectorAll('[data-service-name]').forEach(el => {
    const key = el.getAttribute('data-service-name');
    if (services[key]) {
      if (lang === 'EN') el.textContent = services[key].nameEN;
      else if (lang === 'RU') el.textContent = services[key].nameRU;
      else el.textContent = services[key].nameET;
    }
  });
}

/**
 * Contextual Language Switcher
 * Adjusts switcher links to point to the corresponding file name in target directories
 */
function initLanguageSwitcher(currentLang) {
  const switcher = document.querySelector('.lang-switcher');
  if (!switcher) return;
  
  const path = window.location.pathname;
  const currentFilename = window.location.pathname.split('/').pop() || 'index.html';
  
  // Map buttons inside switcher dropdown
  const etLink = document.querySelector('.lang-link-et');
  const enLink = document.querySelector('.lang-link-en');
  const ruLink = document.querySelector('.lang-link-ru');
  
  const inSubfolder = path.includes('/est/') || path.includes('/eng/') || path.includes('/rus/');
  
  if (etLink) etLink.href = path.includes('/est/') ? currentFilename : (inSubfolder ? `../est/${currentFilename}` : `est/${currentFilename}`);
  if (enLink) enLink.href = path.includes('/eng/') ? currentFilename : (inSubfolder ? `../eng/${currentFilename}` : `eng/${currentFilename}`);
  if (ruLink) ruLink.href = path.includes('/rus/') ? currentFilename : (inSubfolder ? `../rus/${currentFilename}` : `rus/${currentFilename}`);
}

/**
 * Self-Hosted Client-Side Canvas Captcha
 */
let CAPTCHA_RESULT = 0;

function initCaptcha() {
  const canvas = document.getElementById('captchaCanvas');
  const refreshBtn = document.querySelector('.btn-refresh');
  
  if (!canvas) return;
  
  generateMathCaptcha(canvas);
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateMathCaptcha(canvas);
    });
  }
}

function generateMathCaptcha(canvas) {
  const ctx = canvas.getContext('2d');
  const num1 = Math.floor(Math.random() * 9) + 2; // 2-10
  const num2 = Math.floor(Math.random() * 9) + 2; // 2-10
  CAPTCHA_RESULT = num1 + num2;
  
  // Canvas config
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background texture (noise lines to block crawlers)
  ctx.strokeStyle = 'rgba(137, 53, 68, 0.22)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }
  
  // Text styling
  ctx.fillStyle = '#21372f';
  ctx.font = 'bold 22px Georgia, Times New Roman, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Rotate and warp expression slightly
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  const angle = (Math.random() * 16 - 8) * Math.PI / 180;
  ctx.rotate(angle);
  
  const text = `${num1} + ${num2} = ?`;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Contact Form Handler with Airgap/Offline Fallback Logic
 */
const FORM_SUBMIT_URL = 'https://api.web3forms.com/submit'; // Configurable API endpoint
const BUSINESS_EMAIL = 'info@fastservice.ee';

function initContactForm(lang) {
  const form = document.getElementById('contactForm');
  const statusBox = document.getElementById('formStatus');
  const offlineModal = document.getElementById('offlineModal');
  const offlineText = document.getElementById('offlineText');
  const mailtoBtn = document.getElementById('mailtoBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');
  
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Reset statuses
    statusBox.className = 'form-status';
    statusBox.style.display = 'none';
    
    // Captcha Validation
    const captchaInput = document.getElementById('captcha_code');
    if (parseInt(captchaInput.value.trim(), 10) !== CAPTCHA_RESULT) {
      statusBox.textContent = STRINGS[lang].captchaError;
      statusBox.classList.add('error');
      statusBox.style.display = 'block';
      generateMathCaptcha(document.getElementById('captchaCanvas'));
      captchaInput.value = '';
      return;
    }
    
    // Form fields compilation
    const name = document.getElementById('client_name').value.trim();
    const contact = document.getElementById('client_contact').value.trim();
    const device = document.getElementById('device_category').value;
    const issue = document.getElementById('issue_desc').value.trim();
    
    // Build raw email message content
    const emailBodyText = `Remondipäring Fast-Service:
------------------------------
Nimi: ${name}
Kontakt: ${contact}
Seadme Tüüp: ${device}
Probleem: ${issue}
------------------------------
Saadetud kodulehelt.`;

    const formData = new FormData(form);
    // Web3Forms API requirements
    formData.append('access_key', 'YOUR_WEB3FORMS_ACCESS_KEY'); // Setup API key here if needed
    formData.append('subject', STRINGS[lang].fallbackSubject);
    formData.append('message', emailBodyText);
    
    // Send network call
    fetch(FORM_SUBMIT_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(async (response) => {
      if (response.ok) {
        statusBox.textContent = STRINGS[lang].formSuccess;
        statusBox.classList.add('success');
        statusBox.style.display = 'block';
        form.reset();
        generateMathCaptcha(document.getElementById('captchaCanvas'));
      } else {
        throw new Error('API submission error');
      }
    })
    .catch(err => {
      console.warn('External form service failed. Triggering offline airgap fallback...', err);
      // Trigger local email client overlay
      openOfflineModal(emailBodyText, offlineModal, offlineText, mailtoBtn);
    });
  });
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      offlineModal.classList.remove('show');
    });
  }
}

/**
 * Render offline copyable contact window & trigger mailto fallback
 */
function openOfflineModal(bodyText, modal, textArea, mailtoBtn) {
  textArea.value = bodyText;
  
  const mailtoUrl = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(STRINGS[detectLanguage()].fallbackSubject)}&body=${encodeURIComponent(bodyText)}`;
  mailtoBtn.href = mailtoUrl;
  
  // Show modal overlay
  modal.classList.add('show');
}
