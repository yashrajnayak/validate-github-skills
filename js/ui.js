/**
 * UI module for handling DOM manipulation and user interface updates
 */

/**
 * Get DOM elements
 */
const elements = {
    form: document.getElementById('validation-form'),
    usernamesTextarea: document.getElementById('usernames'),
    tokenInput: document.getElementById('github-token'),
    checkButton: document.getElementById('check-btn'),
    buttonText: document.querySelector('.button-text'),
    loadingSpinner: document.querySelector('.loading-spinner'),
    resultsSection: document.getElementById('results-section'),
    summaryStats: document.getElementById('summary-stats'),
    resultsContainer: document.getElementById('results-container'),
    errorMessage: document.getElementById('error-message')
};

/**
 * Show loading state
 */
export function showLoading() {
    elements.checkButton.disabled = true;
    elements.buttonText.textContent = 'Checking...';
    elements.loadingSpinner.hidden = false;
    hideError();
    hideResults();
}

/**
 * Hide loading state
 */
export function hideLoading() {
    elements.checkButton.disabled = false;
    elements.buttonText.textContent = 'Check Completion';
    elements.loadingSpinner.hidden = true;
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
export function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.hidden = false;
}

/**
 * Hide error message
 */
export function hideError() {
    elements.errorMessage.hidden = true;
}

/**
 * Show results section
 */
export function showResults() {
    elements.resultsSection.hidden = false;
}

/**
 * Hide results section
 */
export function hideResults() {
    elements.resultsSection.hidden = true;
}

/**
 * Update progress in button text
 * @param {number} current - Current progress
 * @param {number} total - Total items
 */
export function updateProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    elements.buttonText.textContent = `Checking... ${current}/${total} (${percentage}%)`;
}

/**
 * Generate summary statistics
 * @param {Array} results - Validation results
 * @returns {Object} Summary statistics
 */
function generateSummary(results) {
    const summary = {
        total: results.length,
        completed: 0,
        notCompleted: 0,
        errors: 0
    };

    results.forEach(result => {
        switch (result.status) {
            case 'completed':
                summary.completed++;
                break;
            case 'not-completed':
                summary.notCompleted++;
                break;
            case 'error':
                summary.errors++;
                break;
        }
    });

    return summary;
}

/**
 * Render summary statistics
 * @param {Object} summary - Summary statistics
 */
function renderSummary(summary) {
    const completionRate = summary.total > 0 
        ? Math.round((summary.completed / summary.total) * 100) 
        : 0;

    elements.summaryStats.innerHTML = `
        <div class="stat-card completed">
            <span class="stat-number">${summary.completed}</span>
            <span class="stat-label">Completed</span>
        </div>
        <div class="stat-card not-completed">
            <span class="stat-number">${summary.notCompleted}</span>
            <span class="stat-label">Not Completed</span>
        </div>
        <div class="stat-card error">
            <span class="stat-number">${summary.errors}</span>
            <span class="stat-label">Errors</span>
        </div>
        <div class="stat-card">
            <span class="stat-number">${completionRate}%</span>
            <span class="stat-label">Completion Rate</span>
        </div>
    `;
}

/**
 * Get status icon for result
 * @param {string} status - Result status
 * @returns {string} Icon character
 */
function getStatusIcon(status) {
    switch (status) {
        case 'completed':
            return '✅';
        case 'not-completed':
            return '❌';
        case 'error':
            return '⚠️';
        default:
            return '❓';
    }
}

/**
 * Render individual result item
 * @param {Object} result - Individual validation result
 * @returns {string} HTML string for result item
 */
function renderResultItem(result) {
    const icon = getStatusIcon(result.status);
    const statusText = result.status === 'completed' ? 'Completed' :
                      result.status === 'not-completed' ? 'Not Completed' : 'Error';
    
    return `
        <div class="result-item">
            <div>
                <div class="result-username">${escapeHtml(result.username)}</div>
                ${result.details ? `<div class="result-details">${escapeHtml(result.details)}</div>` : ''}
            </div>
            <div class="result-status ${result.status}">
                <span class="icon">${icon}</span>
                <span>${statusText}</span>
            </div>
        </div>
    `;
}

/**
 * Render all results
 * @param {Array} results - Array of validation results
 */
export function renderResults(results) {
    if (!results || results.length === 0) {
        hideResults();
        return;
    }

    const summary = generateSummary(results);
    renderSummary(summary);

    // Sort results: completed first, then not completed, then errors
    const sortedResults = [...results].sort((a, b) => {
        const order = { 'completed': 0, 'not-completed': 1, 'error': 2 };
        return order[a.status] - order[b.status];
    });

    elements.resultsContainer.innerHTML = sortedResults
        .map(renderResultItem)
        .join('');

    showResults();
}

/**
 * Validate form input
 * @returns {Object} Validation result with isValid and errors
 */
export function validateForm() {
    const usernames = getUsernames();
    const errors = [];

    if (usernames.length === 0) {
        errors.push('Please enter at least one GitHub username');
    }

    // Validate username format (basic check)
    const invalidUsernames = usernames.filter(username => {
        return !/^[a-zA-Z0-9]([a-zA-Z0-9-]){0,38}$/.test(username);
    });

    if (invalidUsernames.length > 0) {
        errors.push(`Invalid username format: ${invalidUsernames.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get usernames from textarea
 * @returns {Array<string>} Array of trimmed usernames
 */
export function getUsernames() {
    const text = elements.usernamesTextarea.value.trim();
    if (!text) return [];
    
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

/**
 * Get GitHub token from input
 * @returns {string|null} Token or null if empty
 */
export function getToken() {
    const token = elements.tokenInput.value.trim();
    return token || null;
}

/**
 * Clear all results and errors
 */
export function clearResults() {
    hideResults();
    hideError();
    elements.summaryStats.innerHTML = '';
    elements.resultsContainer.innerHTML = '';
}

/**
 * Add event listener to form
 * @param {Function} callback - Callback function for form submission
 */
export function onFormSubmit(callback) {
    elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        callback();
    });
}

/**
 * Show rate limit warning
 */
export function showRateLimitWarning() {
    const warningMessage = `
        <strong>Rate Limit Notice:</strong> 
        Without a GitHub token, you may hit rate limits with large batches. 
        Consider adding a Personal Access Token for better performance.
    `;
    
    showError(warningMessage);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize UI
 */
export function initializeUI() {
    // Initialize theme
    initializeTheme();
    
    // Add input validation feedback
    elements.usernamesTextarea.addEventListener('input', () => {
        hideError();
    });

    // Add placeholder examples
    elements.usernamesTextarea.placeholder = `octocat
defunkt
torvalds
gaearon`;

    elements.tokenInput.placeholder = 'ghp_1234567890abcdef...';
}

/**
 * Theme management
 */
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(themeIcon, currentTheme);
    
    // Theme toggle event listener
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(themeIcon, newTheme);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(themeIcon, newTheme);
        }
    });
}

function updateThemeIcon(icon, theme) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}
