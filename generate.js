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

    while (hasNextPage) {
        try {
            console.log(`正在获取第 ${page} 页...`);
            const response = await fetch(`${API_URL}?page=${page}&per_page=100&state=open`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
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

    // 保存到 db.json
    const dbPath = path.join(__dirname, 'db.json');
    fs.writeFileSync(dbPath, JSON.stringify(allIssues, null, 2), 'utf8');
    console.log(`数据已保存到 ${dbPath}`);
}

fetchAllIssues();
