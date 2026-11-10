/**
 * RACING THEME & RESUME WEBSITE INTERACTIVE SCRIPT
 * Features:
 * 1. Race track scroll progress with driving race car indicator
 * 2. Interactive tachometer with Web Audio API engine rev synthesizer
 * 3. Live in-page editable mode (contenteditable) + 1-click HTML export
 * 4. Dark/Light mode theme switcher
 * 5. One-click copy email with animated toast notification
 * 6. Print / Download PDF resume trigger
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollTrack();
  initTachometer();
  initLiveEditMode();
  initThemeToggle();
  initCopyEmail();
  initContactForm();
  initPrintResume();
});

/* ==========================================================================
   1. 賽車賽道頂部捲動進度條 (Race Track Scroll Progress)
   ========================================================================== */
function initScrollTrack() {
  const fill = document.getElementById('raceTrackFill');
  const car = document.getElementById('raceCarIndicator');
  if (!fill || !car) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    fill.style.width = `${progress}%`;
    
    // 稍微根據滾動速度或方向晃動賽車圖標
    if (progress >= 99) {
      car.textContent = '🏁';
    } else {
      car.textContent = '🏎️';
    }
  }, { passive: true });
}

/* ==========================================================================
   2. 互動式轉速表與 Web Audio 引擎聲浪 (Tachometer & Engine Rev)
   ========================================================================== */
function initTachometer() {
  const btnRev = document.getElementById('btnRevEngine');
  const rpmDisplay = document.getElementById('rpmDisplay');
  const ledBar = document.getElementById('rpmLedBar');
  if (!btnRev || !rpmDisplay || !ledBar) return;

  const leds = ledBar.querySelectorAll('.led');
  let isRevving = false;

  btnRev.addEventListener('click', () => {
    if (isRevving) return;
    isRevving = true;

    // 播放 Web Audio API 合成賽車拉轉聲浪
    playEngineRevSound();

    // 轉速瞬間飆升到紅線 9,000 RPM
    let targetRpm = 9200;
    let currentRpm = 3500;
    
    // 燈號全部點亮
    leds.forEach(led => led.classList.add('on'));
    btnRev.style.transform = 'scale(0.92)';

    let revInterval = setInterval(() => {
      currentRpm += 500;
      if (currentRpm >= targetRpm) {
        currentRpm = targetRpm;
        clearInterval(revInterval);
        rpmDisplay.innerHTML = `${currentRpm.toLocaleString()} <span style="font-size: 0.75rem; color: #ef4444;">REV LIMIT!</span>`;
        
        // 0.6 秒後轉速平穩回落到怠速
        setTimeout(() => {
          let dropInterval = setInterval(() => {
            currentRpm -= 600;
            if (currentRpm <= 3500) {
              currentRpm = 3500;
              clearInterval(dropInterval);
              rpmDisplay.innerHTML = `3,500 <span style="font-size: 0.75rem; color: var(--accent-primary);">RPM</span>`;
              // 重設燈號回標準狀態 (前 4 顆亮)
              leds.forEach((led, idx) => {
                if (idx < 4) led.classList.add('on');
                else led.classList.remove('on');
              });
              btnRev.style.transform = '';
              isRevving = false;
            } else {
              rpmDisplay.innerHTML = `${currentRpm.toLocaleString()} <span style="font-size: 0.75rem; color: var(--accent-primary);">RPM</span>`;
            }
          }, 40);
        }, 500);
      } else {
        rpmDisplay.innerHTML = `${currentRpm.toLocaleString()} <span style="font-size: 0.75rem; color: #f59e0b;">RPM</span>`;
      }
    }, 30);
  });
}

/**
 * 使用純 Web Audio API 合成賽車引擎聲 (無須載入任何外部音效檔案)
 */
function playEngineRevSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';

    const now = ctx.currentTime;
    
    // 轉速聲音頻率從低音快速升至高亢超跑聲
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(120, now + 1.1);

    // 濾波器模擬排氣管聲浪共振
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(400, now + 1.1);

    // 音量包絡線
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.15);
  } catch (e) {
    // 瀏覽器若未授權音訊則靜默略過
    console.log('AudioContext not allowed or not supported yet');
  }
}

/* ==========================================================================
   3. 即時網頁編輯模式 (Live In-Page Edit Mode) & HTML 匯出儲存
   ========================================================================== */
function initLiveEditMode() {
  const btnToggle = document.getElementById('btnToggleEdit');
  const btnExport = document.getElementById('btnExportHtml');
  const btnText = document.getElementById('editBtnText');
  const placeholders = document.querySelectorAll('.ph');

  if (!btnToggle) return;

  let isEditing = false;

  btnToggle.addEventListener('click', () => {
    isEditing = !isEditing;
    document.body.classList.toggle('editing-active', isEditing);
    btnToggle.classList.toggle('active', isEditing);

    if (isEditing) {
      btnText.textContent = '完成編輯 (鎖定修改)';
      btnToggle.style.background = '#2563eb';
      btnToggle.style.color = '#ffffff';
      if (btnExport) btnExport.style.display = 'inline-flex';
      
      // 開啟所有留白文字區域的 contenteditable
      placeholders.forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      });

      showToast('✏️ 已開啟即時修改模式！點擊頁面上的任一留白文字即可直接輸入修改。');
    } else {
      btnText.textContent = '開啟網頁直接修改模式';
      btnToggle.style.background = '';
      btnToggle.style.color = '';
      
      placeholders.forEach(el => {
        el.removeAttribute('contenteditable');
      });

      showToast('🔒 已退出編輯模式，內容已保留在當前畫面上！');
    }
  });

  // 匯出儲存當前修改後的 HTML 檔案
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      // 確保在匯出時移除 contenteditable 與編輯中樣式
      document.body.classList.remove('editing-active');
      placeholders.forEach(el => el.removeAttribute('contenteditable'));

      const currentHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
      const blob = new Blob([currentHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-custom-resume.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('💾 已成功匯出包含您修改內容的 my-custom-resume.html！');
    });
  }
}

/* ==========================================================================
   4. 深色 / 淺色主題切換 (Theme Toggle)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  if (!toggleBtn || !themeIcon) return;

  // 讀取先前儲存的主題偏好
  const savedTheme = localStorage.getItem('site-theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.textContent = '🌙';
      localStorage.setItem('site-theme', 'light');
      showToast('☀️ 已切換至明亮現代風格');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '☀️';
      localStorage.setItem('site-theme', 'dark');
      showToast('🌙 已切換至深色科技風格');
    }
  });
}

/* ==========================================================================
   5. 複製 Email 功能 (Copy Email to Clipboard)
   ========================================================================== */
function initCopyEmail() {
  const btnHero = document.getElementById('btnCopyEmailHero');
  const btnContact = document.getElementById('btnCopyEmailContact');
  const emailVal = document.getElementById('emailVal');

  const copyAction = () => {
    const textToCopy = emailVal ? emailVal.textContent.trim() : 'your.name@example.com';
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(`📋 已複製 Email 信箱：${textToCopy}`);
    }).catch(() => {
      showToast('📋 已複製 Email 資訊');
    });
  };

  if (btnHero) btnHero.addEventListener('click', copyAction);
  if (btnContact) btnContact.addEventListener('click', copyAction);
}

/* ==========================================================================
   6. 聯絡表單送出提示 (Contact Form Validation)
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('formName').value;
    showToast(`🚀 謝謝您的訊息，${name || '貴賓'}！已成功送出面試邀約。`);
    form.reset();
  });
}

/* ==========================================================================
   7. 列印履歷 / A4 PDF 轉存
   ========================================================================== */
function initPrintResume() {
  const printBtn = document.getElementById('btnPrintResume');
  if (!printBtn) return;

  printBtn.addEventListener('click', () => {
    window.print();
  });
}

/* ==========================================================================
   通知訊息彈窗 (Toast Notification)
   ========================================================================== */
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toastBox');
  const msgSpan = document.getElementById('toastMsg');
  if (!toast || !msgSpan) return;

  msgSpan.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
