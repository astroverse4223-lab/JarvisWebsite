// Live Chat Widget Loader
(function() {
    let chatSessionId = null;
    let userEmail = null;
    let hasShownWelcome = false;

    // Initialize chat
    function initChat() {
        // Get user email if logged in
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            try {
                const payload = JSON.parse(atob(authToken.split('.')[1]));
                userEmail = payload.email;
            } catch (e) {
                console.log('No auth token');
            }
        }

        // Generate or retrieve session ID
        chatSessionId = localStorage.getItem('chatSessionId');
        if (!chatSessionId) {
            chatSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chatSessionId', chatSessionId);
        }

        // Load previous messages
        loadChatHistory();

        // Check for admin responses every 10 seconds
        setInterval(checkForNewMessages, 10000);
    }

    window.toggleChat = function() {
        const chatWindow = document.getElementById('chatWindow');
        const isOpen = chatWindow.classList.contains('open');
        
        if (isOpen) {
            chatWindow.classList.remove('open');
        } else {
            chatWindow.classList.add('open');
            document.getElementById('chatInput').focus();
            
            // Show welcome message if first time
            if (!hasShownWelcome) {
                setTimeout(showWelcomeMessage, 500);
                hasShownWelcome = true;
                
                // Hide notification badge
                document.getElementById('chatNotification').style.display = 'none';
            }
        }
    };

    function showWelcomeMessage() {
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            addMessage({
                from: 'support',
                message: 'Hello! 👋 Welcome to JARVIS Support. How can I help you today?',
                timestamp: new Date().toISOString()
            });
        }, 1500);
    }

    window.handleChatKeyPress = function(event) {
        if (event.key === 'Enter') {
            sendChatMessage();
        }
    };

    window.sendChatMessage = async function() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Disable input while sending
        const sendBtn = document.getElementById('chatSendBtn');
        sendBtn.disabled = true;
        input.disabled = true;

        // Add user message to UI
        addMessage({
            from: 'user',
            message: message,
            timestamp: new Date().toISOString()
        });

        input.value = '';

        try {
            // Send to server
            const response = await fetch('/api/admin?action=sendChatMessagePublic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: chatSessionId,
                    email: userEmail,
                    message: message,
                    page: window.location.pathname
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Show automated response if any
                if (data.autoReply) {
                    showTypingIndicator();
                    setTimeout(() => {
                        hideTypingIndicator();
                        addMessage({
                            from: 'support',
                            message: data.autoReply,
                            timestamp: new Date().toISOString()
                        });
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage({
                from: 'support',
                message: 'Sorry, there was an error sending your message. Please try again.',
                timestamp: new Date().toISOString()
            });
        }

        // Re-enable input
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
    };

    function addMessage(data) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${data.from === 'user' ? 'user' : 'support'}`;
        
        const time = new Date(data.timestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-avatar">${data.from === 'user' ? '👤' : '🤖'}</div>
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(data.message)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
        document.getElementById('typingIndicator').classList.add('active');
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        document.getElementById('typingIndicator').classList.remove('active');
    }

    async function loadChatHistory() {
        try {
            const response = await fetch(`/api/admin?action=getChatMessages&sessionId=${chatSessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    hasShownWelcome = true;
                    data.messages.forEach(msg => addMessage(msg));
                    
                    // Check for unread admin messages
                    const unreadCount = data.messages.filter(m => 
                        m.from === 'support' && !m.read
                    ).length;
                    
                    if (unreadCount > 0) {
                        const badge = document.getElementById('chatNotification');
                        badge.textContent = unreadCount;
                        badge.style.display = 'flex';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    let lastMessageCount = 0;
    async function checkForNewMessages() {
        try {
            const response = await fetch(`/api/admin?action=getChatMessages&sessionId=${chatSessionId}`);
            if (response.ok) {
                const data = await response.json();
                const currentCount = data.messages ? data.messages.length : 0;
                
                if (currentCount > lastMessageCount) {
                    const newMessages = data.messages.slice(lastMessageCount);
                    newMessages.forEach(msg => {
                        if (msg.from === 'support') {
                            addMessage(msg);
                            
                            // Show notification if chat is closed
                            if (!document.getElementById('chatWindow').classList.contains('open')) {
                                const badge = document.getElementById('chatNotification');
                                badge.style.display = 'flex';
                            }
                        }
                    });
                    lastMessageCount = currentCount;
                }
            }
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load the chat widget HTML
    fetch('/chat-widget.html')
        .then(response => response.text())
        .then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            document.body.appendChild(div);
            
            // Initialize after DOM is ready
            setTimeout(initChat, 100);
        })
        .catch(error => {
            console.error('Error loading chat widget:', error);
        });
})();
