// 存储键名
const STORAGE_KEY = 'talk_messages';
const UNREAD_KEY = 'unread_count';

// 更新扩展图标上的未读消息数量
function updateBadgeCount() {
  chrome.storage.local.get([UNREAD_KEY], function(result) {
    const unreadCount = result[UNREAD_KEY] || 0;
    chrome.action.setBadgeText({ 
      text: unreadCount === 0 ? '' : unreadCount.toString() 
    });
    chrome.action.setBadgeBackgroundColor({ color: '#4caf50' });
  });
}

// 增加未读消息计数
function incrementUnreadCount() {
  chrome.storage.local.get([UNREAD_KEY], function(result) {
    const currentCount = result[UNREAD_KEY] || 0;
    chrome.storage.local.set({ [UNREAD_KEY]: currentCount + 1 }, function() {
      updateBadgeCount();
    });
  });
}

// 清除未读消息计数
function clearUnreadCount() {
  chrome.storage.local.set({ [UNREAD_KEY]: 0 }, function() {
    updateBadgeCount();
  });
}

// 监听来自Talk-A和Talk-C的消息
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    // 处理普通消息
    if (request.action === 'new_message') {
      chrome.storage.local.get([STORAGE_KEY], function(result) {
        const messages = result[STORAGE_KEY] || [];
        messages.push(request.message);
        chrome.storage.local.set({ [STORAGE_KEY]: messages }, function() {
          incrementUnreadCount(); // 增加未读计数
          sendResponse({ success: true });
        });
      });
      return true;
    }
    // 获取消息列表
    else if (request.action === 'get_messages') {
      chrome.storage.local.get([STORAGE_KEY], function(result) {
        sendResponse({ messages: result[STORAGE_KEY] || [] });
      });
      return true;
    }
    // 删除指定消息
    else if (request.action === 'delete_message') {
      chrome.storage.local.get([STORAGE_KEY], function(result) {
        const messages = result[STORAGE_KEY] || [];
        const newMessages = messages.filter(msg => msg.timestamp !== request.timestamp);
        chrome.storage.local.set({ [STORAGE_KEY]: newMessages }, function() {
          sendResponse({ success: true });
        });
      });
      return true;
    }
    // 清除所有消息
    else if (request.action === 'clear_messages') {
      chrome.storage.local.set({ 
        [STORAGE_KEY]: [],
        [UNREAD_KEY]: 0
      }, function() {
        updateBadgeCount();
        sendResponse({ success: true });
      });
      return true;
    }
    // 标记所有消息为已读
    else if (request.action === 'mark_all_read') {
      clearUnreadCount();
      sendResponse({ success: true });
      return true;
    }
  }
);

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes[UNREAD_KEY]) {
    updateBadgeCount();
  }
});

// 初始化徽章
updateBadgeCount(); 