export const initDarkMode = () => {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  const enableDarkMode = () => {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
  };

  const disableDarkMode = () => {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
  };

  // 检查本地存储的主题设置
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    enableDarkMode();
  } else if (currentTheme === 'light') {
    disableDarkMode();
  } else if (prefersDarkScheme.matches) {
    enableDarkMode();
  }

  // 切换主题
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
      } else {
        enableDarkMode();
      }
    });
  }

  // 监听系统主题变化
  prefersDarkScheme.addListener((e) => {
    if (e.matches) {
      enableDarkMode();
    } else {
      disableDarkMode();
    }
  });
};