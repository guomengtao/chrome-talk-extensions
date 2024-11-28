# Talk-I 开发文档

## 功能概述
Talk-I 是文章浏览器，负责提供清晰高效的文章阅读界面。

### 核心功能
    - 文章列表显示
    - 文章详情查看
    - 时间筛选
    - 阅读进度管理

### 技术栈
    - Chrome Extension API
    - Supabase API
    - JavaScript ES6+
    - IndexedDB
    - Virtual Scroll

## API 接口

### 文章列表
    // 获取文章列表
    const getArticles = async (filter = {}) => {
        try {
            let query = supabase
                .from('superbase_articles')
                .select('id, title, created_at')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (filter.today) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (filter.week) {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('created_at', weekAgo.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取文章列表失败:', error);
            return [];
        }
    };

### 阅读进度
    // 保存阅读进度
    const saveReadingProgress = async (articleId, progress) => {
        try {
            await chrome.storage.local.set({
                [`reading_progress_${articleId}`]: {
                    position: progress.position,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('保存进度失败:', error);
        }
    };

## 数据结构

### 阅读进度格式
    {
        articleId: string,     // 文章ID
        progress: {
            position: number,  // 阅读位置
            timestamp: number, // 时间戳
            duration: number,  // 阅读时长
            completed: boolean // 是否完成
        },
        metadata: {           // 元数据
            device: string,
            session: string,
            marks: array      // 书签
        }
    }

## 开发规范

### 代码风格
    - 使用 ES6+ 语法
    - 异步操作使用 async/await
    - 错误处理使用 try/catch
    - 适当添加注释

### 命名规范
    - 文件名：小写字母，用横线分隔
    - 类名：大驼峰
    - 方法名：小驼峰
    - 常量：大写字母，下划线分隔

## 测试要点
1. 列表功能
    - 分页加载
    - 时间筛选
    - 排序功能
    - 搜索功能

2. 阅读功能
    - 进度保存
    - 书签管理
    - 阅读统计
    - 离线阅读

## Talk-I Chrome Extension Development Guide

### Project Overview
Talk-I is a Chrome extension for article browsing and management, built with modern web technologies and integrated with Supabase backend.

### Technical Stack
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Supabase
- Framework: Chrome Extension Manifest V3
- Database: PostgreSQL (via Supabase)

### Project Structure
```
talk-i/
├── manifest.json        # Extension configuration
├── popup.html          # Main popup interface
├── css/
│   └── popup.css       # Styles for popup interface
├── js/
│   ├── popup.js        # Main popup logic
│   ├── supabase.js     # Supabase client configuration
│   └── lib/
│       └── supabase.min.js  # Supabase client library
└── icons/              # Extension icons
```

### Key Features
1. Article List Management
   - Display articles with title and timestamp
   - Filter articles by time period (All/Today/Week)
   - Smooth transitions between list and detail views

2. Article Detail View
   - In-popup article content display
   - Original URL linking
   - Back navigation to list view

3. Database Integration
   - Real-time data synchronization
   - Efficient data querying and filtering
   - Robust error handling

### Database Schema
```sql
create table public.articles (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    content text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_deleted boolean default false not null,
    url text,
    tags text[]
);
```

### Security Features
- Row Level Security (RLS) enabled
- Secure API key handling
- Content sanitization
- XSS protection

### Development Setup
1. Clone the repository
2. Configure Supabase credentials in `js/supabase.js`
3. Load the extension in Chrome:
   - Open chrome://extensions/
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the extension directory

### Testing
1. Manual Testing Points:
   - Article list loading
   - Filtering functionality
   - Detail view transitions
   - Error handling
   - Network connectivity issues

2. Performance Considerations:
   - Response time optimization
   - Memory usage monitoring
   - Network request optimization

### Deployment
1. Update version in manifest.json
2. Package the extension
3. Submit to Chrome Web Store

### Troubleshooting
Common issues and solutions:
1. Connection Issues
   - Verify Supabase credentials
   - Check network connectivity
   - Review console logs

2. Data Loading Problems
   - Validate database schema
   - Check RLS policies
   - Verify query parameters

### Future Improvements
1. Feature Enhancements
   - Offline support
   - Article categorization
   - Search functionality
   - Batch operations

2. Technical Improvements
   - Performance optimization
   - Code splitting
   - Caching strategy
   - Error recovery mechanisms
