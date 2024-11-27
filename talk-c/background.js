// Talk-C 作为管理器，主要负责监听来自 Talk-A 和 Talk-B 的消息
// 并在需要时进行转发和管理

// 存储键名
const STORAGE_KEY = 'talk_messages';

// Talk-A 和 Talk-B 的扩展 ID
const TALK_A_ID = 'japicpcjchioihompffnikdofkngacnh';
const TALK_B_ID = 'pcegncdmdaehddgmifeedeeffjfkmeal';

// 初始化
console.log('Talk-C Manager initialized');

// 监听来自其他扩展的消息
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    // 只保留基本的消息监听，移除徽章计数功能
    if (request.action === 'message_update') {
      sendResponse({ success: true });
    }
    return true;
  }
);