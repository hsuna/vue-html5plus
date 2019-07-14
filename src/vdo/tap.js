export default {
    bind: function (el, binding) {
        const isTouch = "ontouchend" in document;
        el.handler = function (e) {

            const value = binding.value;
            if (!value && el.href && !binding.modifiers.prevent) {
              return window.location = el.href;
            }
            value.event = e;
            value.methods.call(this, value);
        };
        if (isTouch) {
            //touchstart
            el.addEventListener('touchstart', function (e) {
                binding.modifiers.stop && e.stopPropagation();
                binding.modifiers.prevent && e.preventDefault();

                var t = e.touches[0];
                el.startX = t.clientX;
                el.startY = t.clientY;
                el.sTime = + new Date;
            });
            //touchend
            el.addEventListener('touchend', function (e) {
                binding.modifiers.stop && e.stopPropagation();
                binding.modifiers.prevent && e.preventDefault();

                var t = e.changedTouches[0];
                el.endX = t.clientX;
                el.endY = t.clientY;
                if((+ new Date)-el.sTime<300){
                    if(Math.abs(el.endX-el.startX)+Math.abs(el.endY-el.startY)<20){
                        e.preventDefault();
                        el.handler();
                    }
                }
            });
        }else {
            //click
            el.addEventListener('click', function (e) {
                binding.modifiers.stop && e.stopPropagation();
                binding.modifiers.prevent && e.preventDefault();
                el.handler();
            });
        }
    },
    componentUpdated : function(el,binding) {
        el.handler = function () {
            var data = binding.value;
            data[0].apply(this, data.slice(1));
        };
    },
    unbind: function (el) {
        // 卸载
        el.handler = function () {};
    }
}