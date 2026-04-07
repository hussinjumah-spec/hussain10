// ==================== FORM VIEWER (User Side) ====================
let viewerForm = null;
let viewerAnswers = {};
let currentQuestionIndex = 0;
let viewerMode = 'one-by-one';
let uploadedFiles = {};

function loadFormViewer(form) {
  viewerForm = form;
  viewerAnswers = {};
  uploadedFiles = {};
  currentQuestionIndex = 0;
  viewerMode = form.displayMode || 'one-by-one';

  // Set header info
  document.getElementById('viewer-form-title').textContent = form.title;
  document.getElementById('viewer-form-desc').textContent = form.description || '';

  // Logo
  const logoEl = document.getElementById('form-logo-display');
  if (form.logo) {
    logoEl.innerHTML = `<img src="${form.logo}" alt="logo" style="width:80px;height:80px;object-fit:cover;border-radius:16px">`;
    logoEl.style.display = 'block';
  } else {
    logoEl.style.display = 'none';
  }

  renderViewerQuestions();
  updateProgress();

  const nav = document.getElementById('viewer-nav');
  const submitBtn = document.getElementById('submit-btn');

  if (viewerMode === 'all-at-once') {
    // Show all questions, hide nav
    document.querySelectorAll('.viewer-question').forEach(q => q.classList.add('all-visible'));
    nav.style.display = 'none';
    submitBtn.style.display = 'block';
    document.getElementById('progress-container')?.remove();
  } else {
    nav.style.display = 'flex';
    showQuestion(0);
  }
}

function renderViewerQuestions() {
  const container = document.getElementById('viewer-questions-container');
  const questions = viewerForm.questions || [];

  // Add name input first
  container.innerHTML = `
    <div class="viewer-question visible viewer-name-input" id="vq-name">
      <div class="vq-label"><i class="fas fa-user"></i> معلومات المشارك <span class="vq-required">*</span></div>
      <div class="vq-text">ما اسمك الكريم؟</div>
      <input type="text" class="vq-input" id="respondent-name" placeholder="أدخل اسمك..." oninput="viewerAnswers['_name'] = this.value" style="margin-bottom:1.5rem">
      <div class="vq-text">رقم الهاتف التواصل</div>
      <input type="tel" class="vq-input" id="respondent-phone" placeholder="أدخل رقم الهاتف..." oninput="viewerAnswers['_phone'] = this.value">
    </div>
    ${questions.map((q, idx) => buildViewerQuestion(q, idx)).join('')}
  `;

  buildNavDots(questions.length + 1);
}

function buildViewerQuestion(q, idx) {
  let inputHtml = '';

  if (q.type === 'multiple-choice' || q.type === 'true-false') {
    inputHtml = `<div class="vq-options">
      ${q.options.map(opt => `
        <div class="vq-option" id="opt-${opt.id}" onclick="selectOption('${q.id}', '${opt.id}')">
          <div class="vq-option-radio"></div>
          <span class="vq-option-text">${opt.text}</span>
        </div>`).join('')}
    </div>`;
  } else if (q.type === 'short-answer') {
    inputHtml = `<input type="text" class="vq-input" placeholder="اكتب إجابتك هنا..."
      oninput="viewerAnswers['${q.id}'] = this.value" id="inp-${q.id}">`;
  } else if (q.type === 'paragraph') {
    inputHtml = `<textarea class="vq-input" rows="5" placeholder="اكتب إجابتك هنا..."
      oninput="viewerAnswers['${q.id}'] = this.value" id="inp-${q.id}"></textarea>`;
  } else if (q.type === 'file-upload') {
    inputHtml = `
      <div class="vq-file-upload" onclick="document.getElementById('file-${q.id}').click()">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>انقر لرفع ملف أو اسحبه هنا</p>
        <p style="font-size:.75rem;margin-top:.25rem">PNG, JPG, PDF, DOCX حتى 10MB</p>
        <div id="file-name-${q.id}" style="margin-top:.75rem;font-size:.85rem;color:var(--primary)"></div>
      </div>
      <input type="file" id="file-${q.id}" hidden onchange="handleFileUpload('${q.id}', this)">`;
  }

  const reqSpan = q.required ? `<span class="vq-required">*</span>` : '';
  return `
    <div class="viewer-question" id="vq-${q.id}" data-qid="${q.id}" data-idx="${idx + 1}">
      <div class="vq-label"><i class="fas fa-circle-dot"></i> سؤال ${idx + 1} ${reqSpan}</div>
      <div class="vq-text">${q.text || 'سؤال بدون نص'}</div>
      ${inputHtml}
    </div>`;
}

function selectOption(qId, optId) {
  viewerAnswers[qId] = optId;
  // Update UI
  const question = viewerForm.questions.find(q => q.id === qId);
  if (!question) return;
  question.options.forEach(opt => {
    const el = document.getElementById(`opt-${opt.id}`);
    if (el) el.classList.toggle('selected', opt.id === optId);
  });
}

function handleFileUpload(qId, input) {
  const file = input.files[0];
  if (!file) return;
  uploadedFiles[qId] = file.name;
  viewerAnswers[qId] = file.name;
  const nameEl = document.getElementById(`file-name-${qId}`);
  if (nameEl) nameEl.textContent = `✓ ${file.name}`;
}

// -------- NAVIGATION --------
function showQuestion(idx) {
  const allQs = document.querySelectorAll('.viewer-question');
  allQs.forEach(q => q.classList.remove('visible'));

  if (allQs[idx]) allQs[idx].classList.add('visible');

  currentQuestionIndex = idx;
  updateProgress();
  updateNavButtons();
  updateNavDots();
}

function nextQuestion() {
  const allQs = document.querySelectorAll('.viewer-question');
  if (currentQuestionIndex < allQs.length - 1) {
    showQuestion(currentQuestionIndex + 1);
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    showQuestion(currentQuestionIndex - 1);
  }
}

function updateProgress() {
  if (!viewerForm) return;
  const total = (viewerForm.questions?.length || 0) + 1; // +1 for name
  const current = currentQuestionIndex + 1;
  const pct = Math.round((current / total) * 100);

  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  const pctEl = document.getElementById('progress-percent');

  if (bar) bar.style.width = pct + '%';
  if (text) text.textContent = `سؤال ${current} من ${total}`;
  if (pctEl) pctEl.textContent = pct + '%';
}

function updateNavButtons() {
  const allQs = document.querySelectorAll('.viewer-question');
  const total = allQs.length;
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');

  if (prevBtn) prevBtn.style.opacity = currentQuestionIndex === 0 ? '0.3' : '1';
  if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

  const isLast = currentQuestionIndex === total - 1;
  if (nextBtn) nextBtn.style.display = isLast ? 'none' : 'flex';
  if (submitBtn) submitBtn.style.display = isLast ? 'block' : 'none';
}

function buildNavDots(total) {
  const dotsContainer = document.getElementById('nav-dots');
  if (!dotsContainer) return;
  dotsContainer.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="nav-dot ${i === 0 ? 'active' : ''}" onclick="showQuestion(${i})"></div>`
  ).join('');
}

function updateNavDots() {
  document.querySelectorAll('.nav-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentQuestionIndex);
  });
}

// -------- SUBMIT --------
function submitForm() {
  if (!viewerForm) return;

  const name = document.getElementById('respondent-name')?.value?.trim();
  const phone = document.getElementById('respondent-phone')?.value?.trim();
  
  if (!name) { showToast('يرجى إدخال اسمك أولاً', 'error'); showQuestion(0); return; }
  if (!phone) { showToast('يرجى إدخال رقم الهاتف', 'error'); showQuestion(0); return; }

  // Validate required
  for (const q of viewerForm.questions) {
    if (q.required && !viewerAnswers[q.id]) {
      showToast(`يرجى الإجابة على السؤال: "${q.text}"`, 'error');
      const qEl = document.getElementById(`vq-${q.id}`);
      if (qEl) {
        const idx = +qEl.dataset.idx;
        showQuestion(idx);
      }
      return;
    }
  }

  // Calculate score
  let score = 0, totalPoints = 0;
  viewerForm.questions.forEach(q => {
    totalPoints += (q.points || 0);
    if ((q.type === 'multiple-choice' || q.type === 'true-false') && q.points > 0) {
      const selectedOptId = viewerAnswers[q.id];
      const selectedOpt = q.options.find(o => o.id === selectedOptId);
      if (selectedOpt?.correct) score += q.points;
    }
  });

  // Anti-duplicate check (same name + same form in last 10 min)
  const recentResponses = DB.getResponsesByForm(viewerForm.id);
  const tenMinAgo = Date.now() - 600000;
  const duplicate = recentResponses.find(r =>
    r.respondentName === name && new Date(r.submittedAt).getTime() > tenMinAgo
  );
  if (duplicate) {
    showToast('لقد قدمت إجابة مؤخراً. يرجى الانتظار قبل الإرسال مرة أخرى.', 'warning');
    return;
  }

  const response = {
    id: DB.generateId(),
    formId: viewerForm.id,
    respondentName: name,
    respondentPhone: phone,
    answers: { ...viewerAnswers },
    score,
    totalPoints,
    submittedAt: new Date().toISOString()
  };

  DB.addResponse(response);
  showResultPage(response, viewerForm);
}

function showResultPage(response, form) {
  showPage('result-page');

  const isQuiz = form.type === 'quiz';
  const totalPoints = response.totalPoints || 0;
  const pct = totalPoints > 0 ? Math.round((response.score / totalPoints) * 100) : 0;

  const titleEl = document.getElementById('result-title');
  const msgEl = document.getElementById('result-message');
  const scoreEl = document.getElementById('result-score-value');
  const detailsEl = document.getElementById('result-details');
  const circleEl = document.getElementById('result-progress-circle');

  // Logic: Only show score if it's a quiz AND showScore setting is NOT explicitly false
  const showScore = isQuiz && (form.showScore !== false);
  
  titleEl.textContent = showScore
    ? (pct >= 70 ? 'أحسنت! نتيجة ممتازة 🎉' : pct >= 50 ? 'جيد! يمكنك التحسين 💪' : 'حاول مرة أخرى 📚')
    : 'شكراً لمشاركتك! 🎉';

  msgEl.textContent = showScore
    ? `حصلت على ${response.score} من ${response.totalPoints} نقطة`
    : 'تم إرسال إجاباتك بنجاح';

  scoreEl.textContent = showScore ? pct + '%' : '✓';

  // Animate circle
  if (showScore) {
    const circumference = 283;
    const offset = circumference - (pct / 100) * circumference;
    setTimeout(() => {
      if (circleEl) {
        circleEl.style.strokeDashoffset = offset;
        circleEl.style.stroke = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
      }
    }, 300);
  } else {
    if (circleEl) { 
      circleEl.style.strokeDashoffset = 0; 
      circleEl.style.stroke = 'var(--primary)';
    }
  }

  const date = new Date(response.submittedAt).toLocaleString('ar-SA');
  detailsEl.innerHTML = `
    <div class="result-detail-row">
      <span class="result-detail-label">الاسم</span>
      <span class="result-detail-value">${response.respondentName}</span>
    </div>
    <div class="result-detail-row">
      <span class="result-detail-label">رقم الهاتف</span>
      <span class="result-detail-value">${response.respondentPhone || '-'}</span>
    </div>
    <div class="result-detail-row">
      <span class="result-detail-label">النموذج</span>
      <span class="result-detail-value">${form.title}</span>
    </div>
    ${showScore ? `<div class="result-detail-row">
      <span class="result-detail-label">النتيجة</span>
      <span class="result-detail-value" style="color:${pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'}">${response.score}/${totalPoints}</span>
    </div>` : ''}
    <div class="result-detail-row">
      <span class="result-detail-label">وقت الإرسال</span>
      <span class="result-detail-value">${date}</span>
    </div>
  `;

  // Update dashboard if admin
  updateBadgeCounts();
}

function retakeForm() {
  if (!viewerForm) { showPage('login-page'); return; }
  viewerAnswers = {};
  uploadedFiles = {};
  currentQuestionIndex = 0;

  // Reset inputs
  document.querySelectorAll('.vq-option').forEach(o => o.classList.remove('selected'));
  document.querySelectorAll('.vq-input').forEach(i => i.value = '');
  document.getElementById('respondent-name').value = '';
  document.getElementById('respondent-phone').value = '';

  if (viewerMode === 'one-by-one') showQuestion(0);
  showPage('form-viewer');
}
