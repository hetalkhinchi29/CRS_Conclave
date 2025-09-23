// CRS Conclave 2.0 - Firebase Registration Integration
// This file integrates with your existing HTML form structure

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getDatabase, ref, set, get, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// 🔥 FIREBASE CONFIGURATION
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAIlsl_OqjGjRvYTuoGmx04c4LJtJCZIiA",
    authDomain: "crs-conclave.firebaseapp.com",
    projectId: "crs-conclave",
    databaseURL: "https://crs-conclave-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "crs-conclave.firebasestorage.app",
    messagingSenderId: "678967687267",
    appId: "1:678967687267:web:9d3824573ef79f79f36056"
};

// Initialize Firebase
let app, database;
let isFirebaseConnected = false;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

// Firebase Connection Status Indicator
function createConnectionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'firebaseStatus';
    indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 25px;
        color: white;
        font-weight: bold;
        z-index: 1001;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    indicator.textContent = '🔴 Checking Firebase...';
    indicator.style.background = 'rgba(239, 68, 68, 0.9)';
    document.body.appendChild(indicator);
    
    // Click to retry connection
    indicator.addEventListener('click', testFirebaseConnection);
    
    return indicator;
}

// Test Firebase connection
async function testFirebaseConnection() {
    const indicator = document.getElementById('firebaseStatus');
    
    try {
        indicator.textContent = '🟡 Testing Connection...';
        indicator.style.background = 'rgba(245, 158, 11, 0.9)';
        
        const testRef = ref(database, 'system/connection_test');
        const testData = {
            test: true,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            page: 'registration'
        };
        
        await set(testRef, testData);
        
        // Verify by reading back
        const snapshot = await get(testRef);
        if (snapshot.exists()) {
            isFirebaseConnected = true;
            indicator.textContent = '🟢 Firebase Connected';
            indicator.style.background = 'rgba(34, 197, 94, 0.9)';
            
            // Clean up test data
            setTimeout(() => set(testRef, null), 2000);
            
            console.log('✅ Firebase connection successful');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        isFirebaseConnected = false;
        indicator.textContent = '🔴 Connection Failed';
        indicator.style.background = 'rgba(239, 68, 68, 0.9)';
        return false;
    }
}

// Generate unique registration ID
function generateRegistrationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `CRS2024_${timestamp}_${random}`;
}

// Get form data from your existing form structure
function getRegistrationData() {
    // Team Information
    const teamName = document.getElementById('team_name')?.value.trim() || '';
    
    // School Information  
    const schoolName = document.getElementById('school_name')?.value.trim() || '';
    const teacherName = document.getElementById('teacher_name')?.value.trim() || '';
    const teacherContact = document.getElementById('teacher_contact')?.value.trim() || '';
    const teacherEmail = document.getElementById('teacher_email')?.value.trim() || '';
    
    // Terms acceptance
    const termsAccepted = document.getElementById('termsHidden')?.checked || false;
    const rulesAccepted = document.getElementById('rulesHidden')?.checked || false;
    
    // Get members data
    const members = [];
    for (let i = 1; i <= 4; i++) {
        const nameEl = document.getElementById(`member${i}_name`);
        const gradeEl = document.getElementById(`member${i}_grade`);
        const emailEl = document.getElementById(`member${i}_email`);
        const phoneEl = document.getElementById(`member${i}_phone`);
        
        const name = nameEl?.value.trim() || '';
        const grade = gradeEl?.value || '';
        const email = emailEl?.value.trim() || '';
        const phone = phoneEl?.value.trim() || '';
        
        // Only include members with at least a name
        if (name) {
            members.push({
                memberId: i,
                name: name,
                grade: grade,
                email: email,
                phone: phone,
                isRequired: i <= 2 // First 2 members are required
            });
        }
    }
    
    return {
        teamInfo: {
            teamName: teamName,
            memberCount: members.length
        },
        schoolInfo: {
            schoolName: schoolName,
            teacherName: teacherName,
            teacherContact: teacherContact,
            teacherEmail: teacherEmail
        },
        members: members,
        agreements: {
            termsAccepted: termsAccepted,
            rulesAccepted: rulesAccepted
        }
    };
};

// Validate registration data
function validateRegistrationData(data) {
    const errors = [];
    
    // Validate team info
    if (!data.teamInfo.teamName) {
        errors.push('Team name is required');
    }
    
    // Validate school info
    if (!data.schoolInfo.schoolName) {
        errors.push('School name is required');
    }
    if (!data.schoolInfo.teacherName) {
        errors.push('Teacher name is required');
    }
    if (!data.schoolInfo.teacherContact) {
        errors.push('Teacher contact is required');
    }
    if (!data.schoolInfo.teacherEmail) {
        errors.push('Teacher email is required');
    };
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.schoolInfo.teacherEmail && !emailRegex.test(data.schoolInfo.teacherEmail)) {
        errors.push('Teacher email format is invalid');
    };
    
    // Validate phone format
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (data.schoolInfo.teacherContact && !phoneRegex.test(data.schoolInfo.teacherContact)) {
        errors.push('Teacher contact format is invalid');
    };
    
    // Validate members
    if (data.members.length < 2) {
        errors.push('At least 2 team members are required');
    }
    
    if (data.members.length > 4) {
        errors.push('Maximum 4 team members allowed');
    }
    
    // Validate required members
    const requiredMembers = data.members.filter(m => m.isRequired);
    if (requiredMembers.length < 2) {
        errors.push('First 2 team members are required');
    }
    
    // Validate member data
    data.members.forEach((member, index) => {
        if (!member.name) {
            errors.push(`Member ${index + 1} name is required`);
        }
        if (!member.grade) {
            errors.push(`Member ${index + 1} grade is required`);
        }
        if (!member.email) {
            errors.push(`Member ${index + 1} email is required`);
        }
        if (!member.phone) {
            errors.push(`Member ${index + 1} phone is required`);
        }
        
        // Validate email format
        if (member.email && !emailRegex.test(member.email)) {
            errors.push(`Member ${index + 1} email format is invalid`);
        }
        
        // Validate phone format
        if (member.phone && !phoneRegex.test(member.phone)) {
            errors.push(`Member ${index + 1} phone format is invalid`);
        }
    });
    
    // Check for duplicate emails
    const allEmails = [data.schoolInfo.teacherEmail, ...data.members.map(m => m.email)];
    const emailSet = new Set(allEmails.map(email => email.toLowerCase()));
    if (emailSet.size !== allEmails.length) {
        errors.push('All email addresses must be unique');
    }
    
    // Validate agreements
    if (!data.agreements.termsAccepted) {
        errors.push('You must accept the terms and conditions');
    }
    if (!data.agreements.rulesAccepted) {
        errors.push('You must agree to follow competition rules');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Save registration to Firebase
async function saveRegistrationToFirebase(data) {
    const registrationId = generateRegistrationId();
    
    const registrationData = {
        id: registrationId,
        timestamp: new Date().toISOString(),
        registrationDate: new Date().toLocaleDateString('en-IN'),
        registrationTime: new Date().toLocaleTimeString('en-IN'),
        
        teamInfo: data.teamInfo,
        schoolInfo: data.schoolInfo,
        members: data.members,
        agreements: data.agreements,
        
        status: 'registered',
        source: 'web_registration_v2',
        metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            timestamp: serverTimestamp()
        }
    };
    
    // Save main registration
    const registrationRef = ref(database, `registrations/${registrationId}`);
    await set(registrationRef, registrationData);
    
    // Save summary for quick queries
    const summaryRef = ref(database, `registration_summary/${registrationId}`);
    await set(summaryRef, {
        id: registrationId,
        teamName: data.teamInfo.teamName,
        schoolName: data.schoolInfo.schoolName,
        teacherName: data.schoolInfo.teacherName,
        teacherEmail: data.schoolInfo.teacherEmail,
        memberCount: data.members.length,
        registrationDate: registrationData.registrationDate,
        status: 'registered'
    });
    
    return { id: registrationId, data: registrationData };
}

// Show success message
function showSuccessMessage(registrationId, data) {
    const message = `
🎉 REGISTRATION SUCCESSFUL! 🎉

Registration ID: ${registrationId}
Team: ${data.teamInfo.teamName}
School: ${data.schoolInfo.schoolName}
Teacher: ${data.schoolInfo.teacherName}
Members: ${data.members.length}

✅ Your team has been successfully registered for CRS Conclave 2.0
📧 Confirmation emails will be sent to all team members and teacher
💾 Please save your Registration ID: ${registrationId}

Welcome to CRS Conclave 2.0! 🚀
    `;
    
    alert(message);
    
    // Log success
    console.log('🎉 Registration successful:', {
        id: registrationId,
        team: data.teamInfo.teamName,
        school: data.schoolInfo.schoolName,
        members: data.members.length
    });
}

// Show error message
function showErrorMessage(errors) {
    const errorMessage = `
❌ REGISTRATION FAILED

Please fix the following issues:

${errors.map(error => `• ${error}`).join('\n')}

Please correct these issues and try again.
    `;
    
    alert(errorMessage);
}

// Override the existing form submission
function initializeFirebaseIntegration() {
    console.log('🔥 Initializing Firebase integration...');
    
    // Create connection indicator
    createConnectionIndicator();
    
    // Test Firebase connection
    setTimeout(testFirebaseConnection, 1000);
    
    // Find and override the form submission
    const form = document.getElementById('teamRegistrationForm');
    if (!form) {
        console.error('❌ Registration form not found');
        return;
    }
    
    // Remove existing event listeners by cloning the form
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add new Firebase-enabled event listener
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('📝 Form submission started...');
        
        // Check Firebase connection
        if (!isFirebaseConnected) {
            alert('❌ Not connected to Firebase database.\n\nPlease check your internet connection and try again.\n\nClick the connection status indicator to retry.');
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registering Team...';
            submitBtn.style.background = 'rgba(156, 163, 175, 0.8)';
            
            // Get form data
            const formData = getRegistrationData();
            console.log('📊 Form data collected:', formData);
            
            // Validate data
            const validation = validateRegistrationData(formData);
            if (!validation.isValid) {
                showErrorMessage(validation.errors);
                return;
            }
            
            console.log('✅ Validation passed');
            
            // Save to Firebase
            const result = await saveRegistrationToFirebase(formData);
            console.log('💾 Data saved to Firebase');
            
            // Show success message
            showSuccessMessage(result.id, result.data);
            
            // Reset form
            newForm.reset();
            
            // Reset dynamic elements
            if (window.currentMemberCount) {
                window.currentMemberCount = 2;
                document.querySelector('[data-member="3"]').style.display = 'none';
                document.querySelector('[data-member="4"]').style.display = 'none';
                if (window.updateMemberCount) window.updateMemberCount();
            }
            
            // Reset checkboxes
            document.getElementById('termsCheckbox')?.classList.remove('checked');
            document.getElementById('rulesCheckbox')?.classList.remove('checked');
            
        } catch (error) {
            console.error('❌ Registration failed:', error);
            alert(`❌ Registration failed:\n\n${error.message}\n\nPlease try again or contact support if the problem persists.`);
        } finally {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
        }
    });
    
    console.log('✅ Firebase integration initialized');
}

// Debug functions for testing
window.firebaseDebug = {
    testConnection: testFirebaseConnection,
    getFormData: getRegistrationData,
    validateData: () => {
        const data = getRegistrationData();
        return validateRegistrationData(data);
    },
    checkConnection: () => isFirebaseConnected,
    generateId: generateRegistrationId
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseIntegration);
} else {
    initializeFirebaseIntegration();
}

console.log('🔥 CRS Conclave 2.0 Firebase Integration Loaded');