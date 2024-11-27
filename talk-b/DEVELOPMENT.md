# Talk-B 开发文档

## 功能概述
Talk-B 是消息接收器，负责接收和处理来自其他扩展的消息。

### 核心功能
    - 消息接收
    - 实时通知
    - 消息过滤
    - 本地存储

### 技术栈
    - Chrome Extension API
    - Chrome Storage API
    - Chrome Message API
    - JavaScript ES6+

## API 接口

### 消息接收
    // 监听消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            if (message.type === 'NEW_MESSAGE') {
                handleNewMessage(message.data);
                sendResponse({ success: true });
            }
        } catch (error) {
            console.error('消息处理失败:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    });

### 通知管理
    // 显示通知
    const showNotification = (message) => {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon128.png',
            title: '新消息',
            message: message.content
        });
    };

## 数据结构

### 消息格式
    {
        id: string,          // 消息ID
        content: string,     // 消息内容
        timestamp: number,   // 时间戳
        status: string,      // 状态：unread, read
        metadata: {          // 元数据
            sender: string,
            type: string,
            priority: number
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
1. 消息接收
    - 正常接收
    - 错误处理
    - 消息过滤
    - 重复消息

2. 通知系统
    - 通知显示
    - 通知点击
    - 通知关闭
    - 通知权限 