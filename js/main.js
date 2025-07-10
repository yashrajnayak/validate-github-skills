/**
 * Main application entry point
 * Coordinates API calls and UI updates
 */

import { validateUsers } from './api.js';
import { 
    showLoading, 
    hideLoading, 
    showError, 
    hideError,
    updateProgress,
    renderResults,
    validateForm,
    getUsernames,
    getToken,
    clearResults,
    onFormSubmit,
    showRateLimitWarning,
    initializeUI
} from './ui.js';

/**
 * Main validation handler
 */
async function handleValidation() {
    // Clear previous results
    clearResults();

    // Validate form input
    const validation = validateForm();
    if (!validation.isValid) {
        showError(validation.errors.join('. '));
        return;
    }

    // Get form data
    const usernames = getUsernames();
    const token = getToken();

    // Show rate limit warning if no token and many usernames
    if (!token && usernames.length > 10) {
        showRateLimitWarning();
        // Wait a moment for user to see the warning
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Start validation process
    showLoading();

    try {
        const results = await validateUsers(
            usernames, 
            token, 
            (current, total) => updateProgress(current, total)
        );

        // Display results
        renderResults(results);

        // Show summary message
        const completed = results.filter(r => r.status === 'completed').length;
        const total = results.length;
        
        if (completed === total) {
            console.log('🎉 All users have completed the exercise!');
        } else if (completed === 0) {
            console.log('😔 No users have completed the exercise yet.');
        } else {
            console.log(`📊 ${completed} out of ${total} users have completed the exercise.`);
        }

    } catch (error) {
        console.error('Validation error:', error);
        showError(`An error occurred during validation: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('🚀 GitHub Skills Validator initialized');
    
    // Initialize UI components
    initializeUI();
    
    // Bind form submission
    onFormSubmit(handleValidation);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleValidation();
        }
        
        // Theme toggle with Ctrl/Cmd + D
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            document.getElementById('themeToggle').click();
        }
    });

    // Add focus management for accessibility
    document.addEventListener('DOMContentLoaded', () => {
        const firstInput = document.getElementById('usernames');
        if (firstInput) {
            firstInput.focus();
        }
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
