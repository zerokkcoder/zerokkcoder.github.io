// 导入模块
import { initNavigation } from './modules/navigation.js';
import { initTOC } from './modules/toc.js';
import { initDarkMode } from './modules/darkMode.js';
import { initCodeHighlight } from './modules/codeHighlight.js';

// 初始化函数
const init = () => {
  initNavigation();
  initTOC();
  initDarkMode();
  initCodeHighlight();
  
  // 添加极客风格的打字机效果
  typewriterEffect();
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);