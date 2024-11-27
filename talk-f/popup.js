// DOM 元素
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const publishBtn = document.getElementById('publishBtn');
const statusDiv = document.getElementById('status');

// 显示状态消息
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + (isError ? 'error' : 'success');
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// 发布文章
async function publishArticle() {
  try {
    // 禁用按钮
    publishBtn.disabled = true;

    // 获取输入内容
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    // 验证输入
    if (!title || !content) {
      throw new Error('标题和内容不能为空');
    }

    // 准备文章数据
    const article = {
      title,
      content,
      created_at: new Date().toISOString(),
      is_deleted: false,
      updated_at: new Date().toISOString()
    };

    console.log('Sending article:', article);
    console.log('API URL:', `${window.SUPABASE_CONFIG.url}/rest/v1/${window.SUPABASE_CONFIG.tableName}`);

    // 发送到 Supabase
    const response = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/${window.SUPABASE_CONFIG.tableName}`, {
      method: 'POST',
      headers: {
        'apikey': window.SUPABASE_CONFIG.getApiKey(),
        'Authorization': `Bearer ${window.SUPABASE_CONFIG.getApiKey()}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(article)
    });

    const responseData = await response.json();
    console.log('Response:', responseData);

    if (!response.ok) {
      throw new Error(`发布文章失败: ${responseData.message || response.statusText}`);
    }

    // 清空输入
    titleInput.value = '';
    contentInput.value = '';

    // 显示成功消息
    showStatus('文章发布成功！');
  } catch (error) {
    console.error('Error:', error);
    showStatus(error.message, true);
  } finally {
    // 启用按钮
    publishBtn.disabled = false;
  }
}

// 测试数据库连接
async function testConnection() {
  try {
    const response = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/${window.SUPABASE_CONFIG.tableName}?select=count`, {
      headers: {
        'apikey': window.SUPABASE_CONFIG.getApiKey(),
        'Authorization': `Bearer ${window.SUPABASE_CONFIG.getApiKey()}`
      }
    });

    if (!response.ok) {
      throw new Error('数据库连接测试失败');
    }

    const data = await response.json();
    console.log('Database connection test:', data);
    showStatus('数据库连接成功');
  } catch (error) {
    console.error('Connection test error:', error);
    showStatus('数据库连接失败: ' + error.message, true);
  }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
  // 测试连接
  testConnection();

  // 发布按钮点击事件
  publishBtn.addEventListener('click', publishArticle);

  // 输入框回车事件
  titleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      contentInput.focus();
    }
  });
}); 