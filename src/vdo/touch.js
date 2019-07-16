import 'tocca'

const getHandler = (binding, vnode) => event => {
    if('function' === typeof binding.value) {
        binding.value.bind(vnode.context)(event)
    } else {
        let expression = ''
        let beg = ["'", '`', '"'].indexOf(binding.expression[0]) ? 1 : 0
        let count = ["'", '`', '"'].includes(binding.expression[binding.expression.length -1]) ? binding.expression.length -1 : binding.expression.length
        expression = binding.expression.replace(/^['"`]?(.*)['"`]?$/, '$1')
        new Function(expression).bind(vnode.context)(event)
    }
}

export default Vue => ({
    bind(el,binding,vnode){
        el.handler = getHandler(binding, vnode)
        el.addEventListener(binding.arg, function (e) {
            binding.modifiers.stop && e.stopPropagation();
            binding.modifiers.prevent && e.preventDefault();

            el.handler(e)
        });
    },
    update(el,binding,vnode){
        el.handler = getHandler(binding, vnode)
    },
    unbind(el){
        el.handler = () => {}
    }
})