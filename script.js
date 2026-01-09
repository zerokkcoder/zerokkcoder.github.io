/**
 * 配置信息
 * 请根据实际情况修改 USERNAME 和 REPO_NAME
 */
const CONFIG = {
    USERNAME: 'zerokkcoder',
    REPO_NAME: 'zerokkcoder.github.io',
    PER_PAGE: 10 // 每页显示数量
};

/**
 * 格式化日期
 * @param {string} dateString - ISO 日期字符串
 * @returns {string} 格式化后的日期 (YYYY-MM-DD)
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

/**
 * 获取 Issue 列表
 * @param {number} page - 页码
 * @returns {Promise<Array>} Issue 列表数据
 */
async function getIssues(page = 1) {
    const url = `https://api.github.com/repos/${CONFIG.USERNAME}/${CONFIG.REPO_NAME}/issues?creator=${CONFIG.USERNAME}&state=open&per_page=${CONFIG.PER_PAGE}&page=${page}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('获取文章列表失败:', error);
        throw error;
    }
}

/**
 * 获取单个 Issue 详情
 * @param {number} number - Issue 编号
 * @returns {Promise<Object>} Issue 详情数据
 */
async function getIssue(number) {
    const url = `https://api.github.com/repos/${CONFIG.USERNAME}/${CONFIG.REPO_NAME}/issues/${number}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('获取文章详情失败:', error);
        throw error;
    }
}

/**
 * 渲染文章列表
 */
async function renderPostList() {
    const listContainer = document.getElementById('post-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="loading">加载中...</div>';

    try {
        // 获取 Issues，过滤掉 Pull Requests (GitHub API 返回的 issues 包含 PR，但 PR 会有 pull_request 字段)
        const data = await getIssues();
        const posts = data.filter(issue => !issue.pull_request);

        if (posts.length === 0) {
            listContainer.innerHTML = '<div class="loading">暂无文章</div>';
            return;
        }

        const html = posts.map(post => `
            <li class="post-item">
                <h2 class="post-title">
                    <a href="post.html?id=${post.number}">${post.title}</a>
                </h2>
                <div class="post-meta">
                    发布于 ${formatDate(post.created_at)}
                    ${post.labels.length > 0 ? ` • 标签: ${post.labels.map(l => l.name).join(', ')}` : ''}
                </div>
            </li>
        `).join('');

        listContainer.innerHTML = html;

    } catch (error) {
        listContainer.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    }
}

/**
 * 渲染文章详情
 */
async function renderPostDetail() {
    const detailContainer = document.getElementById('post-detail');
    if (!detailContainer) return;

    // 从 URL 获取 issue id
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        detailContainer.innerHTML = '<div class="error">未指定文章 ID</div>';
        return;
    }

    detailContainer.innerHTML = '<div class="loading">加载中...</div>';

    try {
        const post = await getIssue(id);
        
        // 渲染 Markdown
        // 注意：这里假设页面已经引入了 marked 库
        const contentHtml = marked.parse(post.body);

        // 设置页面标题
        document.title = `${post.title} - 我的博客`;

        const html = `
            <div class="post-header">
                <h1>${post.title}</h1>
                <div class="post-meta">
                    发布于 ${formatDate(post.created_at)}
                    <a href="${post.html_url}" target="_blank" style="margin-left: 10px;">在 GitHub 上查看</a>
                </div>
            </div>
            <div class="markdown-body">
                ${contentHtml}
            </div>
        `;

        detailContainer.innerHTML = html;

    } catch (error) {
        detailContainer.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 简单的路由判断
    if (document.getElementById('post-list')) {
        renderPostList();
    } else if (document.getElementById('post-detail')) {
        renderPostDetail();
    }
});
