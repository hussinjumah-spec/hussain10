// ==================== ANALYTICS ====================
function renderAnalytics() {
  const forms = DB.getForms();
  const responses = DB.getResponses();
  const container = document.getElementById('analytics-content');

  if (responses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-chart-bar"></i></div>
        <h3>لا توجد بيانات كافية</h3>
        <p>ستظهر التحليلات بعد تلقي الإجابات الأولى</p>
      </div>`;
    return;
  }

  // Group responses by form
  const formStats = forms.map(f => {
    const fResponses = responses.filter(r => r.formId === f.id);
    const avgScore = fResponses.length > 0 && fResponses[0].totalPoints > 0
      ? Math.round(fResponses.reduce((s, r) => s + (r.score / r.totalPoints) * 100, 0) / fResponses.length)
      : null;
    return { title: f.title, count: fResponses.length, avgScore };
  }).filter(s => s.count > 0);

  // Daily responses (last 7 days)
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('ar-SA', { weekday: 'short' });
    const count = responses.filter(r => {
      const rd = new Date(r.submittedAt);
      return rd.toDateString() === d.toDateString();
    }).length;
    days.push({ label, count });
  }

  const maxDay = Math.max(...days.map(d => d.count), 1);
  const maxForm = Math.max(...formStats.map(f => f.count), 1);

  container.innerHTML = `
    <div class="analytics-grid">
      <!-- Summary Cards -->
      <div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem">
        <div class="analytics-card" style="text-align:center">
          <div style="font-size:2.5rem;font-weight:800;color:var(--primary)">${responses.length}</div>
          <div style="color:var(--text-muted);font-size:.85rem">إجمالي الإجابات</div>
        </div>
        <div class="analytics-card" style="text-align:center">
          <div style="font-size:2.5rem;font-weight:800;color:var(--secondary)">${forms.filter(f=>f.active).length}</div>
          <div style="color:var(--text-muted);font-size:.85rem">نماذج نشطة</div>
        </div>
        <div class="analytics-card" style="text-align:center">
          <div style="font-size:2.5rem;font-weight:800;color:var(--success)">${days.reduce((s,d)=>s+d.count,0)}</div>
          <div style="color:var(--text-muted);font-size:.85rem">إجابات الأسبوع</div>
        </div>
        <div class="analytics-card" style="text-align:center">
          <div style="font-size:2.5rem;font-weight:800;color:var(--accent)">${formStats.length}</div>
          <div style="color:var(--text-muted);font-size:.85rem">نماذج نشطة</div>
        </div>
      </div>

      <!-- Daily Chart -->
      <div class="analytics-card" style="grid-column:1/-1">
        <h3><i class="fas fa-chart-line" style="color:var(--primary)"></i> الإجابات خلال آخر 7 أيام</h3>
        <div class="bar-chart">
          ${days.map(d => `
            <div class="bar-item">
              <div class="bar-fill" style="height:${Math.round((d.count/maxDay)*100)}%;background:linear-gradient(180deg,var(--primary),var(--primary-dark))">
                <span class="bar-value">${d.count}</span>
              </div>
              <span class="bar-label">${d.label}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Forms Chart -->
      <div class="analytics-card full">
        <h3><i class="fas fa-file-alt" style="color:var(--secondary)"></i> الإجابات حسب النموذج</h3>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${formStats.map(f => `
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="width:140px;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right">${f.title}</div>
              <div style="flex:1;height:28px;background:var(--dark-3);border-radius:14px;overflow:hidden">
                <div style="height:100%;width:${Math.round((f.count/maxForm)*100)}%;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:14px;transition:width 1s ease;display:flex;align-items:center;justify-content:flex-end;padding:0 .5rem">
                  <span style="font-size:.75rem;font-weight:700;color:#fff">${f.count}</span>
                </div>
              </div>
              ${f.avgScore !== null ? `<div style="font-size:.8rem;color:var(--text-muted);width:50px;text-align:left">${f.avgScore}%</div>` : '<div style="width:50px"></div>'}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}
