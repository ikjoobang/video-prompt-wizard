const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// JSON 데이터 로드
let videoPromptSystem = null;
let allToolsSchema = null;

try {
    videoPromptSystem = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'B2.video_prompt_system.json'), 'utf8'));
    allToolsSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'A2.all_tools_schema.json'), 'utf8'));
    console.log('✅ JSON 데이터 로드 완료');
} catch (error) {
    console.error('❌ JSON 데이터 로드 실패:', error);
}

// API 엔드포인트
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'AI Video Prompt Wizard API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/video-prompt-system', (req, res) => {
    if (!videoPromptSystem) {
        return res.status(500).json({ error: 'Video prompt system data not loaded' });
    }
    res.json(videoPromptSystem);
});

app.get('/api/tools-schema', (req, res) => {
    if (!allToolsSchema) {
        return res.status(500).json({ error: 'Tools schema data not loaded' });
    }
    res.json(allToolsSchema);
});

app.get('/api/supported-models', (req, res) => {
    if (!allToolsSchema || !allToolsSchema.tools) {
        return res.status(500).json({ error: 'Tools schema data not loaded' });
    }
    
    const videoTool = allToolsSchema.tools.find(tool => tool.name === 'video_generation');
    if (!videoTool || !videoTool.parameters || !videoTool.parameters.model) {
        return res.status(404).json({ error: 'Video generation tool not found' });
    }
    
    const models = videoTool.parameters.model.enum || [];
    const veoModels = models.filter(model => model.includes('veo'));
    const soraModels = models.filter(model => model.includes('sora'));
    
    res.json({
        all: models,
        veo: veoModels,
        sora: soraModels
    });
});

// 루트 경로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📍 Network: http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

