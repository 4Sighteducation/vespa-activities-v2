// VESPA Response Handler Module
// Handles saving activity responses to Knack and validation

class ResponseHandler {
    constructor(config) {
        this.config = config;
        this.saveQueue = [];
        this.isSaving = false;
    }
    
    // Format responses for Knack (Object_46)
    formatResponsesForKnack(activityId, responses, cycleNumber = 1) {
        // Convert responses to the JSON format used in field_1300
        const formattedResponses = {};
        
        Object.keys(responses).forEach(questionId => {
            formattedResponses[questionId] = {
                [`cycle_${cycleNumber}`]: {
                    value: responses[questionId]
                }
            };
        });
        
        return JSON.stringify(formattedResponses);
    }
    
    // Create or update activity response in Object_46
    async saveActivityResponse(data) {
        const {
            activityId,
            studentId,
            responses,
            timeSpent,
            wordCount,
            status = 'in_progress',
            cycleNumber = 1
        } = data;
        
        try {
            // Format the responses
            const formattedResponses = this.formatResponsesForKnack(activityId, responses, cycleNumber);
            
            // Check if a response already exists
            const existingResponse = await this.findExistingResponse(activityId, studentId);
            
            if (existingResponse) {
                // Update existing record
                return await this.updateResponse(existingResponse.id, {
                    field_1300: formattedResponses, // Activity Answers Name (JSON)
                    field_2334: this.generatePlainTextSummary(responses), // Student Responses (readable)
                    field_2068: formattedResponses, // Activity Answers (backup)
                    field_1870: status === 'completed' ? new Date().toISOString() : null // Date/Time completed
                });
            } else {
                // Create new record
                return await this.createResponse({
                    field_1301: studentId, // Student connection
                    field_1302: activityId, // Activities connection
                    field_1300: formattedResponses, // Activity Answers Name (JSON)
                    field_2334: this.generatePlainTextSummary(responses), // Student Responses (readable)
                    field_2068: formattedResponses, // Activity Answers (backup)
                    field_1870: status === 'completed' ? new Date().toISOString() : null // Date/Time completed
                });
            }
        } catch (error) {
            console.error('Error saving activity response:', error);
            throw error;
        }
    }
    
    // Find existing response for this activity and student
    async findExistingResponse(activityId, studentId) {
        try {
            const filters = {
                match: 'and',
                rules: [
                    {
                        field: 'field_1302', // Activities connection
                        operator: 'is',
                        value: activityId
                    },
                    {
                        field: 'field_1301', // Student connection
                        operator: 'is',
                        value: studentId
                    }
                ]
            };
            
            const response = await this.knackAPI('GET', 'objects/object_46/records', {
                filters: filters,
                rows_per_page: 1
            });
            
            return response.records?.[0] || null;
        } catch (error) {
            console.error('Error finding existing response:', error);
            return null;
        }
    }
    
    // Create new response record
    async createResponse(data) {
        return await this.knackAPI('POST', 'objects/object_46/records', data);
    }
    
    // Update existing response record
    async updateResponse(recordId, data) {
        return await this.knackAPI('PUT', `objects/object_46/records/${recordId}`, data);
    }
    
    // Generate a plain text summary of responses for the readable field
    generatePlainTextSummary(responses) {
        const summary = [];
        
        Object.entries(responses).forEach(([questionId, answer]) => {
            if (answer && answer.trim()) {
                summary.push(`Q${questionId}: ${answer}`);
            }
        });
        
        return summary.join('\n\n');
    }
    
    // Make Knack API calls
    async knackAPI(method, endpoint, data = null) {
        const headers = {
            'X-Knack-Application-Id': this.config.knackAppId || this.config.applicationId,
            'X-Knack-REST-API-Key': this.config.knackApiKey || this.config.apiKey,
            'Content-Type': 'application/json'
        };
        
        // If user token is available, use it for authentication
        const userToken = Knack.getUserToken ? Knack.getUserToken() : null;
        if (userToken) {
            headers['Authorization'] = userToken;
        }
        
        const options = {
            method: method,
            headers: headers
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        let url = `https://api.knack.com/v1/${endpoint}`;
        
        if (method === 'GET' && data) {
            const params = new URLSearchParams();
            if (data.filters) {
                params.append('filters', JSON.stringify(data.filters));
            }
            if (data.rows_per_page) {
                params.append('rows_per_page', data.rows_per_page);
            }
            if (data.sort_field) {
                params.append('sort_field', data.sort_field);
            }
            if (data.sort_order) {
                params.append('sort_order', data.sort_order);
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Knack API error: ${response.status}`, errorText);
            throw new Error(`Knack API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // Validate responses based on question requirements
    validateResponses(questions, responses) {
        const errors = [];
        const warnings = [];
        
        questions.forEach(question => {
            const response = responses[question.id] || '';
            const isRequired = question.field_2341 === 'Yes';
            
            // Check required fields
            if (isRequired && !response.trim()) {
                errors.push({
                    questionId: question.id,
                    message: `"${question.field_1279}" is required`
                });
            }
            
            // Check minimum word count for paragraph fields
            if (question.field_1290 === 'Paragraph Text' && response.trim()) {
                const wordCount = response.trim().split(/\s+/).length;
                const minWords = 30; // Configurable
                
                if (wordCount < minWords && isRequired) {
                    warnings.push({
                        questionId: question.id,
                        message: `Consider adding more detail (${wordCount}/${minWords} words)`
                    });
                }
            }
        });
        
        return { errors, warnings, isValid: errors.length === 0 };
    }
    
    // Queue saves to prevent overwhelming the API
    async queueSave(saveData) {
        this.saveQueue.push(saveData);
        
        if (!this.isSaving) {
            this.processSaveQueue();
        }
    }
    
    async processSaveQueue() {
        if (this.saveQueue.length === 0) {
            this.isSaving = false;
            return;
        }
        
        this.isSaving = true;
        const saveData = this.saveQueue.shift();
        
        try {
            await this.saveActivityResponse(saveData);
        } catch (error) {
            console.error('Error in save queue:', error);
            // Re-add to queue for retry
            this.saveQueue.unshift(saveData);
        }
        
        // Process next item after a short delay
        setTimeout(() => this.processSaveQueue(), 1000);
    }
    
    // Get student's current progress on all activities
    async getStudentProgress(studentId) {
        try {
            const filters = [{
                field: 'field_1301', // Student connection
                operator: 'is',
                value: studentId
            }];
            
            const response = await this.knackAPI('GET', 'objects/object_46/records', {
                filters: filters,
                rows_per_page: 1000
            });
            
            return response.records || [];
        } catch (error) {
            console.error('Error fetching student progress:', error);
            return [];
        }
    }
    
    // Calculate statistics for responses
    calculateResponseStats(responses) {
        let totalWords = 0;
        let answeredQuestions = 0;
        let totalQuestions = Object.keys(responses).length;
        
        Object.values(responses).forEach(response => {
            if (response && response.trim()) {
                answeredQuestions++;
                totalWords += response.trim().split(/\s+/).length;
            }
        });
        
        return {
            totalWords,
            answeredQuestions,
            totalQuestions,
            completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
        };
    }
    
    // Create activity progress record (Object_126)
    async createActivityProgress(data) {
        const {
            activityId,
            studentId,
            cycleNumber = 1,
            status = 'in_progress',
            timeMinutes = 0,
            pointsEarned = 0,
            selectedVia = 'student_choice',
            wordCount = 0
        } = data;
        
        try {
            const progressData = {
                field_3537: activityId, // Activities connection
                field_3536: studentId, // Student connection
                field_3538: cycleNumber, // Cycle Number
                field_3539: new Date().toISOString(), // date_assigned
                field_3540: new Date().toISOString(), // date_started
                field_3541: status === 'completed' ? new Date().toISOString() : null, // date_completed
                field_3542: timeMinutes, // total_time_minutes
                field_3543: status, // completion_status
                field_3544: false, // staff_verified
                field_3545: pointsEarned, // points_earned
                field_3546: selectedVia, // selected_via
                field_3549: wordCount // word_count
            };
            
            return await this.knackAPI('POST', 'objects/object_126/records', progressData);
        } catch (error) {
            console.error('Error creating activity progress:', error);
            throw error;
        }
    }
    
    // Update activity progress record
    async updateActivityProgress(progressId, updates) {
        try {
            return await this.knackAPI('PUT', `objects/object_126/records/${progressId}`, updates);
        } catch (error) {
            console.error('Error updating activity progress:', error);
            throw error;
        }
    }
}

// Export for use in main app
window.ResponseHandler = ResponseHandler;
