/**
 * 配置信息
 * 请根据实际情况修改 USERNAME 和 REPO_NAME
 */
const CONFIG = {
    USERNAME: 'zerokkcoder',
    REPO_NAME: 'zerokkcoder.github.io',
    PER_PAGE: 10, // 每页显示数量
    CACHE_TTL: 60 * 60 * 1000 // 缓存过期时间：1小时
};

let DB_DATA = null;

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
 * 带缓存的 Fetch 请求
 * @param {string} url - 请求 URL
 * @returns {Promise<any>} 响应数据
 */
async function fetchWithCache(url) {
    const cacheKey = `cache_${url}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CONFIG.CACHE_TTL) {
            console.log(`[Cache Hit] ${url}`);
            return data;
        }
    }

    console.log(`[Network Request] ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('API 访问频率受限，请稍后再试 (GitHub API Rate Limit Exceeded)');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
    
    return data;
}

/**
 * 尝试加载本地 db.json 数据
 */
async function initDbData() {
    try {
        const response = await fetch('db.json');
        if (response.ok) {
            DB_DATA = await response.json();
            console.log('已加载本地 db.json 数据');
        }
    } catch (e) {
        console.warn('本地 db.json 加载失败，将使用 API 模式');
    }
}

/**
 * 获取并初始化站点配置
 * 优先从 setting.json 获取
 * 获取后会更新全局 CONFIG 对象
 */
async function initSiteConfig() {
    let config = null;
    try {
        // 尝试获取本地 setting.json
        const response = await fetch('setting.json');
        if (response.ok) {
            config = await response.json();
        }
    } catch (e) {
        console.warn('本地 setting.json 获取失败', e);
    }

    if (config) {
        // 更新全局 CONFIG
        if (config.username) CONFIG.USERNAME = config.username;
        if (config.repo_name) CONFIG.REPO_NAME = config.repo_name;
        if (config.per_page) CONFIG.PER_PAGE = config.per_page;
        if (config.cache_ttl) CONFIG.CACHE_TTL = config.cache_ttl;
    }

    return config;
}

/**
 * 渲染导航栏和站点信息
 */
async function renderHeader(config) {
    if (!config) return;

    // 设置站点标题
    const siteTitleEl = document.getElementById('site-title');
    if (siteTitleEl && config.site_name) {
        siteTitleEl.innerHTML = `<a href="index.html">${config.site_name}</a>`;
        document.title = config.site_name;
    }

    // 设置 Slogan
    const siteSloganEl = document.getElementById('site-slogan');
    if (siteSloganEl && config.site_slogan) {
        siteSloganEl.textContent = config.site_slogan;
    }

    // 渲染导航栏标签
    const navEl = document.getElementById('nav');
    if (navEl && config.labels) {
        // 保留首页链接
        const homeLink = '<a href="index.html">首页</a>';
        
        const labelsHtml = config.labels.map(label => {
            return `<a href="index.html?label=${encodeURIComponent(label.name)}">${label.name}</a>`;
        }).join('');

        navEl.innerHTML = homeLink + labelsHtml;
    }
}

/**
 * 获取 Issue 列表
 * @param {number} page - 页码
 * @param {string} labels - 标签过滤
 * @returns {Promise<Array>} Issue 列表数据
 */
async function getIssues(page = 1, labels = '') {
    // 优先使用静态数据
    if (DB_DATA) {
        let issues = DB_DATA;
        if (labels) {
            issues = issues.filter(issue => issue.labels.some(l => l.name === labels));
        }
        // 简单的客户端分页
        const start = (page - 1) * CONFIG.PER_PAGE;
        const end = start + CONFIG.PER_PAGE;
        return issues.slice(start, end);
    }

    let url = `https://api.github.com/repos/${CONFIG.USERNAME}/${CONFIG.REPO_NAME}/issues?creator=${CONFIG.USERNAME}&state=open&per_page=${CONFIG.PER_PAGE}&page=${page}`;
    if (labels) {
        url += `&labels=${encodeURIComponent(labels)}`;
    }
    try {
        return await fetchWithCache(url);
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
    // 优先使用静态数据
    if (DB_DATA) {
        const issue = DB_DATA.find(i => i.number == number);
        if (issue) return issue;
    }

    const url = `https://api.github.com/repos/${CONFIG.USERNAME}/${CONFIG.REPO_NAME}/issues/${number}`;
    try {
        return await fetchWithCache(url);
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

    // 获取 URL 参数中的 label
    const urlParams = new URLSearchParams(window.location.search);
    const labelFilter = urlParams.get('label');

    try {
        // 获取 Issues，过滤掉 Pull Requests
        const data = await getIssues(1, labelFilter);
        let posts = data.filter(issue => !issue.pull_request);

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
document.addEventListener('DOMContentLoaded', async () => {
    await initDbData(); // 尝试加载静态数据
    const config = await initSiteConfig(); // 加载站点配置
    renderHeader(config); // 渲染头部

    // 简单的路由判断
    if (document.getElementById('post-list')) {
        renderPostList();
    } else if (document.getElementById('post-detail')) {
        renderPostDetail();
    }
});
