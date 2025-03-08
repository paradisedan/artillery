import { supabase } from './supabase';

export function initAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginOverlay = document.getElementById('login-overlay');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');

    // Toggle between login and register forms
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username + '@artillery-rts.com', // Using username as email prefix
                password: password
            });

            if (error) throw error;

            // Get user profile from Supabase
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw profileError;

            // Store user data
            localStorage.setItem('user', JSON.stringify({
                id: data.user.id,
                username: profile.username,
                stats: profile.stats
            }));

            // Hide login overlay and show game
            loginOverlay.style.display = 'none';
            document.getElementById('game-container').style.display = 'block';

            // Update UI with user info
            updateUserInterface(profile);

        } catch (error) {
            showError(loginForm, error.message);
        }
    });

    // Handle registration form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            showError(registerForm, 'Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showError(registerForm, 'Password must be at least 6 characters long');
            return;
        }

        try {
            // Create auth user in Supabase
            const { data, error } = await supabase.auth.signUp({
                email: username + '@artillery-rts.com', // Using username as email prefix
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;

            // Create user profile in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        username: username,
                        stats: {
                            gamesPlayed: 0,
                            wins: 0,
                            losses: 0,
                            artilleryHits: 0,
                            unitsDestroyed: 0
                        }
                    }
                ]);

            if (profileError) throw profileError;

            // Store user data
            localStorage.setItem('user', JSON.stringify({
                id: data.user.id,
                username: username,
                stats: {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    artilleryHits: 0,
                    unitsDestroyed: 0
                }
            }));

            // Hide login overlay and show game
            loginOverlay.style.display = 'none';
            document.getElementById('game-container').style.display = 'block';

            // Update UI with user info
            updateUserInterface({
                username: username,
                stats: {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    artilleryHits: 0,
                    unitsDestroyed: 0
                }
            });

        } catch (error) {
            showError(registerForm, error.message);
        }
    });

    // Check if user is already logged in
    checkCurrentSession();

    return {
        isAuthenticated: () => !!supabase.auth.getSession(),
        logout: async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('user');
            loginOverlay.style.display = 'flex';
            document.getElementById('game-container').style.display = 'none';
            // Reset forms
            loginForm.reset();
            registerForm.reset();
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            // Remove any error messages
            clearErrors();
        }
    };
}

async function checkCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            // Hide login overlay and show game
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
            // Update UI with user info
            updateUserInterface(profile);
        }
    }
}

function showError(form, message) {
    // Remove any existing error messages
    clearErrors();
    
    // Create and add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    form.appendChild(errorDiv);
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
}

function updateUserInterface(user) {
    // Create or update user stats display
    let statsContainer = document.getElementById('user-stats');
    if (!statsContainer) {
        statsContainer = document.createElement('div');
        statsContainer.id = 'user-stats';
        statsContainer.style.position = 'absolute';
        statsContainer.style.top = '10px';
        statsContainer.style.right = '10px';
        statsContainer.style.padding = '10px';
        statsContainer.style.background = 'rgba(0, 0, 0, 0.7)';
        statsContainer.style.color = 'white';
        statsContainer.style.borderRadius = '5px';
        document.getElementById('game-container').appendChild(statsContainer);
    }

    statsContainer.innerHTML = `
        <h3>${user.username}</h3>
        <p>Games: ${user.stats.gamesPlayed}</p>
        <p>Wins: ${user.stats.wins}</p>
        <p>Losses: ${user.stats.losses}</p>
        <p>Artillery Hits: ${user.stats.artilleryHits}</p>
        <p>Units Destroyed: ${user.stats.unitsDestroyed}</p>
        <button id="logout-btn" style="margin-top: 10px;">Logout</button>
    `;

    // Add logout handler
    document.getElementById('logout-btn').addEventListener('click', () => {
        initAuth().logout();
    });
}
