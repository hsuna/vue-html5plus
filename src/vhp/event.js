/**
 * plusReady 事件
 * @param callack
 */
export function plusReady (callback) {
  if (window.plus) {
    setTimeout(function() { //解决callback与plusready事件的执行时机问题(典型案例:showWaiting,closeWaiting)
      callback();
    }, 0);
  } else {
    document.addEventListener('plusready', callback, false)
  }
}

/**
 * 设备网络状态变化事件
 * @param netchangeCallback
 * @param context
 */
export function listenNetwork (netchangeCallback) {
  document.addEventListener('netchange', netchangeCallback, false)
}

export default {plusReady, listenNetwork}
