# 我的个人博客

这是一个基于 GitHub Issues 的纯前端静态博客。

## 特性

- **数据源**: 所有文章均来自 GitHub Issues。
- **纯原生**: 不依赖任何构建工具，仅使用 HTML, CSS, JavaScript。
- **Markdown**: 支持 Markdown 渲染。

## 如何发布文章

1. 在本仓库的 [Issues](https://github.com/zerokkcoder/zerokkcoder.github.io/issues) 页面点击 "New Issue"。
2. 输入标题和内容（支持 Markdown）。
3. 添加标签（可选）。
4. 点击 "Submit new issue"。
5. 刷新博客首页即可看到新文章。

## 本地运行

可以使用任何静态文件服务器运行，例如：

```bash
# 使用 Python
python -m http.server 8000

# 或者使用 Node.js http-server
npx http-server
```

## 配置

修改 `script.js` 中的 `CONFIG` 对象来配置用户名和仓库名。
