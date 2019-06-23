/*jshint esversion: 6 */

class Config {

    /********************* ↓ 用户可配置区域 ↓ *********************/

    /**
     * 媒体类型
     *
     * 可通过修改此间数据，影响资源名称中的 @mdeia_type 参数
     */
    static get mediaType() {
        return {
            picture: "P",
            livePhoto: "L",
            video: "V"
        };
    }

    /**
     * 得到资源名称
     * 
     * @param  {字符串} wb_user_name 微博用户名
     * @param  {字符串} wb_user_id   微博用户ID
     * @param  {字符串} wb_id        微博ID
     * @param  {字符串} resource_id  资源原始名称
     * @param  {字符串} no           序号
     * @param  {字符串} mdeia_type   媒体类型
     * 
     * @return {字符串}              由以上字符串组合而成的名称
     */
    static getResourceName(wb_user_name, wb_user_id, wb_id, resource_id, no,mdeia_type) {
        return `${wb_user_name}-${wb_id}-${no}`;
    }

    /**
     * 得到打包名称
     * 
     * @param  {字符串} wb_user_name 微博用户名
     * @param  {字符串} wb_user_id   微博用户ID
     * @param  {字符串} wb_id        微博ID
     * 
     * @return {字符串}              由以上字符串组合而成的名称
     */
    static getZipName(wb_user_name, wb_user_id, wb_id) {
        return `${wb_user_name}-${wb_id}`;
    }

    /**
     * 最大等待请求时间（超时时间），单位：毫秒
     * 若经常请求超时，可适当增大此值
     * 
     * @type {Number}
     */
    static get maxRequestTime() {
        return 8000;
    }

    /**
     * 每隔 space 毫秒检查一次，是否有新的微博被加载出来
     * 此值越小，检查越快；过小会造成浏览器卡顿
     * @type {Number}
     */
    static get space() {
        return 5000;
    }

    /********************* ↑ 用户可配置区域 ↑ *********************/

    // TODO 直播回放

    /**
     * 是否启用调试模式
     * 启用后，浏览器控制台会显示此脚本运行时的调试数据
     * @type {Boolean}
     */
    static get isDebug() {
        return false;
    }

    /**
     * 已添加增强扩展的item，会追加此类
     * @type 字符串
     */
    static get handledWeiBoCardClass() {
        return "weibo_383402_extend";
    }
}