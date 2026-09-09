(() => {
  const listEl = document.getElementById('questions-list');
  const form = document.getElementById('question-form');
  const submitBtn = document.getElementById('submit-btn');
  const messageEl = document.getElementById('form-message');
  const refreshBtn = document.getElementById('refresh-btn');
  const sortButtons = document.querySelectorAll('.sort-btn');

  const VOTED_KEY = 'ioc_qna_voted_ids';
  let currentSort = 'new';
  let questions = [];
  let pollTimer = null;

  function getVotedIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  function saveVotedIds(set) {
    localStorage.setItem(VOTED_KEY, JSON.stringify([...set]));
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} דק'`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  }

  function render() {
    const sorted = [...questions].sort((a, b) => {
      if (currentSort === 'top') return b.upvotes - a.upvotes || new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (sorted.length === 0) {
      listEl.innerHTML = '';
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'עדיין אין שאלות. היו הראשונים לשאול!';
      listEl.appendChild(li);
      return;
    }

    const votedIds = getVotedIds();
    listEl.innerHTML = '';
    for (const q of sorted) {
      const li = document.createElement('li');
      li.className = 'question-item';

      const top = document.createElement('div');
      top.className = 'q-top';
      const name = document.createElement('span');
      name.className = 'q-name';
      name.textContent = q.name;
      const time = document.createElement('span');
      time.className = 'q-time';
      time.textContent = timeAgo(q.createdAt);
      top.append(name, time);

      const text = document.createElement('p');
      text.className = 'q-text';
      text.textContent = q.question;

      const actions = document.createElement('div');
      actions.className = 'q-actions';
      const voteBtn = document.createElement('button');
      voteBtn.className = 'upvote-btn' + (votedIds.has(q.id) ? ' voted' : '');
      voteBtn.innerHTML = `<span>👍</span><span>${q.upvotes}</span>`;
      voteBtn.disabled = votedIds.has(q.id);
      voteBtn.addEventListener('click', () => upvote(q.id, voteBtn));
      actions.appendChild(voteBtn);

      li.append(top, text, actions);
      listEl.appendChild(li);
    }
  }

  async function loadQuestions() {
    try {
      const resp = await fetch('/api/questions');
      if (!resp.ok) throw new Error('load failed');
      questions = await resp.json();
      render();
    } catch (e) {
      listEl.innerHTML = '<li class="empty-state">שגיאה בטעינת השאלות. נסו לרענן.</li>';
    }
  }

  async function upvote(id, btn) {
    const votedIds = getVotedIds();
    if (votedIds.has(id)) return;
    btn.disabled = true;
    try {
      const resp = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!resp.ok) throw new Error('vote failed');
      votedIds.add(id);
      saveVotedIds(votedIds);
      const q = questions.find((x) => x.id === id);
      if (q) q.upvotes += 1;
      render();
    } catch (e) {
      btn.disabled = false;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const question = document.getElementById('question').value.trim();
    messageEl.textContent = '';
    messageEl.className = 'form-message';

    if (!name || !question) {
      messageEl.textContent = 'נא למלא שם ושאלה';
      messageEl.classList.add('error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'שולח...';
    try {
      const resp = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, question, website: document.getElementById('website').value }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'שגיאה');

      form.reset();
      messageEl.textContent = 'השאלה נשלחה בהצלחה, תודה!';
      messageEl.classList.add('success');
      loadQuestions();
    } catch (err) {
      messageEl.textContent = err.message || 'שגיאה בשליחת השאלה';
      messageEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'שליחת שאלה';
    }
  });

  sortButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      sortButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      render();
    });
  });

  refreshBtn.addEventListener('click', loadQuestions);

  loadQuestions();
  pollTimer = setInterval(loadQuestions, 20000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(pollTimer);
    else {
      loadQuestions();
      pollTimer = setInterval(loadQuestions, 20000);
    }
  });
})();
