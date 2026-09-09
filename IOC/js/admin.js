(() => {
  const TOKEN_KEY = 'ioc_qna_admin_token';

  const loginCard = document.getElementById('login-card');
  const adminCard = document.getElementById('admin-card');
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const loginMessage = document.getElementById('login-message');
  const adminList = document.getElementById('admin-list');
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const logoutBtn = document.getElementById('logout-btn');

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function showAdmin() {
    loginCard.hidden = true;
    adminCard.hidden = false;
    loadQuestions();
  }

  function showLogin() {
    loginCard.hidden = false;
    adminCard.hidden = true;
  }

  async function authedFetch(url, options = {}) {
    const token = getToken();
    const resp = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (resp.status === 401) {
      clearToken();
      showLogin();
      throw new Error('פג תוקף ההתחברות, נא להתחבר שוב');
    }
    return resp;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    loginMessage.textContent = '';
    loginMessage.className = 'form-message';
    loginBtn.disabled = true;
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'שגיאה בהתחברות');
      setToken(data.token);
      loginForm.reset();
      showAdmin();
    } catch (err) {
      loginMessage.textContent = err.message;
      loginMessage.classList.add('error');
    } finally {
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', () => {
    clearToken();
    showLogin();
  });

  refreshBtn.addEventListener('click', loadQuestions);

  async function loadQuestions() {
    adminList.innerHTML = '<li class="empty-state">טוען...</li>';
    try {
      const resp = await authedFetch('/api/admin-list');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'שגיאה');
      renderList(data);
    } catch (err) {
      adminList.innerHTML = `<li class="empty-state">${err.message}</li>`;
    }
  }

  function renderList(questions) {
    if (questions.length === 0) {
      adminList.innerHTML = '<li class="empty-state">אין שאלות עדיין</li>';
      return;
    }
    adminList.innerHTML = '';
    for (const q of questions) {
      const li = document.createElement('li');
      li.className = 'question-item admin-item' + (q.state === 'closed' ? ' closed' : '');

      const top = document.createElement('div');
      top.className = 'q-top';
      const badge = document.createElement('span');
      badge.className = 'status-badge' + (q.state === 'closed' ? ' closed' : '');
      badge.textContent = q.state === 'closed' ? 'מוסתר' : 'גלוי';
      top.appendChild(badge);

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = q.name;
      nameInput.maxLength = 80;

      const questionInput = document.createElement('textarea');
      questionInput.rows = 3;
      questionInput.maxLength = 1000;
      questionInput.value = q.question;

      const actions = document.createElement('div');
      actions.className = 'admin-actions';

      const saveBtn = document.createElement('button');
      saveBtn.className = 'save-btn';
      saveBtn.textContent = 'שמירת עריכה';
      saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        try {
          const resp = await authedFetch(`/api/question?id=${q.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameInput.value, question: questionInput.value }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'שגיאה');
          loadQuestions();
        } catch (err) {
          alert(err.message);
        } finally {
          saveBtn.disabled = false;
        }
      });

      const toggleBtn = document.createElement('button');
      const isClosed = q.state === 'closed';
      toggleBtn.className = isClosed ? 'restore-btn' : 'delete-btn';
      toggleBtn.textContent = isClosed ? 'שחזור' : 'מחיקה';
      toggleBtn.addEventListener('click', async () => {
        if (!isClosed && !confirm('להסתיר את השאלה הזו מהעמוד הציבורי?')) return;
        toggleBtn.disabled = true;
        try {
          const resp = await authedFetch(`/api/question?id=${q.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: isClosed ? 'open' : 'closed' }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'שגיאה');
          loadQuestions();
        } catch (err) {
          alert(err.message);
        } finally {
          toggleBtn.disabled = false;
        }
      });

      actions.append(saveBtn, toggleBtn);
      li.append(top, nameInput, questionInput, actions);
      adminList.appendChild(li);
    }
  }

  if (getToken()) {
    showAdmin();
  }
})();
