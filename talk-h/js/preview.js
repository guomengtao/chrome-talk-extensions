document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (articleId) {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const article = articles.find(a => a.id === articleId);
        
        if (article) {
            document.querySelector('.article-title').textContent = article.title;
            document.querySelector('.article-content').textContent = article.content;
        }
    }
}); 