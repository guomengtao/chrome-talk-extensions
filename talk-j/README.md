# Talk-J Chrome Extension (音频播放插件)

一个专注于音频处理和播放的 Chrome 浏览器扩展。

## 🎵 主要功能

### 音频播放
- 多种音频格式支持
- 音量控制
- 播放状态管理
- 音频效果预览

### 声音类型
- 通知音效
- 提示音效
- 警告音效
- 完成音效

### 自定义设置
- 音量调节
- 音效选择
- 播放模式设置
- 快捷键控制

## 🔧 技术实现

### 核心组件
- Web Audio API
- Chrome Extension API
- HTML5 Audio
- FFmpeg 音频处理

### 音频规格
- 支持格式：MP3, WAV
- 采样率：44100 Hz
- 声道：单声道/立体声
- 比特率：可变

## ⚙️ 配置选项

### 音频设置
- 音量级别
- 音效类型
- 播放模式
- 淡入淡出

### 播放控制
- 播放/暂停
- 音量调节
- 效果切换
- 循环播放

## 🛠 安装和使用

1. 安装插件：
   - 打开 `chrome://extensions/`
   - 启用开发者模式
   - 加载已解压的扩展程序
   - 选择 `talk-j` 目录

2. 使用方法：
   - 点击插件图标
   - 选择音效类型
   - 调整音量
   - 测试播放

## 🔒 安全特性

- 安全的音频处理
- 受限的权限要求
- 本地音频存储
- 隐私保护

## 💻 开发指南

### 环境要求
- Chrome 浏览器
- FFmpeg
- Web Audio API 支持

### 开发步骤
1. 克隆仓库
2. 安装依赖
3. 配置音频
4. 测试功能
5. 构建发布

## 📝 版本历史

### v1.0.0
- 基础音频播放
- 音量控制
- 多种音效
- UI 设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request

## 📄 许可证

MIT License

## 👥 作者

Event Team

# Chrome 声音播放器扩展

这是一个功能强大的 Chrome 浏览器扩展，用于管理和播放系统声音及自定义音频。

## 功能特点

- 系统预定义声音播放
- 自定义声音上传和播放
- 后台持久化音频播放
- 实时状态广播机制
- 完整的错误处理
- 支持多种音频格式

## 技术架构

- 使用 Chrome Extension Manifest V3
- 基于 Web Audio API 实现高质量音频播放
- 使用 Service Worker 实现后台持久化
- 采用 Offscreen Document 处理音频播放
- Chrome Storage API 存储自定义声音

## 安装说明

1. 下载源代码
2. 打开 Chrome 浏览器，进入扩展管理页面 (chrome://extensions/)
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目目录

## 使用方法

1. 点击扩展图标打开控制面板
2. 系统声音：
   - 点击播放按钮播放预定义声音
   - 点击停止按钮停止当前播放
3. 自定义声音：
   - 点击"上传新音效"添加自定义声音
   - 管理和播放已上传的声音
   - 可以删除不需要的自定义声音

## 开发说明

- 项目使用原生 JavaScript 开发
- 遵循 Chrome Extension Manifest V3 规范
- 使用 Web Audio API 处理音频
- 采用模块化设计，便于维护和扩展

## 文件结构

```
talk-j/
├── manifest.json        # 扩展配置文件
├── popup.html          # 弹出窗口界面
├── offscreen.html      # 离屏文档
├── js/
│   ├── background.js   # 后台服务脚本
│   ├── popup.js        # 弹出窗口脚本
│   ├── offscreen.js    # 音频处理脚本
│   └── tests/          # 测试脚本
├── sounds/             # 系统音效
│   ├── notification.mp3
│   ├── complete.mp3
│   ├── alert.mp3
│   └── ding.mp3
└── images/            # 图标资源
```

## 测试

项目包含自动化测试套件，测试内容包括：
- 背景连接测试
- 音频上下文初始化测试
- 系统声音播放测试
- 自定义声音上传和播放测试
- 错误处理测试

## 贡献指南

欢迎提交 Pull Request 或创建 Issue。

## 许可证

MIT License
