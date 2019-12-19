// ==UserScript==
// @name         微博 [ 图片 | 视频 ] 下载
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  下载微博(weibo.com)的图片和视频。（支持LivePhoto、短视频、动/静图(9+)，可以打包下载）
// @author       Mr.Po
// @match        https://weibo.com/*
// @match        https://www.weibo.com/*
// @match        https://d.weibo.com/*
// @match        https://s.weibo.com/*
// @require      https://code.jquery.com/jquery-1.11.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @require      https://cdn.staticfile.org/mustache.js/3.1.0/mustache.min.js
// @resource iconError https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/out/media/error.png
// @resource iconSuccess https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/out/media/success.png
// @resource iconInfo https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/out/media/info.png
// @resource iconExtract https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/out/media/extract.png
// @resource iconZip https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/out/media/zip.png
// @connect      sinaimg.cn
// @connect      miaopai.com
// @connect      youku.com
// @connect      weibo.com
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

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
     * 
     * @return {字符串}              由以上字符串组合而成的名称
     */
    static getResourceName(wb_user_name, wb_user_id, wb_id, wb_url,
        resource_id, no, mdeia_type) {

        const template = Config.getValue("resourceName",
            () => "{{wb_user_name}}-{{wb_id}}-{{no}}"
        );

        return Mustache.render(template, {
            wb_user_name: wb_user_name,
            wb_user_id: wb_user_id,
            wb_id: wb_id,
            wb_url: wb_url,
            resource_id: resource_id,
            no: no,
            mdeia_type: mdeia_type
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
     * 
     * @return {字符串}              由以上字符串组合而成的名称
     */
    static getZipName(wb_user_name, wb_user_id, wb_id, wb_url) {

        const template = Config.getValue("zipName",
            () => "{{wb_user_name}}-{{wb_id}}"
        );

        return Mustache.render(template, {
            wb_user_name: wb_user_name,
            wb_user_id: wb_user_id,
            wb_id: wb_id,
            wb_url: wb_url
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
/*jshint esversion: 6 */

class Link {

	/**
	 * 构造函数
	 * 
	 * @param  {字符串} name 名称
     * @param  {字符串} src  地址
	 */
    constructor(name, src) {
        this.name = name;
        this.src = src;
    }
}
/*jshint esversion: 6 */

/**
 * 微博解析器接口
 */
const WeiBoResolver = new Interface("SearchWeiBoResolver",
    [
        "getOperationButton",// 得到操作按钮[↓]
        "getOperationList",// 根据操作按钮，得到操作列表
        "get9PhotoImgs",// 返回九宫格图片的img$控件数组（自带后缀）
        "get9PhotoOver",// 得到超过部分的图片的id数组(无后缀)
        "getLivePhotoContainer",
        "getWeiBoCard",// 这条微博（若为转发微博，则取根微博）
        "getWeiBoInfo",// 这条微博(发布者)信息
        "getWeiBoId",// 此条微博的ID
        "getWeiBoUserId",
        "getWeiBoUserName",
        "getWeiBoUrl",// 此条微博的地址
        "getProgressContainer",
        "getVideoBox",
        "geiVideoSrc"
    ]);
/*jshint esversion: 6 */

/**
 * 搜索微博 - 解析器
 */
const SearchWeiBoResolver = {};

Interface.impl(SearchWeiBoResolver, WeiBoResolver, {
    getOperationButton: () => $(`div .menu a:not(.${Config.handledWeiBoCardClass})`),
    getOperationList: $operationButton => $operationButton.parents(".menu").find("ul"),
    get9PhotoImgs: $ul => $ul.parents(".card-wrap").find(".media.media-piclist img"),
    get9PhotoOver: $ul => new Promise((resolve, reject) => {resolve([]);}), //搜索微博不会展示9+图片
    getLivePhotoContainer: $ul => $(null),
    getWeiBoCard: $ul => {

        const $content = $ul.parents(".content");

        const $card_content = $content.find(".card-comment");

        let $content_node;

        if ($card_content.length == 0) { // 这不是转发微博

            $content_node = $content;

        } else {

            $content_node = $card_content;
        }

        return $content_node;
    },
    getWeiBoInfo: $ul => {

        return SearchWeiBoResolver.getWeiBoCard($ul).find("a.name").first();
    },
    getWeiBoId: $ul => {

        const action_data = $ul.parents(".card-wrap").find(".card-act li:eq(1) a").attr("action-data");

        const rootmid_regex = action_data.match(/rootmid=(\d+)&/);

        let mid;

        if (rootmid_regex) { // 这是转发微博

            mid = rootmid_regex[1];

        } else {

            mid = action_data.match(/mid=(\d+)&/)[1];
        }

        return mid;
    },
    getWeiBoUserId: $ul => {

        const $info = SearchWeiBoResolver.getWeiBoInfo($ul);

        const user_id = $info.attr("href").match(/weibo\.com\/[u\/]{0,2}(\d+)/)[1].trim();

        Core.log(`得到的微博ID为：${user_id}`);

        return user_id;
    },
    getWeiBoUserName: $ul => {

        const $info = SearchWeiBoResolver.getWeiBoInfo($ul);

        const name = $info.text().trim();

        Core.log(`得到的名称为：${name}`);

        return name;
    },
    getWeiBoUrl: $ul => {

        const $card = SearchWeiBoResolver.getWeiBoCard($ul);

        const url = $card.find(".from a").attr("href").match(/weibo\.com\/(\d+\/\w+)\?/)[1].trim();

        Core.log(`得到的地址为：${url}`);

        return url.replace("\/", "_");
    },
    getProgressContainer: $sub => $sub.parents(".card-wrap").find("a.name").first().parent(),
    getVideoBox: $ul => $ul.parents(".card-wrap").find(".WB_video_h5").first(),
    geiVideoSrc: $box => {

        let src = $box.attr("action-data").match(/video_src=([\w\/\.%]+)/)[1];

        src = decodeURIComponent(decodeURIComponent(src));

        if (src.indexOf("http") != 0) {
            src = `https:${src}`;
        }

        return src;
    }
});
/*jshint esversion: 8 */

/**
 * 我的微博（含：我的微博、他人微博、我的收藏、热门微博） - 解析器
 */
const MyWeiBoResolver = {};

Interface.impl(MyWeiBoResolver, WeiBoResolver, {
    getOperationButton: () => $(`div .screen_box i.ficon_arrow_down:not(.${Config.handledWeiBoCardClass})`),
    getOperationList: $operationButton => $operationButton.parents(".screen_box").find("ul"),
    get9PhotoImgs: $ul => $ul.parents(".WB_feed_detail").find("li.WB_pic img"),
    get9PhotoOver: ($ul) => {

        return new Promise((resolve, reject) => {

            const $box = $ul.parents(".WB_feed_detail").find(".WB_media_a");

            const action_data = $box.attr("action-data");

            const over9pic = action_data.match(/over9pic=1&/);

            if (over9pic) { // 存在超9图

                const ids_regex = action_data.match(/pic_ids=([\w,]+)&/);

                if (ids_regex) { // 得到图片ids_regex

                    const ids = ids_regex[1].split(",");

                    // 已知所有图片
                    if (ids.length > 9) { // 用户已手动触发加载over

                        resolve(ids.splice(9));

                    } else { // 只知前面9张，用户未手动触发加载over

                        Core.log("未知超过部分图片！");

                        const mid_regex = action_data.match(/mid=([\d,]+)&/);

                        if (mid_regex) { // 找到mid

                            const mid = mid_regex[1];

                            // 请求未显示的图片id
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: `https://weibo.com/aj/mblog/getover9pic?ajwvr=6&mid=${mid}&__rnd=${Date.now()}`,
                                timeout: Config.maxRequestTime,
                                responseType: "json",
                                onload: function(res) {

                                    resolve(res.response.data);
                                },
                                onerror: function(e) {

                                    console.error(e);

                                    reject("请求未展示图片发生错误");
                                },
                                ontimeout: function() {

                                    reject("请求未展示图片超时！");
                                }
                            });

                        } else { // 未找到mid

                            reject("未能找到此条微博的mid！");
                        }
                    }

                } else {

                    reject("获取图片ids失败！");
                }

            } else { // 图片数量未超9张

                resolve([]);
            }
        });
    },
    getLivePhotoContainer: $ul => $ul.parents(".WB_feed_detail").find(".WB_media_a"),
    getWeiBoCard: $ul => {

        const $box = $ul.parents("div.WB_feed_detail");

        const $box_expand = $box.find(".WB_feed_expand");

        let $box_node;

        // 这不是一条转发微博
        if ($box_expand.length == 0) {

            $box_node = $box;

        } else { // 这是一条转发微博

            $box_node = $box_expand;
        }

        return $box_node;
    },
    getWeiBoInfo: $ul => {

        return MyWeiBoResolver.getWeiBoCard($ul).find("div.WB_info a").first();
    },
    getWeiBoId: $ul => {

        const $info = MyWeiBoResolver.getWeiBoInfo($ul);

        const id_regex = $info.attr("suda-uatrack").match(/value=\w+:(\d+)/);

        let id;

        if (id_regex) { // 我的微博、他人微博（转发）、我的收藏、热门微博

            id = id_regex[1].trim();

        } else { // 他人微博

            id = $ul.parents(".WB_feed_detail").parents(".WB_cardwrap").attr("mid").trim();
        }

        Core.log(`得到的微博ID为：${id}`);

        return id;
    },
    getWeiBoUserId: $ul => {

        const $info = MyWeiBoResolver.getWeiBoInfo($ul);

        const user_id = $info.attr("usercard").match(/id=(\d+)/)[1].trim();

        Core.log(`得到的用户微博ID为：${user_id}`);

        return user_id;
    },
    getWeiBoUserName: $ul => {

        const $info = MyWeiBoResolver.getWeiBoInfo($ul);

        const name = $info.text().trim();

        Core.log(`得到的名称为：${name}`);

        return name;
    },
    getWeiBoUrl: $ul => {

        const $li_forward = $ul.parents(".WB_feed_detail").parents("div.WB_cardwrap")
            .find(".WB_feed_handle .WB_row_line li:eq(1) a");

        const action_data = $li_forward.attr("action-data");

        const rooturl_regex = action_data.match(/rooturl=https:\/\/weibo\.com\/(\d+\/\w+)&/);

        let url;

        if (rooturl_regex) { // 这是转发微博

            url = rooturl_regex[1].trim();

        } else {

            url = action_data.match(/url=https:\/\/weibo\.com\/(\d+\/\w+)&/)[1].trim();
        }

        Core.log(`得到的此条微博地址为：${url}`);

        return url.replace("\/", "_");
    },
    getProgressContainer: $sub => $sub.parents("div.WB_feed_detail").find("div.WB_info").first(),
    getVideoBox: $ul => $ul.parents(".WB_feed_detail").find(".WB_video,.WB_video_a,.li_story"),
    geiVideoSrc: $box => {

        const video_sources = $box.attr("video-sources");

        // 多清晰度源
        const sources = video_sources.split("&");

        Core.log(sources);

        let src;

        // 逐步下调清晰度
        for (var i = sources.length - 2; i >= 0; i -= 1) {

            if (sources[i].trim().split("=")[1].trim().length > 0) {

                // 解码
                var source = decodeURIComponent(decodeURIComponent(sources[i].trim()));

                Core.log(source);

                src = source.substring(source.indexOf("=") + 1);
            }
        }

        return src;
    }
});
/*jshint esversion: 8 */

/**
 * 图片处理器(含：LivePhoto)
 */
class PictureHandler {

    /**
     * 处理图片，如果需要
     */
    static async handlePictureIfNeed($ul) {

        const $button = Core.putButton($ul, "图片解析中...", null);

        try {

            const resolver = Core.getWeiBoResolver();

            const photo_9_ids = resolver.get9PhotoImgs($ul).map(function(i, it) {

                const parts = $(it).attr("src").split("/");

                return parts[parts.length - 1];
            }).get();

            Core.log("九宫格图片：");
            Core.log(photo_9_ids);

            const photo_9_over_ids = await resolver.get9PhotoOver($ul).catch(e => {

                Tip.error(e);

                return [];
            });

            Core.log("未展示图片：");
            Core.log(photo_9_over_ids);

            const photo_ids = photo_9_ids.concat(photo_9_over_ids);

            Core.log("总图片：");
            Core.log(photo_ids);

            // 得到大图片
            let $links = await PictureHandler.convertLargePhoto($ul, photo_ids);

            Core.log(`此Item有图：${$links.length}`);

            // 判断图片是否存在
            if ($links.length > 0) {

                // 得到LivePhoto的链接
                const lp_links = PictureHandler.getLivePhoto($ul, $links.length);

                // 存在LivePhoto
                if (lp_links) {

                    $links = $($links.get().concat(lp_links));
                }

                Core.handleCopy($ul, $links);

                PictureHandler.handleDownload($ul, $links);

                PictureHandler.handleDownloadZip($ul, $links);
            }
        } catch (e) {

            console.error(e);

            Tip.error(e.message);

            Core.putButton($ul, "图片解析失败", null);

        } finally {

            Core.removeButton($ul, $button);
        }
    }


    /**
     * 提取LivePhoto的地址
     * @param  {$标签对象} $owner ul或li
     * @return {字符串数组}       LivePhoto地址集，可能为null
     */
    static extractLivePhotoSrc($owner) {

        const action_data = $owner.attr("action-data");

        if (action_data) {

            const urlsRegex = action_data.match(/pic_video=([\w:,]+)/);

            if (urlsRegex) {

                const urls = urlsRegex[1].split(",").map(function(it, i) {
                    return it.split(":")[1];
                });

                return urls;
            }
        }

        return null;
    }

    /**
     * 得到LivePhoto链接集
     * 
     * @param   {$标签对象} $ul     操作列表
     * @param   {整数}      start   下标开始的位置
     * @return  {Link数组}          链接集，可能为null
     */
    static getLivePhoto($ul, start) {

        const $box = Core.getWeiBoResolver().getLivePhotoContainer($ul);

        let srcs;

        // 仅有一张LivePhoto
        if ($box.hasClass('WB_media_a_m1')) {

            srcs = PictureHandler.extractLivePhotoSrc($box.find(".WB_pic"));

        } else {

            srcs = PictureHandler.extractLivePhotoSrc($box);
        }

        // 判断是否存在LivePhoto的链接
        if (srcs) {

            srcs = srcs.map(function(it, i) {

                var src = `https://video.weibo.com/media/play?livephoto=//us.sinaimg.cn/${it}.mov&KID=unistore,videomovSrc`;

                var name = Core.getResourceName($ul, `https://weibo.com/${it}.mp4`, i + start, Config.mediaType.livePhoto);

                return new Link(name, src);
            });
        }

        return srcs;
    }

    // 处理下载
    static handleDownload($ul, $links) {

        Core.putButton($ul, "逐个下载图片", function() {

            $links.each(function(i, it) {

                // console.log("name:" + it.name + ",src=" + it.src);

                GM_download(it.src, it.name);
            });
        });
    }

    /**
     * 处理打包下载
     */
    static handleDownloadZip($ul, $links) {

        Core.putButton($ul, "打包下载图片", function() {

            ZipHandler.startZip($ul, $links);
        });
    }

    /**
     * 转换为大图链接
     *
     * @param  {$控件} $ul        操作列表
     * @param  {数组}  photo_ids  图片id数组（可能无后缀）
     * @return {Link数组}       链接集，可能为null
     */
    static async convertLargePhoto($ul, photo_ids) {

        const photo_ids_fix = await Promise.all($(photo_ids).map(function(i, it) {

            return new Promise((resolve, reject) => {

                // 判断是否存在后缀
                if (it.indexOf(".") != -1) { // 存在

                    resolve(it);

                } else { // 不存在

                    // 请求，不打开流，只需要头信息
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `http://wx2.sinaimg.cn/thumb150/${it}`,
                        timeout: Config.maxRequestTime,
                        responseType: "blob",
                        onload: function(res) {

                            const postfix_regex = res.responseHeaders.match(/content-type: image\/(\w+)/);

                            // 找到，且图片类型为git
                            if (postfix_regex && postfix_regex[1] == "gif") {

                                resolve(`${it}.gif`);

                            } else { // 未找到，或图片类型为：jpeg

                                resolve(`${it}.jpg`);
                            }
                        },
                        onerror: function(e) {

                            console.error(e);

                            reject("请求图片格式发生错误！");
                        },
                        ontimeout: function() {

                            reject("请求图片格式超时！");
                        }
                    });
                }
            }).catch(e => {

                Tip.error(e);

                return `${it}.jpg`;
            });
        }).get());

        Core.log("总图片(fix)：");
        Core.log(photo_ids_fix);

        return $(photo_ids_fix).map((i, it) => {

            // 替换为大图链接
            const src = `http://wx2.sinaimg.cn/large/${it}`;

            Core.log(src);

            const name = Core.getResourceName($ul, src, i, Config.mediaType.picture);

            return new Link(name, src);
        });
    }
}
/*jshint esversion: 8 */

/**
 * 视频处理器
 */
class VideoHandler {

    /**
     * 处理视频如果需要
     * @param  {$标签对象} $ul 操作列表
     */
    static async handleVideoIfNeed($ul) {

        const $button = Core.putButton($ul, "视频解析中...", null);

        try {

            const $box = Core.getWeiBoResolver().getVideoBox($ul);

            // 不存在视频
            if ($box.length === 0) {
                return;
            }

            // 得到视频类型
            const type = VideoHandler.getVideoType($box);


            let $link;

            if (type === "feedvideo") { // 短视屏（秒拍、梨视频、优酷）

                $link = VideoHandler.getBlowVideoLink($box);

            } else if (type === "feedlive") { // 直播回放

                //TODO 暂不支持

            } else if (type === "story") { // 微博故事

                $link = VideoHandler.getWeiboStoryLink($box);

            } else {

                console.warn(`未知的类型：${type}`);
            }

            // 是否存在视频链接
            if ($link) {

                Core.handleCopy($ul, $([$link]));

                const fun = () => VideoHandler.downloadVideo($box, $link);

                Core.putButton($ul, "下载当前视频", fun);
            }

        } catch (e) {

            console.error(e);

            Tip.error(e.message);

            Core.putButton($ul, "视频解析失败", null);

        } finally {
            
            Core.removeButton($ul,$button);
        }
    }

    /**
     * 得到视频类型
     * @param  {$标签对象} $box 视频容器
     * @return {字符串}         视频类型[video、live]
     */
    static getVideoType($box) {

        const typeRegex = $box.attr("action-data").match(/type=(\w+)&/);

        return typeRegex[1];
    }

    /**
     * 得到微博故事视频Link
     * 
     * @param  {$标签对象} $box 视频box
     * 
     * @return {Link}      链接对象
     */
    static getWeiboStoryLink($box) {

        const action_data = $box.attr("action-data");

        const urlRegex = action_data.match(/gif_url=([\w%.]+)&/);

        const url = urlRegex[1];

        let src = decodeURIComponent(decodeURIComponent(url));

        const name = Core.getResourceName($box, src.split("?")[0], 0, Config.mediaType.video);

        if (src.indexOf("//") === 0) {
            src = "https:" + src;
        }

        return new Link(name, src);
    }

    /**
     * 得到酷燃视频Link
     * 
     * @param  {$标签对象} $box 视频box
     * 
     * @return {Link}      链接对象
     */
    static getBlowVideoLink($box) {

        let src, name;

        try {

            src = Core.getWeiBoResolver().geiVideoSrc($box);

            if (!src) { // 未找到合适的视频地址

                throw new Error("未能找到视频地址！");
            }

            name = Core.getResourceName($box, src.split("?")[0], 0, Config.mediaType.video);

            Core.log(`download：${name}=${src}`);

        } catch (e) {

            console.error(e);

            throw new Error("未能找到视频地址！");
        }

        return new Link(name, src);
    }

    /**
     * 下载直播回放
     * @param  {$标签对象} $li 视频box
     */
    static downloadLiveVCRVideo($ul, $li) {
        // TODO 暂不支持
    }

    /**
     * 下载视频
     * 
     * @param  {$标签对象} $box  视频box
     * @param  {$对象}    $link  Link对象
     */
    static downloadVideo($box, $link) {

        Tip.info("即将开始下载...");

        const progress = ZipHandler.bornProgress($box);

        GM_download({
            url: $link.src,
            name: $link.name,
            onprogress: function(p) {

                const value = p.loaded / p.total;
                progress.value = value;
            },
            onerror: function(e) {

                console.error(e);

                Tip.error("视频下载出错！");
            }
        });
    }
}
/*jshint esversion: 6 */

class ZipHandler {

    /**
     * 生成一个进度条
     * @param  {$标签对象} $sub card的子节点
     * @param  {int}      max  最大值
     * @return {标签对象}     进度条
     */
    static bornProgress($sub) {

        const $div = Core.getWeiBoResolver().getProgressContainer($sub);

        // 尝试获取进度条
        let $progress = $div.find('progress');

        // 进度条不存在时，生成一个
        if ($progress.length === 0) {

            $progress = $("<progress max='1' style='margin-left:10px;' />");

            $div.append($progress);

        } else { // 已存在时，重置value

            $progress[0].value = 0;
        }

        return $progress[0];
    }

    /**
     * 开始打包
     * @param  {$数组} $links 图片地址集
     */
    static startZip($ul, $links) {

        Tip.tip("正在提取，请稍候...", "iconExtract");

        const progress = ZipHandler.bornProgress($ul);

        const zip = new JSZip();

        const names = [];

        $links.each(function(i, it) {

            const name = it.name;

            GM_xmlhttpRequest({
                method: 'GET',
                url: it.src,
                timeout: Config.maxRequestTime,
                responseType: "blob",
                onload: function(response) {

                    zip.file(name, response.response);

                    ZipHandler.downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                },
                onerror: function(e) {

                    console.error(e);

                    Tip.error(`第${(i + 1)}个对象，获取失败！`);

                    ZipHandler.downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                },
                ontimeout: function() {

                    Tip.error(`第${(i + 1)}个对象，请求超时！`);

                    ZipHandler.downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                }
            });
        });
    }

    /**
     * 下载打包，如果完成
     */
    static downloadZipIfComplete($ul, progress, name, zip, names, length) {

        names.push(name);

        const value = names.length / length;

        progress.value = value;

        if (names.length === length) {

            Tip.tip("正在打包，请稍候...", "iconZip");

            zip.generateAsync({
                type: "blob"
            }, function(metadata) {

                progress.value = metadata.percent / 100;

            }).then(function(content) {

                Tip.success("打包完成，即将开始下载！");

                const zipName = Core.getZipName($ul);

                saveAs(content, `${zipName}.zip`);
            });
        }
    }
}
/*jshint esversion: 6 */

/**
 * 提示
 */
class Tip {

    static tip(text, iconName) {
        GM_notification({
            text: text,
            image: GM_getResourceURL(iconName)
        });
    }

    static info(text) {
        Tip.tip(text, "iconInfo");
    }

    static error(text) {
        Tip.tip(text, "iconError");
    }

    static success(text) {
        Tip.tip(text, "iconSuccess");
    }
}
/*jshint esversion: 8 */

/**
 * 核心
 */
class Core {

    /**
     * 处理微博卡片
     */
    static handleWeiBoCard() {

        // 查找未被扩展的操作按钮
        const $operationButtons = Core.getWeiBoResolver().getOperationButton();

        // 存在未被扩展的操作按钮
        if ($operationButtons.length > 0) {

            console.info(`找到未被扩展的操作按钮：${$operationButtons.length}`);

            $operationButtons.one("click", event =>
                Core.resolveWeiBoCard($(event.currentTarget))
            );

            $operationButtons.addClass(Config.handledWeiBoCardClass);
        }
    }

    /**
     * 解析 微博卡片
     * 仅在初次点击 操作按钮[↓] 时，触发
     *
     * @param  {$标签对象} $operationButton  操作按钮
     */
    static resolveWeiBoCard($operationButton) {

        const $ul = Core.getWeiBoResolver().getOperationList($operationButton);

        PictureHandler.handlePictureIfNeed($ul);
        VideoHandler.handleVideoIfNeed($ul);
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
     *
     * @return {$控件} 按钮
     */
    static putButton($ul, name, op) {

        const $li = $(`<li><a href='javascript:void(0)'>—> ${name} <—</a></li>`);

        $li.click(op);

        $ul.append($li);

        return $li;
    }

    /**
     * 移除按钮
     * @param  {$标签对象} $ul  操作列表
     * @param  {$控件}    $button 按钮
     */
    static removeButton($ul, $button) {

        $ul.find(`li a:contains(${$button.text()})`).remove();
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
        const wb_url = weiBoResolver.getWeiBoUrl($ul);

        const name = Config.getZipName(wb_user_name, wb_user_id, wb_id, wb_url);

        return name;
    }

    /**
     * 得到资源原始名称
     * @param  {字符串} path 路径
     * @return {字符串}     名称（含后缀）
     */
    static getPathName(path) {

        const name = path.substring(path.lastIndexOf("/") + 1);

        Core.log(`截得名称为：${name}`);

        return name;
    }

    /**
     * 得到后缀
     * @param  {字符串} path 路径
     * @return {字符串}     后缀（含.）
     */
    static getPathPostfix(path) {

        const postfix = path.substring(path.lastIndexOf("."));

        Core.log(`截得后缀为：${postfix}`);

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
        const wb_url = weiBoResolver.getWeiBoUrl($ul);
        const resource_id = Core.getPathName(src);

        // 修正，从1开始
        index++;

        // 补齐位数：01、02、03...
        if (index.toString().length === 1) {
            index = "0" + index.toString();
        }

        const no = index;

        const postfix = Core.getPathPostfix(src);

        const name = Config.getResourceName(wb_user_name, wb_user_id, wb_id, wb_url,
            resource_id, no, media_type) + postfix;

        return name;
    }

    /**
     * 记录日志
     * @param  {字符串} msg 日志内容
     */
    static log(msg) {
        if (Config.isDebug) {
            console.log(msg);
        }
    }
}
    setInterval(Core.handleWeiBoCard, Config.space);
})();