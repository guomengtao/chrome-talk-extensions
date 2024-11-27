// 存储键名
const STORAGE_KEY = 'talk_e_articles';
const UNREAD_KEY = 'talk_e_unread_count';
const LAST_CHECK_KEY = 'talk_e_last_check';

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

// 更新文章列表
async function updateArticleList() {
  const articleList = document.getElementById('articleList');
  
  try {
    console.log('开始获取文章列表...');
    console.log('Supabase 配置:', {
      url: window.SUPABASE_CONFIG.url,
      tableName: window.SUPABASE_CONFIG.tableName,
      hasApiKey: !!window.SUPABASE_CONFIG.getApiKey()
    });

    // 从 Supabase 获取最新文章
    const url = `${window.SUPABASE_CONFIG.url}/rest/v1/${window.SUPABASE_CONFIG.tableName}?select=*&order=created_at.desc`;
    console.log('请求 URL:', url);
    
    const apiKey = window.SUPABASE_CONFIG.getApiKey();
    console.log('API Key 可用:', !!apiKey);

    const response = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('响应状态:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取文章失败:', errorText);
      throw new Error(`获取文章失败: ${response.status} ${errorText}`);
    }

    const newArticles = await response.json();
    console.log('获取到的文章:', newArticles);

    if (!newArticles || newArticles.length === 0) {
      console.log('没有找到文章');
      articleList.innerHTML = '<div class="empty-message">暂无文章</div>';
      return;
    }

    // 过滤掉已删除的文章
    const activeArticles = newArticles.filter(article => !article.is_deleted);
    console.log('活跃文章数量:', activeArticles.length);

    if (activeArticles.length === 0) {
      console.log('没有活跃的文章');
      articleList.innerHTML = '<div class="empty-message">暂无文章</div>';
      return;
    }

    articleList.innerHTML = activeArticles.map(article => `
      <div class="article-item ${article.read ? 'read' : 'unread'}" data-id="${article.id}">
        <div class="article-title">${article.title || ''}</div>
        <div class="article-content">${article.content || ''}</div>
        <div class="article-meta">
          <span>创建时间: ${formatDate(article.created_at)}</span>
          <span>更新时间: ${formatDate(article.updated_at)}</span>
        </div>
        <div class="article-actions">
          <button class="read-btn" onclick="markAsRead(${article.id})">${article.read ? '已读' : '标记已读'}</button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('更新文章列表失败:', error);
    showStatus(error.message, true);
    articleList.innerHTML = '<div class="empty-message">加载文章失败</div>';
  }
}

// 标记文章为已读
async function markAsRead(articleId) {
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

    // 更新存储
    await chrome.storage.local.set({
      [STORAGE_KEY]: updatedArticles,
      [UNREAD_KEY]: Math.max(0, unreadCount - 1)
    });

    // 更新界面
    updateArticleList();
    
    // 更新徽章
    chrome.runtime.sendMessage({ action: 'updateBadge' });
    
    showStatus('文章已标记为已读');
  } catch (error) {
    console.error('标记已读失败:', error);
    showStatus(error.message, true);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('页面加载完成，开始初始化...');
  updateArticleList();
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && (changes[STORAGE_KEY] || changes[UNREAD_KEY])) {
    updateArticleList();
  }
}); 