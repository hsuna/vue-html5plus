/**
 * Created by Administrator on 2019/7/13.
 */
import os from './os'
import _ from '../utils'

var jsonType = 'application/json';
var htmlType = 'text/html';
var scriptTypeRE = /^(?:text|application)\/javascript/i;
var xmlTypeRE = /^(?:text|application)\/xml/i;
var blankRE = /^\s*$/;
var _noop = () => {}

var ajaxBeforeSend = function(xhr, settings) {
    var context = settings.context
    if(settings.beforeSend.call(context, xhr, settings) === false) {
        return false;
    }
};
var ajaxSuccess = function(data, xhr, settings) {
    settings.success.call(settings.context, data, 'success', xhr);
    ajaxComplete('success', xhr, settings);
};
// type: "timeout", "error", "abort", "parsererror"
var ajaxError = function(error, type, xhr, settings) {
    settings.error.call(settings.context, xhr, type, error);
    ajaxComplete(type, xhr, settings);
};
// status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
var ajaxComplete = function(status, xhr, settings) {
    settings.complete.call(settings.context, xhr, status);
};

var serialize = function(params, obj, traditional, scope) {
    var type, array = _.isArray(obj),
        hash = _.isPlainObject(obj);
    Object.keys(obj).forEach(key => {
        let value = obj[key]  
        type = _.type(value);
        if(scope) {
            key = traditional ? scope :
                scope + '[' + (hash || type === 'object' || type === 'array' ? key : '') + ']';
        }
        // handle data in serializeArray() format
        if(!scope && array) {
            params.add(value.name, value.value);
        }
        // recurse into nested objects
        else if(type === "array" || (!traditional && type === "object")) {
            serialize(params, value, traditional, key);
        } else {
            params.add(key, value);
        }
    })
};
var serializeData = function(options) {
    if(options.processData && options.data && typeof options.data !== "string") {
        var contentType = options.contentType;
        if(!contentType && options.headers) {
            contentType = options.headers['Content-Type'];
        }
        if(contentType && ~contentType.indexOf(jsonType)) { //application/json
            options.data = JSON.stringify(options.data);
        } else {
            options.data = param(options.data, options.traditional);
        }
    }
    if(options.data && (!options.type || options.type.toUpperCase() === 'GET')) {
        options.url = appendQuery(options.url, options.data);
        options.data = undefined;
    }
};
var appendQuery = function(url, query) {
    if(query === '') {
        return url;
    }
    return(url + '&' + query).replace(/[&?]{1,2}/, '?');
};
var mimeToDataType = function(mime) {
    if(mime) {
        mime = mime.split(';', 2)[0];
    }
    return mime && (mime === htmlType ? 'html' :
        mime === jsonType ? 'json' :
        scriptTypeRE.test(mime) ? 'script' :
        xmlTypeRE.test(mime) && 'xml') || 'text';
};
var parseArguments = function(url, data, success, dataType) {
    if(_.isFunction(data)) {
        dataType = success, success = data, data = undefined;
    }
    if(!_.isFunction(success)) {
        dataType = success, success = undefined;
    }
    return {
        url: url,
        data: data,
        success: success,
        dataType: dataType
    };
};

const originAnchor = document.createElement('a');
originAnchor.href = window.location.href;
let ajaxSettings = {
    type: 'GET',
    beforeSend: _noop,
    success: _noop,
    error: _noop,
    complete: _noop,
    context: null,
    xhr: function(settings) {
        if (settings.crossDomain) { //强制使用plus跨域
            return new plus.net.XMLHttpRequest();
        }
        //仅在webview的url为远程文件，且ajax请求的资源不同源下使用plus.net.XMLHttpRequest
        if (originAnchor.protocol !== 'file:') {
            var urlAnchor = document.createElement('a');
            urlAnchor.href = settings.url;
            urlAnchor.href = urlAnchor.href;
            settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
            if (settings.crossDomain) {
                return new plus.net.XMLHttpRequest();
            }
        }
        if (os.ios && window.webkit && window.webkit.messageHandlers) { //wkwebview下同样使用5+ xhr
            return new plus.net.XMLHttpRequest();
        }
        return new window.XMLHttpRequest();
    },
    accepts: {
        script: 'text/javascript, application/javascript, application/x-javascript',
        json: jsonType,
        xml: 'application/xml, text/xml',
        html: htmlType,
        text: 'text/plain'
    },
    timeout: 0,
    processData: true,
    cache: true
};

const ajax = function(url, options) {
    if(typeof url === "object") {
        options = url;
        url = undefined;
    }
    var settings = options || {};
    settings.url = url || settings.url;
    settings = { ...ajaxSettings, ...settings }

    serializeData(settings);
    var dataType = settings.dataType;

    if(settings.cache === false || ((!options || options.cache !== true) && ('script' === dataType))) {
        settings.url = appendQuery(settings.url, '_=' + Date.now());
    }
    var mime = settings.accepts[dataType && dataType.toLowerCase()];
    var headers = {};
    var setHeader = function(name, value) {
        headers[name.toLowerCase()] = [name, value];
    };
    var protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol;
    var xhr = settings.xhr(settings);
    var nativeSetHeader = xhr.setRequestHeader;
    var abortTimeout;

    setHeader('X-Requested-With', 'XMLHttpRequest');
    setHeader('Accept', mime || '*/*');
    if(!!(mime = settings.mimeType || mime)) {
        if(mime.indexOf(',') > -1) {
            mime = mime.split(',', 2)[0];
        }
        xhr.overrideMimeType && xhr.overrideMimeType(mime);
    }
    if(settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() !== 'GET')) {
        setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');
    }
    if(settings.headers) {
        for(var name in settings.headers)
            setHeader(name, settings.headers[name]);
    }
    xhr.setRequestHeader = setHeader;

    xhr.onreadystatechange = function() {
        if(xhr.readyState === 4) {
            xhr.onreadystatechange = __noop;
            clearTimeout(abortTimeout);
            var result, error = false;
            var isLocal = protocol === 'file:';
            if((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || (xhr.status === 0 && isLocal && xhr.responseText)) {
                dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));
                result = xhr.responseText;
                try {
                    // http://perfectionkills.com/global-eval-what-are-the-options/
                    if(dataType === 'script') {
                        (1, eval)(result);
                    } else if(dataType === 'xml') {
                        result = xhr.responseXML;
                    } else if(dataType === 'json') {
                        result = blankRE.test(result) ? null : parseJSON(result);
                    }
                } catch(e) {
                    error = e;
                }

                if(error) {
                    ajaxError(error, 'parsererror', xhr, settings);
                } else {
                    ajaxSuccess(result, xhr, settings);
                }
            } else {
                var status = xhr.status ? 'error' : 'abort';
                var statusText = xhr.statusText || null;
                if(isLocal) {
                    status = 'error';
                    statusText = '404';
                }
                ajaxError(statusText, status, xhr, settings);
            }
        }
    };
    if(ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort();
        ajaxError(null, 'abort', xhr, settings);
        return xhr;
    }

    if(settings.xhrFields) {
        for(var name in settings.xhrFields) {
            xhr[name] = settings.xhrFields[name];
        }
    }

    var async = 'async' in settings ? settings.async : true;

    xhr.open(settings.type.toUpperCase(), settings.url, async, settings.username, settings.password);

    for(var name in headers) {
        if(headers.hasOwnProperty(name)) {
            nativeSetHeader.apply(xhr, headers[name]);
        }
    }
    if(settings.timeout > 0) {
        abortTimeout = setTimeout(function() {
            xhr.onreadystatechange = _noop;
            xhr.abort();
            ajaxError(null, 'timeout', xhr, settings);
        }, settings.timeout);
    }
    xhr.send(settings.data ? settings.data : null);
    return xhr;
}

const param = function(obj, traditional) {
    var params = [];
    params.add = function(k, v) {
        this.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    };
    serialize(params, obj, traditional);
    return params.join('&').replace(/%20/g, '+');
}

const get = function( /* url, data, success, dataType */ ) {
    return ajax(parseArguments.apply(null, arguments));
}

const post = function( /* url, data, success, dataType */ ) {
    var options = parseArguments.apply(null, arguments);
    options.type = 'POST';
    return ajax(options);
}

const getJSON = function( /* url, data, success */ ) {
    var options = parseArguments.apply(null, arguments);
    options.dataType = 'json';
    return ajax(options);
}

export default {
    ajaxSettings,
    ajax,
	param,
    get,
    post,
    getJSON
}