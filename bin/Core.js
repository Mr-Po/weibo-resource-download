/*jshint esversion: 6 */

/**
 * 核心
 */
class Core {

    /**
     * 处理微博卡片
     */
    static handleWeiBoCard() {

        // 查找未被扩展的box
        const $uls = Core.getWeiBoResolver().getOperationList();

        if ($uls.length > 0) {

            console.info(`找到未扩展的box：${$uls.length}`);

            $uls.each(function(i, it) {

                PictureHandler.handlePictureIfNeed($(it));

                VideoHandler.handleVideoIfNeed($(it));
            });

            // 批量给这些box添加已扩展标记
            $uls.addClass(Config.handledWeiBoCardClass);
        }
    }

    /**
     * 得到微博解析器
     */
    static getWeiBoResolver() {

        let resolver;

        // 微博搜索
        if (window.location.href.indexOf("https://s.weibo.com") === 0) {

            resolver = SearchWeiBoResolver;

        } else { // 我的微博、他人微博、我的收藏、热门微博

            resolver = MyWeiBoResolver;
        }

        return resolver;
    }

    /**
     * 添加按钮
     * @param  {$标签对象} $ul  操作列表
     * @param  {字符串} name 按钮名称
     * @param  {方法} op   按钮操作
     */
    static putButton($ul, name, op) {

        const $li = $(`<li><a href='javascript:void(0)'>—> ${name} <—</a></li>`);

        $li.click(op);

        $ul.append($li);
    }

    /**
     * 处理拷贝
     * 
     * @param  {$对象} $ul    操作列表
     * @param  {$数组} $links Link数组
     */
    static handleCopy($ul, $links) {

        Core.putButton($ul, "复制资源链接", function() {

            const link = $links.get().map(function(it, i) {
                return it.src;
            }).join("\n");

            GM_setClipboard(link, "text");

            Tip.success("链接地址已复制到剪贴板！");
        });
    }

    /**
     * 得到打包名称
     * 
     * @param  {$标签对象} $ul      操作列表
     * @return {字符串}             压缩包名称(不含后缀)
     */
    static getZipName($ul) {

        const weiBoResolver = Core.getWeiBoResolver();

        const wb_user_name = weiBoResolver.getWeiBoUserName($ul);
        const wb_user_id = weiBoResolver.getWeiBoUserId($ul);
        const wb_id = weiBoResolver.getWeiBoId($ul);

        const name = Config.getZipName(wb_user_name, wb_user_id, wb_id);

        return name;
    }

    /**
     * 得到资源原始名称
     * @param  {字符串} path 路径
     * @return {字符串}     名称（含后缀）
     */
    static getPathName(path) {

        const name = path.substring(path.lastIndexOf("/") + 1);

        if (Config.isDebug) {
            console.log(`截得名称为：${name}`);
        }

        return name;
    }

    /**
     * 得到后缀
     * @param  {字符串} path 路径
     * @return {字符串}     后缀（含.）
     */
    static getPathPostfix(path) {

        const postfix = path.substring(path.lastIndexOf("."));

        if (Config.isDebug) {
            console.log(`截得后缀为：${postfix}`);
        }

        return postfix;
    }

    /**
     * 得到资源名称
     * 
     * @param  {$标签对象} $ul        操作列表
     * @param  {字符串}    src        资源地址
     * @param  {整数}      index      序号
     * @param  {字符串}    media_type 媒体类型
     * 
     * @return {字符串}             资源名称(含后缀)
     */
    static getResourceName($ul, src, index, media_type) {

        const weiBoResolver = Core.getWeiBoResolver();

        const wb_user_name = weiBoResolver.getWeiBoUserName($ul);
        const wb_user_id = weiBoResolver.getWeiBoUserId($ul);
        const wb_id = weiBoResolver.getWeiBoId($ul);
        const resource_id = Core.getPathName(src);

        // 修正，从1开始
        index++;

        // 补齐位数：01、02、03...
        if (index.toString().length === 1) {
            index = "0" + index.toString();
        }

        const no = index;

        const postfix = Core.getPathPostfix(src);

        const name = Config.getResourceName(wb_user_name, wb_user_id, wb_id, resource_id, no, media_type) + postfix;

        return name;
    }
}