// 初始化
console.log('Talk-D Manager initialized');

// 监听来自其他扩展的消息
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    console.log('Received message from:', sender.id, request);
    sendResponse({ success: true });
  }
); 