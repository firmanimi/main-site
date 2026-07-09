/**
 * Fast-Service Order Tracker Controller
 * Handles interactive demo tracking timeline step-by-step visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
  initOrderTracker();
});

// Localization database for tracking results
const TRACKER_STRINGS = {
  ET: {
    notFound: 'Tellimuse ID-d ei leitud. Palun proovige ühte näidiskoodidest.',
    device: 'Seade',
    receivedDate: 'Vastuvõtu kuupäev',
    estReady: 'Eeldatav valmimisaeg',
    details: 'Üksikasjad',
    steps: ['Vastu võetud', 'Diagnostika', 'Remondis', 'Valmis pickupiks'],
    statusTexts: [
      'Seade on lattu vastu võetud. Diagnostikat alustatakse peagi.',
      'Seadme diagnostika on lõppenud ja remondiplaan on kinnitatud.',
      'Remonditööd on pooleli. Vahetatakse vigaseid komponente.',
      'Seade on testitud, puhastatud ja valmis väljastamiseks!'
    ]
  },
  EN: {
    notFound: 'Order ID not found. Please try using one of the demo codes.',
    device: 'Device',
    receivedDate: 'Received Date',
    estReady: 'Estimated Ready Time',
    details: 'Details',
    steps: ['Received', 'Diagnostics', 'Repairing', 'Ready for Pickup'],
    statusTexts: [
      'Device received at our laboratory. Diagnostics starting shortly.',
      'Diagnostics completed. Repair path confirmed and parts allocated.',
      'Repair is currently in progress. Replacing faulty hardware.',
      'Device fully repaired, calibrated, and ready for pickup!'
    ]
  },
  RU: {
    notFound: 'Заказ с таким ID не найден. Пожалуйста, введите один из демо-кодов.',
    device: 'Устройство',
    receivedDate: 'Дата получения',
    estReady: 'Ожидаемая готовность',
    details: 'Детали',
    steps: ['Принят', 'Диагностика', 'В ремонте', 'Готов к выдаче'],
    statusTexts: [
      'Устройство получено. Ожидает очереди на диагностику.',
      'Диагностика завершена. План ремонта согласован.',
      'Производятся ремонтные работы. Замена неисправных компонентов.',
      'Ремонт успешно завершен. Устройство готово к выдаче!'
    ]
  }
};

// Precise mock orders database
const MOCK_ORDERS = {
  'FN-TV-2026': {
    device: {
      ET: 'Samsung QLED TV 55"',
      EN: 'Samsung QLED TV 55"',
      RU: 'Телевизор Samsung QLED 55"'
    },
    received: '08.07.2026',
    estReady: {
      ET: '1-2 päeva',
      EN: '1-2 days',
      RU: '1-2 дня'
    },
    status: 3, // 1: Received, 2: Diagnostics, 3: Repairing, 4: Ready
    details: {
      ET: 'Toiteploki diagnostika tehtud. Vahetatakse kondensaatoreid. Ootab lõplikku pingetesti.',
      EN: 'Power supply diagnostics complete. Replacing capacitors. Awaiting final voltage test.',
      RU: 'Диагностика БП завершена. Заменяются конденсаторы. Ожидает финального теста напряжения.'
    }
  },
  'FN-AUDIO-8041': {
    device: {
      ET: 'Marantz PM6007 Hi-Fi Võimendi',
      EN: 'Marantz PM6007 Hi-Fi Amplifier',
      RU: 'Hi-Fi Усилитель Marantz PM6007'
    },
    received: '06.07.2026',
    estReady: {
      ET: 'Valmis kättesaamiseks',
      EN: 'Ready for Pickup',
      RU: 'Готов к выдаче'
    },
    status: 4,
    details: {
      ET: 'Kanalite tasakaalustus lõpetatud, signaalitest läbitud. Läbinud 24h koormustesti. Kaasas garantiiakt.',
      EN: 'Channel balancing complete, signal test passed. Completed 24h load test. Warranty certificate attached.',
      RU: 'Балансировка каналов завершена, сигнальный тест пройден. Прошел 24ч тест под нагрузкой.'
    }
  }
};

function initOrderTracker() {
  const form = document.getElementById('trackerForm');
  const input = document.getElementById('trackerInput');
  const resultCard = document.getElementById('trackingResult');
  const errorBox = document.getElementById('trackerError');
  const demoCodes = document.querySelectorAll('.tracker-demo-code');
  
  if (!form) return;
  
  // Detect active language
  const path = window.location.pathname;
  let lang = 'ET';
  if (path.includes('/eng/')) lang = 'EN';
  else if (path.includes('/rus/')) lang = 'RU';
  
  const strings = TRACKER_STRINGS[lang];

  // Clicking demo codes instantly triggers searches
  demoCodes.forEach(codeEl => {
    codeEl.addEventListener('click', () => {
      input.value = codeEl.textContent.trim();
      processTrackingSearch(input.value, strings, lang, resultCard, errorBox);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim().toUpperCase();
    processTrackingSearch(query, strings, lang, resultCard, errorBox);
  });
}

function processTrackingSearch(query, strings, lang, resultCard, errorBox) {
  // Reset statuses
  errorBox.style.display = 'none';
  resultCard.style.display = 'none';
  
  if (!query) return;
  
  let orderData = MOCK_ORDERS[query];
  
  // Dynamic fallback generator to let ANY numeric code generate a realistic tracking result
  if (!orderData && query.startsWith('FN-')) {
    orderData = generateDeterministicMockOrder(query, lang);
  }
  
  if (orderData) {
    // Populate card
    document.getElementById('resOrderId').textContent = query;
    document.getElementById('resDevice').textContent = typeof orderData.device === 'object' ? orderData.device[lang] : orderData.device;
    document.getElementById('resReceived').textContent = orderData.received;
    document.getElementById('resReady').textContent = typeof orderData.estReady === 'object' ? orderData.estReady[lang] : orderData.estReady;
    document.getElementById('resDetails').textContent = typeof orderData.details === 'object' ? orderData.details[lang] : orderData.details;
    
    // Set Status Badge
    const badge = document.getElementById('resStatusBadge');
    badge.className = 'status-badge';
    
    const stepIndices = ['received', 'diagnostic', 'repairing', 'pickup'];
    badge.classList.add(stepIndices[orderData.status - 1]);
    badge.textContent = strings.steps[orderData.status - 1];
    
    // Animate Progress Steps
    const steps = document.querySelectorAll('.status-step');
    const stepBar = document.getElementById('stepProgressBar');
    
    steps.forEach((stepEl, idx) => {
      stepEl.className = 'status-step';
      
      if (idx + 1 < orderData.status) {
        stepEl.classList.add('complete');
      } else if (idx + 1 === orderData.status) {
        stepEl.classList.add('active');
      }
      
      // Update step numbers and labels in correct language
      const dot = stepEl.querySelector('.step-dot');
      const label = stepEl.querySelector('.step-label');
      
      if (idx + 1 < orderData.status) {
        dot.innerHTML = '&#10003;'; // Checkmark
      } else {
        dot.textContent = idx + 1;
      }
      
      label.textContent = strings.steps[idx];
    });
    
    // Calculate progress bar width
    const percentage = ((orderData.status - 1) / 3) * 100;
    setTimeout(() => {
      stepBar.style.width = `${percentage}%`;
    }, 100);
    
    resultCard.style.display = 'block';
  } else {
    // Show error
    errorBox.textContent = strings.notFound;
    errorBox.style.display = 'block';
  }
}

/**
 * Hash utility to make mock orders stable and realistic for any FN-XXXX input
 */
function generateDeterministicMockOrder(query, lang) {
  const numPart = query.replace(/[^0-9]/g, '');
  if (!numPart) return null;
  
  const seed = parseInt(numPart, 10) || 1234;
  
  // Seed-based stable calculations
  const status = (seed % 4) + 1; // 1, 2, 3, 4
  const deviceIndex = seed % 4;
  
  const devices = [
    { ET: 'LG OLED Teler 65"', EN: 'LG OLED TV 65"', RU: 'Телевизор LG OLED 65"' },
    { ET: 'Denon AV Vastuvõtja', EN: 'Denon AV Receiver', RU: 'Ресивер Denon AV' },
    { ET: 'Vintage Pioneer Plaadimängija', EN: 'Vintage Pioneer Turntable', RU: 'Проигрыватель винила Pioneer' },
    { ET: 'Philips LED Laualamp', EN: 'Philips LED Desk Lamp', RU: 'Настольная LED лампа Philips' }
  ];
  
  const estTimes = [
    { ET: '1-3 päeva', EN: '1-3 days', RU: '1-3 дня' },
    { ET: 'Ootab varuosasid (3-5 päeva)', EN: 'Awaiting parts (3-5 days)', RU: 'Ожидает детали (3-5 дней)' },
    { ET: 'Täna hiljem', EN: 'Later today', RU: 'Сегодня позже' },
    { ET: 'Valmis', EN: 'Ready', RU: 'Готов к выдаче' }
  ];
  
  const details = [
    {
      ET: 'Seade on vastu võetud. Tehakse esialgne toiteahela diagnostika.',
      EN: 'Device received. Initial power circuit testing in progress.',
      RU: 'Устройство принято. Проводится первичная диагностика цепей питания.'
    },
    {
      ET: 'Ootame tellitud originaalkomponendi saabumist laost.',
      EN: 'Awaiting delivery of the ordered original component from the warehouse.',
      RU: 'Ожидаем поступления оригинального компонента со склада.'
    },
    {
      ET: 'Helitugevuse potentsiomeetrite puhastamine ja kanalite jootmine on töös.',
      EN: 'Volume potentiometers cleaning and channel soldering in progress.',
      RU: 'В процессе чистки потенциометров громкости и пропайки каналов.'
    },
    {
      ET: 'Seadme remont on lõpetatud. Kõik testid on edukalt läbitud. Võite järgi tulla.',
      EN: 'Repair complete. All performance diagnostics passed successfully. Ready to pick up.',
      RU: 'Ремонт завершен. Устройство протестировано и полностью готово к выдаче.'
    }
  ];
  
  return {
    device: devices[deviceIndex],
    received: '07.07.2026',
    estReady: estTimes[status - 1],
    status: status,
    details: details[status - 1]
  };
}
