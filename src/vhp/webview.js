/**
 * Created by Administrator on 2017/4/26.
 */
import os from './os'
import nativeUI from './nativeUI'
import _ from '../utils'

/** 等待动画配置 */
const WAITING_OPTIONS = {
	autoShow: true,
	title: '',
	modal: false
}
/** 窗口显示配置 */
const SHOW_OPTIONS = {
	event:"titleUpdate",
	autoShow: true,
	duration: 300,
	aniShow: 'slide-in-right',
	extras:{}
}
/** 窗口默认配置 */
const WINDOW_OPTIONS = {
	scalable: false,
	bounce: "" //vertical
}
/** 默认配置 */
const DEFAULT_OPTIONS = {
	preloadPages: [], //5+ lazyLoad webview
	preloadLimit: 10, //预加载窗口的数量限制(一旦超出，先进先出)
	titleConfig: {
		height: "44px",
		backgroundColor: "#f7f7f7", //导航栏背景色
		bottomBorderColor: "#cccccc", //底部边线颜色
		title: { //标题配置
			text: "", //标题文字
			position: {
				top: 0,
				left: 0,
				width: "100%",
				height: "100%"
			},
			styles: {
				color: "#000000",
				align: "center",
				family: "'Helvetica Neue',Helvetica,sans-serif",
				size: "17px",
				style: "normal",
				weight: "normal",
				fontSrc: ""
			}
		},
		back: {
			image: {
				base64Data: '',
				imgSrc: '',
				sprite: {
					top: '0px',
					left: '0px',
					width: '100%',
					height: '100%'
				},
				position: {
					top: "10px",
					left: "10px",
					width: "24px",
					height: "24px"
				}
			}
		}
	}
}

let _webviews = {}
let preloads = [];

const _triggerPreload = function(webview) {
	if(!webview.preloaded) { //保证仅触发一次
		fire(webview, 'preload');
		var list = webview.children();
		for(var i = 0; i < list.length; i++) {
			fire(list[i], 'preload');
		}
		webview.preloaded = true;
	}
};

const _trigger = function(webview, eventType, timeChecked) {
	if(timeChecked) {
		if(!webview[eventType + 'ed']) {
			fire(webview, eventType);
			var list = webview.children();
			for(var i = 0; i < list.length; i++) {
				fire(list[i], eventType);
			}
			webview[eventType + 'ed'] = true;
		}
	} else {
		fire(webview, eventType);
		var list = webview.children();
		for(var i = 0; i < list.length; i++) {
			fire(list[i], eventType);
		}
	}
};

/**
 * 5+ event(5+没提供之前我自己实现)
 * @param {type} webview
 * @param {type} eventType
 * @param {type} data
 * @returns {undefined}
 */
const fire = (webview, eventType, data) => {
	if(webview) {
		if(typeof data === 'undefined') {
			data = '';
		} else if(typeof data === 'boolean' || typeof data === 'number') {
			webview.evalJS(`window.Vue && window.VueHtml5Plus && Vue.prototype.$receive("${eventType}", "${data}");`);
			return;
		} else if(_.isPlainObject(data) || _.isArray()) {
			data = JSON.stringify(data || {}).replace(/\'/g, "\\u0027").replace(/\\/g, "\\u005c");
		}
		webview.evalJS(`window.Vue && window.VueHtml5Plus && Vue.prototype.$receive("${eventType}", "${data}");`);
	}
};

/*
* 推送事件
* @param type 事件名
* @param views 窗口id列表 如存在，则向指定窗口推送，否则广播全部窗口
* @param data 推送时需传数据
*/
const dispatchFire = (type, ids, data) => {
	const list = ('string'==typeof ids?[ids]:ids) || plus.webview.all();
	list.forEach(view => {
		view = 'string'==typeof view ? plus.webview.getWebviewById(view) : view;
		view && fire(view, type, data);
	})
}

/**
 * 5+ event(5+没提供之前我自己实现)
 * @param {type} eventType
 * @param {type} data
 * @returns {undefined}
 */
const receive = (eventType, data) => {
	if(eventType) {
		try {
			if(data && typeof data === 'string') {
				data = JSON.parse(data);
			}
		} catch(e) {}
		trigger(document, eventType, data);
	}
};

/**
 * trigger event
 * @param {type} element
 * @param {type} eventType
 * @param {type} eventData
 * @returns {_L8.$}
 */
const trigger = (element, eventType, eventData) => {
	element.dispatchEvent(new CustomEvent(eventType, {
		detail: eventData,
		bubbles: true,
		cancelable: true
	}));
	return this;
};

const createWindow = (options, isCreate) => {
	if(!window.plus) {
		return;
	}
	let id = options.id || options.url;
	let webview;
	if(options.preload) {
		if(_webviews[id] && _webviews[id].webview.getURL()) { //已经cache
			webview = _webviews[id].webview;
		} else { //新增预加载窗口
			//判断是否携带createNew参数，默认为false
			if(options.createNew !== true) {
				webview = plus.webview.getWebviewById(id);
			}

			//之前没有，那就新创建	
			if(!webview) {
				webview = plus.webview.create(
					options.url, 
					id, 
					{ ...WINDOW_OPTIONS, ...options.styles },
					{ preload: true, ...options.extras }
				);
				if(options.subpages) {
					options.subpages.forEach((subpage, index) => {
						let subpageId = subpage.id || subpage.url;
						if(subpageId) { //过滤空对象
							let subWebview = plus.webview.getWebviewById(subpageId);
							if(!subWebview) { //如果该webview不存在，则创建
								subWebview = plus.webview.create(
									subpage.url, 
									subpageId, 
									{ ...WINDOW_OPTIONS, ...subpage.styles },
									{ preload: true, ...subpage.extras }
								);
							}
							webview.append(subWebview);
						}
					})
				}
			}
		}

		//TODO 理论上，子webview也应该计算到预加载队列中，但这样就麻烦了，要退必须退整体，否则可能出现问题；
		_webviews[id] = {
			webview: webview, //目前仅preload的缓存webview
			preload: true,
			show: { ...SHOW_OPTIONS, ...options.show },
			afterShowMethodName: options.afterShowMethodName //就不应该用evalJS。应该是通过事件消息通讯
		};
		//索引该预加载窗口
		if(~preloads.indexOf(id)) { //删除已存在的(变相调整插入位置)
			preloads.splice(index, 1);
		}
		preloads.push(id);
		if(preloads.length > DEFAULT_OPTIONS.preloadLimit) {
			//先进先出
			var first = preloads.shift();
			var webviewCache = _webviews[first];
			if(webviewCache && webviewCache.webview) {
				//需要将自己打开的所有页面，全部close；
				//关闭该预加载webview	
				closeAll(webviewCache.webview);
			}
			//删除缓存
			delete _webviews[first];
		}
	} else {
		if(isCreate !== false) { //直接创建非预加载窗口
			webview = plus.webview.create(
				options.url, 
				id, 
				{ ...WINDOW_OPTIONS, ...options.styles },
				options.extras
			);
			if(options.subpages) {
				options.subpages.forEach((subpage, index) => {
					const subpageId = subpage.id || subpage.url;
					let subWebview = plus.webview.getWebviewById(subpageId);
					if(!subWebview) {
						subWebview = plus.webview.create(
							subpage.url, 
							subpageId, 
							{ ...WINDOW_OPTIONS, ...subpage.styles },
							subpage.extras
						);
					}
					webview.append(subWebview);
				});
			}
		}
	}
	return webview;
}

const openWindow = (url, id, options) => {
	if(typeof url === 'object') {
		options = url;
		url = options.url;
		id = options.id || url;
	} else {
		if(typeof id === 'object') {
			options = id;
			id = options.id || url;
		} else {
			id = id || url;
		}
	}
	if(!os.plus) {
		//TODO 先临时这么处理：手机上顶层跳，PC上parent跳
		if(os.ios || os.android) {
			window.top.location.href = url;
		} else {
			window.parent.location.href = url;
		}
		return;
	}
	if(!window.plus) {
		return;
	}

	options = options || {};
	var params = options.params || {};
	var webview = null,
		webviewCache = null,
		nShow, nWaiting;

	if(_webviews[id]) {
		webviewCache = _webviews[id];
		//webview真实存在，才能获取
		if(plus.webview.getWebviewById(id)) {
			webview = webviewCache.webview;
		}
	} else if(options.createNew !== true) {
		webview = plus.webview.getWebviewById(id);
	}

	if(webview) { //已缓存
		//每次show都需要传递动画参数；
		//预加载的动画参数优先级：openWindow配置>preloadPages配置>mui默认配置；
		nShow = webviewCache ? webviewCache.show : defaultShow;
		nShow = options.show ? { ...nShow, ...options.show } : nShow;
		nShow.autoShow && webview.show(nShow.aniShow, nShow.duration, function() {
			_triggerPreload(webview);
			_trigger(webview, 'pagebeforeshow', false);
		});
		if(webviewCache) {
			webviewCache.afterShowMethodName && webview.evalJS(webviewCache.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
		}
		return webview;
	} else { //新窗口
		if(!url) {
			throw new Error('webview[' + id + '] does not exist');
		}

		//显示waiting
		const waitingConfig = { ...WAITING_OPTIONS, ...options.waiting }
		if(waitingConfig.autoShow) {
			nWaiting = plus.nativeUI.showWaiting(waitingConfig.title, waitingConfig.options);
		}

		//创建页面
		options = {
			...options,
			id,
			url
		};
		webview = createWindow(options);

		//显示
		nShow = { ...SHOW_OPTIONS, ...options.show }
		if(nShow.autoShow) {
			var showWebview = function() {
				//关闭等待框
				if(nWaiting) {
					nWaiting.close();
				}
				//显示页面
				webview.show(nShow.aniShow, nShow.duration, function() {},nShow.extras);
				options.afterShowMethodName && webview.evalJS(options.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
			};
			//titleUpdate触发时机早于loaded，更换为titleUpdate后，可以更早的显示webview
			webview.addEventListener(nShow.event, showWebview, false);
			//loaded事件发生后，触发预加载和pagebeforeshow事件
			webview.addEventListener("loaded", function() {
				_triggerPreload(webview);
				_trigger(webview, 'pagebeforeshow', false);
			}, false);
		}
	}
	return webview;
}

/**
 * 预加载
 */
const preloadWindow = (options) => {
	//调用预加载函数，不管是否传递preload参数，强制变为true
	return createWindow({ ...options, preload: true});
};

/**
 *关闭当前webview打开的所有webview；
	*/
const closeOpened = function(webview) {
	const opened = webview.opened();
	if(opened) {
		opened.forEach(openedWebview => {
			const open_open = openedWebview.opened();
			if(open_open && open_open.length > 0) {
				//关闭打开的webview
				closeOpened(openedWebview);
				//关闭自己
				openedWebview.close("none");
			} else {
				//如果直接孩子节点，就不用关闭了，因为父关闭的时候，会自动关闭子；
				if(openedWebview.parent() !== webview) {
					openedWebview.close('none');
				}
			}
		})
	}
};

const closeAll = (webview, aniShow) => {
	closeOpened(webview);
	if(aniShow) {
		webview.close(aniShow);
	} else {
		webview.close();
	}
};

/**
 * 批量创建webview
 * @param {type} options
 * @returns {undefined}
 */
const createWindows = (options) => {
	//初始化预加载窗口(创建)和非预加载窗口(仅配置，不创建)
	options.forEach((option) => createWindow(option, false))
}

/**
 * 创建当前页面的子webview
 * @param {type} options
 * @returns {webview}
 */
const appendWebview = (options) => {
	if(!window.plus) {
		return;
	}
	var id = options.id || options.url;
	var webview;
	if(!_webviews[id]) { //保证执行一遍
		//TODO 这里也有隐患，比如某个webview不是作为subpage创建的，而是作为target webview的话；
		if(!plus.webview.getWebviewById(id)) {
			webview = plus.webview.create(options.url, id, options.styles, options.extras);
		}
		//之前的实现方案：子窗口loaded之后再append到父窗口中；
		//问题：部分子窗口loaded事件发生较晚，此时执行父窗口的children方法会返回空，导致父子通讯失败；
		//     比如父页面执行完preload事件后，需触发子页面的preload事件，此时未append的话，就无法触发；
		//修改方式：不再监控loaded事件，直接append
		//by chb@20150521
		// webview.addEventListener('loaded', function() {
		plus.webview.currentWebview().append(webview);
		// });
		_webviews[id] = options;

	}
	return webview;
};

//首次按下back按键的时间
let __back__first = null;
const back = function() {
	if (!window.plus) {
		return false;
	}
	var wobj = plus.webview.currentWebview();
	var parent = wobj.parent();
	if (parent) {
		parent.evalJS('window.Vue && window.VueHtml5Plus && Vue.prototype.$back();');
	} else {
		wobj.canBack(function(e) {
			//by chb 暂时注释，在碰到类似popover之类的锚点的时候，需多次点击才能返回；
			if (e.canBack) { //webview history back
				window.history.back();
			} else { //webview close or hide
				//fixed by fxy 此处不应该用opener判断，因为用户有可能自己close掉当前窗口的opener。这样的话。opener就为空了，导致不能执行close
				if (wobj.id === plus.runtime.appid) { //首页
					//首页不存在opener的情况下，后退实际上应该是退出应用；
					//首次按键，提示‘再按一次退出应用’
					if (!__back__first) {
						__back__first = Date.now();
						nativeUI.toast('再按一次退出应用');
						setTimeout(function() {
							__back__first = null;
						}, 2000);
					} else {
						if (Date.now() - __back__first < 2000) {
							plus.runtime.quit();
						}
					}
				} else { //其他页面，
					if (wobj.preload) {
						wobj.hide("auto");
					} else {
						//关闭页面时，需要将其打开的所有子页面全部关闭；
						closeAll(wobj);
					}
				}
			}
		});
	}
	return true;
}

export default {
	preloadWindow,
	createWindow,
	createWindows,
	openWindow,
	closeOpened,
	closeAll,
	appendWebview,
	trigger,
	fire,
	dispatchFire,
	receive,
	back,
}  