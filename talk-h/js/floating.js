document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (articleId) {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const article = articles.find(a => a.id === articleId);
        
        if (article) {
            document.querySelector('.message').textContent = article.title;
            document.querySelector('.summary').textContent = article.summary || '暂无摘要';
            document.querySelector('.meta').textContent = `来源: ${article.source || '未知'} • ${new Date(article.receivedAt).toLocaleString()}`;
        }
    }

    // 3秒后自动关闭
    setTimeout(() => {
        window.close();
    }, 3000);
});

function readNow() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (articleId) {
        chrome.runtime.sendMessage({ action: 'openArticle', articleId });
    }
    window.close();
}

function close() {
    window.close();
}
