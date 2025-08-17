// 전역 네임스페이스
window.NetLab = (function () {
  const API = 'https://be.netlab.kr/api';
  let triedRefreshOnce = false;

  const $nav  = () => $('#nav-links');
  const $user = () => $('#user-info');

  /* ---------- UI ---------- */
  function renderGuest() {
    $nav().html(
      '<a href="/problems/list.html">문제목록</a>' +
      '<a href="/community/community.html">커뮤니티</a>' +
      '<a href="/login/login.html">로그인</a>' +
      '<a href="/login/signUp.html">회원가입</a>'
    );
    $user().hide();
  }

  function renderNav(isAdmin, name) {
    let links = '';
    if (isAdmin) links += '<a href="/admin/index.html">관리자 메뉴</a>';
    links += '<a href="/problems/list.html">문제목록</a>';
    links += '<a href="/community/community.html">커뮤니티</a>';
    links += '<a href="#" id="logoutBtn">로그아웃</a>';
    $nav().html(links);
    if (name) { $user().text(name).show(); } else { $user().hide(); }
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
      const isAdmin = (typeof res === 'boolean') ? res : !!res?.isAdmin;
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
    // partial 주입 후 실행
    $('#navbar').load('/PUBLIC/partials/navbar.html', function () {
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

      // 로그아웃
      $(document).on('click', '#logoutBtn', function (e) {
        e.preventDefault();
        clearCred();
        alert('로그아웃 되었습니다');
        location.reload();
      });
    });
  }

  return { initNavbar };
})();