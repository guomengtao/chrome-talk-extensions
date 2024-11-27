// 存储键名
const STORAGE_KEY = 'talk_e_articles';
const UNREAD_KEY = 'talk_e_unread_count';
const LAST_CHECK_KEY = 'talk_e_last_check';

// 更新扩展图标上的未读文章数量
function updateBadgeCount() {
  chrome.storage.local.get([UNREAD_KEY], function(result) {
    const unreadCount = result[UNREAD_KEY] || 0;
    chrome.action.setBadgeText({ 
      text: unreadCount === 0 ? '' : unreadCount.toString() 
    });
    chrome.action.setBadgeBackgroundColor({ color: '#673ab7' });
  });
}

// 从 Supabase 获取新文章
async function fetchNewArticles() {
  try {
    // 等待配置加载
    await new Promise(resolve => {
      if (window.SUPABASE_CONFIG) {
        resolve();
      } else {
        const checkConfig = setInterval(() => {
          if (window.SUPABASE_CONFIG) {
            clearInterval(checkConfig);
            resolve();
          }
        }, 100);
      }
    });

    const lastCheck = await chrome.storage.local.get([LAST_CHECK_KEY]);
    const lastCheckTime = lastCheck[LAST_CHECK_KEY] || new Date(0).toISOString();

    console.log('Fetching articles since:', lastCheckTime);

    // 构建查询 URL
    const queryParams = new URLSearchParams({
      select: '*',
      is_deleted: 'eq.false',
      created_at: `gt.${lastCheckTime}`,
      order: 'created_at.desc'
    });

    const url = `${window.SUPABASE_CONFIG.url}/rest/v1/superbase_articles?${queryParams}`;
    console.log('Fetching from URL:', url);

    const response = await fetch(url, {
      headers: {
        'apikey': window.SUPABASE_CONFIG.getApiKey(),
        'Authorization': `Bearer ${window.SUPABASE_CONFIG.getApiKey()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }

    const newArticles = await response.json();
    console.log('Fetched articles:', newArticles);
    
    if (newArticles.length > 0) {
      // 获取现有文章
      const existingData = await chrome.storage.local.get([STORAGE_KEY]);
      const existingArticles = existingData[STORAGE_KEY] || [];
      
      // 合并新文章
      const updatedArticles = [...newArticles, ...existingArticles];
      
      // 更新未读计数
      const currentUnread = (await chrome.storage.local.get([UNREAD_KEY]))[UNREAD_KEY] || 0;
      const newUnreadCount = currentUnread + newArticles.length;
      
      // 保存更新
      await chrome.storage.local.set({
        [STORAGE_KEY]: updatedArticles,
        [UNREAD_KEY]: newUnreadCount,
        [LAST_CHECK_KEY]: new Date().toISOString()
      });
      
      // 更新徽章
      updateBadgeCount();
      console.log('Updated storage with new articles');
    } else {
      console.log('No new articles found');
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
  }
}

// 标记文章为已读
async function markArticleAsRead(articleId) {
  try {
    const data = await chrome.storage.local.get([STORAGE_KEY, UNREAD_KEY]);
    const articles = data[STORAGE_KEY] || [];
    const unreadCount = data[UNREAD_KEY] || 0;

    // 更新文章的已读状态
    const updatedArticles = articles.map(article => {
      if (article.id === articleId && !article.read) {
        return { ...article, read: true };
      }
      return article;
    });

    // 更新存储和徽章
    await chrome.storage.local.set({
      [STORAGE_KEY]: updatedArticles,
      [UNREAD_KEY]: Math.max(0, unreadCount - 1)
    });

    updateBadgeCount();
  } catch (error) {
    console.error('Error marking article as read:', error);
  }
}

// 设置定时检查新文章
chrome.alarms.create('checkNewArticles', {
  periodInMinutes: 1 // 每1分钟检查一次
});

// 监听定时器
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkNewArticles') {
    fetchNewArticles();
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'markAsRead') {
    markArticleAsRead(request.articleId);
    sendResponse({ success: true });
  }
  return true;
});

// 初始化
console.log('Talk-E Reader initialized');
updateBadgeCount();
fetchNewArticles(); 