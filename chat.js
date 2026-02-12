// Chat UI - Self-contained module
(function() {
  var chatInitialized = false;
  var chatMessages = [];
  var chatPolling = null;

  function initChat() {
    if (chatInitialized) return;
    chatInitialized = true;
    
    var container = document.getElementById('chat-container');
    if (!container) return;
    
    container.innerHTML = 
      '&lt;div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;height:calc(100vh - 140px);"&gt;' +
        '&lt;h2 style="color:#e4e4e7;margin-bottom:16px;font-size:20px;"&gt;💬 Chat with Obi&lt;/h2&gt;' +
        '&lt;div id="chat-messages" style="flex:1;overflow-y:auto;background:#13131a;border:1px solid #2a2a3a;border-radius:12px;padding:16px;margin-bottom:12px;"&gt;&lt;/div&gt;' +
        '&lt;div style="display:flex;gap:8px;"&gt;' +
          '&lt;input id="chat-input" type="text" placeholder="Type a message..." ' +
            'style="flex:1;background:#1f1f2e;border:1px solid #2a2a3a;border-radius:8px;padding:12px 16px;color:#e4e4e7;font-size:14px;outline:none;font-family:inherit;" /&gt;' +
          '&lt;button id="chat-send" style="background:#6366f1;color:white;border:none;border-radius:8px;padding:12px 24px;cursor:pointer;font-weight:600;font-size:14px;"&gt;Send&lt;/button&gt;' +
        '&lt;/div&gt;' +
      '&lt;/div&gt;';
    
    var input = document.getElementById('chat-input');
    var sendBtn = document.getElementById('chat-send');
    var messagesDiv = document.getElementById('chat-messages');
    
    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
      
      // Add user message immediately
      appendMessage('user', text, new Date().toISOString());
      
      fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      }).then(function(r) { return r.json(); }).then(function(data) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
        if (data.error) appendMessage('system', 'Error: ' + data.error, new Date().toISOString());
      }).catch(function(e) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
        appendMessage('system', 'Failed to send: ' + e.message, new Date().toISOString());
      });
    }
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
    
    function appendMessage(role, content, timestamp) {
      var div = document.createElement('div');
      div.style.cssText = 'margin-bottom:12px;padding:10px 14px;border-radius:8px;max-width:85%;word-wrap:break-word;font-size:14px;line-height:1.5;';
      if (role === 'user') {
        div.style.cssText += 'background:#6366f1;color:white;margin-left:auto;';
      } else if (role === 'assistant') {
        div.style.cssText += 'background:#1f1f2e;color:#e4e4e7;border:1px solid #2a2a3a;';
      } else {
        div.style.cssText += 'background:#2a1a1a;color:#ef4444;text-align:center;margin:0 auto;font-size:12px;';
      }
      var time = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
      div.innerHTML = '&lt;div style="font-size:11px;color:#71717a;margin-bottom:4px;"&gt;' + 
        (role === 'user' ? '👤 You' : role === 'assistant' ? '🦉 Obi' : '⚠️ System') + 
        (time ? ' · ' + time : '') + '&lt;/div&gt;' + 
        content.replace(/&lt;/g, '&amp;lt;').replace(/\n/g, '&lt;br&gt;');
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    function loadHistory() {
      fetch('/api/session-messages?id=agent:main:main').then(function(r) { return r.json(); }).then(function(messages) {
        messagesDiv.innerHTML = '';
        messages.forEach(function(m) {
          if (m.role === 'user' || m.role === 'assistant') {
            appendMessage(m.role, m.content || '', m.timestamp || '');
          }
        });
      }).catch(function() {});
    }
    
    loadHistory();
    chatPolling = setInterval(loadHistory, 5000);
  }
  
  // Hook into nav system
  document.addEventListener('DOMContentLoaded', function() {
    var observer = new MutationObserver(function() {
      var chatPage = document.getElementById('chat');
      if (chatPage && chatPage.style.display !== 'none') {
        initChat();
      }
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
    
    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        if (item.dataset.page === 'chat') {
          setTimeout(initChat, 100);
        }
      });
    });
  });
})();
