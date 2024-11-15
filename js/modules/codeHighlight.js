export const initCodeHighlight = () => {
  const codeBlocks = document.querySelectorAll('pre code');
  
  // 添加复制按钮
  codeBlocks.forEach((block) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'code-block__copy';
    copyButton.innerHTML = '复制';
    
    block.parentNode.insertBefore(wrapper, block);
    wrapper.appendChild(block);
    wrapper.appendChild(copyButton);

    // 复制代码功能
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(block.textContent);
        copyButton.innerHTML = '已复制!';
        copyButton.classList.add('code-block__copy--success');
        
        setTimeout(() => {
          copyButton.innerHTML = '复制';
          copyButton.classList.remove('code-block__copy--success');
        }, 2000);
      } catch (err) {
        copyButton.innerHTML = '复制失败';
        copyButton.classList.add('code-block__copy--error');
        
        setTimeout(() => {
          copyButton.innerHTML = '复制';
          copyButton.classList.remove('code-block__copy--error');
        }, 2000);
      }
    });
  });

  // 添加行号
  codeBlocks.forEach((block) => {
    const lines = block.textContent.split('\n').length;
    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'code-block__lines';
    
    for (let i = 1; i < lines; i++) {
      const line = document.createElement('span');
      line.textContent = i;
      lineNumbers.appendChild(line);
    }
    
    block.parentNode.insertBefore(lineNumbers, block);
  });
};