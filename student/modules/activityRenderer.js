// VESPA Activity Renderer Module
// Handles the full-page activity experience with 5 stages

class ActivityRenderer {
    constructor(activity, activityQuestions, studentProgress, config) {
        this.activity = activity;
        this.questions = activityQuestions;
        this.progress = studentProgress;
        this.config = config;
        
        this.currentStage = 'intro';
        this.stages = ['intro', 'learn', 'do', 'reflect', 'complete'];
        this.responses = this.parseExistingResponses();
        this.startTime = Date.now();
        this.lastSaveTime = Date.now();
        this.isExiting = false;
        this.autoSaveInterval = null;
        
        this.handleStageNavigation = this.handleStageNavigation.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleExit = this.handleExit.bind(this);
    }
    
    parseExistingResponses() {
        if (!this.progress || !this.progress.field_1300) return {};
        
        try {
            const jsonData = JSON.parse(this.progress.field_1300);
            const responses = {};
            
            Object.keys(jsonData).forEach(questionId => {
                const cycles = jsonData[questionId];
                const latestCycle = Object.keys(cycles).sort().pop();
                if (latestCycle && cycles[latestCycle]) {
                    responses[questionId] = cycles[latestCycle].value || '';
                }
            });
            
            return responses;
        } catch (e) {
            console.error('Error parsing existing responses:', e);
            return {};
        }
    }
    
    render() {
        // Remove any existing modal first
        const existingModal = document.querySelector('.activity-modal-fullpage');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'activity-modal-fullpage';
        modal.innerHTML = `
            ${this.getHeaderHTML()}
            <div class="activity-stages-nav">
                ${this.getStageNavigationHTML()}
            </div>
            <div class="activity-content-wrapper">
                <div class="activity-content">
                    ${this.getContentHTML()}
                </div>
            </div>
            ${this.getFooterHTML()}
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        this.attachEventListeners();
        this.startAutoSave();
        this.initializeDynamicContent();
        
        return modal;
    }
    
    getHeaderHTML() {
        const categoryColor = this.getCategoryColor();
        return `
            <header class="activity-header" style="background: linear-gradient(135deg, ${categoryColor.primary}, ${categoryColor.light})">
                <div class="activity-header-content">
                    <div class="activity-title-section">
                        <h1 class="activity-title">${this.activity.name}</h1>
                        <span class="activity-category-badge">
                            ${this.getCategoryEmoji()} ${this.activity.category}
                        </span>
                        <span class="activity-level-badge">${this.activity.level}</span>
                    </div>
                    <button class="activity-exit-btn" onclick="window.vespaActivityRenderer.handleExit()">
                        <span class="exit-icon">✕</span>
                        <span class="exit-text">Save & Exit</span>
                    </button>
                </div>
                <div class="activity-progress-bar">
                    <div class="progress-fill" style="width: ${this.getProgressPercentage()}%"></div>
                </div>
            </header>
        `;
    }
    
    getStageNavigationHTML() {
        const stageConfig = {
            intro: { icon: '📖', label: 'Introduction' },
            learn: { icon: '🎯', label: 'Learn' },
            do: { icon: '✏️', label: 'Do' },
            reflect: { icon: '💭', label: 'Reflect' },
            complete: { icon: '🏆', label: 'Complete' }
        };
        
        return this.stages.map((stage, index) => {
            const config = stageConfig[stage];
            const isActive = stage === this.currentStage;
            const isCompleted = this.isStageCompleted(stage);
            const isAccessible = this.canAccessStage(stage);
            
            return `
                <button class="stage-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isAccessible ? 'locked' : ''}"
                        data-stage="${stage}"
                        ${!isAccessible ? 'disabled' : ''}>
                    <span class="stage-icon">${config.icon}</span>
                    <span class="stage-label">${config.label}</span>
                    ${isCompleted ? '<span class="stage-check">✓</span>' : ''}
                </button>
            `;
        }).join('');
    }
    
    getContentHTML() {
        switch (this.currentStage) {
            case 'intro':
                return this.getIntroContent();
            case 'learn':
                return this.getLearnContent();
            case 'do':
                return this.getDoContent();
            case 'reflect':
                return this.getReflectContent();
            case 'complete':
                return this.getCompleteContent();
            default:
                return this.getIntroContent();
        }
    }
    
    getIntroContent() {
        return `
            <div class="stage-content intro-content">
                <div class="stage-header">
                    <h2>Welcome to ${this.activity.name}!</h2>
                    <p class="stage-description">Let's explore this activity together.</p>
                </div>
                
                <div class="activity-overview">
                    <div class="overview-card">
                        <span class="overview-icon">⏱️</span>
                        <h3>Time Needed</h3>
                        <p>Approximately ${this.activity.timeMinutes || 30} minutes</p>
                    </div>
                    <div class="overview-card">
                        <span class="overview-icon">🎯</span>
                        <h3>What You'll Learn</h3>
                        <p>${this.getActivityObjective()}</p>
                    </div>
                    <div class="overview-card">
                        <span class="overview-icon">⭐</span>
                        <h3>Points Available</h3>
                        <p>${this.activity.level === 'Level 3' ? 15 : 10} points</p>
                    </div>
                </div>
                
                <div class="stage-navigation">
                    <button class="primary-btn next-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('learn')">
                        Let's Begin! <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    getLearnContent() {
        const hasVideo = this.activity.video && this.activity.video.includes('iframe');
        const hasSlides = this.activity.slideshow && this.activity.slideshow.trim() !== '';
        
        return `
            <div class="stage-content learn-content">
                <div class="stage-header">
                    <h2>Learn & Explore</h2>
                    <p class="stage-description">Watch the video and review the materials.</p>
                </div>
                
                ${hasVideo || hasSlides ? `
                    <div class="media-tabs">
                        ${hasVideo ? '<button class="media-tab active" data-media="video">📺 Video</button>' : ''}
                        ${hasSlides ? `<button class="media-tab ${!hasVideo ? 'active' : ''}" data-media="slides">📊 Slides</button>` : ''}
                    </div>
                    
                    <div class="media-content">
                        ${hasVideo ? `<div class="media-panel active" id="video-panel">${this.activity.video}</div>` : ''}
                        ${hasSlides ? `<div class="media-panel ${!hasVideo ? 'active' : ''}" id="slides-panel">${this.activity.slideshow}</div>` : ''}
                    </div>
                ` : `
                    <div class="text-content">
                        ${this.activity.slideshow || '<p>Content coming soon...</p>'}
                    </div>
                `}
                
                <div class="stage-navigation">
                    <button class="secondary-btn prev-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('intro')">
                        <span class="btn-arrow">←</span> Back
                    </button>
                    <button class="primary-btn next-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('do')">
                        Ready to Practice! <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    getDoContent() {
        console.log('[ActivityRenderer] All questions:', this.questions);
        const questions = this.questions.filter(q => q.field_1314 !== 'Yes');
        console.log('[ActivityRenderer] Filtered DO questions:', questions);
        
        return `
            <div class="stage-content do-content">
                <div class="stage-header">
                    <h2>Your Turn!</h2>
                    <p class="stage-description">Complete the following activities.</p>
                </div>
                
                <div class="activity-questions">
                    ${questions.length > 0 ? questions.map(question => this.getQuestionHTML(question)).join('') : '<p style="text-align: center; color: #666;">No questions found for this section. Please check the activity configuration.</p>'}
                </div>
                
                <div class="stage-navigation">
                    <button class="secondary-btn prev-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('learn')">
                        <span class="btn-arrow">←</span> Review Materials
                    </button>
                    <button class="primary-btn next-stage-btn" 
                            onclick="window.vespaActivityRenderer.handleStageNavigation('reflect')"
                            ${!this.canProceedFromDo() ? 'disabled' : ''}>
                        Continue to Reflection <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    getReflectContent() {
        const reflectionQuestions = this.questions.filter(q => q.field_1314 === 'Yes');
        
        return `
            <div class="stage-content reflect-content">
                <div class="stage-header">
                    <h2>Reflection Time</h2>
                    <p class="stage-description">Take a moment to reflect on what you've learned.</p>
                </div>
                
                <div class="reflection-questions">
                    ${reflectionQuestions.map(question => this.getQuestionHTML(question)).join('')}
                </div>
                
                <div class="stage-navigation">
                    <button class="secondary-btn prev-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('do')">
                        <span class="btn-arrow">←</span> Back to Activities
                    </button>
                    <button class="primary-btn complete-btn" 
                            onclick="window.vespaActivityRenderer.completeActivity()"
                            ${!this.canComplete() ? 'disabled' : ''}>
                        Complete Activity! <span class="btn-arrow">🎉</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    getCompleteContent() {
        const points = this.activity.level === 'Level 3' ? 15 : 10;
        
        return `
            <div class="stage-content complete-content">
                <div class="completion-celebration">
                    <div class="celebration-icon">🎉</div>
                    <h2>Congratulations!</h2>
                    <p>You've completed "${this.activity.name}"</p>
                    
                    <div class="points-earned">
                        <span class="points-value">+${points}</span>
                        <span class="points-label">Points Earned!</span>
                    </div>
                    
                    <div class="completion-actions">
                        <button class="primary-btn" onclick="window.vespaActivityRenderer.handleExit()">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getQuestionHTML(question) {
        const response = this.responses[question.id] || '';
        const isRequired = question.field_2341 === 'Yes';
        
        let inputHTML = '';
        
        switch (question.field_1290) {
            case 'Paragraph Text':
                inputHTML = `
                    <div class="input-wrapper">
                        <textarea 
                            class="question-input paragraph-input" 
                            id="question-${question.id}"
                            data-question-id="${question.id}"
                            placeholder="Type your response here..."
                            ${isRequired ? 'required' : ''}>${response}</textarea>
                        <div class="input-feedback">
                            <span class="word-count">0 words</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'Dropdown':
                const options = (question.field_1291 || '').split(',');
                inputHTML = `
                    <select class="question-input dropdown-input" 
                            id="question-${question.id}"
                            data-question-id="${question.id}"
                            ${isRequired ? 'required' : ''}>
                        <option value="">Choose an option...</option>
                        ${options.map(opt => `
                            <option value="${opt.trim()}" ${response === opt.trim() ? 'selected' : ''}>
                                ${opt.trim()}
                            </option>
                        `).join('')}
                    </select>
                `;
                break;
                
            default:
                inputHTML = `
                    <input type="text" 
                           class="question-input text-input"
                           id="question-${question.id}"
                           data-question-id="${question.id}"
                           value="${response}"
                           placeholder="Enter your response..."
                           ${isRequired ? 'required' : ''}>
                `;
        }
        
        return `
            <div class="question-block ${isRequired ? 'required' : ''}" data-question-id="${question.id}">
                ${question.field_1310 ? `<div class="question-context">${question.field_1310}</div>` : ''}
                <label class="question-label">
                    ${question.field_1279}
                    ${isRequired ? '<span class="required-star">*</span>' : ''}
                </label>
                ${inputHTML}
            </div>
        `;
    }
    
    getFooterHTML() {
        return `
            <footer class="activity-footer">
                <div class="save-status">
                    <span class="save-icon">💾</span>
                    <span class="save-text">Auto-saving enabled</span>
                    <span class="last-saved">Last saved: just now</span>
                </div>
            </footer>
        `;
    }
    
    getCategoryColor() {
        const colors = {
            vision: { primary: '#ff8f00', light: '#ffb347' },
            effort: { primary: '#86b4f0', light: '#a8c8f5' },
            systems: { primary: '#72cb44', light: '#8ed666' },
            practice: { primary: '#7f31a4', light: '#a155c7' },
            attitude: { primary: '#f032e6', light: '#ff5eef' }
        };
        return colors[this.activity.category] || colors.vision;
    }
    
    getCategoryEmoji() {
        const emojis = {
            vision: '👁️',
            effort: '💪',
            systems: '⚙️',
            practice: '🎯',
            attitude: '🧠'
        };
        return emojis[this.activity.category] || '📚';
    }
    
    getActivityObjective() {
        if (this.activity.instructions) {
            return this.activity.instructions.substring(0, 100) + '...';
        }
        return 'Develop key skills in ' + this.activity.category;
    }
    
    getProgressPercentage() {
        const currentIndex = this.stages.indexOf(this.currentStage);
        return Math.round((currentIndex / (this.stages.length - 1)) * 100);
    }
    
    isStageCompleted(stage) {
        const stageIndex = this.stages.indexOf(stage);
        const currentIndex = this.stages.indexOf(this.currentStage);
        return stageIndex < currentIndex;
    }
    
    canAccessStage(stage) {
        if (stage === 'complete') {
            return this.canComplete();
        }
        return true;
    }
    
    canProceedFromDo() {
        const requiredQuestions = this.questions.filter(q => 
            q.field_2341 === 'Yes' && q.field_1314 !== 'Yes'
        );
        
        return requiredQuestions.every(q => {
            const response = this.responses[q.id];
            return response && response.trim().length > 0;
        });
    }
    
    canComplete() {
        const allRequiredQuestions = this.questions.filter(q => q.field_2341 === 'Yes');
        
        return allRequiredQuestions.every(q => {
            const response = this.responses[q.id];
            return response && response.trim().length > 0;
        });
    }
    
    attachEventListeners() {
        document.querySelectorAll('.stage-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!btn.disabled) {
                    this.handleStageNavigation(btn.dataset.stage);
                }
            });
        });
        
        document.querySelectorAll('.question-input').forEach(input => {
            input.addEventListener('input', this.handleInputChange);
            input.addEventListener('blur', this.handleSave);
        });
        
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMediaTab(tab.dataset.media);
            });
        });
        
        window.vespaActivityRenderer = this;
    }
    
    handleStageNavigation(newStage) {
        this.currentStage = newStage;
        this.render();
    }
    
    handleInputChange(e) {
        const questionId = e.target.dataset.questionId;
        this.responses[questionId] = e.target.value;
        
        if (e.target.tagName === 'TEXTAREA') {
            const wordCount = e.target.value.trim().split(/\s+/).length;
            const counter = e.target.closest('.input-wrapper').querySelector('.word-count');
            if (counter) {
                counter.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
            }
        }
    }
    
    handleSave() {
        const saveData = {
            activityId: this.activity.id,
            responses: this.responses,
            currentStage: this.currentStage,
            lastSaved: Date.now()
        };
        
        localStorage.setItem(`vespa-activity-${this.activity.id}`, JSON.stringify(saveData));
        
        const saveText = document.querySelector('.last-saved');
        if (saveText) {
            saveText.textContent = 'Last saved: just now';
        }
        
        // Create response handler to save to Knack
        const responseHandler = new window.ResponseHandler(this.config);
        responseHandler.saveActivityResponse({
            activityId: this.activity.id,
            studentId: this.config.studentId,
            responses: this.responses,
            status: this.currentStage === 'complete' ? 'completed' : 'in_progress'
        });
    }
    
    async handleExit() {
        if (this.isExiting) return;
        
        this.isExiting = true;
        
        await this.handleSave();
        
        this.stopAutoSave();
        document.body.style.overflow = '';
        
        const modal = document.querySelector('.activity-modal-fullpage');
        if (modal) {
            modal.remove();
        }
        
        if (window.vespaApp) {
            window.vespaApp.onActivityClose();
        }
    }
    
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.handleSave();
        }, 30000);
    }
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
    
    switchMediaTab(mediaType) {
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.media === mediaType);
        });
        
        document.querySelectorAll('.media-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${mediaType}-panel`);
        });
    }
    
    async completeActivity() {
        this.currentStage = 'complete';
        this.render();
    }
    
    initializeDynamicContent() {
        // Any dynamic content initialization
    }
}

// Export for use in main app
window.ActivityRenderer = ActivityRenderer; 