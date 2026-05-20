# Bilingual Reader

一个双语英语文章阅读网站，支持中英文对照阅读。

## 功能特点

- 📚 **文章管理**：上传、编辑、删除双语文章
- 🔍 **搜索功能**：支持标题、内容、标签搜索
- 🏷️ **标签筛选**：按标签分类筛选文章
- 📖 **难度分级**：入门级、中级、高级
- 💾 **本地存储**：文章数据保存在浏览器 localStorage 中
- 🎨 **精美界面**：现代化的 UI 设计

## 技术栈

- **前端框架**：纯 HTML + CSS + JavaScript
- **样式**：自定义 CSS（Google Fonts）
- **存储**：浏览器 localStorage
- **部署**：GitHub Pages

## 使用方法

### 本地运行

直接打开 `index.html` 文件即可使用：

```bash
# 方法1：直接双击打开
start index.html

# 方法2：使用 Python 简易服务器
python -m http.server 8000
# 然后访问 http://localhost:8000
```

### 部署上线

项目已配置为 GitHub Pages，推送代码后自动部署：

```bash
git add .
git commit -m "Update"
git push origin main
```

访问地址：https://wangjinxin-123.github.io/bilingual-reader/

## 项目结构

```
├── index.html              # 主页面
├── bilingual_reader.css    # 样式文件
├── bilingual_reader.js     # 核心逻辑
└── README.md               # 项目说明
```

## 功能说明

### 文章列表
- 展示所有文章卡片
- 支持搜索和标签筛选
- 点击卡片查看详情

### 上传文章
- 填写文章标题、标签、难度等级
- 输入英文原文和中文译文
- 支持批量导入示例文章

### 文章详情
- 中英文对照展示
- 支持编辑和删除操作

## 浏览器兼容性

支持所有现代浏览器：
- Chrome（推荐）
- Firefox
- Safari
- Edge

## 注意事项

- 数据存储在浏览器 localStorage 中，清除浏览器数据会导致文章丢失
- 建议定期导出文章数据备份
- 如需跨设备同步，可考虑使用云存储方案

## License

MIT License
