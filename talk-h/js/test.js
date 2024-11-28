// 测试脚本
let logElement;

// 添加日志
function log(message, type = 'info') {
    console.log(message);
    if (logElement) {
        const timestamp = new Date().toLocaleTimeString();
        const color = type === 'error' ? '#dc3545' : 
                     type === 'success' ? '#28a745' : 
                     '#1565c0';
        logElement.innerHTML += `\n[${timestamp}] <span style="color: ${color}">${message}</span>`;
        logElement.scrollTop = logElement.scrollHeight;
    }
}

async function simulateNewArticle(priority = 'normal') {
    log(`创建${priority === 'high' ? '重要' : '普通'}测试文章...`);
    
    const article = {
        id: Date.now().toString(),
        title: priority === 'high' ? '重要：这是一篇测试文章' : '这是一篇测试文章',
        summary: '这是文章摘要，用于测试提醒系统的各项功能是否正常工作。',
        source: '测试来源',
        priority: priority,
        url: 'https://example.com/article',
        receivedAt: Date.now()
    };

    log('发送测试文章...');

    try {
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'testArticle',
                article: article
            }, response => {
                if (chrome.runtime.lastError) {
                    log(`错误：${chrome.runtime.lastError.message}`, 'error');
                    reject(chrome.runtime.lastError);
                } else {
                    log('收到响应：' + JSON.stringify(response), 'success');
                    resolve(response);
                }
            });
        });

        log('测试文章发送成功！', 'success');
    } catch (error) {
        log(`发送测试文章失败：${error.message}`, 'error');
    }
}

// 等待页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    log('测试页面已加载');
    
    // 获取日志元素
    logElement = document.getElementById('log');
    
    // 测试普通文章
    const normalButton = document.getElementById('testNormal');
    if (normalButton) {
        normalButton.addEventListener('click', async () => {
            log('开始测试普通文章...');
            await simulateNewArticle('normal');
        });
    } else {
        log('未找到普通测试按钮', 'error');
    }

    // 测试重要文章
    const highButton = document.getElementById('testHigh');
    if (highButton) {
        highButton.addEventListener('click', async () => {
            log('开始测试重要文章...');
            await simulateNewArticle('high');
        });
    } else {
        log('未找到重要文章测试按钮', 'error');
    }
});
