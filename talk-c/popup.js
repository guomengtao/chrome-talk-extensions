// 存储键名
const STORAGE_KEY = 'talk_messages';

// Talk-A 和 Talk-B 的扩展 ID
const TALK_A_ID = 'japicpcjchioihompffnikdofkngacnh';
const TALK_B_ID = 'pcegncdmdaehddgmifeedeeffjfkmeal';

// DOM 元素
const messageList = document.getElementById('messageList');
const refreshBtn = document.getElementById('refreshBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const statusDiv = document.getElementById('status');
const tabs = document.querySelectorAll('.tab');
const badges = {
  all: document.getElementById('allBadge'),
  a: document.getElementById('aBadge'),
  b: document.getElementById('bBadge')
};

// 当前选中的标签
let currentTab = 'all';

// 显示状态消息
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? '#f44336' : '#666';
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 3000);
}

// 格式化时间戳
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 标记所有消息为已读
async function markAllAsRead() {
  try {
    // 清除 Talk-A 的未读计数
    await chrome.runtime.sendMessage(TALK_A_ID, { 
      action: 'mark_all_read' 
    });

    // 清除 Talk-B 的未读计数
    await chrome.runtime.sendMessage(TALK_B_ID, { 
      action: 'mark_all_read' 
    });

    // 清除 Talk-C 的徽章
    chrome.action.setBadgeText({ text: '' });
  } catch (error) {
    console.error('标记已读失败:', error);
  }
}

// 更新消息列表
function updateMessageList(messages) {
  messageList.innerHTML = '';
  
  if (!messages || messages.length === 0) {
    messageList.innerHTML = '<div class="empty-message">暂无消息</div>';
    return;
  }

  // 根据当前标签过滤消息
  const filteredMessages = messages.filter(msg => {
    if (currentTab === 'all') return true;
    return msg.source === currentTab;
  });

  // 更新徽章数量
  const counts = {
    all: messages.length,
    a: messages.filter(msg => msg.source === 'a').length,
    b: messages.filter(msg => msg.source === 'b').length
  };

  Object.entries(counts).forEach(([key, count]) => {
    const badge = badges[key];
    if (count > 0) {
      badge.style.display = 'block';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  });

  // 显示过滤后的消息
  filteredMessages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message from-${msg.source}`;
    
    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-from from-${msg.source}">来自 ${msg.source.toUpperCase()}</span>
        <span class="message-time">${formatTimestamp(msg.timestamp)}</span>
      </div>
      <div class="message-text">${msg.text}</div>
      <button class="delete-btn" data-timestamp="${msg.timestamp}">×</button>
    `;

    messageList.appendChild(messageDiv);
  });
}

// 获取所有消息
async function getAllMessages() {
  try {
    refreshBtn.disabled = true;
    
    // 从 Talk-A 获取消息
    const messagesFromA = await chrome.runtime.sendMessage(TALK_A_ID, { 
      action: 'get_messages' 
    });

    // 从 Talk-B 获取消息
    const messagesFromB = await chrome.runtime.sendMessage(TALK_B_ID, { 
      action: 'get_messages' 
    });

    // 合并并排序消息，添加来源标记
    const allMessages = [
      ...(messagesFromA?.messages || []).map(msg => ({ ...msg, source: 'a' })),
      ...(messagesFromB?.messages || []).map(msg => ({ ...msg, source: 'b' }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    // 更新界面
    updateMessageList(allMessages);
    showStatus('消息已更新');

    // 标记所有消息为已读
    await markAllAsRead();
  } catch (error) {
    showStatus('获取消息失败: ' + error.message, true);
  } finally {
    refreshBtn.disabled = false;
  }
}

// 删除指定消息
async function deleteMessage(timestamp, source) {
  try {
    const targetId = source === 'a' ? TALK_A_ID : TALK_B_ID;
    await chrome.runtime.sendMessage(targetId, {
      action: 'delete_message',
      timestamp: timestamp
    });
    
    showStatus('消息已删除');
    getAllMessages(); // 刷新消息列表
  } catch (error) {
    showStatus('删除消息失败: ' + error.message, true);
  }
}

// 清除所有消息
async function clearAllMessages() {
  try {
    clearAllBtn.disabled = true;
    
    // 清除 Talk-A 的消息
    await chrome.runtime.sendMessage(TALK_A_ID, { action: 'clear_messages' });
    
    // 清除 Talk-B 的消息
    await chrome.runtime.sendMessage(TALK_B_ID, { action: 'clear_messages' });
    
    showStatus('所有消息已清除');
    getAllMessages(); // 刷新消息列表
  } catch (error) {
    showStatus('清除消息失败: ' + error.message, true);
  } finally {
    clearAllBtn.disabled = false;
  }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
  getAllMessages();
  // 打开 popup 时自动标记所有消息为已读
  markAllAsRead();
});

refreshBtn.addEventListener('click', getAllMessages);
clearAllBtn.addEventListener('click', clearAllMessages);

// 标签切换
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.source;
    getAllMessages();
  });
});

// 删除按钮点击事件
messageList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const timestamp = parseInt(e.target.dataset.timestamp);
    const messageDiv = e.target.closest('.message');
    const source = messageDiv.classList.contains('from-a') ? 'a' : 'b';
    await deleteMessage(timestamp, source);
  }
}); 