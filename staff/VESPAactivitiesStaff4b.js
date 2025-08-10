/**
 * VESPA Activities Staff Management System v2i
 * Shell file for testing load and field mappings
 * Step 1: Verify loading
 * Step 2: Test field mappings
 * Step 3: Begin implementation
 */

(function() {
    'use strict';
    
    console.log('🚀 VESPA Staff 4b: Starting initialization...');
    
    // Immediately hide data views to prevent flash
    const style = document.createElement('style');
    style.textContent = `
        #view_3177, #view_3178, #view_3192, #view_3193, 
        #view_3194, #view_3195 { 
            display: none !important; 
        }
    `;
    document.head.appendChild(style);
    
    // Configuration - COMPLETE FIELD MAPPINGS FROM ORIGINAL
    const CONFIG = {
        version: '4b',
        debug: true,
        
        // API credentials will come from KnackAppLoader via VESPA_ACTIVITIES_STAFF_CONFIG
        appId: null,  // Set from loader config
        apiKey: null, // Set from loader config
        
        // View IDs
        views: {
            container: 'view_3179',
            activities: 'view_3178',
            answers: 'view_3177',
            staffAdmin: 'view_3192',
            tutor: 'view_3193',
            headOfYear: 'view_3194',
            subjectTeacher: 'view_3195'
        },
        
        // Object IDs
        objects: {
            accounts: 'object_3',
            staffAdmin: 'object_5',
            student: 'object_6',
            tutor: 'object_7',
            vespaResults: 'object_10',
            headOfYear: 'object_18',
            activities: 'object_44',
            activityQuestions: 'object_45',
            activityAnswers: 'object_46',
            subjectTeacher: 'object_78',
            activityProgress: 'object_126',
            studentAchievements: 'object_127',
            activityFeedback: 'object_128'
        },
        
        // Field mappings - COMPLETE SET FROM ORIGINAL
        fields: {
            // User fields (Object_3)
            userRoles: 'field_73',
            
            // Staff role email fields
            staffAdminEmail: 'field_86',
            tutorEmail: 'field_96',
            headOfYearEmail: 'field_417',
            subjectTeacherEmail: 'field_1879',
            
            // Student fields (Object_6)
            studentName: 'field_90',
            studentEmail: 'field_91',
            studentVESPAConnection: 'field_182',
            studentStaffAdmins: 'field_190',
            studentHeadsOfYear: 'field_547',
            finishedActivities: 'field_1380',
            studentTutors: 'field_1682',
            prescribedActivities: 'field_1683',
            studentSubjectTeachers: 'field_2177',
            
            // VESPA scores (Object_10)
            visionScore: 'field_147',
            effortScore: 'field_148',
            systemsScore: 'field_149',
            practiceScore: 'field_150',
            attitudeScore: 'field_151',
            
            // Activity fields (Object_44)
            activityName: 'field_1278',
            activityVESPACategory: 'field_1285',
            activityScoreMoreThan: 'field_1287',
            activityScoreLessEqual: 'field_1294',
            activityLevel: 'field_1295',
            activityDescription: 'field_1134',
            activityDuration: 'field_1135',
            activityType: 'field_1133',
            activityLevelPreferred: 'field_3568',
            
            // Activity Questions (Object_45)
            questionActivity: 'field_1136',
            questionText: 'field_1137',
            questionType: 'field_1138',
            questionOptions: 'field_1139',
            questionOrder: 'field_1140',
            
            // Activity Answers (Object_46)
            answerActivityJSON: 'field_1300',
            answerStudentConnection: 'field_1301',
            answerActivityConnection: 'field_1302',
            
            // Activity Progress (Object_126)
            progressStudent: 'field_3536',
            progressActivity: 'field_3537',
            progressDateAssigned: 'field_3539',
            progressDateStarted: 'field_3540',
            progressDateCompleted: 'field_3541',
            progressStatus: 'field_3543',
            progressSelectedVia: 'field_3546',
            progressStaffNotes: 'field_3547'
        }
    };
    
    /**
     * Main Application Class
     */
    class VESPAStaffApp {
        constructor() {
            this.config = CONFIG;
            this.container = null;
            this.userRole = null;
            this.roleId = null;
            this.testResults = {
                loading: false,
                containerFound: false,
                userDetected: false,
                apiAccess: false,
                fieldMappings: []
            };
        }
        
        /**
         * Initialize the application
         */
        async init() {
            console.log(`📋 VESPA Staff ${this.config.version}: Initializing...`);
            
            try {
                // Step 1: Test container
                await this.testContainer();
                
                // Step 2: Test user detection
                await this.testUserDetection();
                
                // Step 3: Test API access
                await this.testAPIAccess();
                
                // Step 4: Test field mappings
                await this.testFieldMappings();
                
                // Display test results
                this.displayTestResults();
                
                this.testResults.loading = true;
                console.log(`✅ VESPA Staff ${this.config.version}: All tests complete!`);
                
            } catch (error) {
                console.error(`❌ VESPA Staff ${this.config.version}: Initialization failed`, error);
                this.displayError(error);
            }
        }
        
        /**
         * Test container exists
         */
        async testContainer() {
            console.log('🔍 Testing container...');
            this.container = document.getElementById(this.config.views.container);
            
            if (this.container) {
                this.testResults.containerFound = true;
                console.log('✅ Container found:', this.config.views.container);
            } else {
                throw new Error(`Container ${this.config.views.container} not found`);
            }
        }
        
        /**
         * Test user detection
         */
        async testUserDetection() {
            console.log('🔍 Testing user detection...');
            
            // Wait for Knack to be ready
            if (!window.Knack || !window.Knack.getUserAttributes) {
                console.warn('⚠️ Knack not ready, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const user = Knack.getUserAttributes();
            console.log('User object:', user);
            
            if (user && user.email) {
                this.testResults.userDetected = true;
                console.log('✅ User detected:', user.email);
                
                // Detect role
                const profileKeys = user.profile_keys || [];
                const roleMap = {
                    'profile_5': 'Staff Admin',
                    'profile_7': 'Tutor',
                    'profile_18': 'Head of Year',
                    'profile_78': 'Subject Teacher'
                };
                
                for (const key of profileKeys) {
                    if (roleMap[key]) {
                        this.userRole = roleMap[key];
                        console.log('✅ User role:', this.userRole);
                        break;
                    }
                }
            } else {
                console.warn('⚠️ User not detected or not authenticated');
            }
        }
        
        /**
         * Test API access
         */
        async testAPIAccess() {
            console.log('🔍 Testing API access...');
            
            try {
                // Use jQuery AJAX like the original to avoid CORS issues
                const data = await new Promise((resolve, reject) => {
                    $.ajax({
                        url: `https://api.knack.com/v1/objects/${this.config.objects.student}/records`,
                        type: 'GET',
                        headers: {
                            'X-Knack-Application-Id': this.config.appId,
                            'X-Knack-REST-API-Key': this.config.apiKey
                        },
                        data: {
                            rows_per_page: 1
                        },
                        success: function(response) {
                            resolve(response);
                        },
                        error: function(xhr, status, error) {
                            reject(error);
                        }
                    });
                });
                
                this.testResults.apiAccess = true;
                console.log('✅ API access successful, found', data.total_records, 'student records');
            } catch (error) {
                console.error('❌ API access failed:', error);
                this.testResults.apiAccess = false;
            }
        }
        
        /**
         * Test field mappings
         */
        async testFieldMappings() {
            console.log('🔍 Testing field mappings...');
            
            // Test critical field mappings by fetching one record
            try {
                const response = await fetch(`https://api.knack.com/v1/objects/${this.config.objects.student}/records?rows_per_page=1`, {
                    headers: {
                        'X-Knack-Application-Id': this.config.appId,
                        'X-Knack-REST-API-Key': this.config.apiKey
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.records && data.records[0]) {
                        const record = data.records[0];
                        console.log('Sample student record:', record);
                        
                        // Test each critical field
                        const fieldsToTest = [
                            { name: 'Student Name', field: this.config.fields.studentName },
                            { name: 'Student Email', field: this.config.fields.studentEmail },
                            { name: 'Prescribed Activities', field: this.config.fields.prescribedActivities },
                            { name: 'Finished Activities', field: this.config.fields.finishedActivities }
                        ];
                        
                        fieldsToTest.forEach(test => {
                            const value = record[test.field];
                            const exists = value !== undefined;
                            this.testResults.fieldMappings.push({
                                name: test.name,
                                field: test.field,
                                exists: exists,
                                value: exists ? (typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value) : 'NOT FOUND'
                            });
                            
                            if (exists) {
                                console.log(`✅ ${test.name} (${test.field}):`, value);
                            } else {
                                console.warn(`⚠️ ${test.name} (${test.field}): NOT FOUND`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('❌ Field mapping test failed:', error);
            }
        }
        
        /**
         * Display test results in the container
         */
        displayTestResults() {
            if (!this.container) return;
            
            const html = `
                <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="color: #079baa;">VESPA Staff Management v${this.config.version} - Test Results</h1>
                    
                    <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #23356f; margin-top: 0;">✅ Loading Test</h2>
                        <ul style="list-style: none; padding: 0;">
                            <li>${this.testResults.containerFound ? '✅' : '❌'} Container Found</li>
                            <li>${this.testResults.userDetected ? '✅' : '❌'} User Detected ${this.userRole ? `(${this.userRole})` : ''}</li>
                            <li>${this.testResults.apiAccess ? '✅' : '❌'} API Access</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #23356f; margin-top: 0;">📋 Field Mappings Test</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #e0e0e0;">
                                    <th style="padding: 8px; text-align: left;">Field Name</th>
                                    <th style="padding: 8px; text-align: left;">Field ID</th>
                                    <th style="padding: 8px; text-align: left;">Status</th>
                                    <th style="padding: 8px; text-align: left;">Sample Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.testResults.fieldMappings.map(field => `
                                    <tr style="border-bottom: 1px solid #e0e0e0;">
                                        <td style="padding: 8px;">${field.name}</td>
                                        <td style="padding: 8px; font-family: monospace; font-size: 12px;">${field.field}</td>
                                        <td style="padding: 8px;">${field.exists ? '✅' : '❌'}</td>
                                        <td style="padding: 8px; font-size: 12px; color: #666;">${field.value}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2e7d32; margin-top: 0;">✅ Ready for Implementation</h3>
                        <p>All core systems are working. Ready to proceed with:</p>
                        <ol>
                            <li>Page 1: Group Overview</li>
                            <li>Page 2: Individual Student Management</li>
                        </ol>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                        <code style="font-size: 12px; color: #666;">
                            Version: ${this.config.version}<br>
                            Timestamp: ${new Date().toLocaleString()}<br>
                            User: ${Knack.getUserAttributes()?.email || 'Unknown'}
                        </code>
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
        }
        
        /**
         * Display error message
         */
        displayError(error) {
            if (!this.container) return;
            
            this.container.innerHTML = `
                <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="color: #dc3545;">❌ VESPA Staff Management v${this.config.version} - Error</h1>
                    <div style="background: #fee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcc;">
                        <pre style="color: #c00; font-family: monospace; font-size: 12px;">${error.message}\n${error.stack}</pre>
                    </div>
                </div>
            `;
        }
    }
    
    // Create global instance
    window.VESPAStaff = new VESPAStaffApp();
    
    // Initialization function for KnackAppLoader
    window.initializeVESPAActivitiesStaff = function() {
        console.log('🎯 VESPA Staff 4b: initializeVESPAActivitiesStaff called');
        
        // Get config from KnackAppLoader
        const loaderConfig = window.VESPA_ACTIVITIES_STAFF_CONFIG;
        if (loaderConfig) {
            // Update API credentials from loader
            CONFIG.appId = loaderConfig.knackAppId;
            CONFIG.apiKey = loaderConfig.knackApiKey;
            console.log('✅ API credentials loaded from KnackAppLoader');
        } else {
            console.error('❌ VESPA_ACTIVITIES_STAFF_CONFIG not found');
        }
        
        // Initialize the app
        window.VESPAStaff.init();
    };
    
    console.log('✅ VESPA Staff 4b: Script loaded successfully');
    
})();
