# Firebase 配置指南

## 为什么需要 Firebase

因为网络环境限制，腾讯云服务无法使用。我们改用 Google Firebase 作为云端数据库服务，这样您可以继续在 GitHub Pages 上访问网站。

## 配置步骤

### 1. 创建 Firebase 项目

1. 访问 [https://console.firebase.google.com](https://console.firebase.google.com)
2. 点击 "Add project" 或 "创建项目"
3. 输入项目名称，如 "bilingual-reader"
4. 点击 "Continue" 或 "继续"，完成创建

### 2. 启用 Firestore 数据库

1. 在 Firebase 控制台左侧菜单，点击 "Firestore Database"
2. 点击 "Create Database" 或 "创建数据库"
3. 选择 "Start in test mode" 或 "以测试模式启动"
4. 点击 "Next" 或 "下一步"
5. 选择位置（建议选择离你近的地区）
6. 点击 "Enable" 或 "启用"

### 3. 获取配置信息

1. 在 Firebase 控制台，点击项目设置图标（齿轮图标）
2. 滚动到 "Your apps" 或 "您的应用" 部分
3. 点击 "Add app" 或 "添加应用" > 选择 "Web" 图标（</>）
4. 输入应用昵称，点击 "Register app"
5. 复制 "firebaseConfig" 配置信息

### 4. 更新代码配置

打开 `bilingual_reader.js` 文件，找到以下代码段：

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCw4wJ5Nc2r9x8T2zK8XfWx9Yd8QzXwJx5s",
    authDomain: "bilingual-reader-app.firebaseapp.com",
    projectId: "bilingual-reader-app",
    storageBucket: "bilingual-reader-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def4567890abc12"
};
```

用你在第 3 步中获取的配置替换上面的示例配置。

### 5. 设置 Firestore 安全规则

1. 在 Firestore Database 页面，点击 "Rules" 或 "规则" 标签
2. 将规则修改为：

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

注意：这是开发环境配置，生产环境需要设置更严格的安全规则。

3. 点击 "Publish" 或 "发布"

### 6. 提交到 GitHub

完成配置后，将代码提交到 GitHub，GitHub Pages 会自动部署更新。

## 使用说明

- **管理员密钥**：`323157`
- 登录后可以添加、编辑、删除文章
- 所有数据都会保存在云端 Firestore 数据库中
- 其他用户也可以通过 GitHub Pages 访问到您的文章

## 本地测试

在完成 Firebase 配置后，可以：

1. 直接在浏览器打开 `index.html` 文件
2. 或者使用简单的本地服务器：
   ```bash
   npx serve .
   ```
