
(function () {
    // Load Marked.js for Markdown parsing
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(script);

    // Wait for Marked.js to load before starting the Widget Logic
    script.onload = function () {
        startChatbotWidget();
    };

    function startChatbotWidget() {
        // Configure Markdown
        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
        }

        // 🔹 Extract Parameters
        function getParams() {
            const scripts = document.getElementsByTagName("script");
            const current = Array.from(scripts).find((s) => s.src.includes("chatbot.js"));

            // Fallback defaults if script tag isn't found perfectly
            let key = null, website = window.location.hostname;

            if (current) {
                const qs = current.src.split("?")[1] || "";
                const urlParams = new URLSearchParams(qs);
                key = urlParams.get("key");

                const siteParam = urlParams.get("website");
                if (siteParam) {
                    website = siteParam.replace(/^https?:\/\//, '')
                                     .replace(/^www\./, '')
                                     .split('/')[0]
                                     .split(':')[0]
                                     .toLowerCase()
                                     .trim();
                }
            }
            
            return { key, website };
        }

        const { key: SECRET_KEY, website: WEBSITE } = getParams();
        
        // Backend URL Logic
        const getBackendUrl = () => {
            if (window.$chatbot_widget?.apiUrl) return window.$chatbot_widget.apiUrl;
            if (window.location.hostname === 'localhost') return "http://localhost:3000";
            return "https://phpstack-1582641-6176954.cloudwaysapps.com";
            // return "https://dashboard.dotzerotech.net";
        };
        const API_URL = getBackendUrl();
        const DOMAIN = window.location.origin;

        let widgetConfig = null;
        let widgetColor = '#4b7bec'; // Default color
        let floatBtn = null;
        let popup = null;

        // 🔥 CRITICAL: Fetch config FIRST before creating any elements
        async function fetchWidgetConfigSync() {
            try {
                const response = await fetch(`${API_URL}/api/widget-customize/public/${encodeURIComponent(WEBSITE)}`);
                const data = await response.json();
                if (data.success && data.data) {
                    widgetConfig = data.data;
                    // Set color immediately if config has it
                    if (widgetConfig.widget_header_color) {
                        widgetColor = widgetConfig.widget_header_color;
                    }
                    return true;
                }
            } catch (error) {
                console.error("❌ Widget config error:", error);
            }
            return false;
        }

        // Create styles with dynamic color
        function createStyles(color) {
            return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');#chatbot-float-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;background-color:${color};color:white;border:none;border-radius:50%;font-size:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,0.3);cursor:pointer;z-index:2147483647;transition:transform 0.2s,background-color 0.3s;}#chatbot-float-btn:hover{transform:scale(1.05);}#chatbot-popup{font-family:'Inter',sans-serif;position:fixed;bottom:90px;right:24px;width:360px;max-width:90%;background-color:#fff;border-radius:18px;box-shadow:0 12px 36px rgba(0,0,0,0.2);overflow:hidden;z-index:2147483647;display:none;animation:slideUp 0.3s ease;}@keyframes slideUp{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}.chat-header{background-color:${color};color:white;padding:20px;font-size:18px;font-weight:600;border-top-left-radius:18px;border-top-right-radius:18px;transition:background-color 0.3s;}.chat-header span{display:block;font-size:14px;font-weight:400;margin-top:4px;}.chat-body{padding:12px 16px;min-height:240px;max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;background:#fff;}.chat-message-bubble{background:#eef0ff;padding:10px 14px;border-radius:12px;max-width:75%;word-wrap:break-word;margin:10px 0;text-align:left;font-size:15px;color:#333;line-height:1.5;}.chat-message-user{background:${color};color:white;align-self:flex-end;margin-left:auto;font-size:15px;text-align:left;transition:background-color 0.3s;}.chat-message-bubble p{margin:6px 0;}.chat-message-bubble code{background:#f2f2f2;padding:2px 4px;border-radius:4px;font-family:monospace;}.typing-indicator{display:flex;align-items:center;gap:6px;padding:15px 10px;border-radius:12px;background:#eef0ff;max-width:20%;}.typing-dot{width:8px;height:8px;background:#999;border-radius:50%;animation:typing-bounce 1.2s infinite;opacity:0.6;}.typing-dot:nth-child(2){animation-delay:0.15s;}.typing-dot:nth-child(3){animation-delay:0.3s;}@keyframes typing-bounce{0%{transform:translateY(0);opacity:0.6;}30%{transform:translateY(-6px);opacity:1;}60%,100%{transform:translateY(0);opacity:0.6;}}.chat-input-box{display:flex;border-top:1px solid #eee;padding:8px;gap:8px;background:#fff;}.chat-input-box input{flex:1;padding:10px;font-size:14px;border:1px solid #ccc;border-radius:8px;outline:none;}.chat-input-box button{background:${color};color:white;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;transition:background-color 0.3s;}.chat-powered{text-align:center;font-size:10px;color:#666;padding:6px 8px;background:#fafafa;}`;
}

        function injectWidget() {
            // Safety check: if already exists, stop
            if (document.getElementById('chatbot-float-btn')) return;
            if (!document.body) return;

            // Create styles with fetched color
            const styleTag = document.createElement("style");
            styleTag.innerHTML = createStyles(widgetColor);
            document.head.appendChild(styleTag);

            // Create button with correct color
            floatBtn = document.createElement("button");
            floatBtn.id = "chatbot-float-btn";
            floatBtn.innerHTML = "💬";
            floatBtn.style.backgroundColor = widgetColor; // Inline style for immediate application

            popup = document.createElement("div");
            popup.id = "chatbot-popup";
            popup.innerHTML = `
                <div class="chat-header">
                    👋 Hi there
                    <span>Welcome to our website. Ask us anything 🎉</span>
                </div>
                <div class="chat-body">
                    <div id="chat-messages"></div>
                </div>
                <div class="chat-input-box">
                    <input type="text" id="user-message" placeholder="Type your message..." />
                    <button id="send-btn">Send</button>
                </div>
                <div class="chat-powered">Powered by Dotzerotech.com</div>
            `;

            document.body.appendChild(floatBtn);
            document.body.appendChild(popup);

            // Apply config if fetched
            if (widgetConfig) {
                applyWidgetConfig();
            }
            // Initialize Event Listeners
            initEventListeners();
        }

        //Fetch config FIRST, then inject widget
        async function initializeWidget() {
            // Wait for body to be ready
            const waitForBody = () => {
                return new Promise((resolve) => {
                    if (document.body) {
                        resolve();
                    } else {
                        const interval = setInterval(() => {
                            if (document.body) {
                                clearInterval(interval);
                                resolve();
            }
        }, 50);}
                });
            };

            await waitForBody();

            // Fetch config with timeout (max 2 seconds wait)
            const configPromise = fetchWidgetConfigSync();
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 2000));
            await Promise.race([configPromise, timeoutPromise]);

            // Now inject widget with correct color
            injectWidget();
        }

        // Start initialization
        initializeWidget();

        let socket;
        let chatId = generateChatId();
        const SOCKET_URL = `${API_URL.replace('http', 'ws')}/api/ws/chat`;

        // Generate ID
        function generateChatId() {
            const SESSION_DURATION = 5 * 60 * 1000;
            const IDLE_TIMEOUT = 5 * 60 * 1000;
            const now = Date.now();

            let storedId = sessionStorage.getItem("chat_id");
            let lastActivity = parseInt(sessionStorage.getItem("last_activity_time")) || 0;
            let expiryTime = parseInt(sessionStorage.getItem("session_expiry_time")) || 0;

            const formatDateTime = (date) => {
                const d = new Date(date);
                return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
            };

            const createNewSession = () => {
                const current = Date.now();
                const hash = btoa(navigator.userAgent).slice(0, 6);
                const newChatId = `${formatDateTime(current)}${hash}`;
                const newExpiry = current + SESSION_DURATION;

                sessionStorage.clear();
                sessionStorage.setItem("chat_id", newChatId);
                sessionStorage.setItem("last_activity_time", current.toString());
                sessionStorage.setItem("session_expiry_time", newExpiry.toString());
                return newChatId;
            };

            if (!storedId || now > expiryTime || (now - lastActivity) > IDLE_TIMEOUT) {
                return createNewSession();
            }

            // Extend session
            sessionStorage.setItem("last_activity_time", now.toString());
            sessionStorage.setItem("session_expiry_time", (now + SESSION_DURATION).toString());
            return storedId;
        }

        // Fetch Config (for re-fetching if needed, but usually config is already fetched)
        async function fetchWidgetConfig() {
            // Config already fetched in initializeWidget, just apply it
            if (widgetConfig) {
                applyWidgetConfig();
            } else {
                // Fallback: fetch again if somehow config wasn't fetched
                try {
                    const response = await fetch(`${API_URL}/api/widget-customize/public/${encodeURIComponent(WEBSITE)}`);
                    const data = await response.json();
                    if (data.success && data.data) {
                        widgetConfig = data.data;
                        if (widgetConfig.widget_header_color) {
                            widgetColor = widgetConfig.widget_header_color;
                        }
                        applyWidgetConfig();
                    }
                } catch (error) {
                    console.error("❌ Widget config error:", error);
                }
            }
        }

        function applyWidgetConfig() {
            if (!widgetConfig) return;

            // Apply Colors
            if (widgetConfig.widget_header_color) {
                const header = popup.querySelector('.chat-header');
                const sendBtn = popup.querySelector('#send-btn');

                if (header) header.style.backgroundColor = widgetConfig.widget_header_color;
                if (floatBtn) floatBtn.style.backgroundColor = widgetConfig.widget_header_color;
                if (sendBtn) {
                    sendBtn.style.backgroundColor = widgetConfig.widget_header_color;
                    sendBtn.style.borderColor = widgetConfig.widget_header_color;
                }
            }

            // Apply Content
            const header = popup.querySelector('.chat-header');
            if (header) {
                // Logo & Name
                if (widgetConfig.company_name) {
                    const logoHtml = widgetConfig.company_logo
                        ? `<img src="${widgetConfig.company_logo}" style="width:24px;height:24px;border-radius:50%;margin-right:8px;vertical-align:middle;object-fit:cover;" />`
                        : '👋 ';

                    // Welcome Message
                    const welcomeMsg = widgetConfig.header_welcome_message || 'Welcome to our website. Ask us anything';

                    header.innerHTML = `${logoHtml}${widgetConfig.company_name}<span>${welcomeMsg}</span>`;
                }
            }

            // Placement
            if (widgetConfig.widget_placement === 'Left') {
                floatBtn.style.right = 'auto'; floatBtn.style.left = '24px';
                popup.style.right = 'auto'; popup.style.left = '24px';
            }

            // Default State
            if (widgetConfig.default_state === 'Open') {
                toggleChat(true);
            }

             // Powered By Visibility and Custom Text
             const poweredByElement = popup.querySelector('.chat-powered');
             if (poweredByElement) {
                 const poweredByValue = widgetConfig.powered_by || widgetConfig.show_powered_by;
                 
                 // Check if should hide
                 if (poweredByValue && (poweredByValue.toLowerCase() === 'hide' || poweredByValue === false)) {
                     poweredByElement.style.display = 'none';
                 } else {
                     // Show the element
                     poweredByElement.style.display = 'block';
                     
                     // Get custom text - check powered_by_custom_name first (primary field)
                     const customText = widgetConfig.powered_by_custom_name || 
                                       widgetConfig.powered_by_text || 
                                       widgetConfig.powered_by_label || 
                                       widgetConfig.custom_powered_by ||
                                       widgetConfig.powered_by_custom_text ||
                                       widgetConfig.powered_by_custom;
                     
                     // Update text if custom text is provided
                     if (customText && customText.trim()) {
                         poweredByElement.textContent = customText.trim();
                     }
                     // Otherwise keep default "Powered by Dotzerotech.com"
                 }
             }
        }

        // Socket Connection
        function connectSocket() {
            if (!SECRET_KEY) return;
            // Close existing if open
            if (socket && socket.readyState === WebSocket.OPEN) socket.close();

            const url = `${SOCKET_URL}?token=${SECRET_KEY}&domain=${DOMAIN}&chatId=${chatId}&type=chat`;
            socket = new WebSocket(url);

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle Errors
                    if (data.type === "error" && data.status === 4003) {
                        hideTyping();
                        appendMessage("system", "⚠️ Subscription limit reached.");
                        document.getElementById("user-message").disabled = true;
                        return;
                    }

                    // Handle Typing
                    if (data.type === "typing") {
                        data.status === "start" ? showTyping() : hideTyping();
                        return;
                    }

                    // Handle Message
                    if (data.type === "chat" && data.message) {
                        hideTyping();
                        appendMessage("bot", data.message);

                        // Handle End of Chat signal - Reset session after thank you message
                        if (data.message.toLowerCase().includes("our agent will contact you")) {
                            setTimeout(() => {
                                // Clear chat messages from UI
                                const container = document.getElementById("chat-messages");
                                if (container) {
                                    container.innerHTML = "";
                                }

                                // Clear session storage and generate new chat ID
                                sessionStorage.clear();
                                chatId = generateChatId();

                                // Reconnect socket with new chat ID
                                if (socket) {
                                    socket.close();
                                }
                                connectSocket();
                            }, 2000);
                        }
                    }
                } catch (err) { console.warn(err); }
            };

            socket.onclose = (e) => {
                if (e.code !== 4003) setTimeout(connectSocket, 3000);
            };
        }

        // Chat UI Logic
        function initEventListeners() {
            const messageInput = document.getElementById("user-message");
            const sendBtn = document.getElementById("send-btn");

            floatBtn.addEventListener("click", () => toggleChat());

            sendBtn.addEventListener("click", handleSend);
            messageInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") handleSend(e);
            });
        }

        let isOpen = false;
        function toggleChat(forceOpen = null) {
            isOpen = forceOpen !== null ? forceOpen : !isOpen;
            popup.style.display = isOpen ? "block" : "none";
            floatBtn.innerHTML = isOpen ? "✖" : "💬";

            if (isOpen) {
                if (!socket || socket.readyState !== 1) connectSocket();
                fetchChatHistory();
                autoScroll();
            }
        }

        function handleSend(e) {
            e?.preventDefault();
            const input = document.getElementById("user-message");
            const msg = input.value.trim();
            if (!msg) return;

            appendMessage("user", msg);
            input.value = "";
            showTyping();

            if (socket && socket.readyState === WebSocket.OPEN) {
                chatId = generateChatId(); // Refresh session activity
                socket.send(JSON.stringify({ type: "chat", message: msg }));
            } else {
                // Offline fallback logic could go here
                try { socket.send(msg); } catch(e) {}
            }
        }

        function fetchChatHistory() {
            const container = document.getElementById("chat-messages");
            if(!container) return;

            fetch(`${API_URL}/api/chatbot/chat-history/${chatId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        container.innerHTML = ""; // Clear duplicates
                        data.forEach(item => {
                            const role = item.sender === "Client" ? "user" : "bot";
                            appendMessage(role, item.message, false);
                        });
                        autoScroll();
                    }
                })
                .catch(err => console.error(err));
        }

        function appendMessage(role, text, shouldScroll = true) {
            const container = document.getElementById("chat-messages");
            if (!container) return;

            const bubble = document.createElement("div");
            bubble.className = `chat-message-bubble ${role === 'user' ? 'chat-message-user' : ''}`;
            bubble.innerHTML = marked.parse(text || "");
            container.appendChild(bubble);
            if (shouldScroll) autoScroll();
        }

        function showTyping() {
            const container = document.getElementById("chat-messages");
            if (container.querySelector(".typing-indicator")) return;

            const wrap = document.createElement("div");
            wrap.className = "typing-indicator";
            wrap.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
            container.appendChild(wrap);
            autoScroll();
        }

        function hideTyping() {
            const el = document.querySelector(".typing-indicator");
            if (el) el.remove();
        }

        function autoScroll() {
            const body = document.querySelector(".chat-body");
            if (body) setTimeout(() => body.scrollTop = body.scrollHeight, 50);
        }
    }
})();



