# 技术架构与功能实现文档

## 1. 项目概览
本项目是一个基于 **GitHub Pages** 的无后端静态博客系统，创新性地利用 **GitHub Issues** 作为内容管理系统 (CMS)。通过 GitHub Actions 实现数据的自动抓取、清洗与构建，配合纯前端技术栈实现动态渲染，打造了一个轻量、高性能且易于维护的个人博客平台。

## 2. 技术栈
- **前端核心**: HTML5, CSS3 (CSS Variables), JavaScript (ES6+)
- **样式方案**: 自定义极简暗黑主题 (无第三方 CSS 框架依赖)
- **数据处理**: Node.js (构建脚本), Fetch API (前端请求)
- **渲染引擎**: 
  - Markdown 解析: `marked.js`
  - 代码高亮: `highlight.js`
- **自动化运维**: GitHub Actions

## 3. 核心功能实现

### 3.1 数据流转架构 (Data Flow)
整个系统的数据流转完全自动化，无需手动部署：
1.  **内容创作**: 用户在 GitHub Repository 的 Issues 中发布或更新文章。
2.  **事件触发**: `update_blog.yml` 工作流监听 `push` (main分支) 和 `issues` (open, edit, close 等) 事件。
3.  **构建生成**: 触发 `scripts/generate.js` 脚本，调用 GitHub API 获取 Issue 数据，清洗并生成标准化的 `data/db.json` 文件。
4.  **前端消费**: 客户端访问页面时，异步请求 `data/db.json` 和 `data/setting.json`，在浏览器端完成 DOM 渲染。

### 3.2 动态 SEO 优化系统
为了解决 SPA/静态页面的 SEO 短板，实现了基于 DOM 的动态元数据更新机制 (`assets/js/script.js`):
- **功能**: `updatePageSEO(meta)` 函数。
- **实现**: 在页面加载或路由切换（如进入文章详情页）时，根据内容动态更新 `<title>`, `<meta name="description">`, `<meta name="keywords">`。
- **社交优化**: 同步更新 Open Graph (`og:title`, `og:image`) 和 Twitter Card (`twitter:card`) 标签，确保链接在社交平台分享时显示丰富的预览卡片。

### 3.3 模块化页面架构
- **首页 (Home)**: 展示文章列表，支持标签筛选和分页（配置于 `setting.json`）。
- **文章详情 (Post)**: 
  - 支持 Markdown 实时渲染。
  - 集成 **社交分享组件** (Twitter/X, Weibo, LinkedIn)，自动生成带参数的分享链接。
  - 动态 Hero Header，展示文章标题和元信息。
- **项目集 (Projects)**: 独立页面展示 GitHub 项目，支持自定义封面图和描述，数据源于 `setting.json`。
- **关于页 (About)**: 支持 Markdown 格式的个人介绍，从配置文件动态加载，方便随时更新简历或介绍。

### 3.4 性能与体验优化
- **智能缓存策略**: 实现 `fetchWithCache` 方法，利用 `localStorage` 缓存 API 数据，配合 `cache_ttl` (默认 1小时) 减少网络请求，提升二次访问速度。
- **版本控制**: 静态资源 (CSS/JS) 引入版本号参数 (`?v=x.x`)，有效解决浏览器强缓存导致的代码更新不及时问题。
- **响应式布局**: 采用 Flexbox + Grid 布局，配合 Media Queries，完美适配移动端和桌面端。

## 4. 目录结构说明
```text
├── .github/workflows/
│   └── update_blog.yml  # CI/CD 自动化配置
├── assets/
│   ├── css/             # 样式文件 (style.css - 核心样式库)
│   ├── js/              # 逻辑脚本 (script.js - 核心渲染逻辑)
│   └── images/          # 静态资源 (Logo, Hero Images)
├── data/
│   ├── db.json          # 文章数据存储 (由脚本自动生成)
│   └── setting.json     # 站点全局配置 (SEO, 菜单, 个人信息)
├── scripts/
│   └── generate.js      # 数据构建脚本 (Node.js)
├── index.html           # 首页入口
├── post.html            # 文章详情页入口
├── projects.html        # 项目列表页入口
└── about.html           # 关于页入口
```

## 5. 配置指南 (`data/setting.json`)
项目支持高度自定义配置，核心配置项包括：
- `site_name` / `site_slogan`: 站点基本信息。
- `seo`: 全局 SEO 默认配置 (keywords, description)。
- `projects`: 自定义项目列表数据。
- `about_markdown`: 关于页的 Markdown 内容源码。
- `accounts`: 社交媒体链接配置。

---
*文档生成于: 2026-01-10*
