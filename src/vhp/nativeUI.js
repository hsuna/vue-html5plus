/**
 * Created by Administrator on 2017/4/26.
 */

export default {
  toast (message, duration='short', verticalAlign='bottom') {
    return window.plus && window.plus.nativeUI.toast(message, {
      duration,
      verticalAlign
    })
  },
  alert (...arg) {
    return window.plus && window.plus.nativeUI.alert(...arg)
  },
  confirm (...arg) {
    return window.plus && window.plus.nativeUI.confirm(...arg)
  },
  prompt (...arg) {
    return window.plus && window.plus.nativeUI.prompt(...arg)
  },
  actionSheet (...arg) {
    return window.plus && window.plus.nativeUI.actionSheet(...arg)
  },
  showWaiting (...arg) {
    return window.plus && window.plus.nativeUI.showWaiting(...arg)
  },
  closeWaiting (...arg) {
    return window.plus && window.plus.nativeUI.closeWaiting(...arg)
  }
}
