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
        // 添加时间戳防止缓存
        const response = await fetch(`data/db.json?t=${Date.now()}`);
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
        const response = await fetch(`data/setting.json?t=${Date.now()}`);
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
        if (config.site_logo) {
            siteTitleEl.innerHTML = `
                <a href="index.html" class="site-branding">
                    <img src="${config.site_logo}" alt="${config.site_name}" class="site-logo">
                    <span>${config.site_name}</span>
                </a>
            `;
        } else {
            siteTitleEl.innerHTML = `<a href="index.html">${config.site_name}</a>`;
        }

        // 动态设置页面 Title
        if (!document.getElementById('post-detail')) {
            document.title = config.site_name;
        }
    }

    // 设置 Slogan
    const siteSloganEl = document.getElementById('site-slogan');
    if (siteSloganEl && config.site_slogan) {
        siteSloganEl.textContent = config.site_slogan;
    }

    // 设置 Hero Image (如果存在)
    const heroSection = document.getElementById('hero-section');
    if (heroSection && config.hero_image) {
        // 创建或更新 Hero Image
        let heroImg = heroSection.querySelector('.hero-image');
        if (!heroImg) {
            heroImg = document.createElement('img');
            heroImg.className = 'hero-image';
            heroSection.insertBefore(heroImg, heroSection.firstChild);
        }
        heroImg.src = config.hero_image;
        heroImg.alt = "Hero Image";

        // 在 Hero Section 中显示 Slogan
        if (config.site_slogan) {
            let heroSlogan = heroSection.querySelector('.hero-slogan');
            if (!heroSlogan) {
                heroSlogan = document.createElement('div');
                heroSlogan.className = 'hero-slogan';
                heroSection.appendChild(heroSlogan);
            }
            heroSlogan.textContent = config.site_slogan;
        }
    }

    // 渲染导航栏标签
    const navEl = document.getElementById('nav');
    if (navEl && config.labels) {
        // 获取当前选中的 label
        const currentLabel = new URLSearchParams(window.location.search).get('label');
        
        // 保留首页链接
        const homeClass = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ? (!currentLabel ? 'class="active"' : '') : '';
        const homeLink = `<a href="index.html" ${homeClass}>首页</a>`;
        
        // 项目页链接
        const projectsClass = window.location.pathname.includes('projects.html') ? 'class="active"' : '';
        const projectsLink = `<a href="projects.html" ${projectsClass}>项目</a>`;

        // 关于页链接
        const aboutClass = window.location.pathname.includes('about.html') ? 'class="active"' : '';
        const aboutLink = `<a href="about.html" ${aboutClass}>关于</a>`;

        const labelsHtml = config.labels.map(label => {
            const activeClass = currentLabel === label.name ? 'class="active"' : '';
            return `<a href="index.html?label=${encodeURIComponent(label.name)}" ${activeClass}>${label.name}</a>`;
        }).join('');

        navEl.innerHTML = homeLink + projectsLink + aboutLink + labelsHtml;
    }
}

/**
 * 渲染页脚 (社交账号和项目)
 */
function renderFooter(config) {
    const footerEl = document.getElementById('site-footer');
    if (!footerEl || !config) return;

    let html = '';

    // 渲染社交账号
    if (config.accounts && config.accounts.length > 0) {
        const accountsHtml = config.accounts.map(account => `
            <a href="${account.site_url}" target="_blank" class="account-link" title="${account.name}">
                <img src="${account.site_logo}" alt="${account.name}" onerror="this.src='https://github.githubassets.com/favicons/favicon.png'">
                <span>${account.name}</span>
            </a>
        `).join('');
        
        html += `
            <div class="footer-section">
                <h3 class="section-title">联系我</h3>
                <div class="account-list">${accountsHtml}</div>
            </div>
        `;
    }
    
    // 版权信息
    let copyrightYear = new Date().getFullYear();
    if (config.start_time) {
        const startYear = parseInt(config.start_time);
        if (!isNaN(startYear) && startYear < copyrightYear) {
            copyrightYear = `${startYear}-${copyrightYear}`;
        }
    }

    html += `
        <div class="copyright">
            <span class="status-indicator"></span>
            系统在线 • © ${copyrightYear} ${config.username || 'My Blog'}
        </div>
    `;

    footerEl.innerHTML = html;
}

/**
 * 从 Markdown 提取摘要
 * @param {string} markdown - Markdown 文本
 * @param {number} length - 摘要长度
 * @returns {string} 纯文本摘要
 */
function getSummary(markdown, length = 150) {
    if (!markdown) return '';
    // 移除 Markdown 标记
    const text = markdown
        .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接
        .replace(/#{1,6}\s/g, '') // 移除标题符号
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // 移除粗体
        .replace(/(\*|_)(.*?)\1/g, '$2') // 移除斜体
        .replace(/`{3}[\s\S]*?`{3}/g, '') // 移除代码块
        .replace(/`(.+?)`/g, '$1') // 移除行内代码
        .replace(/\n/g, ' ') // 换行转空格
        .trim();
    
    return text.length > length ? text.slice(0, length) + '...' : text;
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

        const html = posts.map(post => {
            return `
            <li class="post-item">
                <div class="post-header-flex">
                    <h2 class="post-title">
                        <a href="post.html?id=${post.number}">${post.title}</a>
                    </h2>
                    <div class="post-meta">
                        ${post.labels.length > 0 ? post.labels.map(l => `<span class="post-tag">#${l.name}</span>`).join('') : ''}
                        <span>${formatDate(post.created_at)}</span>
                    </div>
                </div>
            </li>
        `}).join('');

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

        // 更新 Hero Slogan 为文章标题
        const heroSection = document.getElementById('hero-section');
        if (heroSection) {
            let heroSlogan = heroSection.querySelector('.hero-slogan');
            if (!heroSlogan) {
                heroSlogan = document.createElement('div');
                heroSlogan.className = 'hero-slogan';
                heroSection.appendChild(heroSlogan);
            }
            heroSlogan.textContent = post.title;
        }

        const html = `
            <div class="post-header">
                <h1>${post.title}</h1>
                <div class="post-meta">
                    <span>发布于 ${formatDate(post.created_at)}</span>
                    <span><a href="${post.html_url}" target="_blank" style="color: inherit; text-decoration: none;">${post.user.login}</a></span>
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

/**
 * 渲染项目列表
 */
async function renderProjectList() {
    const listContainer = document.getElementById('project-list');
    if (!listContainer) return;

    // 获取配置
    const config = await initSiteConfig();
    if (!config || !config.projects || config.projects.length === 0) {
        listContainer.innerHTML = '<div class="loading">暂无项目</div>';
        return;
    }

    const html = config.projects.map(project => `
        <a href="${project.site_url}" target="_blank" class="project-card">
            ${project.cover ? `<div class="project-cover"><img src="${project.cover}" alt="${project.name}" loading="lazy"></div>` : ''}
            <div class="project-content">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-arrow">↗</div>
                </div>
                <p class="project-desc">${project.desc}</p>
            </div>
        </a>
    `).join('');

    listContainer.innerHTML = html;
}

/**
 * 渲染关于页面
 */
async function renderAbout() {
    const aboutContainer = document.getElementById('about-content');
    if (!aboutContainer) return;

    aboutContainer.innerHTML = '<div class="loading">加载中...</div>';

    try {
        const config = await initSiteConfig();
        
        // 获取 GitHub 用户信息
        const userUrl = `https://api.github.com/users/${config.username}`;
        const user = await fetchWithCache(userUrl);

        // 如果配置中有关于内容（支持 Markdown），则优先显示
        // 这里假设 setting.json 可能包含 about_markdown 字段
        // 如果没有，则使用 GitHub Bio
        
        let content = '';
        if (config.about_markdown) {
            content = marked.parse(config.about_markdown);
        } else if (user.bio) {
             content = `<p class="about-bio">${user.bio}</p>`;
        } else {
            content = '<p>暂无介绍。</p>';
        }

        const html = `
            <div class="about-profile">
                <img src="${user.avatar_url}" alt="${user.name}" class="about-avatar">
                <h2 class="about-name">${user.name || user.login}</h2>
                <div class="about-meta">
                    <span><a href="${user.html_url}" target="_blank">@${user.login}</a></span>
                    ${user.location ? `<span>📍 ${user.location}</span>` : ''}
                    ${user.blog ? `<span>🔗 <a href="${user.blog}" target="_blank">${user.blog}</a></span>` : ''}
                </div>
                <div class="about-stats">
                    <div class="stat-item"><strong>${user.public_repos}</strong> Repos</div>
                    <div class="stat-item"><strong>${user.followers}</strong> Followers</div>
                    <div class="stat-item"><strong>${user.following}</strong> Following</div>
                </div>
            </div>
            <div class="markdown-body about-body">
                ${content}
            </div>
        `;

        aboutContainer.innerHTML = html;

    } catch (error) {
        aboutContainer.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    await initDbData(); // 尝试加载静态数据
    const config = await initSiteConfig(); // 加载站点配置
    renderHeader(config); // 渲染头部
    renderFooter(config); // 渲染页脚

    // 简单的路由判断
    if (document.getElementById('post-list')) {
        renderPostList();
    } else if (document.getElementById('post-detail')) {
        renderPostDetail();
    } else if (document.getElementById('project-list')) {
        renderProjectList();
    } else if (document.getElementById('about-content')) {
        renderAbout();
    }
});
