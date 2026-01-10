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
 * 更新页面的 SEO 信息 (Meta 标签)
 * @param {object} meta - Meta 信息对象
 * @param {string} meta.title - 页面标题
 * @param {string} meta.description - 页面描述
 * @param {string} meta.keywords - 关键词
 * @param {string} meta.image - 分享图片 (og:image, twitter:image)
 */
function updatePageSEO(meta) {
    if (!meta) return;

    // 更新标题
    if (meta.title) {
        document.title = meta.title;
        // Open Graph
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = meta.title;
        // Twitter
        const twTitle = document.querySelector('meta[property="twitter:title"]');
        if (twTitle) twTitle.content = meta.title;
    }

    // 更新描述
    if (meta.description) {
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.content = meta.description;
        // Open Graph
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.content = meta.description;
        // Twitter
        const twDesc = document.querySelector('meta[property="twitter:description"]');
        if (twDesc) twDesc.content = meta.description;
    }

    // 更新关键词
    if (meta.keywords) {
        const kw = document.querySelector('meta[name="keywords"]');
        if (kw) kw.content = meta.keywords;
    }

    // 更新图片
    if (meta.image) {
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg) ogImg.content = meta.image;
        const twImg = document.querySelector('meta[property="twitter:image"]');
        if (twImg) twImg.content = meta.image;
    }

    // 更新 URL
    const currentUrl = window.location.href;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = currentUrl;
    const twUrl = document.querySelector('meta[property="twitter:url"]');
    if (twUrl) twUrl.content = currentUrl;
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
 * 切换分页
 * @param {number} page - 目标页码
 */
window.changePage = function(page) {
    renderPostList(page);
    // 滚动到顶部
    const postList = document.getElementById('post-list');
    if (postList) {
        postList.scrollIntoView({ behavior: 'smooth' });
    }
};

/**
 * 渲染分页控件
 * @param {number} currentPage - 当前页码
 * @param {number} totalPages - 总页数 (如果未知则为 -1)
 * @param {boolean} hasMore - 是否有更多数据 (API 模式下使用)
 */
function renderPagination(currentPage, totalPages, hasMore) {
    const listContainer = document.getElementById('post-list');
    if (!listContainer) return;
    
    // 移除已有的分页控件
    const existingPagination = document.querySelector('.pagination');
    if (existingPagination) existingPagination.remove();

    // 如果只有一页且明确知道总页数，或者API模式下第一页且无更多数据，则不显示分页
    if (totalPages === 1 || (totalPages === -1 && !hasMore && currentPage === 1)) return;
    // 如果没有数据，也不显示
    if (totalPages === 0) return;

    const paginationEl = document.createElement('div');
    paginationEl.className = 'pagination';

    const prevDisabled = currentPage <= 1 ? 'disabled' : '';
    // 如果知道总页数，则当前页>=总页数时禁用下一页
    // 如果不知道总页数(API)，则如果没有更多数据时禁用下一页
    const nextDisabled = (totalPages !== -1 && currentPage >= totalPages) || (totalPages === -1 && !hasMore) ? 'disabled' : '';

    let infoText = `第 ${currentPage} 页`;
    if (totalPages !== -1) {
        infoText += ` / 共 ${totalPages} 页`;
    }

    paginationEl.innerHTML = `
        <button class="pagination-btn ${prevDisabled}" onclick="changePage(${currentPage - 1})">
            &larr; 上一页
        </button>
        <div class="pagination-info">
            ${infoText}
        </div>
        <button class="pagination-btn ${nextDisabled}" onclick="changePage(${currentPage + 1})">
            下一页 &rarr;
        </button>
    `;

    // 插入到列表容器之后
    listContainer.parentNode.insertBefore(paginationEl, listContainer.nextSibling);
}

/**
 * 渲染文章列表
 * @param {number} page - 页码
 */
async function renderPostList(page = 1) {
    const listContainer = document.getElementById('post-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="loading">加载中...</div>';
    
    // 移除旧的分页控件，避免加载时显示旧的
    const existingPagination = document.querySelector('.pagination');
    if (existingPagination) existingPagination.remove();

    // 获取 URL 参数中的 label
    const urlParams = new URLSearchParams(window.location.search);
    const labelFilter = urlParams.get('label');

    try {
        let posts = [];
        let totalPages = -1;
        let hasMore = false;

        if (DB_DATA) {
            // 本地数据模式：支持精确分页
            let filtered = DB_DATA;
            
            // 1. 标签过滤
            if (labelFilter) {
                filtered = filtered.filter(issue => issue.labels.some(l => l.name === labelFilter));
            }
            
            // 2. 排除 Pull Requests
            filtered = filtered.filter(issue => !issue.pull_request);
            
            // 3. 计算分页
            const totalCount = filtered.length;
            totalPages = Math.ceil(totalCount / CONFIG.PER_PAGE);
            
            // 修正 page 范围
            if (page < 1) page = 1;
            if (totalPages > 0 && page > totalPages) page = totalPages;
            
            const start = (page - 1) * CONFIG.PER_PAGE;
            const end = start + CONFIG.PER_PAGE;
            posts = filtered.slice(start, end);
            
        } else {
            // API 模式：使用 getIssues 获取数据
            // getIssues 内部已经处理了 label 过滤和分页 (slice or API param)
            // 但我们需要在这里处理 !pull_request 过滤，这会导致每页数量不一致的问题
            // 这是一个已知限制。
            const data = await getIssues(page, labelFilter);
            posts = data.filter(issue => !issue.pull_request);
            
            // 简单的 hasMore 判断
            // 如果返回的数据量等于 PER_PAGE，我们假设可能还有下一页
            // 注意：因为过滤了 PR，所以 posts.length 可能会小于 data.length
            // 我们应该基于原始 data.length 来判断是否还有更多
            hasMore = data.length === CONFIG.PER_PAGE;
        }

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
        
        // 渲染分页控件
        renderPagination(page, totalPages, hasMore);

    } catch (error) {
        console.error(error);
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
        
        // 动态更新 SEO Meta
        updatePageSEO({
            title: `${post.title} - 我的博客`,
            description: post.body.slice(0, 150).replace(/[#*`]/g, '') + '...', // 简略提取前150字
            image: CONFIG.HERO_IMAGE || 'assets/images/banner.jpg', // 默认图，如果文章有图可以解析出来
            keywords: post.labels ? post.labels.map(l => l.name).join(', ') : ''
        });

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

        const shareUrl = encodeURIComponent(window.location.href);
        const shareTitle = encodeURIComponent(post.title);
        
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
            
            <div class="share-section">
                <h3>分享文章</h3>
                <div class="share-buttons">
                    <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}" target="_blank" class="share-btn share-twitter" title="分享到 Twitter/X">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        Twitter
                    </a>
                    <a href="https://service.weibo.com/share/share.php?url=${shareUrl}&title=${shareTitle}" target="_blank" class="share-btn share-weibo" title="分享到微博">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21.05 15.65c-.24.03-.49.06-.74.06-2.5 0-4.54-2.03-4.54-4.54 0-.17.02-.34.04-.51-1.68-.53-3.13-1.63-4.04-3.16-.18-.3-.39-.62-.63-.97C9.37 3.65 6.94 1.5 4.1 1.5c-2.08 0-3.95 1.15-4.96 2.87-.99 1.69-1.04 3.79-.13 5.53.86 1.64 2.47 2.84 4.3 3.19.47 1.93 1.93 3.56 3.82 4.24 1.51.54 3.14.54 4.65.01 1.66 1.63 3.93 2.66 6.43 2.66 2.5 0 4.77-1.03 6.43-2.66 1.51.53 3.14.53 4.65-.01 1.89-.68 3.35-2.31 3.82-4.24 1.83-.35 3.44-1.55 4.3-3.19.91-1.74.86-3.84-.13-5.53-1.01-1.72-2.88-2.87-4.96-2.87-2.84 0-5.27 2.15-7.04 5.03-.24.35-.45.67-.63.97-.91 1.53-2.36 2.63-4.04 3.16z"></path></svg>
                        微博
                    </a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" class="share-btn share-linkedin" title="分享到 LinkedIn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                    </a>
                    <button onclick="navigator.clipboard.writeText(window.location.href).then(()=>alert('链接已复制！'))" class="share-btn share-copy" title="复制链接">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        复制链接
                    </button>
                </div>
            </div>
        `;

        detailContainer.innerHTML = html;

        // 添加代码复制按钮
        addCodeCopyButtons();

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
        
        // 添加代码复制按钮
        addCodeCopyButtons();

    } catch (error) {
        aboutContainer.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    }
}

/**
 * 为代码块添加复制按钮
 */
function addCodeCopyButtons() {
    // 获取所有 pre 标签
    const preBlocks = document.querySelectorAll('pre');

    preBlocks.forEach(pre => {
        // 检查是否已经被包裹在 .code-wrapper 中，避免重复添加
        if (pre.parentNode.classList.contains('code-wrapper')) return;

        // 创建 wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        
        // 将 pre 替换为 wrapper，然后将 pre 放入 wrapper
        // 1. 在 pre 之前插入 wrapper
        pre.parentNode.insertBefore(wrapper, pre);
        // 2. 将 pre 移动到 wrapper 内部
        wrapper.appendChild(pre);

        // 创建按钮
        const button = document.createElement('button');
        button.className = 'code-copy-btn';
        button.textContent = '复制';
        
        // 点击事件
        button.addEventListener('click', async () => {
            // 获取代码内容
            const code = pre.querySelector('code');
            const text = code ? code.innerText : pre.innerText;

            try {
                await navigator.clipboard.writeText(text);
                
                // 复制成功反馈
                button.textContent = '已复制!';
                setTimeout(() => {
                    button.textContent = '复制';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                button.textContent = '失败';
                setTimeout(() => {
                    button.textContent = '复制';
                }, 2000);
            }
        });

        // 将按钮添加到 wrapper 元素中，使其相对于 wrapper 定位
        wrapper.appendChild(button);
    });
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
