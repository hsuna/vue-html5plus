import evt from './vhp/event'
import os from './vhp/os'
import nativeUI from './vhp/nativeUI'
import geolocation from './vhp/geolocation'
import networkinfo from './vhp/networkinfo'
import axios from './vhp/axios'
import webview from './vhp/webview'

/** 添加移动事件 */
import 'tocca'

import _ from './utils'

const VueHtml5Plus = {}
VueHtml5Plus.install = (Vue) => {
  Vue.mixin({
    beforeCreate () {
      if (os.plus) {
        let self = this
        let _options = this.$options
        evt.plusReady(function () {
          this.$currentWebview = plus.webview.currentWebview();
          if (_.isFunction(_options.plusReady)) {
            _options.plusReady.call(this)
          }
          if (_.isFunction(_options.listenNetwork)) {
            evt.listenNetwork(function () {
              _options.listenNetwork.call(this)
              this.$back.bind(this)
            })
          }
          this.$back = function(){
            if(_.isFunction(_options.beforeBack) && _options.beforeBack.call(self)) return;
            webview.back.call(self)
          }
          /** 监听返回键  */
          plus.key.addEventListener('backbutton', this.$back, false);
        }.bind(this))
      }
    }
  })
  //Vue.directive('touch', Touch(Vue))

  Vue.prototype.$plusReady = evt.plusReady
  Vue.prototype.$os = os
  Vue.prototype.$nativeUI = nativeUI
  Vue.prototype.$toast = nativeUI.toast
  Vue.prototype.$geolocation = geolocation
  Vue.prototype.$networkinfo = networkinfo

  Vue.prototype.$axios = axios

  Object.keys(webview).forEach(v => Vue.prototype[`$${v}`] = webview[v])
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VueHtml5Plus)
}

export default VueHtml5Plus
