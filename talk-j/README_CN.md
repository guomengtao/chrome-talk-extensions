# Chrome 声音播放器扩展

这是一个功能强大的 Chrome 浏览器扩展，专门用于管理和播放系统声音及自定义音频文件。

## 主要功能

- 播放系统预定义声音
- 上传和播放自定义声音
- 后台持续播放音频
- 实时状态更新
- 完整的错误处理机制
- 支持多种音频格式播放

## 技术特点

- 基于 Chrome Extension Manifest V3 开发
- 使用 Web Audio API 实现高质量音频播放
- 采用 Service Worker 实现后台持久化
- 通过 Offscreen Document 处理音频播放
- 使用 Chrome Storage API 存储自定义声音

## 安装步骤

1. 下载源代码
2. 打开 Chrome 浏览器的扩展管理页面 (chrome://extensions/)
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目所在目录

## 使用指南

1. 点击浏览器工具栏中的扩展图标，打开控制面板
2. 系统声音部分：
   - 点击播放按钮可播放预设声音
   - 点击停止按钮可停止当前播放
3. 自定义声音部分：
   - 点击"上传新音效"按钮添加自定义声音
   - 管理和播放已上传的声音文件
   - 可以删除不需要的自定义声音

## 开发指南

- 使用原生 JavaScript 开发
- 严格遵循 Chrome Extension Manifest V3 规范
- 采用 Web Audio API 处理音频播放
- 模块化设计，便于维护和扩展

## 目录结构

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
├── sounds/             # 系统音效文件
│   ├── notification.mp3
│   ├── complete.mp3
│   ├── alert.mp3
│   └── ding.mp3
└── images/            # 图标资源文件
```

## 自动化测试

项目包含完整的自动化测试套件，测试范围包括：
- 后台连接测试
- 音频上下文初始化测试
- 系统声音播放测试
- 自定义声音上传和播放测试
- 错误处理机制测试

## 参与贡献

欢迎提交 Pull Request 或创建 Issue 来帮助改进项目。

## 开源协议

MIT License
