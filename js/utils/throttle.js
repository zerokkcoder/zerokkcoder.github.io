/**
 * 节流函数
 * @param {Function} fn 需要节流的函数
 * @param {Number} limit 时间限制(ms)
 * @returns {Function} 节流后的函数
 */
export const throttle = (fn, limit) => {
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function (...args) {
    const context = this;
    
    if (!inThrottle) {
      fn.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

/**
 * RAF节流 (使用requestAnimationFrame)
 * @param {Function} fn 需要节流的函数
 * @returns {Function} 节流后的函数
 */
export const rafThrottle = (fn) => {
  let ticking = false;
  
  return function (...args) {
    const context = this;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        fn.apply(context, args);
        ticking = false;
      });
      ticking = true;
    }
  };
};

/**
 * 带有开始和结束回调的节流
 * @param {Function} fn 主函数
 * @param {Function} start 开始回调
 * @param {Function} end 结束回调
 * @param {Number} limit 时间限制(ms)
 * @returns {Function} 节流后的函数
 */
export const throttleWithCallbacks = (fn, start, end, limit) => {
  let timeoutId;
  let lastRan;
  
  return function (...args) {
    const context = this;
    
    if (!lastRan) {
      start?.call(context);
      fn.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn.apply(context, args);
          lastRan = Date.now();
        }
        end?.call(context);
      }, limit);
    }
  };
};