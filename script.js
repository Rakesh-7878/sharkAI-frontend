import { createClient } from "https://esm.sh/@supabase/supabase-js";

export const supabase = createClient(
    "https://actkprrehtruirwdegfv.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdGtwcnJlaHRydWlyd2RlZ2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzI0MDYsImV4cCI6MjA4MzU0ODQwNn0.T7QdgyVKrg9BTqhX9JnLUZFqkFKH7ZCv0wweL3RTqgI"
);


// Particle Background Logic
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 80;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = `rgba(176, 176, 176, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw lines between close particles
    particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                ctx.strokeStyle = `rgba(176, 176, 176, ${0.1 * (1 - dist / 100)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });
    });

    requestAnimationFrame(animate);
}

initParticles();
animate();

// Chat Core Logic
const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const homeBtn = document.getElementById('homeBtn');
const freeOfferBtn = document.getElementById('freeOfferBtn');

const welcomeScreenHTML = chatHistory.innerHTML;

homeBtn.addEventListener('click', () => {
    isGenerating = false; // Stop any ongoing generation
    chatHistory.innerHTML = welcomeScreenHTML;
    homeBtn.classList.add('hidden'); // Hide button on welcome screen
    updateSendButtonState();
    updateNews(); // Refresh news content immediately
});

// Auto-expand textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

let isGenerating = false;
let currentAbortController = null;
let currentUser = null;
const MESSAGE_LIMIT = 5;

// Load guest message count from localStorage
let guestMessageCount = parseInt(localStorage.getItem('guestMessageCount')) || 0;


async function addMessage(text, isUser = false) {
    // Remove welcome screen if it exists
    const welcome = chatHistory.querySelector('.flex-col.items-center');
    if (welcome) {
        welcome.remove();
        homeBtn.classList.remove('hidden'); // Show back button when chat starts
    }

    const container = document.createElement('div');
    container.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 w-full`;

    if (!isUser) {
        const nameLabel = document.createElement('div');
        nameLabel.className = "text-[10px] font-['Space_Grotesk'] font-bold text-gray-500 uppercase tracking-[0.2em] ml-2 mb-0.5";
        nameLabel.textContent = "Shark-AI";
        container.appendChild(nameLabel);
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message-bubble ${isUser ? 'user-message' : 'ai-message'}`;

    if (isUser) {
        msgDiv.textContent = text;
        container.appendChild(msgDiv);
        chatHistory.appendChild(container);
    } else {
        // Create wrapper for AI message with relative positioning
        msgDiv.style.position = 'relative';

        const contentSpan = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        msgDiv.appendChild(contentSpan);
        msgDiv.appendChild(cursor);
        container.appendChild(msgDiv);
        chatHistory.appendChild(container);

        // Typewriter effect
        for (let i = 0; i < text.length; i++) {
            if (!isGenerating) break; // STOP if interrupted
            contentSpan.textContent += text[i];
            chatHistory.scrollTop = chatHistory.scrollHeight;
            await new Promise(r => setTimeout(r, 20 + Math.random() * 30));
        }
        cursor.remove();

        // Add copy button after typing is complete
        const copyBtn = document.createElement('button');
        copyBtn.className = 'absolute bottom-2 right-2 p-1.5 text-white hover:text-gray-300 transition-colors opacity-70 hover:opacity-100';
        copyBtn.innerHTML = '<i class="fas fa-copy text-xs"></i>';
        copyBtn.title = 'Copy response';

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(text);
                // Visual feedback
                copyBtn.innerHTML = '<i class="fas fa-check text-xs text-green-400"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy text-xs"></i>';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });

        msgDiv.appendChild(copyBtn);

        isGenerating = false;
        updateSendButtonState();
    }

    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function updateSendButtonState() {
    if (isGenerating) {
        sendBtn.innerHTML = `<i class="fas fa-stop text-white"></i>`;
        sendBtn.classList.add('bg-red-500/20', 'border-red-500/50');
    } else {
        sendBtn.innerHTML = `<svg class="w-5 h-5 text-black transition-transform duration-300 transform rotate-90"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>`;
        sendBtn.classList.remove('bg-red-500/20', 'border-red-500/50');
    }
}

/**
 * Fetches an AI response from the backend service.
 * @param {string} question - The user's input message.
 * @returns {Promise<string>} - The AI's response or an error message.
 */
async function askShark(question) {
    const endpoint = "https://sharkai.onrender.com/ask";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data.answer || "I received a response, but it didn't contain an answer. Please try again.";

    } catch (error) {
        console.error("Critical error while communicating with Shark Backend:", error);
        return "The deep stream is currently turbulent (Backend Connection Error). Please ensure your engine is running and try again.";
    }
}


async function handleSend() {
    if (isGenerating) {
        isGenerating = false;
        updateSendButtonState();
        return;
    }

    // Check message limit for guest users (skip if reward claimed)
    const isRewardClaimed = localStorage.getItem('rewardClaimed') === 'true';
    if (!currentUser && !isRewardClaimed) {
        if (guestMessageCount >= MESSAGE_LIMIT) {
            showLimitModal();
            return;
        }
    }

    const text = userInput.value.trim();


    if (!text) return;

    userInput.value = '';
    userInput.style.height = 'auto';

    await addMessage(text, true);

    isGenerating = true;
    updateSendButtonState();

    try {
        const reply = await askShark(text);
        if (!isGenerating) return;
        await addMessage(reply, false);

        // Update guest count if not logged in and reward not claimed
        if (!currentUser && !isRewardClaimed) {
            guestMessageCount++;
            localStorage.setItem('guestMessageCount', guestMessageCount);
            console.log(`Guest message count: ${guestMessageCount}/${MESSAGE_LIMIT}`);

            // If limit reached after this message, show modal automatically
            if (guestMessageCount >= MESSAGE_LIMIT) {
                setTimeout(showLimitModal, 500);
            }
        }
    } catch (error) {
        console.error("Error in handleSend:", error);
        isGenerating = false;
        updateSendButtonState();
    }
}

function showLimitModal() {
    authModal.querySelector('h3').textContent = "Limit Reached";
    authModal.querySelector('p').textContent = "You've used your 5 free messages. Please Sign Up to continue your neural voyage.";
    authModal.classList.add('active');
}



sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Auth Modal Logic
const authModal = document.getElementById('authModal');
const authTrigger = document.getElementById('authTrigger');
const DEFAULT_USER_ICON = authTrigger.innerHTML;

const closeAuth = document.getElementById('closeAuth');
const authOptions = document.getElementById('authOptions');
const logoutSection = document.getElementById('logoutSection');
const logoutBtn = document.getElementById('logoutBtn');


authTrigger.addEventListener('click', () => {
    authModal.classList.add('active');
});

closeAuth.addEventListener('click', () => {
    authModal.classList.remove('active');
});

// Close modal on background click
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.classList.remove('active');
    }
});

// Logout logic
window.handleLogout = async function () {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log('User signed out successfully');
        authModal.classList.remove('active');
    } catch (err) {
        console.error('Logout error:', err);
        alert(`Failed to sign out: ${err.message}`);
    }
};

logoutBtn.addEventListener('click', window.handleLogout);


// Google Sign-in with Supabase - Global function for onclick handler
window.loginWithGoogle = async function () {
    try {
        console.log('Initiating Google Sign-in...');

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        });

        if (error) {
            console.error('Supabase OAuth Error:', error);
            alert(`Failed to sign in with Google: ${error.message}`);
            return;
        }

        console.log('OAuth redirect initiated successfully');
        // The user will be redirected to Google's OAuth page
        // After successful authentication, they'll be redirected back to the app
    } catch (err) {
        console.error('Unexpected error during sign-in:', err);
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        alert(`An unexpected error occurred: ${err.message || 'Please try again.'}`);
    }
};

// Update UI based on auth state
function updateAuthUI(user) {
    currentUser = user;
    if (user) {
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        // Reset modal text if it was changed by limit
        authModal.querySelector('h3').textContent = "Access the Deep Stream";
        authModal.querySelector('p').textContent = "Sign up or Login to preserve your neural voyages.";

        if (avatarUrl) {

            authTrigger.innerHTML = `<img src="${avatarUrl}" alt="Profile" class="w-full h-full object-cover">`;
            authTrigger.title = `Logged in as ${user.user_metadata?.full_name || user.email}`;

            // Toggle modal buttons
            authOptions.classList.add('hidden');
            logoutSection.classList.remove('hidden');
            return;
        }
    }
    // Default fallback (logged out)
    authTrigger.innerHTML = DEFAULT_USER_ICON;
    authTrigger.title = "Sign in";

    // Toggle modal buttons
    authOptions.classList.remove('hidden');
    logoutSection.classList.add('hidden');
}


// Check for existing session on page load
supabase.auth.getSession().then(({ data: { session } }) => {
    updateAuthUI(session?.user);
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
        updateAuthUI(session.user);
        authModal.classList.remove('active'); // Close the modal
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        updateAuthUI(null);
    }
});

// Dynamic News Logic
const indiaAchievements = [
    "GDP growth projected at 6.6% for FY26 by UN.",
    "First country to produce commercial Bio-Bitumen.",
    "Crude steel production reaches global #2 spot.",
    "Foreign exchange reserves exceed $700 billion.",
    "Mobile phone manufacturing hits record highs."
];

const internationalNews = [
    "UN projects robust global growth driven by India.",
    "Akasa Air officially joins IATA global network.",
    "BRICS 2026 chairmanship focus on space capabilities.",
    "Global Innovation Index: India rises to 39th rank.",
    "Strategic neural space layers expanded in 2026."
];

let newsIndex = 0;

function updateNews() {
    const newsBtn1 = document.querySelector('#newsBtn1 .news-content');
    const newsBtn2 = document.querySelector('#newsBtn2 .news-content');

    if (!newsBtn1 || !newsBtn2) return;

    // Add fade out effect
    newsBtn1.style.opacity = '0';
    newsBtn2.style.opacity = '0';

    setTimeout(() => {
        newsBtn1.textContent = indiaAchievements[newsIndex % indiaAchievements.length];
        newsBtn2.textContent = internationalNews[newsIndex % internationalNews.length];

        // Fade back in
        newsBtn1.style.opacity = '1';
        newsBtn2.style.opacity = '1';
        newsBtn1.style.transition = 'opacity 0.5s ease';
        newsBtn2.style.transition = 'opacity 0.5s ease';

        newsIndex++;
    }, 500);
}

// Initial update and interval
updateNews();
setInterval(updateNews, 5000); // Change every 5 seconds

// Mic interaction
let isListening = false;
micBtn.addEventListener('click', () => {
    isListening = !isListening;
    const dot = micBtn.querySelector('.bg-gray-400');
    if (isListening) {
        dot.classList.remove('hidden');
        micBtn.classList.add('text-white');
    } else {
        dot.classList.add('hidden');
        micBtn.classList.remove('text-white');
    }
});

// Free Offer Logic
const generatedCardNumber = document.getElementById('generatedCardNumber');
const claimAccessBtn = document.getElementById('claimAccessBtn');
const cardSecretInput = document.getElementById('cardSecretInput');
const successState = document.getElementById('successState');
const modalControls = document.getElementById('modalControls');
const confettiContainer = document.getElementById('confettiContainer');

const SECRET_CODE = "1313";

// Initial check for reward persistence
function checkRewardStatus() {
    if (localStorage.getItem('rewardClaimed') === 'true') {
        if (freeOfferBtn) freeOfferBtn.style.display = 'none';
    }
}

function generateLuhnNumber() {
    // Generate first 11 digits randomly, then calculate the 12th digit (checksum)
    let number = "4242"; // Fixed prefix for consistent branding look
    for (let i = 0; i < 7; i++) {
        number += Math.floor(Math.random() * 10);
    }

    // Luhn algorithm to find the 12th digit
    let sum = 0;
    let shouldDouble = true;
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }

    let checksum = (10 - (sum % 10)) % 10;
    return number + checksum;
}

function updateCardDisplay() {
    const fullNumber = generateLuhnNumber();
    const group1 = fullNumber.substring(0, 4);
    const group2 = fullNumber.substring(4, 8);

    document.getElementById('cardGroup1').textContent = group1;
    document.getElementById('cardGroup2').textContent = group2;
    cardSecretInput.value = '';
    successState.classList.remove('active');
    modalControls.style.opacity = '1';
    modalControls.style.pointerEvents = 'auto';
}

function createConfetti() {
    const colors = ['#ffffff', '#00f5ff', '#d4af37', '#fde08d', '#9ca3af'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'party-flag';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 15 + 10 + 'px';
        confetti.style.animationDuration = Math.random() * 2 + 3 + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.opacity = Math.random();
        confettiContainer.appendChild(confetti);

        setTimeout(() => confetti.remove(), 6000);
    }
}

if (freeOfferBtn) {
    freeOfferBtn.addEventListener('click', () => {
        updateCardDisplay();
        offerModal.classList.add('active');
        // Auto focus the secret input
        setTimeout(() => cardSecretInput.focus(), 600);
    });
}

claimAccessBtn.addEventListener('click', () => {
    if (cardSecretInput.value === SECRET_CODE) {
        successState.classList.add('active');
        modalControls.style.opacity = '0';
        modalControls.style.pointerEvents = 'none';
        createConfetti();

        // Save claim status and hide button
        localStorage.setItem('rewardClaimed', 'true');
        if (freeOfferBtn) freeOfferBtn.style.display = 'none';

        // Return to main view after delay
        setTimeout(() => {
            offerModal.classList.remove('active');
        }, 4000);
    } else {
        cardSecretInput.classList.add('shake');
        setTimeout(() => cardSecretInput.classList.remove('shake'), 400);
        cardSecretInput.value = '';
    }
});

cardSecretInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') claimAccessBtn.click();
});

closeOffer.addEventListener('click', () => {
    offerModal.classList.remove('active');
});

offerModal.addEventListener('click', (e) => {
    if (e.target === offerModal) {
        offerModal.classList.remove('active');
    }
});

// Run persistence check
checkRewardStatus();

// Mock tooltip functionality
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
        // Simple logic for hover interactions could be added here
    });
});
