document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    
    if (title) {
        document.querySelector('.message').textContent = title;
    }

    // 自动关闭计时器
    setTimeout(() => {
        window.close();
    }, 10000); // 10秒后自动关闭
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
