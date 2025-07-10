/**
 * API module for handling GitHub repository interactions
 */

const COMPLETION_PHRASE = "You've successfully completed this exercise!";
const RATE_LIMIT_ERROR = "API rate limit exceeded";
const CORS_PROXY = "https://api.allorigins.win/get?url=";

/**
 * Fetch README content from GitHub repository
 * @param {string} username - GitHub username
 * @param {string} token - Optional GitHub Personal Access Token
 * @returns {Promise<{success: boolean, content?: string, error?: string}>}
 */
export async function fetchUserReadme(username, token = null) {
    const url = `https://raw.githubusercontent.com/${username}/skills-getting-started-with-github-copilot/main/README.md`;
    
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        // First try direct fetch
        let response = await fetch(url, { headers });
        
        // If CORS error or other issues, try with proxy
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error(RATE_LIMIT_ERROR);
            }
            if (response.status === 404) {
                throw new Error("Repository or README not found");
            }
            
            // Try with CORS proxy as fallback
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
            response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                content: data.contents
            };
        }

        const content = await response.text();
        return {
            success: true,
            content
        };

    } catch (error) {
        console.error(`Error fetching README for ${username}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if the README content contains the completion phrase
 * @param {string} content - README content to search
 * @returns {boolean}
 */
export function checkCompletion(content) {
    return content.includes(COMPLETION_PHRASE);
}

/**
 * Validate a single GitHub username
 * @param {string} username - GitHub username to validate
 * @param {string} token - Optional GitHub Personal Access Token
 * @returns {Promise<{username: string, status: 'completed'|'not-completed'|'error', details?: string}>}
 */
export async function validateUser(username, token = null) {
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
        return {
            username: trimmedUsername,
            status: 'error',
            details: 'Invalid username'
        };
    }

    try {
        const result = await fetchUserReadme(trimmedUsername, token);
        
        if (!result.success) {
            return {
                username: trimmedUsername,
                status: 'error',
                details: result.error
            };
        }

        const isCompleted = checkCompletion(result.content);
        
        return {
            username: trimmedUsername,
            status: isCompleted ? 'completed' : 'not-completed',
            details: isCompleted 
                ? 'Exercise completed successfully' 
                : 'Completion phrase not found'
        };

    } catch (error) {
        return {
            username: trimmedUsername,
            status: 'error',
            details: error.message
        };
    }
}

/**
 * Validate multiple GitHub usernames with batching and rate limiting
 * @param {string[]} usernames - Array of GitHub usernames
 * @param {string} token - Optional GitHub Personal Access Token
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Array>}
 */
export async function validateUsers(usernames, token = null, progressCallback = null) {
    const results = [];
    const batchSize = token ? 10 : 5; // Smaller batches without token
    const delay = token ? 100 : 500; // Longer delay without token
    
    for (let i = 0; i < usernames.length; i += batchSize) {
        const batch = usernames.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(username => validateUser(username, token));
        const batchResults = await Promise.all(batchPromises);
        
        results.push(...batchResults);
        
        // Update progress
        if (progressCallback) {
            progressCallback(results.length, usernames.length);
        }
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < usernames.length) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return results;
}
