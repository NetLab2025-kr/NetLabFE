// 환경변수 설정
const config = {
  // 개발 환경 (로컬)
  development: {
    API_BASE_URL: 'http://localhost:8080/api'
  },
  // 프로덕션 환경 (배포)
  production: {
    API_BASE_URL: 'https://be.netlab.kr/api'
  }
};

// 현재 환경 감지 (기본값은 development)
const currentEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'development' : 'production';

// 현재 환경의 설정을 내보내기
window.APP_CONFIG = config[currentEnv];

// 편의를 위한 전역 변수
window.API_BASE_URL = window.APP_CONFIG.API_BASE_URL;
