# AI 영상 제작 프롬프트 마법사 - AWS 배포용

AWS Elastic Beanstalk 또는 ECS(Fargate)에 배포 가능한 컨테이너 기반 애플리케이션입니다.

## 프로젝트 구조

```
video-prompt-wizard-aws/
├── server.js                 # Express 서버
├── package.json             # Node.js 의존성
├── Dockerfile               # Docker 이미지 빌드 설정
├── docker-compose.yml       # 로컬 테스트용 Docker Compose
├── .dockerignore           # Docker 빌드 제외 파일
├── data/                   # JSON 데이터 파일
│   ├── A2.all_tools_schema.json
│   └── B2.video_prompt_system.json
└── public/                 # 정적 파일 (프론트엔드)
    ├── index.html
    ├── style.css
    └── script.js
```

## 기술 스택

- **백엔드**: Node.js 18 + Express
- **프론트엔드**: Vanilla JavaScript (프레임워크 없음)
- **컨테이너**: Docker
- **배포**: AWS Elastic Beanstalk / ECS Fargate

## 로컬 테스트

### 1. Docker Compose 사용 (권장)

```bash
# Docker 이미지 빌드 및 컨테이너 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 중지
docker-compose down
```

애플리케이션이 http://localhost:8080 에서 실행됩니다.

### 2. Node.js 직접 실행

```bash
# 의존성 설치
npm install

# 서버 실행
npm start

# 개발 모드 (nodemon)
npm run dev
```

## API 엔드포인트

- `GET /` - 메인 페이지
- `GET /api/health` - 헬스 체크
- `GET /api/video-prompt-system` - 비디오 프롬프트 시스템 데이터
- `GET /api/tools-schema` - 도구 스키마 데이터
- `GET /api/supported-models` - 지원 모델 목록

## AWS 배포

### Elastic Beanstalk 배포

1. **Elastic Beanstalk CLI 설치**
```bash
pip install awsebcli
```

2. **애플리케이션 초기화**
```bash
eb init -p docker video-prompt-wizard
```

3. **환경 생성 및 배포**
```bash
eb create video-prompt-wizard-env
eb deploy
```

4. **애플리케이션 열기**
```bash
eb open
```

### ECS Fargate 배포

1. **ECR 레포지토리 생성**
```bash
aws ecr create-repository --repository-name video-prompt-wizard
```

2. **Docker 이미지 빌드 및 푸시**
```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드
docker build -t video-prompt-wizard .

# 이미지 태그
docker tag video-prompt-wizard:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/video-prompt-wizard:latest

# 이미지 푸시
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/video-prompt-wizard:latest
```

3. **ECS 태스크 정의 및 서비스 생성**
- AWS 콘솔에서 ECS 클러스터 생성
- 태스크 정의 생성 (Fargate, 0.5 vCPU, 1GB 메모리)
- 컨테이너 포트: 8080
- 서비스 생성 및 배포

## 환경 변수

- `PORT`: 서버 포트 (기본값: 8080)
- `NODE_ENV`: 환경 (production/development)

## 헬스 체크

애플리케이션은 `/api/health` 엔드포인트를 통해 헬스 체크를 제공합니다.

```bash
curl http://localhost:8080/api/health
```

응답:
```json
{
  "status": "ok",
  "message": "AI Video Prompt Wizard API is running",
  "timestamp": "2025-10-25T03:52:00.000Z"
}
```

## 문제 해결

### Docker 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
docker-compose logs -f

# 컨테이너 상태 확인
docker-compose ps
```

### JSON 파일을 찾을 수 없는 경우

`data/` 디렉토리에 다음 파일이 있는지 확인:
- `A2.all_tools_schema.json`
- `B2.video_prompt_system.json`

## 라이선스

MIT


Updated: 2025-10-25
