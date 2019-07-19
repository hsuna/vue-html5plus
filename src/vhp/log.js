const write = (type, log) => {
  if(window.plus){
    const filename = (new Date).setHours(0,0,0,0)+'.txt'
    plus.io.requestFileSystem(plus.io.PRIVATE_WWW, fs => {
      // 可通过fs进行文件操作 

    }, e => {})
  }
}

/**
 * @param {String}  msg    错误信息
 * @param {String}  url    出错文件
 * @param {Number}  row    行号
 * @param {Number}  col    列号
 * @param {Object}  error  错误详细信息
 */
window.addEventListener('error', (msg, url, lineNo, columnNo, error) => {
    write('ERROR', { msg, url, lineNo, columnNo, error, ua: navigator.userAgent}) // 需要的调试的其它信息也可以收集，比如已登录的用户id
})

window.addEventListener("unhandledrejection", function(e) {
  write('PROMISE', e.reason)
})

export default (...arg) => {
  write('LOG', JSON.stringify(arg))
  console.log(JSON.stringify(arg))
}