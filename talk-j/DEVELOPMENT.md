# Chrome 声音播放器扩展开发文档

## 技术架构

### 核心组件

1. **Service Worker (background.js)**
   - 处理扩展生命周期
   - 管理消息路由
   - 控制 offscreen document

2. **Popup 界面 (popup.js)**
   - 用户界面交互
   - 声音控制
   - 状态显示

3. **Offscreen Document (offscreen.js)**
   - 音频播放核心逻辑
   - Web Audio API 实现
   - 状态管理

### 关键技术

1. **音频处理**
   - Web Audio API
   - AudioContext 管理
   - 音频缓冲区处理

2. **状态管理**
   - 播放状态追踪
   - 实时状态广播
   - 错误状态处理

3. **存储系统**
   - Chrome Storage API
   - 自定义声音存储
   - 数据持久化

## 开发环境设置

1. **前提条件**
   - Chrome 浏览器
   - 文本编辑器（推荐 VS Code）
   - 基本的 Web 开发知识

2. **开发模式启用**
   ```bash
   # 1. 打开 Chrome 扩展管理页面
   chrome://extensions/

   # 2. 启用开发者模式
   # 3. 加载未打包的扩展
   ```

3. **调试工具**
   - Chrome DevTools
   - Console 日志
   - 网络请求监控

## 代码结构

### 1. Service Worker (background.js)
```javascript
// 主要职责：
- 扩展生命周期管理
- 消息路由
- Offscreen Document 控制
```

### 2. Popup 界面 (popup.js)
```javascript
// 主要职责：
- 用户界面渲染
- 事件处理
- 状态更新
```

### 3. 音频处理 (offscreen.js)
```javascript
// 主要职责：
- 音频上下文管理
- 声音播放控制
- 错误处理
```

## 开发指南

### 1. 添加新功能

1. **新增系统声音**
   ```javascript
   // 在 SOUNDS 对象中添加
   const SOUNDS = {
       'newSound': 'sounds/newSound.mp3'
   };
   ```

2. **添加新的消息处理**
   ```javascript
   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
       if (message.action === 'newAction') {
           // 处理新动作
       }
   });
   ```

### 2. 错误处理

```javascript
try {
    // 操作代码
} catch (error) {
    console.error('错误描述:', error);
    // 错误恢复逻辑
}
```

### 3. 状态管理

```javascript
const state = {
    isPlaying: false,
    currentSound: null,
    // 其他状态...
};

function updateState(newState) {
    Object.assign(state, newState);
    broadcastStatus();
}
```

## 测试指南

### 1. 自动化测试

```javascript
// 运行测试
const tester = new SoundPlayerTest();
await tester.runAllTests();
```

### 2. 手动测试步骤

1. 系统声音测试
   - 播放每个系统声音
   - 验证停止功能
   - 检查状态更新

2. 自定义声音测试
   - 上传新声音
   - 播放上传的声音
   - 删除声音

3. 错误处理测试
   - 尝试播放不存在的声音
   - 断开连接测试
   - 恢复连接测试

## 发布流程

1. 代码审查
   - 检查代码质量
   - 运行所有测试
   - 验证功能完整性

2. 打包扩展
   - 更新版本号
   - 生成发布包
   - 准备发布说明

3. 提交商店
   - 准备商店材料
   - 提交审核
   - 发布更新

## 最佳实践

1. **代码风格**
   - 使用 ES6+ 特性
   - 保持代码简洁
   - 添加适当注释

2. **错误处理**
   - 全面的错误捕获
   - 用户友好的错误提示
   - 错误恢复机制

3. **性能优化**
   - 资源懒加载
   - 适当的缓存策略
   - 内存管理

## 常见问题

1. **音频不播放**
   - 检查 AudioContext 状态
   - 验证文件路径
   - 确认权限设置

2. **状态不同步**
   - 检查消息监听器
   - 验证广播机制
   - 排查连接问题

3. **扩展崩溃**
   - 查看错误日志
   - 检查内存使用
   - 验证异步操作

## 维护指南

1. **日常维护**
   - 更新依赖
   - 监控性能
   - 处理用户反馈

2. **问题修复**
   - 分析错误日志
   - 制定修复方案
   - 验证修复效果

3. **版本更新**
   - 规划新功能
   - 编写更新文档
   - 测试新版本
