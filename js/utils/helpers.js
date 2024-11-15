// 格式化日期
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 生成唯一ID
export const generateId = () => {
  return '_' + Math.random().toString(36).substr(2, 9);
};

// 防抖函数
export const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 获取元素相对于视口的位置
export const getElementPosition = (el) => {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset
  };
};

// 检查元素是否在视口中
export const isInViewport = (el) => {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// 添加赛博朋克风格的打字机效果
export const typewriterEffect = (element, text, speed = 50) => {
  let i = 0;
  element.innerHTML = '';
  
  const type = () => {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  };
  
  type();
};

// 创建霓虹灯文字效果
export const createNeonText = (element) => {
  element.style.textShadow = `
    0 0 5px var(--primary-color),
    0 0 10px var(--primary-color),
    0 0 20px var(--primary-color)
  `;
};

// 随机生成赛博朋克风格的颜色
export const generateCyberpunkColor = () => {
  const colors = [
    '#00ff00', // 霓虹绿
    '#ff00ff', // 霓虹粉
    '#00ffff', // 青色
    '#ff0000', // 红色
    '#0000ff'  // 蓝色
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};