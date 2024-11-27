# Talk-H 开发文档

## 功能概述
Talk-H 是文章提醒器，负责监控文章更新并发送通知。

### 核心功能
    - 文章更新监控
    - 自定义提醒规则
    - 通知管理
    - 提醒历史记录

### 技术栈
    - Chrome Extension API
    - Chrome Notifications API
    - Supabase Realtime API
    - JavaScript ES6+
    - WebSocket

## API 接口

### 更新监控
    // 监听文章更新
    const watchArticleUpdates = () => {
        const channel = supabase.channel('article-updates')
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'superbase_articles',
                    filter: 'is_deleted=eq.false'
                },
                (payload) => handleArticleChange(payload)
            )
            .subscribe();
    };

### 通知管理
    // 发送通知
    const sendNotification = async (article) => {
        try {
            const notificationId = await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon128.png',
                title: '文章更新提醒',
                message: `《${article.title}》已更新`,
                buttons: [
                    { title: '查看详情' },
                    { title: '稍后提醒' }
                ]
            });
            return notificationId;
        } catch (error) {
            console.error('发送通知失败:', error);
            return null;
        }
    };

## 数据结构

### 提醒规则格式
    {
        id: string,           // 规则ID
        type: string,         // 规则类型
        conditions: [{        // 触发条件
            field: string,
            operator: string,
            value: any
        }],
        actions: [{          // 触发动作
            type: string,
            params: object
        }],
        schedule: {          // 定时设置
            type: string,
            interval: number,
            times: array
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
1. 监控功能
    - 实时更新
    - 规则匹配
    - 通知触发
    - 错误恢复

2. 通知功能
    - 通知显示
    - 按钮交互
    - 提醒时间
    - 通知分组 