import evt from './vhp/event'
import os from './vhp/os'
import nativeUI from './vhp/nativeUI'
import geolocation from './vhp/geolocation'
import networkinfo from './vhp/networkinfo'
import axios from './vhp/axios'
import webview from './vhp/webview'

import VueTouch from 'vue-touch'

import _ from './utils'

let currentWebview = null

const VueHtml5Plus = {}
VueHtml5Plus.install = (Vue) => {
  Vue.mixin({
    beforeCreate () {
      if (os.plus) {
        let _options = this.$options
        evt.plusReady(function () {
            currentWebview = plus.webview.currentWebview();
          if (_.isFunction(_options.plusReady)) {
            _options.plusReady.call(this)
          }
          if (_.isFunction(_options.listenNetwork)) {
            evt.listenNetwork(function () {
              _options.listenNetwork.call(this)
            })
          }
        }.bind(this))
      }
    }
  })
  Vue.use(VueTouch, {name: 'v-touch'})

  Vue.prototype.$plusReady = evt.plusReady
  Vue.prototype.$os = os
  Vue.prototype.$nativeUI = nativeUI
  Vue.prototype.$toast = nativeUI.toast
  Vue.prototype.$geolocation = geolocation
  Vue.prototype.$networkinfo = networkinfo

  Vue.prototype.$axios = axios

  Vue.prototype.$currentWebview = currentWebview
  Object.keys(webview).forEach(v => Vue.prototype[`$${v}`] = webview[v])
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VueHtml5Plus)
}

export default VueHtml5Plus
