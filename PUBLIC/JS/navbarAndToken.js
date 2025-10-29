(function bootstrapTheme() {
  try {
    const stored = localStorage.getItem('netlab-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = (stored === 'dark' || stored === 'light')
      ? stored
      : (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  } catch (err) {
    console.warn('Theme bootstrap failed', err);
  }
})();

// 전역 네임스페이스
window.NetLab = (function () {
  const API = window.API_BASE_URL;
  let triedRefreshOnce = false;

  const $nav  = () => $('#nav-links');
  const $user = () => $('#user-info');
  const THEME_STORAGE_KEY = 'netlab-theme';

  /* ---------- 테마 ---------- */
  const prefersDark = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function resolveTheme(explicitTheme) {
    if (explicitTheme === 'dark' || explicitTheme === 'light') {
      return explicitTheme;
    }
    return prefersDark() ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const resolved = resolveTheme(theme);
    const isDark = resolved === 'dark';
    const body = document.body;
    if (body) body.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    updateThemeToggle(isDark);
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      console.warn('Unable to persist theme preference', err);
    }
  }

  function toggleTheme() {
    const current = resolveTheme(getStoredTheme());
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  }

  function updateThemeToggle(isDark) {
    const $btn = $('#theme-toggle');
    if (!$btn.length) return;
    const label = isDark ? '라이트 모드로 전환' : '다크 모드로 전환';

    $btn.attr({
      'aria-label': label,
      'title': label
    });
    $btn.toggleClass('is-dark', isDark);
    $btn.find('.theme-toggle__icon').text(isDark ? '☀️' : '🌙');
  }

  function ensureThemeToggle() {
    const $navbar = $('.navbar');
    if (!$navbar.length) return;

    if (!$('#theme-toggle').length) {
      const $btn = $(`
        <button type="button" id="theme-toggle" class="theme-toggle" aria-live="polite">
          <span class="theme-toggle__icon" aria-hidden="true">🌙</span>
        </button>
      `);
      $btn.on('click', toggleTheme);

      const $rightGroup = $navbar.find('.right-group');
      if ($rightGroup.length) {
        $rightGroup.append($btn);
      } else {
        $navbar.append($btn);
      }
    }
    updateThemeToggle(resolveTheme(getStoredTheme()) === 'dark');
  }

  function initTheme() {
    applyTheme(getStoredTheme());
    ensureThemeToggle();

    if (window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      if (mql.addEventListener) {
        mql.addEventListener('change', e => {
          if (getStoredTheme()) return;
          applyTheme(e.matches ? 'dark' : 'light');
        });
      } else if (mql.addListener) {
        mql.addListener(e => {
          if (getStoredTheme()) return;
          applyTheme(e.matches ? 'dark' : 'light');
        });
      }
    }
  }

  /* ---------- UI ---------- */
  function renderGuest() {
    $nav().html(
      '<a href="/problems/list.html">문제목록</a>' +
      '<a href="/community/community.html">커뮤니티</a>' +
      '<a href="/login/login.html">로그인</a>' +
      '<a href="/login/signUp.html">회원가입</a>'
    );
    $user().hide();
    ensureThemeToggle();
  }

  function renderNav(isAdmin, name) {
    let links = '';
    if (isAdmin) links += '<a href="/admin/index.html">관리자 메뉴</a>';
    links += '<a href="/problems/list.html">문제목록</a>';
    links += '<a href="/community/community.html">커뮤니티</a>';
    links += '<a href="#" id="logoutBtn">로그아웃</a>';
    $nav().html(links);
    if (name) { $user().html('<a href="/profile/profile.html" style="text-decoration: none;">' + name + '</a>').show() } else { $user().hide(); }
    ensureThemeToggle();
  }

  /* ---------- 토큰 유틸 ---------- */
  function isExpired(token, leewaySec = 5) {
    try {
      const p = JSON.parse(atob(token.split('.')[1]));
      if (!p.exp) return true;
      const now = Math.floor(Date.now()/1000);
      return now >= (p.exp - leewaySec);
    } catch { return true; }
  }

  const getToken   = () => localStorage.getItem('token');
  const getRefresh = () => localStorage.getItem('refreshToken');
  const getName    = () => localStorage.getItem('name');

  function setCred(at, rt, name) {
    if (at)  localStorage.setItem('token', at);
    if (rt)  localStorage.setItem('refreshToken', rt);
    if (name) localStorage.setItem('name', name);
  }
  function clearCred() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('name');
  }

  /* ---------- API ---------- */
  function refreshTokens() {
    const rt = getRefresh();
    if (!rt) return $.Deferred().reject().promise();
    return $.ajax({
      url: `${API}/auth/refresh`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ refreshToken: rt })
    }).then(res => {
      if (!res || !res.accessToken || !res.refreshToken) {
        return $.Deferred().reject().promise();
      }
      setCred(res.accessToken, res.refreshToken, res.name);
      return res;
    });
  }

  function callIsAdmin(token, name) {
    return $.ajax({
      url: `${API}/auth/is-admin`,
      method: 'GET',
      headers: { "Authorization": "Bearer " + token }
    }).then(res => {
      const isAdmin = (typeof res === 'boolean') ? res : !!(res && res.isAdmin);
      renderNav(isAdmin, name);
      return isAdmin;
    }).fail(jqXHR => {
      const status = jqXHR.status;
      if ((status === 401 || status === 403) && getRefresh() && !triedRefreshOnce) {
        triedRefreshOnce = true;
        return refreshTokens()
          .then(r => callIsAdmin(r.accessToken, r.name || name))
          .fail(() => { clearCred(); renderGuest(); });
      } else {
        renderGuest();
        return $.Deferred().reject().promise();
      }
    });
  }

  /* ---------- 초기화 ---------- */
  function initNavbar() {
    // 기존 마크업(.navbar / #nav-links / #user-info)을 그대로 사용
    const at = getToken();
    const rt = getRefresh();

    if (at) {
      if (isExpired(at) && rt) {
        refreshTokens()
          .then(r => callIsAdmin(r.accessToken, r.name || getName()))
          .fail(renderGuest);
      } else {
        callIsAdmin(at, getName()).fail(renderGuest);
      }
    } else if (rt) {
      refreshTokens()
        .then(r => callIsAdmin(r.accessToken, r.name))
        .fail(renderGuest);
    } else {
      renderGuest();
    }

    // 위임 바인딩: 렌더 후 생기는 버튼에도 동작
    $(document).on('click', '#logoutBtn', function (e) {
      e.preventDefault();
      clearCred();
      alert('로그아웃 되었습니다');
      location.reload();
    });
  }

  return { initNavbar, initTheme };
})();

// DOM 준비되면 자동 실행
$(function(){
  if (NetLab.initTheme) {
    NetLab.initTheme();
  }
  NetLab.initNavbar();
});
