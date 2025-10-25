// 전역 변수
let videoPromptSystem = null;
let allToolsSchema = null;
let conversationHistory = [];

// 페이지 로드 시 JSON 파일 로드
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // API 엔드포인트에서 데이터 로드
        const videoSystemResponse = await fetch('https://ax2fggqnv2hh5bhdvehevrvht40ldjte.lambda-url.ap-northeast-2.on.aws/');
        videoPromptSystem = await videoSystemResponse.json();
        
        const toolsSchemaResponse = await fetch('https://nq3cdllk4dwj5daif3r2vvbnve0ldcrq.lambda-url.ap-northeast-2.on.aws/');
        allToolsSchema = await toolsSchemaResponse.json();
        
        console.log('시스템 초기화 완료');
        console.log('Video Prompt System:', videoPromptSystem);
        console.log('Tools Schema:', allToolsSchema);
        
        // 이벤트 리스너 설정
        setupEventListeners();
    } catch (error) {
        console.error('시스템 초기화 실패:', error);
        addAIMessage('시스템 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
    }
});

// 이벤트 리스너 설정
function setupEventListeners() {
    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');
    
    sendButton.addEventListener('click', handleSendMessage);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
}

// 메시지 전송 처리
async function handleSendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // 사용자 메시지 추가
    addUserMessage(message);
    
    // 입력창 초기화
    userInput.value = '';
    
    // 대화 히스토리에 추가
    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    // AI 응답 생성
    await generateAIResponse(message);
}

// 사용자 메시지 추가
function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `<p>${escapeHtml(message)}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// AI 메시지 추가
function addAIMessage(message, isPrompt = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    
    if (isPrompt) {
        const promptId = 'prompt-' + Date.now();
        messageDiv.innerHTML = `
            <p>전문가급 프롬프트를 생성했습니다! 🎬</p>
            <div class="prompt-output-container">
                <button class="copy-button" onclick="copyPrompt('${promptId}')">복사</button>
                <div class="prompt-output" id="${promptId}">${escapeHtml(message)}</div>
            </div>
            <p class="message-hint">복사 버튼을 눌러 프롬프트를 복사하세요</p>
        `;
    } else {
        messageDiv.innerHTML = `<p>${escapeHtml(message)}</p>`;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 로딩 메시지 추가
function addLoadingMessage() {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message loading';
    messageDiv.id = 'loadingMessage';
    messageDiv.innerHTML = `
        <span>프롬프트 생성 중</span>
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 로딩 메시지 제거
function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// AI 응답 생성
async function generateAIResponse(userMessage) {
    addLoadingMessage();
    
    // 사용자 입력 분석
    const intent = analyzeUserIntent(userMessage);
    
    // 로딩 시뮬레이션 (실제 AI 연동 시 제거)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    removeLoadingMessage();
    
    // 의도에 따른 응답 생성
    if (intent === 'enhancement') {
        const prompt = generateEnhancedPrompt(userMessage);
        addAIMessage(prompt, true);
    } else if (intent === 'creation') {
        const prompt = generateCreativePrompt(userMessage);
        addAIMessage(prompt, true);
    } else if (intent === 'inspiration') {
        const prompt = generateInspirationalPrompt();
        addAIMessage(prompt, true);
    } else if (intent === 'question') {
        const answer = answerQuestion(userMessage);
        addAIMessage(answer);
    } else {
        addAIMessage('어떤 종류의 영상을 만들고 싶으신가요? 간단한 아이디어나 컨셉을 말씀해주세요! 🎥');
    }
    
    // 대화 히스토리에 추가
    conversationHistory.push({
        role: 'assistant',
        content: '응답 생성 완료'
    });
}

// 사용자 의도 분석
function analyzeUserIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // 질문 패턴
    if (lowerMessage.includes('?') || lowerMessage.includes('어떻게') || 
        lowerMessage.includes('무엇') || lowerMessage.includes('왜')) {
        return 'question';
    }
    
    // 영감 요청 패턴
    if (lowerMessage.includes('영감') || lowerMessage.includes('아이디어') || 
        lowerMessage.includes('제안') || lowerMessage.includes('추천')) {
        return 'inspiration';
    }
    
    // 창작 패턴 (구체적인 목적이나 컨셉)
    if (lowerMessage.includes('만들') || lowerMessage.includes('제작') || 
        lowerMessage.includes('생성') || lowerMessage.includes('컨셉')) {
        return 'creation';
    }
    
    // 기본은 강화 모드
    return 'enhancement';
}

// 프롬프트 강화 (Enhancement)
function generateEnhancedPrompt(userIdea) {
    // 16가지 필수 요소를 포함한 프롬프트 생성
    const template = videoPromptSystem.professional_template;
    
    // 사용자 아이디어를 기반으로 프롬프트 생성
    const enhancedPrompt = `Cinematic establishing shot captures ${userIdea} in stunning detail. Opening sequence (0-2s): Dynamic camera movement with explosive particle burst transition, thousands of luminous particles converging toward frame center with magnetic acceleration. Main subject (2-4s): ${userIdea} presented with Hollywood-level production quality, featuring dramatic lighting and professional color grading. Camera executes smooth dolly-in movement combined with 15-degree orbital sweep, creating cinematic momentum. Lighting: Soft golden hour illumination with rim lighting effect, casting dramatic shadows across surfaces. Color palette dominated by warm amber tones (HSL: 35°, 75%, 60%), deep navy blues (HSL: 220°, 80%, 30%), and subtle cream highlights (HSL: 45°, 40%, 85%). Atmospheric conditions feature gentle volumetric fog with god rays piercing through, creating depth and dimension. Audio design: Ambient soundscape with subtle orchestral underscore at 90 BPM, featuring warm string sections and delicate piano motifs. Sound effects synchronized with visual beats - soft whooshes on camera movements, environmental ambience matching scene context. Camera movement: Smooth tracking shot following subject with precise focus pulls, aperture shifting from f/2.8 to f/5.6 for dramatic depth of field changes. Motion graphics: Elegant UI elements fade in at 4-second mark with subtle scale animations. Particle effects: Fine dust particles floating through light beams, size range 2-8 pixels, velocity 0.5-1.5 units per second, 40% opacity with soft bloom. Typography: Clean sans-serif font with 120% scale animation, subtle glow effect. Transitions: Smooth cross-dissolve with 0.5-second duration using ease-in-out curve. Pacing: Rhythmic beat timing at 1.5-second intervals, elements introduced sequentially with natural acceleration. Production polish: 15% bloom intensity, subtle lens flare characteristics, motion blur calculated at 180-degree shutter, cinematic color grading with slightly lifted blacks and enhanced midtones. Final composition (7-8s): Hero shot with rule-of-thirds grid layout, visual hierarchy directing attention to key elements. Format optimized for 16:9 aspect ratio, 8-second duration, HD quality with compression settings for social media distribution.`;
    
    return enhancedPrompt;
}

// 프롬프트 창작 (Creation)
function generateCreativePrompt(userConcept) {
    // 컨셉을 기반으로 완전히 새로운 프롬프트 생성
    const creativePrompt = `Professional product reveal sequence showcasing ${userConcept} with cinematic excellence. Opening (0-2s): Explosive energy burst with thousands of cyan and white particles materializing from void, converging with magnetic acceleration creating speed lines and motion blur streaks. High-energy whoosh sound effect synchronized perfectly with visual impact. Hero moment (2-4s): Main subject SLAMS into frame with confident authority, rendered in glossy liquid metal finish with real-time environmental reflections. Dynamic animations include electric pulse waves radiating outward, RGB chromatic glitch effects at 0.2-second intervals, holographic shimmer sweep across surfaces. Camera work: Aggressive dynamic movement starting with fast dolly-push reducing focal distance by 60%, simultaneous counter-clockwise orbital sweep at 35 degrees per second. Camera shake simulation adds documentary energy with subtle 2-pixel vibration. Snap-focus transitions using rapid aperture shifts from f/1.4 to f/8 creating dramatic depth changes. Environment: Modern minimalist studio with infinite white backdrop, strategic accent lighting creating depth. Lighting setup: Three-point lighting with key light at 45-degree angle (5600K color temperature), fill light at 30% intensity, dramatic rim light creating edge definition. Atmospheric haze adds volumetric quality to light rays. Audio design: High-energy beat-driven soundtrack with deep sub-bass drop (40Hz) with impact boom, driving electronic beat at 128 BPM with punchy kicks, sci-fi whooshes synchronized with particle bursts, digital glitch stabs on reveals. Color palette: Electric cyan (HSL: 180°, 100%, 50%), vibrant magenta (HSL: 320°, 100%, 50%), pure white highlights, aggressive 15:1 contrast ratio for maximum visual impact. Motion graphics: Sleek UI elements with kinetic typography, particle systems with physics-based motion, timing synchronized to audio beats. Particle effects: Size range 3-12 pixels, 70% cyan / 30% white color distribution, velocity 2-4 units per second, 80% bloom intensity, 60-100% opacity variation. Typography: Bold sans-serif at 150% scale with glow effect, animated entrance with elastic easing. Transitions: Quick cuts with glitch effects, 0.3-second duration, aggressive easing curves. Pacing: Fast-paced with element introduction every 0.8 seconds, acceleration pattern building to climax. Production polish: 25% bloom percentage, prominent lens flare with hexagonal characteristics, motion blur at 360-degree shutter, color grading with crushed blacks and boosted saturation (+25%). Call to action (7-8s): Final hero composition with dynamic grid layout, visual hierarchy directing attention through leading lines and contrast. Social media optimization: 16:9 format, 8-second duration, 1080p HD quality, optimized compression for Instagram and TikTok, high visibility thumbnail frame at 4-second mark, engagement hooks in first 2 seconds.`;
    
    return creativePrompt;
}

// 영감 제공 (Inspiration)
function generateInspirationalPrompt() {
    const inspirationalPrompts = [
        `Epic cinematic journey through mystical forest realm. Opening (0-2s): Magical particle burst with thousands of glowing fireflies emerging from darkness, swirling in spiral patterns with ethereal trails. Enchanting chime sound synchronized with visual sparkle. Hero moment (2-4s): Ancient mystical tree materializes with bioluminescent bark patterns pulsing with life energy, roots spreading across ground with organic growth animation. Camera: Sweeping crane shot descending from canopy to forest floor, combined with 360-degree orbital movement revealing hidden details. Smooth gimbal stabilization with intentional drift creating dreamlike quality. Environment: Enchanted forest with towering ancient trees, mystical fog rolling across moss-covered ground, shafts of moonlight piercing through canopy. Lighting: Soft moonlight (4800K) as key source, bioluminescent plants providing accent lighting in cyan and purple hues, volumetric god rays creating atmospheric depth. Audio: Orchestral fantasy score with Celtic harp and woodwinds at 75 BPM, forest ambience with cricket chirps and distant owl calls, magical sparkle sound effects on particle appearances. Color palette: Deep forest green (HSL: 140°, 60%, 25%), mystical purple (HSL: 280°, 70%, 40%), bioluminescent cyan (HSL: 180°, 90%, 60%), moonlight silver (HSL: 200°, 20%, 80%). Motion graphics: Magical runes and symbols floating through air with gentle rotation, particle trails following camera movement. Particle effects: Firefly particles 4-10 pixels, warm yellow glow, slow floating motion 0.3-0.8 units per second, 90% bloom intensity, pulsing opacity 40-100%. Typography: Elegant serif font with magical glow effect, fade-in animation with sparkle particles. Transitions: Smooth dissolve with particle wipe effects, 0.8-second duration. Pacing: Slow contemplative rhythm with 2-second intervals, gradual build creating sense of wonder. Production polish: 20% bloom with soft falloff, subtle lens flare with organic characteristics, natural motion blur, color grading with lifted shadows and enhanced blues and greens. Final shot (7-8s): Wide establishing shot revealing full majesty of mystical realm, rule-of-thirds composition with tree as focal point. Format: 16:9, 8 seconds, HD quality.`,
        
        `High-energy sports action sequence capturing athletic excellence. Opening (0-2s): Explosive start with speed lines and motion blur, dramatic slow-motion moment of athlete launching into action, powerful impact sound with bass drop. Hero moment (2-4s): Athlete in peak performance captured with freeze-frame effect highlighting perfect form, sweat particles frozen mid-air catching dramatic lighting. Camera: Dynamic tracking shot following athlete with high-speed movement, combined with dramatic slow-motion segments at 120fps, handheld camera shake adding raw energy. Environment: Professional sports arena with dramatic stadium lighting, crowd blur in background creating depth, modern athletic facility with clean lines. Lighting: Dramatic high-contrast lighting with strong key light from above (5600K), rim lighting defining athlete silhouette, practical lights from arena creating atmosphere. Audio: Intense electronic sports anthem at 140 BPM with driving bass, crowd roar ambience, impact sounds synchronized with athletic movements, whoosh effects on fast motions. Color palette: Bold team colors - electric red (HSL: 0°, 100%, 50%), deep black (HSL: 0°, 0%, 10%), bright white (HSL: 0°, 0%, 100%), accent yellow (HSL: 50°, 100%, 50%). Motion graphics: Dynamic statistics and performance metrics appearing with kinetic animations, speed indicators and trajectory lines. Particle effects: Sweat droplets 2-6 pixels with realistic physics, dust particles from ground impact, energy trails following fast movements. Typography: Bold condensed sans-serif with strong impact, animated counters for statistics, glitch effects on transitions. Transitions: Quick cuts with directional wipes, 0.2-second duration, aggressive easing. Pacing: Fast-paced with rapid cuts every 0.5 seconds, building intensity throughout sequence. Production polish: High contrast with crushed blacks, motion blur emphasizing speed, color grading with saturated team colors and lifted highlights. Call to action (7-8s): Powerful hero pose with athlete center frame, dynamic composition with diagonal leading lines. Social optimization: 16:9 format, 8 seconds, 1080p, high-impact thumbnail.`,
        
        `Futuristic technology showcase with sleek modern aesthetics. Opening (0-2s): Digital matrix particles assembling from data streams, holographic elements materializing with electronic glitch effects, futuristic UI boot-up sound. Hero moment (2-4s): Cutting-edge technology product revealed with holographic interface projections, sleek metallic surfaces with mirror-like reflections, animated technical diagrams floating around subject. Camera: Precise robotic camera movements with perfect stabilization, smooth 3D rotation revealing product from all angles, macro close-ups showing intricate details. Environment: Minimalist futuristic space with infinite black backdrop, geometric light patterns creating depth, floating holographic displays. Lighting: Cool LED lighting (6500K) as key source, accent lights in cyan and magenta creating sci-fi atmosphere, edge lighting defining product contours. Audio: Electronic ambient soundtrack with synthesizer pads at 110 BPM, digital interface sounds, subtle whooshes on transitions, futuristic beeps synchronized with UI elements. Color palette: Electric blue (HSL: 200°, 100%, 50%), neon cyan (HSL: 180°, 100%, 60%), deep black (HSL: 0°, 0%, 5%), bright white (HSL: 0°, 0%, 100%). Motion graphics: Complex holographic UI with animated data visualizations, geometric patterns morphing and rotating, particle systems forming technical diagrams. Particle effects: Digital pixels 1-3 size, cyan and blue colors, grid-based movement patterns, 70% bloom intensity. Typography: Futuristic sans-serif with geometric characteristics, animated appearance with digital assembly effect. Transitions: Digital glitch transitions with RGB separation, 0.4-second duration. Pacing: Measured rhythm with 1-second intervals, synchronized to electronic beat. Production polish: High-tech color grading with enhanced blues and cyans, subtle chromatic aberration, clean sharp details. Final composition (7-8s): Product centered with holographic elements framing composition, technical sophistication emphasized. Format: 16:9, 8 seconds, 1080p HD.`
    ];
    
    const randomIndex = Math.floor(Math.random() * inspirationalPrompts.length);
    return inspirationalPrompts[randomIndex];
}

// 질문 답변
function answerQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('veo') || lowerQuestion.includes('sora')) {
        return `VEO 3, VEO 3.1, SORA 2는 최신 AI 비디오 생성 모델입니다.\n\n` +
               `**VEO 3**: 8초 영상, 네이티브 오디오 지원, 최고 품질\n` +
               `**VEO 3.1**: 8초 영상, Fast/HD 모드, 정밀한 제어\n` +
               `**SORA 2**: 4-12초 영상, 빠른 생성, 실험적 창작에 최적\n` +
               `**SORA 2 Pro**: 4-8초, 720p/1080p, 프로덕션 품질\n\n` +
               `어떤 모델로 영상을 만들고 싶으신가요?`;
    }
    
    if (lowerQuestion.includes('16가지') || lowerQuestion.includes('필수 요소')) {
        return `16가지 필수 요소는 할리우드급 프롬프트의 핵심입니다:\n\n` +
               `1. OPENING_SEQUENCE (0-2s)\n` +
               `2. HERO_MOMENT (2-4s)\n` +
               `3. FEATURE_SHOWCASE (4-6s)\n` +
               `4. ENVIRONMENT\n` +
               `5. LIGHTING\n` +
               `6. CAMERA_WORK\n` +
               `7. MOTION_GRAPHICS\n` +
               `8. PARTICLE_EFFECTS\n` +
               `9. COLOR_PALETTE\n` +
               `10. TYPOGRAPHY\n` +
               `11. AUDIO_DESIGN\n` +
               `12. TRANSITIONS\n` +
               `13. PACING\n` +
               `14. PRODUCTION_POLISH\n` +
               `15. CALL_TO_ACTION (7-8s)\n` +
               `16. SOCIAL_MEDIA_OPTIMIZATION\n\n` +
               `이 모든 요소가 하나의 프롬프트에 통합됩니다!`;
    }
    
    if (lowerQuestion.includes('어떻게') || lowerQuestion.includes('사용')) {
        return `사용 방법은 아주 간단합니다!\n\n` +
               `1️⃣ 간단한 아이디어를 입력하세요 (예: "해변의 일몰")\n` +
               `2️⃣ AI가 전문가급 프롬프트를 생성합니다\n` +
               `3️⃣ 생성된 프롬프트를 확인하고 승인하세요\n` +
               `4️⃣ 원하시면 영상 생성을 진행합니다\n\n` +
               `지금 바로 시작해보세요! 🎬`;
    }
    
    return `좋은 질문이네요! 구체적으로 어떤 부분이 궁금하신가요?\n\n` +
           `- VEO 3 / SORA 2 모델에 대해\n` +
           `- 16가지 필수 요소에 대해\n` +
           `- 사용 방법에 대해\n\n` +
           `무엇이든 물어보세요! 😊`;
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 비디오 생성 툴 정보 가져오기 (A2.json에서)
function getVideoGenerationToolInfo() {
    if (!allToolsSchema || !allToolsSchema.tools) {
        return null;
    }
    
    const videoTool = allToolsSchema.tools.find(tool => tool.name === 'video_generation');
    return videoTool;
}

// 지원되는 모델 목록 가져오기
function getSupportedModels() {
    const videoTool = getVideoGenerationToolInfo();
    if (!videoTool || !videoTool.parameters || !videoTool.parameters.model) {
        return [];
    }
    
    return videoTool.parameters.model.enum || [];
}

// 모델 정보 표시
function displayModelInfo() {
    const models = getSupportedModels();
    console.log('지원되는 비디오 생성 모델:', models);
    
    // VEO 3 관련 모델 필터링
    const veoModels = models.filter(model => model.includes('veo'));
    console.log('VEO 모델:', veoModels);
    
    // SORA 관련 모델 필터링
    const soraModels = models.filter(model => model.includes('sora'));
    console.log('SORA 모델:', soraModels);
}


// 프롬프트 복사 함수
function copyPrompt(promptId) {
    const promptElement = document.getElementById(promptId);
    const copyButton = event.target;
    
    if (!promptElement) {
        console.error('프롬프트 요소를 찾을 수 없습니다:', promptId);
        return;
    }
    
    const text = promptElement.textContent;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(text).then(() => {
        // 복사 성공 피드백
        const originalText = copyButton.textContent;
        copyButton.textContent = '✓ 복사됨';
        copyButton.classList.add('copied');
        
        // 2초 후 원래 상태로 복구
        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('복사 실패:', err);
        
        // 폴백: 텍스트 선택 방식
        try {
            const range = document.createRange();
            range.selectNodeContents(promptElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            selection.removeAllRanges();
            
            copyButton.textContent = '✓ 복사됨';
            copyButton.classList.add('copied');
            
            setTimeout(() => {
                copyButton.textContent = '복사';
                copyButton.classList.remove('copied');
            }, 2000);
        } catch (fallbackErr) {
            console.error('폴백 복사도 실패:', fallbackErr);
            alert('복사에 실패했습니다. 수동으로 텍스트를 선택하여 복사해주세요.');
        }
    });
}

