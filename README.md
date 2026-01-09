# 我的个人博客

这是一个基于 GitHub Issues 的纯前端静态博客。

## 特性

- **数据源**: 所有文章均来自 GitHub Issues。
- **纯原生**: 不依赖任何构建工具，仅使用 HTML, CSS, JavaScript。
- **Markdown**: 支持 Markdown 渲染。

## 如何发布文章

### 1. Issue 格式规范
为了确保文章能被博客正确识别和展示，请遵循以下规范创建 GitHub Issue：

- **标题 (Title)**: 博客文章的标题。
- **内容 (Body)**: 文章的正文内容，支持标准的 Markdown 语法。
- **标签 (Labels)**: **非常重要！** 只有添加了正确标签的 Issue 才能在博客的分类列表中显示。

### 2. 标签与分类
博客导航栏上的分类标签是在 `setting.json` 文件中配置的。

**关键规则：**
GitHub Issue 上添加的 Label 名称，必须与 `setting.json` 中 `labels` 数组里的 `name` 字段**完全一致**。

例如，如果你的 `setting.json` 配置如下：
```json
"labels": [
    { "name": "技术", "value": "Technical" },
    { "name": "生活", "value": "Life" }
]
```
那么：
- 要发布一篇"技术"类的文章，你必须给 Issue 添加一个名为 `技术` 的 Label。
- 要发布一篇"生活"类的文章，你必须给 Issue 添加一个名为 `生活` 的 Label。
- 如果 Issue 没有标签，它只会出现在"首页"的全部文章列表中，无法通过分类筛选找到。
- 点击导航栏上的标签（如"技术"），博客会筛选出所有包含 `技术` 标签的 Issue。

### 3. 发布步骤
1. 在本仓库的 [Issues](https://github.com/zerokkcoder/zerokkcoder.github.io/issues) 页面点击 "New Issue"。
2. 输入标题和 Markdown 内容。
3. 在右侧边栏的 "Labels" 选项中，选择或创建一个与 `setting.json` 对应的标签（如 `技术`）。
4. 点击 "Submit new issue"。
5. 等待 GitHub Actions 自动构建（约 1 分钟），刷新博客即可看到更新。

## 本地运行

可以使用任何静态文件服务器运行，例如：

```bash
# 使用 Python
python -m http.server 8000

# 或者使用 Node.js http-server
npx http-server
```

## 配置

修改 `setting.json` 文件来配置博客的基本信息、社交账号和分类标签。
