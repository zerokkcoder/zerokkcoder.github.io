export const initNavigation = () => {
  const header = document.querySelector('.header');
  let lastScroll = 0;

  // 处理滚动时导航栏的显示/隐藏
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
      header.classList.remove('header--hidden');
      return;
    }

    if (currentScroll > lastScroll && !header.classList.contains('header--hidden')) {
      // 向下滚动
      header.classList.add('header--hidden');
    } else if (currentScroll < lastScroll && header.classList.contains('header--hidden')) {
      // 向上滚动
      header.classList.remove('header--hidden');
    }

    lastScroll = currentScroll;
  });

  // 移动端菜单切换
  const menuToggle = document.querySelector('.header__menu-toggle');
  const nav = document.querySelector('.header__nav');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('header__nav--active');
      menuToggle.classList.toggle('header__menu-toggle--active');
    });
  }
};