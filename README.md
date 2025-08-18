# NetLab Frontend

## 환경변수 설정

이 프로젝트는 개발 환경과 프로덕션 환경에서 다른 API URL을 사용하도록 설정되어 있습니다.

### 설정 파일

- `config.js` - 자동 환경 감지 (기본값)
- `config.development.js` - 개발 환경 전용
- `config.production.js` - 프로덕션 환경 전용

### 사용 방법

#### 1. 자동 환경 감지 (권장)
기본적으로 `config.js`를 사용하면 현재 도메인에 따라 자동으로 환경을 감지합니다:
- `localhost` 또는 `127.0.0.1` → 개발 환경 (`http://localhost:3000/api`)
- 그 외 → 프로덕션 환경 (`https://be.netlab.kr/api`)

#### 2. 수동 환경 설정
특정 환경을 강제로 사용하고 싶다면:

**개발 환경 사용:**
```html
<script src="config.development.js"></script>
```

**프로덕션 환경 사용:**
```html
<script src="config.production.js"></script>
```

### API URL 사용법

JavaScript에서 API URL을 사용할 때:
```javascript
// 전역 변수로 사용
const apiUrl = window.API_BASE_URL;

// 예시
$.ajax({
  url: window.API_BASE_URL + '/auth/login',
  method: 'POST',
  // ...
});
```

### 환경별 API URL

- **개발 환경**: `http://localhost:3000/api`
- **프로덕션 환경**: `https://be.netlab.kr/api`

### 주의사항

1. 모든 HTML 파일에서 `config.js` (또는 환경별 설정 파일)가 다른 스크립트보다 먼저 로드되어야 합니다.
2. `window.API_BASE_URL` 전역 변수를 통해 API URL에 접근할 수 있습니다.
3. 환경 변경 시 서버 재시작이 필요할 수 있습니다.
