
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
            return "https://dashboard.dotzerotech.net";
        };
        const API_URL = getBackendUrl();
        const DOMAIN = window.location.origin;

        let widgetConfig = null;
        let widgetColor = '#4F46E5';
        let widgetIcon = null;
        let floatBtn = null;
        let popup = null;

        const CLOSE_FLOAT_ICON = `<span class="cb-float-icon"><svg class="cb-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>`;

        const DEFAULT_FLOAT_ICON = `<span class="cb-float-icon"><svg class="cb-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C7.03 3 3 6.58 3 11c0 2.39 1.06 4.54 2.76 6.04L5 21l4.2-2.1c.74.2 1.52.31 2.33.31 1.04 0 2.02-.2 2.91-.55.5.92 1.23 1.7 2.12 2.27.3.2.67.07.8-.26.14-.33-.02-.7-.35-.85-1.1-.55-1.95-1.45-2.45-2.55C18.8 16.46 21 13.92 21 11c0-4.42-4.03-8-9-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8.5" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="11" r="1" fill="currentColor"/><circle cx="15.5" cy="11" r="1" fill="currentColor"/></svg></span>`;

        function renderFloatIcon(icon) {
            if (!icon) return DEFAULT_FLOAT_ICON;
            if (/^(https?:\/\/|\/|data:image)/i.test(icon)) {
                return `<span class="cb-float-icon"><img src="${icon}" alt="" /></span>`;
            }
            if (icon.trim().startsWith('<svg')) {
                return `<span class="cb-float-icon">${icon}</span>`;
            }
            if (icon.length <= 4) {
                return `<span class="cb-float-icon cb-float-emoji">${icon}</span>`;
            }
            return DEFAULT_FLOAT_ICON;
        }

        function getBotAvatarHtml() {
            if (widgetConfig?.company_logo) {
                return `<img src="${widgetConfig.company_logo}" alt="" class="chat-avatar-img" />`;
            }
            const letter = widgetConfig?.company_name?.charAt(0)?.toUpperCase() || 'AI';
            return `<span class="chat-avatar-letter">${letter}</span>`;
        }

        // 🔥 CRITICAL: Fetch config FIRST before creating any elements
        async function fetchWidgetConfigSync() {
            const maxRetries = 3;
            let retryCount = 0;
            
            while (retryCount < maxRetries) {
                try {
                    const response = await fetch(`${API_URL}/api/widget-customize/public/${encodeURIComponent(WEBSITE)}`);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const data = await response.json();
                    if (data.success && data.data) {
                        widgetConfig = data.data;
                        // Set color immediately if config has it
                        if (widgetConfig.widget_header_color) {
                            widgetColor = widgetConfig.widget_header_color;
                        }
                        // Set icon if config has it
                        if (widgetConfig.widget_icon) {
                            widgetIcon = widgetConfig.widget_icon;
                        }
                        return true;
                    }
                } catch (error) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        // Wait before retry (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
                        continue;
                    }
                    console.error("❌ Widget config error after retries:", error);
                }
            }
            return false;
        }

        function createStyles(color) {
            const rgb = hexToRgb(color);
            const softBg = rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)` : '#EEF2FF';
            return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

#chatbot-float-btn{
    position:fixed;bottom:28px;right:28px;width:60px;height:60px;
    background:linear-gradient(135deg,${color} 0%,${color}dd 100%);
    color:#fff;border:none;border-radius:50%;font-size:24px;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 32px ${color}55,0 2px 8px rgba(0,0,0,0.12);
    cursor:pointer;z-index:2147483647;
    transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s;
}
#chatbot-float-btn:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 12px 40px ${color}66,0 4px 12px rgba(0,0,0,0.15);}
#chatbot-float-btn .cb-float-icon{display:flex;align-items:center;justify-content:center;line-height:0;}
#chatbot-float-btn .cb-icon-svg{width:28px;height:28px;}
#chatbot-float-btn .cb-float-icon img{width:32px;height:32px;object-fit:contain;}
#chatbot-float-btn .cb-float-emoji{font-size:26px;line-height:1;}

#chatbot-popup{
    font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
    position:fixed;bottom:100px;right:28px;width:400px;max-width:calc(100vw - 32px);
    background:#fff;border-radius:20px;
    box-shadow:0 24px 64px rgba(15,23,42,0.18),0 0 0 1px rgba(15,23,42,0.06);
    overflow:hidden;z-index:2147483647;display:none;
    animation:cbSlideUp .35s cubic-bezier(.4,0,.2,1);
}
@keyframes cbSlideUp{from{transform:translateY(16px) scale(.98);opacity:0;}to{transform:translateY(0) scale(1);opacity:1;}}

.chat-header{
    background:linear-gradient(135deg,${color} 0%,${color}cc 100%);
    color:#fff;padding:18px 20px;display:flex;align-items:center;gap:14px;
    transition:background .3s;
}
.chat-header-info{display:flex;align-items:center;gap:12px;flex:1;min-width:0;}
.chat-header-avatar{
    width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.2);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
    border:2px solid rgba(255,255,255,0.35);overflow:hidden;
}
.chat-header-avatar .chat-avatar-img{width:100%;height:100%;object-fit:cover;}
.chat-header-avatar .chat-avatar-letter{font-size:13px;font-weight:700;letter-spacing:.5px;}
.chat-header-text{min-width:0;}
.chat-header-title{font-size:16px;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.chat-header-subtitle{font-size:12.5px;font-weight:400;opacity:.9;margin-top:2px;line-height:1.4;}
.chat-header-status{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500;opacity:.85;margin-top:4px;}
.chat-header-status .status-dot{width:7px;height:7px;background:#4ade80;border-radius:50%;box-shadow:0 0 0 2px rgba(74,222,128,0.35);animation:cbPulse 2s infinite;}
@keyframes cbPulse{0%,100%{opacity:1;}50%{opacity:.6;}}

.chat-body{
    padding:16px;min-height:280px;max-height:380px;overflow-y:auto;
    display:flex;flex-direction:column;gap:4px;
    background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);
    scroll-behavior:smooth;
}
.chat-body::-webkit-scrollbar{width:5px;}
.chat-body::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px;}

#chat-messages{display:flex;flex-direction:column;gap:12px;}

.chat-message-row{display:flex;align-items:flex-end;gap:10px;animation:cbMsgIn .3s ease;}
.chat-message-row-user{justify-content:flex-end;}
@keyframes cbMsgIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}

.chat-avatar{
    width:32px;height:32px;border-radius:50%;flex-shrink:0;
    background:${softBg};color:${color};
    display:flex;align-items:center;justify-content:center;
    font-size:11px;font-weight:700;border:1px solid ${color}22;overflow:hidden;
}
.chat-avatar .chat-avatar-img{width:100%;height:100%;object-fit:cover;}
.chat-avatar .chat-avatar-letter{font-size:10px;font-weight:700;}

.chat-message-bubble{
    background:#fff;padding:12px 16px;border-radius:18px 18px 18px 4px;
    max-width:78%;word-wrap:break-word;font-size:14px;color:#1e293b;line-height:1.55;
    box-shadow:0 1px 3px rgba(15,23,42,0.08);border:1px solid #e2e8f0;
}
.chat-message-user{
    background:linear-gradient(135deg,${color} 0%,${color}dd 100%);
    color:#fff;border-radius:18px 18px 4px 18px;border:none;
    box-shadow:0 2px 8px ${color}44;
}
.chat-message-system{
    background:#fef3c7;color:#92400e;border:1px solid #fde68a;
    border-radius:12px;font-size:13px;text-align:center;max-width:100%;align-self:center;
}
.chat-message-bubble p{margin:4px 0;}
.chat-message-bubble p:first-child{margin-top:0;}
.chat-message-bubble p:last-child{margin-bottom:0;}
.chat-message-bubble code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13px;}
.chat-message-bubble a{color:${color};}

.typing-row{align-items:flex-end;}
.typing-indicator{
    display:flex;align-items:center;gap:10px;
    background:#fff;padding:12px 16px;border-radius:18px 18px 18px 4px;
    border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(15,23,42,0.06);
    animation:cbMsgIn .3s ease;
}
.typing-label{font-size:13px;font-weight:500;color:#64748b;letter-spacing:.2px;}
.typing-dots{display:inline-flex;align-items:center;gap:4px;margin-left:2px;}
.typing-dots span{
    width:5px;height:5px;background:${color};border-radius:50%;
    animation:cbTypingDot 1.4s infinite ease-in-out;opacity:.4;
}
.typing-dots span:nth-child(1){animation-delay:0s;}
.typing-dots span:nth-child(2){animation-delay:.2s;}
.typing-dots span:nth-child(3){animation-delay:.4s;}
@keyframes cbTypingDot{0%,60%,100%{transform:translateY(0);opacity:.35;}30%{transform:translateY(-5px);opacity:1;}}

.chat-input-box{
    display:flex;align-items:center;border-top:1px solid #e2e8f0;
    padding:12px 14px;gap:10px;background:#fff;
}
.chat-input-box input{
    flex:1;padding:12px 16px;font-size:14px;font-family:inherit;
    border:1.5px solid #e2e8f0;border-radius:12px;outline:none;
    background:#f8fafc;color:#1e293b;transition:border-color .2s,box-shadow .2s,background .2s;
}
.chat-input-box input::placeholder{color:#94a3b8;}
.chat-input-box input:focus{border-color:${color};background:#fff;box-shadow:0 0 0 3px ${color}22;}
.chat-input-box button{
    width:44px;height:44px;min-width:44px;
    background:linear-gradient(135deg,${color} 0%,${color}dd 100%);
    color:#fff;border:none;border-radius:12px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:transform .2s,box-shadow .2s;box-shadow:0 2px 8px ${color}44;
}
.chat-input-box button:hover{transform:scale(1.05);box-shadow:0 4px 12px ${color}55;}
.chat-input-box button:active{transform:scale(.97);}
.chat-input-box button svg{width:18px;height:18px;}

.chat-powered{
    text-align:center;font-size:10px;color:#94a3b8;
    padding:8px 12px;background:#f8fafc;border-top:1px solid #f1f5f9;
    letter-spacing:.3px;
}`;
        }

        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        function injectWidget() {
            // Safety check: if already exists, stop
            if (document.getElementById('chatbot-float-btn')) return;
            if (!document.body) return;

            // Create styles with fetched color
            const styleTag = document.createElement("style");
            styleTag.id = "chatbot-widget-styles";
            styleTag.innerHTML = createStyles(widgetColor);
            document.head.appendChild(styleTag);

            // Create button with correct color and icon
            floatBtn = document.createElement("button");
            floatBtn.id = "chatbot-float-btn";
            floatBtn.innerHTML = renderFloatIcon(widgetIcon);
            floatBtn.style.backgroundColor = widgetColor; // Inline style for immediate application

            popup = document.createElement("div");
            popup.id = "chatbot-popup";
            popup.innerHTML = `
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-header-avatar"><span class="chat-avatar-letter">AI</span></div>
                        <div class="chat-header-text">
                            <div class="chat-header-title">Virtual Assistant</div>
                            <div class="chat-header-subtitle">How can we help you today?</div>
                            <div class="chat-header-status"><span class="status-dot"></span> Online</div>
                        </div>
                    </div>
                </div>
                <div class="chat-body">
                    <div id="chat-messages"></div>
                </div>
                <div class="chat-input-box">
                    <input type="text" id="user-message" placeholder="Type your message..." autocomplete="off" />
                    <button id="send-btn" aria-label="Send message">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </div>
                <div class="chat-powered">Powered by Dotzerotech</div>
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

            // Fetch config with timeout (max 5 seconds wait) - increased for slow networks
            const configPromise = fetchWidgetConfigSync();
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 5000));
            const configLoaded = await Promise.race([configPromise, timeoutPromise]);

            // Now inject widget with correct color and icon
            injectWidget();

            // If config didn't load in time, continue fetching in background and apply when ready
            if (!configLoaded) {
                // Continue fetching in background (no timeout for retry)
                fetchWidgetConfigSync().then((success) => {
                    if (success && widgetConfig) {
                        // Config loaded late, update widget now
                        applyWidgetConfig();
                        // Also update styles if color changed
                        if (widgetConfig.widget_header_color && widgetColor !== widgetConfig.widget_header_color) {
                            const styleTag = document.getElementById('chatbot-widget-styles');
                            if (styleTag) {
                                styleTag.innerHTML = createStyles(widgetConfig.widget_header_color);
                            }
                        }
                    }
                }).catch(err => {
                    console.warn("Background config fetch failed:", err);
                });
            }
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
                        if (widgetConfig.widget_icon) {
                            widgetIcon = widgetConfig.widget_icon;
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
                if (floatBtn) {
                    floatBtn.style.backgroundColor = widgetConfig.widget_header_color;
                }
                if (sendBtn) {
                    sendBtn.style.backgroundColor = widgetConfig.widget_header_color;
                    sendBtn.style.borderColor = widgetConfig.widget_header_color;
                }
                
                widgetColor = widgetConfig.widget_header_color;
                const styleTag = document.getElementById('chatbot-widget-styles');
                if (styleTag) styleTag.innerHTML = createStyles(widgetColor);
            }

            // Apply Widget Icon
            if (widgetConfig.widget_icon && floatBtn) {
                widgetIcon = widgetConfig.widget_icon;
                // Only update icon if chat is closed (not showing X)
                if (!isOpen) {
                    floatBtn.innerHTML = renderFloatIcon(widgetIcon);
                }
            }

            const headerAvatar = popup.querySelector('.chat-header-avatar');
            const headerTitle = popup.querySelector('.chat-header-title');
            const headerSubtitle = popup.querySelector('.chat-header-subtitle');

            if (headerAvatar) {
                headerAvatar.innerHTML = getBotAvatarHtml();
            }
            if (widgetConfig.company_name && headerTitle) {
                headerTitle.textContent = widgetConfig.company_name;
            }
            if (headerSubtitle) {
                headerSubtitle.textContent = widgetConfig.header_welcome_message || 'How can we help you today?';
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
            floatBtn.classList.toggle("cb-open", isOpen);
            floatBtn.innerHTML = isOpen ? CLOSE_FLOAT_ICON : renderFloatIcon(widgetIcon);

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

            const row = document.createElement("div");
            row.className = `chat-message-row ${role === 'user' ? 'chat-message-row-user' : ''}`;

            if (role === 'bot' || role === 'system') {
                const avatar = document.createElement("div");
                avatar.className = "chat-avatar";
                avatar.innerHTML = getBotAvatarHtml();
                row.appendChild(avatar);
            }

            const bubble = document.createElement("div");
            bubble.className = `chat-message-bubble ${
                role === 'user' ? 'chat-message-user' : role === 'system' ? 'chat-message-system' : ''
            }`;
            bubble.innerHTML = marked.parse(text || "");
            row.appendChild(bubble);
            container.appendChild(row);
            if (shouldScroll) autoScroll();
        }

        function showTyping() {
            const container = document.getElementById("chat-messages");
            if (container.querySelector(".typing-row")) return;

            const row = document.createElement("div");
            row.className = "chat-message-row typing-row";
            row.innerHTML = `
                <div class="chat-avatar">${getBotAvatarHtml()}</div>
                <div class="typing-indicator">
                    <span class="typing-label">Typing</span>
                    <span class="typing-dots"><span></span><span></span><span></span></span>
                </div>
            `;
            container.appendChild(row);
            autoScroll();
        }

        function hideTyping() {
            const el = document.querySelector(".typing-row");
            if (el) el.remove();
        }

        function autoScroll() {
            const body = document.querySelector(".chat-body");
            if (body) setTimeout(() => body.scrollTop = body.scrollHeight, 50);
        }
    }
})();



