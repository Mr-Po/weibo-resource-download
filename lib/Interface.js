/*jshint esversion: 6 */

/**
 * 接口
 */
class Interface {

    /**
     * 构造函数
     * @param  {字符串} name    接口名
     * @param  {字符串数组} methods 该接口所包含的所有方法
     */
    constructor(name, methods) {

        //判断接口的参数个数(第一个为接口对象,第二个为参数数组)
        if (arguments.length != 2) {
            throw new Error('创建的接口对象参数必须为两个,第二个为方法数组！');
        }

        // 判断第二个参数是否为数组
        if(!Array.isArray(methods)){
            throw new Error('参数2必须为字符串数组！');
        }

        //接口对象引用名
        this.name = name;

        //自己的属性
        this.methods = []; //定义一个内置的空数组对象 等待接受methods里的元素（方法名称）

        //判断数组是否中的元素是否为string的字符串
        for (var i = 0; i < methods.length; i++) {

            //判断方法数组里面是否为string(字符串)的属性
            if (typeof methods[i] != 'string') {
                throw new Error('方法名必须是string类型的!');
            }

            //把他放在接口对象中的methods中(把接口方法名放在Interface对象的数组中)
            this.methods.push(methods[i]);
        }
    }

    /**
     * 实现
     * @param  {对象} obj 待实现接口的对象
     * @param  {接口} I 接口对象
     * @param  {对象} proxy 接口的实现
     * @return {对象}           扩展后的当前对象
     */
    static impl(obj, I, proxy) {

        if (I.constructor != Interface) {
            throw new Error("参数2不是一个接口！");
        }

        // 校验实现是否实现了接口的每一个方法
        for (var i = 0; i < I.methods.length; i++) {

            // 方法名
            var methodName = I.methods[i];

            //判断obj中是否实现了接口的方法和methodName是方法(而不是属性)
            if (!proxy[methodName] || typeof proxy[methodName] != 'function') {
                throw new Error('有接口的方法没实现');
            }

            // 将代理中的方法渡给obj
            obj[methodName] = proxy[methodName];
        }
    }
}