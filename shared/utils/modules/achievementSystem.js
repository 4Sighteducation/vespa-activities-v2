// VESPA Achievement System Module
// Handles badges, points, celebrations, and gamification

class AchievementSystem {
    constructor(config) {
        this.config = config;
        this.achievements = this.defineAchievements();
        this.unlockedAchievements = [];
    }
    
    // Define all possible achievements
    defineAchievements() {
        return {
            // Activity Completion Achievements
            firstActivity: {
                id: 'first_activity',
                name: 'First Steps! 🎯',
                description: 'Complete your first activity',
                icon: '🌟',
                points: 5,
                criteria: { activitiesCompleted: 1 }
            },
            fiveActivities: {
                id: 'five_activities',
                name: 'Getting Going! 🚀',
                description: 'Complete 5 activities',
                icon: '🔥',
                points: 25,
                criteria: { activitiesCompleted: 5 }
            },
            tenActivities: {
                id: 'ten_activities',
                name: 'On a Roll! 🎯',
                description: 'Complete 10 activities',
                icon: '💎',
                points: 50,
                criteria: { activitiesCompleted: 10 }
            },
            
            // Category Mastery
            visionMaster: {
                id: 'vision_master',
                name: 'Vision Master 👁️',
                description: 'Complete 5 Vision activities',
                icon: '👁️',
                points: 30,
                criteria: { categoryActivities: { vision: 5 } }
            },
            effortChampion: {
                id: 'effort_champion',
                name: 'Effort Champion 💪',
                description: 'Complete 5 Effort activities',
                icon: '💪',
                points: 30,
                criteria: { categoryActivities: { effort: 5 } }
            },
            systemsGuru: {
                id: 'systems_guru',
                name: 'Systems Guru ⚙️',
                description: 'Complete 5 Systems activities',
                icon: '⚙️',
                points: 30,
                criteria: { categoryActivities: { systems: 5 } }
            },
            practicePro: {
                id: 'practice_pro',
                name: 'Practice Pro 🎯',
                description: 'Complete 5 Practice activities',
                icon: '🎯',
                points: 30,
                criteria: { categoryActivities: { practice: 5 } }
            },
            attitudeAce: {
                id: 'attitude_ace',
                name: 'Attitude Ace 🧠',
                description: 'Complete 5 Attitude activities',
                icon: '🧠',
                points: 30,
                criteria: { categoryActivities: { attitude: 5 } }
            },
            
            // Quality Achievements
            wordsmith: {
                id: 'wordsmith',
                name: 'Wordsmith ✍️',
                description: 'Write 500+ words in a single activity',
                icon: '📝',
                points: 20,
                criteria: { singleActivityWords: 500 }
            },
            novelist: {
                id: 'novelist',
                name: 'Novelist 📚',
                description: 'Write 1000+ words total',
                icon: '📚',
                points: 40,
                criteria: { totalWords: 1000 }
            },
            
            // Streak Achievements
            weekStreak: {
                id: 'week_streak',
                name: 'Week Warrior! 🗓️',
                description: 'Complete activities 7 days in a row',
                icon: '🔥',
                points: 50,
                criteria: { streak: 7 }
            },
            
            // Level Achievements
            level3Explorer: {
                id: 'level3_explorer',
                name: 'Challenge Seeker 🏔️',
                description: 'Complete your first Level 3 activity',
                icon: '🏔️',
                points: 15,
                criteria: { level3Activities: 1 }
            },
            
            // Special Achievements
            nightOwl: {
                id: 'night_owl',
                name: 'Night Owl 🦉',
                description: 'Complete an activity after 9 PM',
                icon: '🌙',
                points: 10,
                criteria: { specialCondition: 'night_activity' }
            },
            earlyBird: {
                id: 'early_bird',
                name: 'Early Bird 🐦',
                description: 'Complete an activity before 7 AM',
                icon: '☀️',
                points: 10,
                criteria: { specialCondition: 'morning_activity' }
            },
            speedRunner: {
                id: 'speed_runner',
                name: 'Speed Runner ⚡',
                description: 'Complete an activity in under 10 minutes',
                icon: '⚡',
                points: 15,
                criteria: { timeMinutes: 10 }
            }
        };
    }
    
    // Check if any new achievements have been unlocked
    checkAchievements(studentStats) {
        const newAchievements = [];
        
        Object.values(this.achievements).forEach(achievement => {
            if (!this.isAchievementUnlocked(achievement.id)) {
                if (this.checkCriteria(achievement.criteria, studentStats)) {
                    newAchievements.push(achievement);
                    this.unlockedAchievements.push(achievement.id);
                }
            }
        });
        
        return newAchievements;
    }
    
    // Check if specific criteria are met
    checkCriteria(criteria, stats) {
        if (criteria.activitiesCompleted && stats.activitiesCompleted < criteria.activitiesCompleted) {
            return false;
        }
        
        if (criteria.categoryActivities) {
            for (const [category, count] of Object.entries(criteria.categoryActivities)) {
                if (!stats.categoryActivities || stats.categoryActivities[category] < count) {
                    return false;
                }
            }
        }
        
        if (criteria.singleActivityWords && stats.currentActivityWords < criteria.singleActivityWords) {
            return false;
        }
        
        if (criteria.totalWords && stats.totalWords < criteria.totalWords) {
            return false;
        }
        
        if (criteria.streak && stats.currentStreak < criteria.streak) {
            return false;
        }
        
        if (criteria.level3Activities && stats.level3Activities < criteria.level3Activities) {
            return false;
        }
        
        if (criteria.timeMinutes && stats.lastActivityTime > criteria.timeMinutes) {
            return false;
        }
        
        if (criteria.specialCondition) {
            return this.checkSpecialCondition(criteria.specialCondition, stats);
        }
        
        return true;
    }
    
    // Check special conditions
    checkSpecialCondition(condition, stats) {
        const now = new Date();
        const hour = now.getHours();
        
        switch (condition) {
            case 'night_activity':
                return hour >= 21 || hour < 3;
            case 'morning_activity':
                return hour >= 5 && hour < 7;
            default:
                return false;
        }
    }
    
    // Check if achievement is already unlocked
    isAchievementUnlocked(achievementId) {
        return this.unlockedAchievements.includes(achievementId);
    }
    
    // Show achievement notification
    showAchievementUnlocked(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <h3>Achievement Unlocked!</h3>
                    <p class="achievement-name">${achievement.name}</p>
                    <p class="achievement-description">${achievement.description}</p>
                    <p class="achievement-points">+${achievement.points} bonus points!</p>
                </div>
            </div>
            <div class="achievement-confetti"></div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
        
        // Play sound if available
        this.playAchievementSound();
    }
    
    // Show points earned animation
    showPointsEarned(points, bonusPoints = 0) {
        const total = points + bonusPoints;
        
        const pointsDisplay = document.createElement('div');
        pointsDisplay.className = 'points-earned-display';
        pointsDisplay.innerHTML = `
            <div class="points-main">+${points}</div>
            ${bonusPoints > 0 ? `<div class="points-bonus">+${bonusPoints} bonus!</div>` : ''}
            <div class="points-total">Total: ${total} points</div>
        `;
        
        // Position it in the center of the screen
        document.body.appendChild(pointsDisplay);
        
        // Animate
        setTimeout(() => pointsDisplay.classList.add('animate'), 100);
        
        // Remove after animation
        setTimeout(() => pointsDisplay.remove(), 3000);
    }
    
    // Calculate bonus points based on performance
    calculateBonusPoints(stats) {
        let bonus = 0;
        
        // Quality bonus
        if (stats.wordCount > 100) {
            bonus += 5;
        }
        if (stats.wordCount > 300) {
            bonus += 10;
        }
        
        // Speed bonus
        if (stats.timeMinutes < 15) {
            bonus += 5;
        }
        
        // Completion bonus (all required fields)
        if (stats.completionPercentage === 100) {
            bonus += 10;
        }
        
        // First time bonus
        if (stats.isFirstCompletion) {
            bonus += 5;
        }
        
        return bonus;
    }
    
    // Create celebration effect
    createCelebration(type = 'confetti') {
        if (type === 'confetti') {
            this.createConfetti();
        } else if (type === 'fireworks') {
            this.createFireworks();
        }
    }
    
    // Create confetti effect
    createConfetti() {
        const colors = ['#ff8f00', '#86b4f0', '#72cb44', '#7f31a4', '#f032e6'];
        const confettiCount = 150;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => confetti.remove(), 5000);
        }
    }
    
    // Play achievement sound
    playAchievementSound() {
        // Could be implemented with Web Audio API
        // For now, we'll skip actual sound implementation
    }
    
    // Get student's achievement progress
    getAchievementProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.unlockedAchievements.length;
        
        return {
            total,
            unlocked,
            percentage: Math.round((unlocked / total) * 100),
            nextAchievements: this.getNextAchievements()
        };
    }
    
    // Get next achievable achievements
    getNextAchievements() {
        // Return 3 closest achievements to being unlocked
        // This would require more complex logic to calculate
        return Object.values(this.achievements)
            .filter(a => !this.isAchievementUnlocked(a.id))
            .slice(0, 3);
    }
    
    // Save achievements to Knack (Object_127)
    async saveAchievementToKnack(achievement, studentId) {
        try {
            const achievementData = {
                field_3552: studentId, // Student connection
                field_3554: achievement.name, // achievement_name
                field_3555: achievement.description, // achievement_description
                field_3553: 'activity_completion', // achievement_type
                field_3556: new Date().toISOString(), // date_earned
                field_3557: achievement.points, // points_value
                field_3558: achievement.icon, // icon_emoji
                field_3560: `Unlocked: ${achievement.name}` // criteria_met
            };
            
            // Use the response handler to make the API call
            const responseHandler = new window.ResponseHandler(this.config);
            return await responseHandler.knackAPI('POST', 'objects/object_127/records', achievementData);
        } catch (error) {
            console.error('Error saving achievement:', error);
        }
    }
}

// Export for use in main app
window.AchievementSystem = AchievementSystem;

// CSS for achievement notifications (should be in main CSS file)
const achievementStyles = `
<style>
.achievement-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    padding: 1.5rem;
    z-index: 10000;
    transform: translateX(400px);
    transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    max-width: 350px;
}

.achievement-notification.show {
    transform: translateX(0);
}

.achievement-content {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.achievement-icon {
    font-size: 3rem;
    animation: bounce 1s ease infinite;
}

.achievement-details h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.achievement-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #079baa;
    margin: 0 0 0.25rem 0;
}

.achievement-description {
    color: #666;
    margin: 0 0 0.5rem 0;
}

.achievement-points {
    color: #72cb44;
    font-weight: 600;
    margin: 0;
}

.points-earned-display {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    text-align: center;
    z-index: 10000;
    transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.points-earned-display.animate {
    transform: translate(-50%, -50%) scale(1);
}

.points-main {
    font-size: 4rem;
    font-weight: 800;
    color: #72cb44;
    text-shadow: 0 2px 10px rgba(114, 203, 68, 0.3);
}

.points-bonus {
    font-size: 1.5rem;
    color: #ff8f00;
    margin-top: 0.5rem;
}

.points-total {
    font-size: 1.25rem;
    color: #666;
    margin-top: 0.5rem;
}

.confetti-piece {
    position: fixed;
    width: 10px;
    height: 10px;
    top: -10px;
    z-index: 9999;
    animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
    to {
        transform: translateY(100vh) rotate(360deg);
    }
}

@media (max-width: 768px) {
    .achievement-notification {
        right: 10px;
        left: 10px;
        max-width: calc(100% - 20px);
    }
}
</style>
`;

// Inject styles (temporary - should be in main CSS)
document.head.insertAdjacentHTML('beforeend', achievementStyles);
