const fs = require('fs');
const path = require('path');

// 读取 setting.json 获取配置
const settingPath = path.join(__dirname, 'setting.json');
let config = {};

try {
    const settingContent = fs.readFileSync(settingPath, 'utf8');
    config = JSON.parse(settingContent);
} catch (e) {
    console.error('读取 setting.json 失败:', e);
    process.exit(1);
}

const USERNAME = config.username || 'zerokkcoder';
const REPO_NAME = config.repo_name || 'zerokkcoder.github.io';
const API_URL = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}/issues`;

async function fetchAllIssues() {
    let allIssues = [];
    let page = 1;
    let hasNextPage = true;

    console.log(`开始获取 ${USERNAME}/${REPO_NAME} 的 Issues...`);

    const headers = {
        'User-Agent': 'Node.js Script'
    };
    
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        console.log('已加载 GITHUB_TOKEN');
    } else {
        console.warn('未检测到 GITHUB_TOKEN，将使用匿名请求（速率限制较低）');
    }

    while (hasNextPage) {
        try {
            const url = `${API_URL}?page=${page}&per_page=100&state=open`;
            console.log(`正在获取第 ${page} 页: ${url}`);
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                console.error(`API 请求失败: ${response.status} ${response.statusText}`);
                console.error(`Response Body: ${await response.text()}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`第 ${page} 页获取到 ${data.length} 条数据`);
            
            if (data.length === 0) {
                hasNextPage = false;
            } else {
                // 过滤掉 Pull Requests
                const issues = data.filter(item => !item.pull_request);
                allIssues = allIssues.concat(issues);
                
                // 如果返回的数量小于 100，说明是最后一页
                if (data.length < 100) {
                    hasNextPage = false;
                } else {
                    page++;
                }
            }
        } catch (error) {
            console.error('获取 Issues 失败:', error);
            process.exit(1);
        }
    }

    console.log(`共获取到 ${allIssues.length} 个 Issue`);

    // 精简数据，只保留必要字段
    const simplifiedIssues = allIssues.map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
        labels: issue.labels.map(label => ({
            id: label.id,
            name: label.name,
            color: label.color
        })),
        user: {
            login: issue.user.login,
            avatar_url: issue.user.avatar_url,
            html_url: issue.user.html_url
        }
    }));

    // 保存到 db.json
    const dbPath = path.join(__dirname, 'db.json');
    fs.writeFileSync(dbPath, JSON.stringify(simplifiedIssues, null, 2), 'utf8');
    console.log(`数据已保存到 ${dbPath}`);
}

fetchAllIssues();
