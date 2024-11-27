// DOM Elements
const extensionList = document.getElementById('extensionList');
const refreshAllBtn = document.getElementById('refreshAllBtn');
const status = document.getElementById('status');

// Constants
const CHAT_EXTENSIONS = {
  'japicpcjchioihompffnikdofkngacnh': 'Talk-A',
  'pcegncdmdaehddgmifeedeeffjfkmeal': 'Talk-B',
  'iflaljigapebhboldihgmoojbmbdjfoa': 'Talk-C'
};

// 更新状态显示
function updateStatus(message, type = 'info') {
  status.textContent = message;
  status.className = `status ${type}`;
}

// 加载扩展列表
async function loadExtensions() {
  try {
    const extensions = await chrome.management.getAll();
    extensionList.innerHTML = '';

    // 首先显示聊天相关的扩展
    const chatExtensions = extensions.filter(ext => 
      Object.keys(CHAT_EXTENSIONS).includes(ext.id)
    );

    if (chatExtensions.length > 0) {
      const chatSection = document.createElement('div');
      chatSection.className = 'extension-section';
      chatSection.innerHTML = '<h3>聊天扩展</h3>';
      extensionList.appendChild(chatSection);

      chatExtensions.forEach(ext => {
        const item = createExtensionItem(ext, true);
        chatSection.appendChild(item);
      });
    }

    // 然后显示其他扩展
    const otherExtensions = extensions.filter(ext => 
      !Object.keys(CHAT_EXTENSIONS).includes(ext.id) &&
      ext.id !== chrome.runtime.id && // 排除自己
      !ext.isApp // 排除应用
    );

    if (otherExtensions.length > 0) {
      const otherSection = document.createElement('div');
      otherSection.className = 'extension-section';
      otherSection.innerHTML = '<h3>其他扩展</h3>';
      extensionList.appendChild(otherSection);

      otherExtensions.forEach(ext => {
        const item = createExtensionItem(ext, false);
        otherSection.appendChild(item);
      });
    }
  } catch (error) {
    console.error('加载扩展列表失败:', error);
    updateStatus('加载扩展列表失败', 'error');
  }
}

// 创建扩展项目
function createExtensionItem(extension, isChat) {
  const item = document.createElement('div');
  item.className = 'extension-item';
  
  const icon = extension.icons ? extension.icons[extension.icons.length - 1].url : '';
  
  item.innerHTML = `
    <img class="extension-icon" src="${icon}" alt="">
    <div class="extension-info">
      <div class="extension-name">${isChat ? CHAT_EXTENSIONS[extension.id] : extension.name}</div>
      <div class="extension-id">${extension.id}</div>
    </div>
    <div class="extension-status ${extension.enabled ? 'status-enabled' : 'status-disabled'}"></div>
    <button class="toggle-btn ${extension.enabled ? 'enabled' : 'disabled'}"
            data-id="${extension.id}"
            ${extension.id === chrome.runtime.id ? 'disabled' : ''}>
      ${extension.enabled ? '禁用' : '启用'}
    </button>
  `;

  // 添加开关按钮事件
  const toggleBtn = item.querySelector('.toggle-btn');
  toggleBtn.addEventListener('click', async () => {
    try {
      await chrome.management.setEnabled(extension.id, !extension.enabled);
      loadExtensions(); // 重新加载列表
      updateStatus(`${extension.name} 已${extension.enabled ? '禁用' : '启用'}`, 'success');
    } catch (error) {
      updateStatus(`操作失败: ${error.message}`, 'error');
    }
  });

  return item;
}

// 刷新所有扩展
async function refreshAllExtensions() {
  refreshAllBtn.disabled = true;
  updateStatus('正在刷新所有扩展...', 'info');

  try {
    const extensions = await chrome.management.getAll();
    const refreshableExtensions = extensions.filter(ext => 
      ext.enabled && !ext.isApp && ext.id !== chrome.runtime.id
    );

    // 依次刷新每个扩展
    for (const ext of refreshableExtensions) {
      updateStatus(`正在刷新 ${ext.name}...`, 'info');
      
      // 禁用然后启用扩展来实现刷新
      await chrome.management.setEnabled(ext.id, false);
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms
      await chrome.management.setEnabled(ext.id, true);
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms
    }

    updateStatus('所有扩展已刷新完成', 'success');
    await loadExtensions(); // 重新加载扩展列表
  } catch (error) {
    console.error('刷新扩展时出错:', error);
    updateStatus('刷新失败: ' + error.message, 'error');
  } finally {
    refreshAllBtn.disabled = false;
  }
}

// Event Listeners
refreshAllBtn.addEventListener('click', refreshAllExtensions);

// 初始化
document.addEventListener('DOMContentLoaded', loadExtensions); 