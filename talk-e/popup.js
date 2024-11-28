// 存储键名
const STORAGE_KEY = 'talk_e_articles';
const UNREAD_KEY = 'talk_e_unread_count';
const LAST_CHECK_KEY = 'talk_e_last_check';
const READ_ARTICLES_KEY = 'talk_e_read_articles';

// 格式化时间戳
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 显示状态消息
function showStatus(message, isError = false) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + (isError ? 'error' : 'success');
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// 更新未读计数
async function updateUnreadCounter() {
  try {
    const result = await chrome.storage.local.get([READ_ARTICLES_KEY, STORAGE_KEY]);
    const readArticles = result[READ_ARTICLES_KEY] || [];
    const articles = result[STORAGE_KEY] || [];
    
    const unreadCount = articles.filter(article => !readArticles.includes(article.id)).length;
    
    // 更新弹窗中的未读计数
    const counter = document.getElementById('unreadCounter');
    if (unreadCount > 0) {
      counter.textContent = unreadCount;
      counter.style.display = 'block';
    } else {
      counter.style.display = 'none';
    }
    
    // 更新扩展图标上的未读计数
    if (unreadCount > 0) {
      await chrome.action.setBadgeText({ text: unreadCount.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#ff4081' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('更新未读计数失败:', error);
  }
}

// 更新文章列表
async function updateArticleList() {
  const articleList = document.getElementById('articleList');
  
  try {
    // 获取已读文章列表
    const result = await chrome.storage.local.get([READ_ARTICLES_KEY, STORAGE_KEY]);
    const readArticles = result[READ_ARTICLES_KEY] || [];
    
    console.log('开始获取文章列表...');
    const url = `${window.SUPABASE_CONFIG.url}/rest/v1/${window.SUPABASE_CONFIG.tableName}?select=*&order=created_at.desc`;
    const apiKey = window.SUPABASE_CONFIG.getApiKey();

    const response = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (!response.ok) {
      throw new Error('获取文章失败');
    }

    const articles = await response.json();
    
    // 保存文章到本地存储
    await chrome.storage.local.set({ [STORAGE_KEY]: articles });
    
    // 清空文章列表
    articleList.innerHTML = '';

    // 渲染文章列表
    articles.forEach(article => {
      const isRead = readArticles.includes(article.id);
      const articleElement = document.createElement('div');
      articleElement.className = `article-item ${isRead ? 'read' : 'unread'}`;
      articleElement.innerHTML = `
        <div class="article-title">${article.title}</div>
        <div class="article-content">${article.content}</div>
        <div class="article-meta">${formatDate(article.created_at)}</div>
        <button class="mark-read-btn ${isRead ? 'read' : 'unread'}">${isRead ? '已读' : '标记已读'}</button>
      `;

      // 添加标记已读按钮事件
      const markReadBtn = articleElement.querySelector('.mark-read-btn');
      markReadBtn.addEventListener('click', async () => {
        await markAsRead(article.id);
        articleElement.className = 'article-item read';
        markReadBtn.className = 'mark-read-btn read';
        markReadBtn.textContent = '已读';
        await updateUnreadCounter();
      });

      articleList.appendChild(articleElement);
    });

    // 更新未读计数
    await updateUnreadCounter();
    
  } catch (error) {
    console.error('更新文章列表失败:', error);
    showStatus('获取文章失败，请稍后重试', true);
  }
}

// 标记文章为已读
async function markAsRead(articleId) {
  try {
    const result = await chrome.storage.local.get(READ_ARTICLES_KEY);
    const readArticles = result[READ_ARTICLES_KEY] || [];
    
    if (!readArticles.includes(articleId)) {
      readArticles.push(articleId);
      await chrome.storage.local.set({ [READ_ARTICLES_KEY]: readArticles });
      showStatus('已标记为已读');
    }
  } catch (error) {
    console.error('标记已读失败:', error);
    showStatus('标记已读失败，请重试', true);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('页面加载完成，开始初始化...');
  updateArticleList();
});