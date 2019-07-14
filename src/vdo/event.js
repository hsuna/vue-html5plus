import webview from '../vhp/webview'

let _gestures = {
	handler: [],
	session: {}
}

const isTouchable = 'ontouchstart' in window
const EVENT_START = isTouchable ? 'touchstart' : 'mousedown'
const EVENT_MOVE = isTouchable ? 'touchmove' : 'mousemove'
const EVENT_END = isTouchable ? 'touchend' : 'mouseup'
const EVENT_CANCEL = 'touchcancel'

const round = Math.round;
const abs = Math.abs;
const sqrt = Math.sqrt;
const atan = Math.atan;
const atan2 = Math.atan2;

/**
 * distance
 * @param {type} p1
 * @param {type} p2
 * @returns {Number}
 */
const getDistance = function(p1, p2, props) {
	if(!props) {
		props = ['x', 'y'];
	}
	var x = p2[props[0]] - p1[props[0]];
	var y = p2[props[1]] - p1[props[1]];
	return sqrt((x * x) + (y * y));
};
/**
 * scale
 * @param {Object} starts
 * @param {Object} moves
 */
const getScale = function(starts, moves) {
	if(starts.length >= 2 && moves.length >= 2) {
		var props = ['pageX', 'pageY'];
		return getDistance(moves[1], moves[0], props) / getDistance(starts[1], starts[0], props);
	}
	return 1;
};
/**
 * angle
 * @param {type} p1
 * @param {type} p2
 * @returns {Number}
 */
const getAngle = function(p1, p2, props) {
	if(!props) {
		props = ['x', 'y'];
	}
	var x = p2[props[0]] - p1[props[0]];
	var y = p2[props[1]] - p1[props[1]];
	return atan2(y, x) * 180 / Math.PI;
};
/**
 * direction
 * @param {Object} x
 * @param {Object} y
 */
const getDirection = function(x, y) {
	if(x === y) {
		return '';
	}
	if(abs(x) >= abs(y)) {
		return x > 0 ? 'left' : 'right';
	}
	return y > 0 ? 'up' : 'down';
};
/**
 * rotation
 * @param {Object} start
 * @param {Object} end
 */
const getRotation = function(start, end) {
	var props = ['pageX', 'pageY'];
	return getAngle(end[1], end[0], props) - getAngle(start[1], start[0], props);
};
/**
 * px per ms
 * @param {Object} deltaTime
 * @param {Object} x
 * @param {Object} y
 */
const getVelocity = function(deltaTime, x, y) {
	return {
		x: x / deltaTime || 0,
		y: y / deltaTime || 0
	};
};
/**
 * detect gestures
 * @param {type} event
 * @param {type} touch
 * @returns {undefined}
 */
const detect = function(event, touch) {
	Object.keys(_gestures.handler).forEach(name => {
		if(_gestures.handler[name]) {
			_gestures.handler[name](event, touch);
		}
	})
};
/**
 * 暂时无用
 * @param {Object} node
 * @param {Object} parent
 */
var hasParent = function(node, parent) {
	while(node) {
		if(node == parent) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
};
const uniqueArray = function(src, key, sort) {
	var results = [];
	var values = [];
	var i = 0;

	while(i < src.length) {
		var val = key ? src[i][key] : src[i];
		if(values.indexOf(val) < 0) {
			results.push(src[i]);
		}
		values[i] = val;
		i++;
	}

	if(sort) {
		if(!key) {
			results = results.sort();
		} else {
			results = results.sort(function sortUniqueArray(a, b) {
				return a[key] > b[key];
			});
		}
	}

	return results;
};

var getMultiCenter = function(touches) {
	var touchesLength = touches.length;
	if(touchesLength === 1) {
		return {
			x: round(touches[0].pageX),
			y: round(touches[0].pageY)
		};
	}

	var x = 0;
	var y = 0;
	var i = 0;
	while(i < touchesLength) {
		x += touches[i].pageX;
		y += touches[i].pageY;
		i++;
	}

	return {
		x: round(x / touchesLength),
		y: round(y / touchesLength)
	};
};

var multiTouch = function() {
	return false;
	//return $.options.gestureConfig.pinch;
};

const copySimpleTouchData = function(touch) {
	var touches = [];
	var i = 0;
	while(i < touch.touches.length) {
		touches[i] = {
			pageX: round(touch.touches[i].pageX),
			pageY: round(touch.touches[i].pageY)
		};
		i++;
	}
	return {
		timestamp: Date.now(),
		gesture: touch.gesture,
		touches: touches,
		center: getMultiCenter(touch.touches),
		deltaX: touch.deltaX,
		deltaY: touch.deltaY
	};
};

const calDelta = function(touch) {
	var session = _gestures.session;
	var center = touch.center;
	var offset = session.offsetDelta || {};
	var prevDelta = session.prevDelta || {};
	var prevTouch = session.prevTouch || {};

	if(touch.gesture.type === EVENT_START || touch.gesture.type === EVENT_END) {
		prevDelta = session.prevDelta = {
			x: prevTouch.deltaX || 0,
			y: prevTouch.deltaY || 0
		};

		offset = session.offsetDelta = {
			x: center.x,
			y: center.y
		};
	}
	touch.deltaX = prevDelta.x + (center.x - offset.x);
	touch.deltaY = prevDelta.y + (center.y - offset.y);
}

const calTouchData = function(touch) {
	var session = _gestures.session;
	var touches = touch.touches;
	var touchesLength = touches.length;

	if(!session.firstTouch) {
		session.firstTouch = copySimpleTouchData(touch);
	}

	if(multiTouch() && touchesLength > 1 && !session.firstMultiTouch) {
		session.firstMultiTouch = copySimpleTouchData(touch);
	} else if(touchesLength === 1) {
		session.firstMultiTouch = false;
	}

	var firstTouch = session.firstTouch;
	var firstMultiTouch = session.firstMultiTouch;
	var offsetCenter = firstMultiTouch ? firstMultiTouch.center : firstTouch.center;

	var center = touch.center = getMultiCenter(touches);
	touch.timestamp = Date.now();
	touch.deltaTime = touch.timestamp - firstTouch.timestamp;

	touch.angle = getAngle(offsetCenter, center);
	touch.distance = getDistance(offsetCenter, center);

	calDelta(touch);

	touch.offsetDirection = getDirection(touch.deltaX, touch.deltaY);

	touch.scale = firstMultiTouch ? getScale(firstMultiTouch.touches, touches) : 1;
	touch.rotation = firstMultiTouch ? getRotation(firstMultiTouch.touches, touches) : 0;

	calIntervalTouchData(touch);

};

const CAL_INTERVAL = 25;
const calIntervalTouchData = function(touch) {
	var session = _gestures.session;
	var last = session.lastInterval || touch;
	var deltaTime = touch.timestamp - last.timestamp;
	var velocity;
	var velocityX;
	var velocityY;
	var direction;

	if(touch.gesture.type != EVENT_CANCEL && (deltaTime > CAL_INTERVAL || last.velocity === undefined)) {
		var deltaX = last.deltaX - touch.deltaX;
		var deltaY = last.deltaY - touch.deltaY;

		var v = getVelocity(deltaTime, deltaX, deltaY);
		velocityX = v.x;
		velocityY = v.y;
		velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
		direction = getDirection(deltaX, deltaY) || last.direction;

		session.lastInterval = touch;
	} else {
		velocity = last.velocity;
		velocityX = last.velocityX;
		velocityY = last.velocityY;
		direction = last.direction;
	}

	touch.velocity = velocity;
	touch.velocityX = velocityX;
	touch.velocityY = velocityY;
	touch.direction = direction;
};

let targetIds = {};
const convertTouches = function(touches) {
	touches['identifier'] = touches['identifier'] || 0
	return touches;
};

const getTouches = function(event, touch) {
	var allTouches = convertTouches(event.touches ? [...event.touches] : [event]);

	var type = event.type;

	var targetTouches = [];
	var changedTargetTouches = [];

	//当touchstart或touchmove且touches长度为1，直接获得all和changed
	if((type === EVENT_START || type === EVENT_MOVE) && allTouches.length === 1) {
		targetIds[allTouches[0].identifier] = true;
		targetTouches = allTouches;
		changedTargetTouches = allTouches;
		touch.target = event.target;
	} else {
		var i = 0;
		var targetTouches = [];
		var changedTargetTouches = [];
		var changedTouches = convertTouches(event.touches ? [...event.changedTouches] : [event]);

		touch.target = event.target;
		var sessionTarget = _gestures.session.target || event.target;
		targetTouches = allTouches.filter(function(touch) {
			return hasParent(touch.target, sessionTarget);
		});

		if(type === EVENT_START) {
			i = 0;
			while(i < targetTouches.length) {
				targetIds[targetTouches[i].identifier] = true;
				i++;
			}
		}

		i = 0;
		while(i < changedTouches.length) {
			if(targetIds[changedTouches[i].identifier]) {
				changedTargetTouches.push(changedTouches[i]);
			}
			if(type === EVENT_END || type === EVENT_CANCEL) {
				delete targetIds[changedTouches[i].identifier];
			}
			i++;
		}

		if(!changedTargetTouches.length) {
			return false;
		}
	}
	targetTouches = uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true);
	var touchesLength = targetTouches.length;
	var changedTouchesLength = changedTargetTouches.length;
	if(type === EVENT_START && touchesLength - changedTouchesLength === 0) { //first
		touch.isFirst = true;
		_gestures.touch = _gestures.session = {
			target: event.target
		};
	}
	touch.isFinal = ((type === EVENT_END || type === EVENT_CANCEL) && (touchesLength - changedTouchesLength === 0));

	touch.touches = targetTouches;
	touch.changedTouches = changedTargetTouches;
	return true;

};

const handleTouchEvent = function(event) {
	var touch = {
		gesture: event
	};
	var touches = getTouches(event, touch);
	if(!touches) {
		return;
	}
	calTouchData(touch);
	detect(event, touch);
	_gestures.session.prevTouch = touch;
	if(event.type === EVENT_END && !isTouchable) {
		_gestures.touch = _gestures.session = {};
	}
};

const supportsPassive = (function checkPassiveListener() {
	var supportsPassive = false;
	try {
		var opts = Object.defineProperty({}, 'passive', {
			get: function get() {
				supportsPassive = true;
			},
		});
		window.addEventListener('testPassiveListener', null, opts);
	} catch(e) {
		// No support
	}
	return supportsPassive;
}())

window.addEventListener(EVENT_START, handleTouchEvent);
window.addEventListener(EVENT_MOVE, handleTouchEvent, supportsPassive ? {
	passive: false,
	capture: false
} : false);
window.addEventListener(EVENT_END, handleTouchEvent);
window.addEventListener(EVENT_CANCEL, handleTouchEvent);

const directive = (type, handle) => {
	_gestures.handler[type] = handle
	return {
		bind(el,binding) {
			el.handler = function () {
			    const value = binding.value;
				if (!value && el.href && !binding.modifiers.prevent) {
				return window.location = el.href;
				}
				value.event = e;
				value.methods.call(this, value);
			};
			el.addEventListener(type, function (e) {
				binding.modifiers.stop && e.stopPropagation();
                binding.modifiers.prevent && e.preventDefault();
                el.handler();
			})
		},
		componentUpdated(el,binding) {
			el.handler = function () {
			    const value = binding.value;
				if (!value && el.href && !binding.modifiers.prevent) {
				return window.location = el.href;
				}
				value.event = e;
				value.methods.call(this, value);
			};
		},
		unbind (el) {
			// 卸载
			el.handler = () => {};
		}
	}
}

/**
 * mui gesture flick[left|right|up|down]
 * @param {type} $
 * @param {type} name
 * @returns {undefined}
 */
export const flick = (function(){
	const FLICK_MAX_TIME = 200
	const FLICK_MIN_DISTINCE = 10

	var flickStartTime = 0;
	return directive('flick', function(event, touch) {
		var session = _gestures.session;
		var now = Date.now();
		switch (event.type) {
			case EVENT_MOVE:
				if (now - flickStartTime > 300) {
					flickStartTime = now;
					session.flickStart = touch.center;
				}
				break;
			case EVENT_END:
			case EVENT_CANCEL:
				touch.flick = false;
				if (session.flickStart && FLICK_MAX_TIME > (now - flickStartTime) && touch.distance > FLICK_MIN_DISTINCE) {
					touch.flick = true;
					touch.flickTime = now - flickStartTime;
					touch.flickDistanceX = touch.center.x - session.flickStart.x;
					touch.flickDistanceY = touch.center.y - session.flickStart.y;
					webview.trigger(session.target, name, touch);
					webview.trigger(session.target, name + touch.direction, touch);
				}
				break;
		}
	})
})()

/**
 * mui gesture tap and doubleTap
 * @param {type} $
 * @param {type} name
 * @returns {undefined}
 */
export const tap = (function(){
	const TAP_MAX_INTERVAL = 300;
	const TAP_MAX_DISTANCE = 5;
	const TAP_MAX_TIME = 250;
	
	var lastTarget;
	var lastTapTime;
	return directive('tap', function(event, touch) {
		var session = _gestures.session;
		switch (event.type) {
			case EVENT_END:
				if (!touch.isFinal) {
					return;
				}
				var target = session.target;
				if (!target || (target.disabled || (target.classList && target.classList.contains('mui-disabled')))) {
					return;
				}
				if (touch.distance < TAP_MAX_DISTANCE && touch.deltaTime < TAP_MAX_TIME) {
					if (_gestures.handler.doubletap && lastTarget && (lastTarget === target)) { //same target
						if (lastTapTime && (touch.timestamp - lastTapTime) < TAP_MAX_INTERVAL) {
							webview.trigger(target, 'doubletap', touch);
							lastTapTime = Date.now();
							lastTarget = target;
							return;
						}
					}
					webview.trigger(target, name, touch);
					lastTapTime = Date.now();
					lastTarget = target;
				}
				break;
		}
	})
})();
export const doubletap = (function(){
	return directive('doubletap', _gestures.handler['tap'])
})

/**
 * mui gesture longtap
 * @param {type} $
 * @param {type} name
 * @returns {undefined}
 */
export const longtap = (function(){
	const HOLD_TIMEOUT = 500
	const HOLD_THRESHOLD = 2
	var timer;
	return directive('longtap', function(event, touch) {
		var session = _gestures.session;
		switch (event.type) {
			case EVENT_START:
				clearTimeout(timer);
				timer = setTimeout(function() {
					webview.trigger(session.target, name, touch);
				}, HOLD_TIMEOUT);
				break;
			case EVENT_MOVE:
				if (touch.distance > HOLD_THRESHOLD) {
					clearTimeout(timer);
				}
				break;
			case EVENT_END:
			case EVENT_CANCEL:
				clearTimeout(timer);
				break;
		}
	})
})()