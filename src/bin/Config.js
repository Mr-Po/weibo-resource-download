/*jshint esversion: 8 */

class Config {

    /********************* ↓ 用户可配置区域 ↓ *********************/

    /**
     * 媒体类型
     * 【不推荐】直接在此修改数据，应前往【储存】中修改。
     *
     * 此方法的返回值，影响资源名称中的 @mdeia_type 参数值
     */
    static get mediaType() {

        return Config.getValue("mediaType", () => {
            return {
                picture: "P",
                livePhoto: "L",
                video: "V"
            };
        });
    }

    /**
     * 得到资源名称
     * 【不推荐】直接在此修改数据，应前往【储存】中修改。
     * 
     * 此方法的返回值，影响资源名称
     *
     * 默认的：${wb_user_name}-${wb_id}-${no}
     * 会生成：小米商城-4375413591293810-01
     * 
     * 若改为：微博-${media_type}-${wb_user_name}-${wb_id}-${no}
     * 会生成：微博-P-小米商城-4375413591293810-01
     * 
     * @param  {字符串} wb_user_name 微博用户名（如：小米商城）
     * @param  {字符串} wb_user_id   微博用户ID（如：5578564422）
     * @param  {字符串} wb_id        微博ID（如：4375413591293810）
     * @param  {字符串} wb_url       微博地址（如：1871821935_Ilt7yCnvt）https://weibo.com/
     * @param  {字符串} resource_id  资源原始名称（如：0065x5rwly1g3c6exw0a2j30u012utyg）
     * @param  {字符串} no           序号（如：01）
     * @param  {字符串} mdeia_type   媒体类型（如：P）
     * @param  {字符串} wb_root_user_name  微博根用户名
     * @param  {字符串} wb_root_user_id    微博根用户ID
     * @param  {字符串} wb_root_url        微博根链接
     * @param  {字符串} wb_root_id         微博根ID
     * 
     * @return {字符串}              由以上字符串组合而成的名称
     */
    static getResourceName(wb_user_name, wb_user_id, wb_id, wb_url,
        resource_id, no, mdeia_type,
        wb_root_user_name, wb_root_user_id, wb_root_url, wb_root_id) {

        const template = Config.getValue("resourceName",
            () => "{{wb_root_user_name}}-{{wb_root_id}}-{{no}}"
        );

        return Mustache.render(template, {
            wb_user_name: wb_user_name,
            wb_user_id: wb_user_id,
            wb_id: wb_id,
            wb_url: wb_url,
            resource_id: resource_id,
            no: no,
            mdeia_type: mdeia_type,
            wb_root_user_name: wb_root_user_name,
            wb_root_user_id: wb_root_user_id,
            wb_root_url: wb_root_url,
            wb_root_id: wb_root_id
        });
    }

    /**
     * 得到打包名称
     * 【不推荐】直接在此修改数据，应前往【储存】中修改。
     * 
     * 此方法的返回值，影响打包名称
     *
     * 默认的：${wb_user_name}-${wb_id}
     * 会生成：小米商城-4375413591293810
     *
     * 若改为：压缩包-${wb_user_name}-${wb_id}
     * 会生成：压缩包-小米商城-4375413591293810
     * 
     * 
     * @param  {字符串} wb_user_name 微博用户名（如：小米商城）
     * @param  {字符串} wb_user_id   微博用户ID（如：5578564422）
     * @param  {字符串} wb_id        微博ID（如：4375413591293810）
     * @param  {字符串} wb_url       微博地址（如：1871821935_Ilt7yCnvt）
     * @param  {字符串} wb_root_user_name  微博根用户名
     * @param  {字符串} wb_root_user_id    微博根用户ID
     * @param  {字符串} wb_root_url        微博根链接
     * @param  {字符串} wb_root_id         微博根ID
     * 
     * @return {字符串}              由以上字符串组合而成的名称
     */
    static getZipName(wb_user_name, wb_user_id, wb_id, wb_url,
        wb_root_user_name, wb_root_user_id, wb_root_url, wb_root_id) {

        const template = Config.getValue("zipName",
            () => "{{wb_root_user_name}}-{{wb_root_id}}"
        );

        return Mustache.render(template, {
            wb_user_name: wb_user_name,
            wb_user_id: wb_user_id,
            wb_id: wb_id,
            wb_url: wb_url,
            wb_root_user_name: wb_root_user_name,
            wb_root_user_id: wb_root_user_id,
            wb_root_url: wb_root_url,
            wb_root_id: wb_root_id
        });
    }

    /**
     * 最大等待请求时间（超时时间），单位：毫秒
     *【不推荐】直接在此修改数据，应前往【储存】中修改。
     * 
     * 若经常请求超时，可适当增大此值
     * 
     * @type {Number}
     */
    static get maxRequestTime() {

        return Config.getValue("maxRequestTime", () => 8000);
    }

    /**
     * 每隔 space 毫秒检查一次，是否有新的微博被加载出来
     *【不推荐】直接在此修改数据，应前往【储存】中修改。
     * 
     * 此值越小，检查越快；过小会造成浏览器卡顿
     * @type {Number}
     */
    static get space() {

        return Config.getValue("space", () => 5000);
    }

    /********************* ↑ 用户可配置区域 ↑ *********************/

    /**
     * 是否启用调试模式
     * 【不推荐】直接在此修改数据，应前往【储存】中修改。
     * 
     * 启用后，浏览器控制台会显示此脚本运行时的调试数据
     * @type {Boolean}[true/false]
     */
    static get isDebug() {

        return JSON.parse(Config.getValue("debug", () => false));
    }

    /**
     * 已添加增强扩展的item，会追加此类
     * 【不推荐】直接在此修改数据，应前往【储存】中修改。
     * 
     * @type 字符串
     */
    static get handledWeiBoCardClass() {

        return Config.getValue("handledWeiBoCardClass", () => "weibo_383402_extend");
    }

    /**
     * 得到值
     * @param  {字符串} name 键
     * @param  {方法} fun    缺省产生值的方法
     * @return {值}         值
     */
    static getValue(name, fun) {

        let value = Config.properties[name];

        // 本地map中不存在
        if (!value) {

            value = GM_getValue(name, null);

            // 储存中也不存在
            if (!value) {

                value = fun();
                GM_setValue(name, value);
            }

            // 记录到本地map中
            Config.properties[name] = value;
        }

        return value;
    }
}

Config.properties = new Map();