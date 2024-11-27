// DOM Elements
const messageList = document.getElementById('messageList');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const clearAllButton = document.getElementById('clearAllButton');
const status = document.getElementById('status');

// Constants
const STORAGE_KEY = 'talk_messages';
const UNREAD_KEY = 'unread_count';
const EXTENSION_IDS = {
  A: 'japicpcjchioihompffnikdofkngacnh',
  C: 'iflaljigapebhboldihgmoojbmbdjfoa'
};

// 加载消息
function loadMessages() {
  chrome.storage.local.get([STORAGE_KEY], function(result) {
    const messages = result[STORAGE_KEY] || [];
    displayMessages(messages);
    // 清除未读计数
    chrome.storage.local.set({ [UNREAD_KEY]: 0 });
  });
}

// 显示消息
function displayMessages(messages) {
  messageList.innerHTML = '';
  
  if (messages.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-message';
    emptyDiv.textContent = '暂无消息';
    messageList.appendChild(emptyDiv);
    return;
  }

  messages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.from === 'B' ? 'sent' : 'received'}`;
    
    const time = new Date(msg.timestamp).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-from">来自: ${msg.from}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${msg.text}</div>
      <button class="delete-btn" data-timestamp="${msg.timestamp}">删除</button>
    `;
    messageList.appendChild(messageDiv);
  });

  // 添加删除按钮事件
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      deleteMessage(parseInt(this.dataset.timestamp));
    });
  });

  // 滚动到底部
  messageList.scrollTop = messageList.scrollHeight;
}

// 发送消息
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const message = {
    text: text,
    timestamp: Date.now(),
    from: 'B'
  };

  try {
    // 先存储本地
    chrome.storage.local.get([STORAGE_KEY], function(result) {
      const messages = result[STORAGE_KEY] || [];
      messages.push(message);
      chrome.storage.local.set({ [STORAGE_KEY]: messages }, function() {
        messageInput.value = '';
        loadMessages();
      });
    });

    // 发送给 A
    await chrome.runtime.sendMessage(EXTENSION_IDS.A, {
      action: 'new_message',
      message: message
    });

    // 通知 C
    chrome.runtime.sendMessage(EXTENSION_IDS.C, {
      action: 'message_update'
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    updateStatus('发送失败: ' + error.message);
  }
}

// 删除消息
function deleteMessage(timestamp) {
  chrome.storage.local.get([STORAGE_KEY], function(result) {
    const messages = result[STORAGE_KEY] || [];
    const newMessages = messages.filter(msg => msg.timestamp !== timestamp);
    chrome.storage.local.set({ [STORAGE_KEY]: newMessages }, function() {
      loadMessages();
      // 通知 C
      chrome.runtime.sendMessage(EXTENSION_IDS.C, {
        action: 'message_update'
      });
    });
  });
}

// 清除所有消息
function clearAllMessages() {
  if (!confirm('确定要清除所有消息吗？')) return;
  
  chrome.storage.local.set({ 
    [STORAGE_KEY]: [],
    [UNREAD_KEY]: 0
  }, function() {
    loadMessages();
    // 通知 C
    chrome.runtime.sendMessage(EXTENSION_IDS.C, {
      action: 'message_update'
    });
  });
}

// 更新状态
function updateStatus(message) {
  status.textContent = message;
  setTimeout(() => {
    status.textContent = '';
  }, 3000);
}

// 事件监听
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage();
});
clearAllButton.addEventListener('click', clearAllMessages);

// 监听来自其他扩展的消息
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.action === 'new_message') {
      chrome.storage.local.get([STORAGE_KEY], function(result) {
        const messages = result[STORAGE_KEY] || [];
        messages.push(request.message);
        chrome.storage.local.set({ [STORAGE_KEY]: messages }, function() {
          loadMessages();
          sendResponse({ success: true });
        });
      });
      return true;
    }
  }
);

// 初始化加载
loadMessages(); 