# AI 영상 제작 프롬프트 마법사 - AWS 배포 가이드

## 📦 배포 패키지 내용

```
video-prompt-wizard-aws/
├── server.js                 # Express 백엔드 서버
├── package.json             # Node.js 의존성 정의
├── Dockerfile               # Docker 이미지 빌드 설정
├── docker-compose.yml       # 로컬 테스트용 Docker Compose
├── .dockerignore           # Docker 빌드 제외 파일
├── README.md               # 프로젝트 설명
├── DEPLOYMENT_GUIDE.md     # 이 파일
├── data/                   # JSON 데이터
│   ├── A2.all_tools_schema.json       # 도구 스키마
│   └── B2.video_prompt_system.json    # 비디오 프롬프트 시스템
└── public/                 # 정적 프론트엔드 파일
    ├── index.html          # 메인 HTML
    ├── style.css           # 스타일시트
    └── script.js           # 클라이언트 JavaScript
```

## 🚀 배포 옵션

### 옵션 1: AWS Elastic Beanstalk (권장)

가장 간단한 배포 방법으로, AWS가 인프라를 자동으로 관리합니다.

#### 1단계: AWS CLI 및 EB CLI 설치

```bash
# AWS CLI 설치 (이미 설치되어 있다면 건너뛰기)
pip install awscli

# AWS 자격 증명 설정
aws configure

# Elastic Beanstalk CLI 설치
pip install awsebcli
```

#### 2단계: 애플리케이션 초기화

```bash
cd video-prompt-wizard-aws

# EB 애플리케이션 초기화
eb init -p docker video-prompt-wizard --region ap-northeast-2

# 리전 선택 시 서울(ap-northeast-2) 권장
```

#### 3단계: 환경 생성 및 배포

```bash
# 환경 생성 (최초 1회)
eb create video-prompt-wizard-env

# 배포 완료 후 URL 확인
eb status

# 브라우저에서 열기
eb open
```

#### 4단계: 업데이트 배포

```bash
# 코드 수정 후 재배포
eb deploy

# 로그 확인
eb logs
```

#### 5단계: 환경 설정 (선택사항)

```bash
# 환경 변수 설정
eb setenv NODE_ENV=production

# 인스턴스 타입 변경 (비용 최적화)
eb scale 1 -i t3.micro
```

### 옵션 2: AWS ECS Fargate

컨테이너 기반 서버리스 배포로, 더 세밀한 제어가 가능합니다.

#### 1단계: ECR 레포지토리 생성

```bash
# ECR 레포지토리 생성
aws ecr create-repository \
    --repository-name video-prompt-wizard \
    --region ap-northeast-2

# 출력에서 repositoryUri 기록
# 예: 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/video-prompt-wizard
```

#### 2단계: Docker 이미지 빌드 및 푸시

```bash
# AWS 계정 ID 확인
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=ap-northeast-2

# ECR 로그인
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Docker 이미지 빌드
docker build -t video-prompt-wizard .

# 이미지 태그
docker tag video-prompt-wizard:latest \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/video-prompt-wizard:latest

# 이미지 푸시
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/video-prompt-wizard:latest
```

#### 3단계: ECS 클러스터 생성 (AWS 콘솔)

1. AWS 콘솔 → ECS → 클러스터 생성
2. 클러스터 이름: `video-prompt-wizard-cluster`
3. 인프라: AWS Fargate (서버리스)
4. 생성 클릭

#### 4단계: 태스크 정의 생성

1. ECS → 태스크 정의 → 새 태스크 정의 생성
2. 태스크 정의 패밀리: `video-prompt-wizard-task`
3. 시작 유형: Fargate
4. 운영 체제: Linux
5. CPU: 0.5 vCPU
6. 메모리: 1 GB
7. 컨테이너 추가:
   - 컨테이너 이름: `video-prompt-wizard`
   - 이미지 URI: `<AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/video-prompt-wizard:latest`
   - 포트 매핑: 8080 (TCP)
   - 환경 변수:
     - `NODE_ENV`: `production`
     - `PORT`: `8080`
8. 생성 클릭

#### 5단계: 서비스 생성 및 배포

1. 클러스터 → 서비스 → 생성
2. 시작 유형: Fargate
3. 태스크 정의: `video-prompt-wizard-task:1`
4. 서비스 이름: `video-prompt-wizard-service`
5. 작업 개수: 1
6. 네트워킹:
   - VPC: 기본 VPC 선택
   - 서브넷: 퍼블릭 서브넷 2개 이상 선택
   - 보안 그룹: 새로 생성
     - 인바운드 규칙: TCP 8080 포트 허용 (0.0.0.0/0)
   - 퍼블릭 IP 자동 할당: 활성화
7. 로드 밸런서 (선택사항):
   - Application Load Balancer 생성
   - 대상 그룹 포트: 8080
   - 헬스 체크 경로: `/api/health`
8. 생성 클릭

#### 6단계: 서비스 URL 확인

```bash
# 태스크의 퍼블릭 IP 확인
aws ecs list-tasks --cluster video-prompt-wizard-cluster --service-name video-prompt-wizard-service
aws ecs describe-tasks --cluster video-prompt-wizard-cluster --tasks <task-arn>

# 퍼블릭 IP로 접속
# http://<PUBLIC_IP>:8080
```

### 옵션 3: AWS EC2 (수동 배포)

전통적인 VM 기반 배포 방식입니다.

#### 1단계: EC2 인스턴스 생성

1. AWS 콘솔 → EC2 → 인스턴스 시작
2. AMI: Ubuntu Server 22.04 LTS
3. 인스턴스 유형: t3.micro (프리티어)
4. 키 페어: 생성 또는 기존 키 선택
5. 보안 그룹:
   - SSH (22): 내 IP
   - HTTP (8080): 0.0.0.0/0
6. 스토리지: 8 GB gp3
7. 시작 클릭

#### 2단계: 인스턴스 접속 및 환경 설정

```bash
# SSH 접속
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 버전 확인
node --version
npm --version
```

#### 3단계: 애플리케이션 배포

```bash
# 배포 패키지 업로드 (로컬에서 실행)
scp -i your-key.pem video-prompt-wizard-aws-deploy.tar.gz ubuntu@<EC2_PUBLIC_IP>:~

# EC2에서 압축 해제
cd ~
tar -xzf video-prompt-wizard-aws-deploy.tar.gz
cd video-prompt-wizard-aws

# 의존성 설치
npm install --production

# 서버 실행 (테스트)
PORT=8080 node server.js
```

#### 4단계: PM2로 프로세스 관리

```bash
# PM2 설치
sudo npm install -g pm2

# 애플리케이션 시작
pm2 start server.js --name video-prompt-wizard

# 부팅 시 자동 시작 설정
pm2 startup
pm2 save

# 상태 확인
pm2 status
pm2 logs video-prompt-wizard
```

## 🔍 배포 후 테스트

### 헬스 체크

```bash
curl http://<YOUR_URL>/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "message": "AI Video Prompt Wizard API is running",
  "timestamp": "2025-10-25T07:57:00.000Z"
}
```

### API 엔드포인트 테스트

```bash
# 비디오 프롬프트 시스템 데이터
curl http://<YOUR_URL>/api/video-prompt-system

# 도구 스키마
curl http://<YOUR_URL>/api/tools-schema

# 지원 모델 목록
curl http://<YOUR_URL>/api/supported-models
```

### 웹 인터페이스 테스트

브라우저에서 `http://<YOUR_URL>` 접속 후:
1. 채팅 입력창에 메시지 입력
2. "시네마틱한 고양이 영상" 등의 테스트 메시지 전송
3. AI 응답 확인

## 📊 모니터링

### Elastic Beanstalk

```bash
# 로그 확인
eb logs

# 환경 상태 확인
eb health

# 메트릭 확인 (AWS 콘솔)
# Elastic Beanstalk → 환경 → 모니터링
```

### ECS Fargate

```bash
# CloudWatch 로그 확인
aws logs tail /ecs/video-prompt-wizard-task --follow

# 서비스 상태 확인
aws ecs describe-services \
    --cluster video-prompt-wizard-cluster \
    --services video-prompt-wizard-service
```

### EC2

```bash
# PM2 로그
pm2 logs video-prompt-wizard

# 시스템 리소스
pm2 monit
```

## 💰 비용 예상

### Elastic Beanstalk
- t3.micro 인스턴스: ~$8/월
- 로드 밸런서 (선택): ~$16/월
- **총 예상 비용**: $8-24/월

### ECS Fargate
- 0.5 vCPU, 1GB 메모리 (24/7 운영)
- vCPU: $0.04048/시간 × 0.5 × 730시간 = ~$14.78/월
- 메모리: $0.004445/GB/시간 × 1 × 730시간 = ~$3.24/월
- **총 예상 비용**: ~$18/월

### EC2
- t3.micro (프리티어 적용 가능): $0/월 (1년) 또는 ~$8/월
- **총 예상 비용**: $0-8/월

## 🔧 문제 해결

### 서버가 시작되지 않는 경우

```bash
# 로그 확인
cat server.log

# 포트 충돌 확인
lsof -i :8080

# JSON 파일 유효성 검사
python3 -m json.tool data/A2.all_tools_schema.json
python3 -m json.tool data/B2.video_prompt_system.json
```

### Docker 빌드 실패

```bash
# 캐시 없이 다시 빌드
docker build --no-cache -t video-prompt-wizard .

# 빌드 로그 상세 확인
docker build -t video-prompt-wizard . --progress=plain
```

### 메모리 부족

```bash
# ECS 태스크 정의에서 메모리 증가 (1GB → 2GB)
# 또는 EC2 인스턴스 타입 업그레이드 (t3.micro → t3.small)
```

## 🔒 보안 권장사항

1. **환경 변수로 민감 정보 관리**
   - API 키, 데이터베이스 비밀번호 등은 환경 변수 사용
   - AWS Secrets Manager 활용 권장

2. **HTTPS 설정**
   - AWS Certificate Manager로 SSL 인증서 발급
   - Application Load Balancer에 HTTPS 리스너 추가

3. **보안 그룹 제한**
   - 필요한 포트만 개방
   - SSH는 특정 IP로 제한

4. **정기 업데이트**
   - Node.js 및 의존성 패키지 정기 업데이트
   - 보안 패치 적용

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues 생성
- 이메일: support@example.com

## 📝 라이선스

MIT License

