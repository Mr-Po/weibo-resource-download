// ==UserScript==
// @name         微博 [ 图片 | 视频 ] 下载
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  下载微博(weibo.com)的图片和视频。（支持LivePhoto、短视频、动/静图，可以打包下载）
// @author       Mr.Po
// @match        https://weibo.com/*
// @match        https://www.weibo.com/*
// @match        https://d.weibo.com/*
// @match        https://s.weibo.com/*
// @require      https://code.jquery.com/jquery-1.11.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @resource iconError https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/media/error.png
// @resource iconSuccess https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/media/success.png
// @resource iconInfo https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/media/info.png
// @resource iconExtract https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/media/extract.png
// @resource iconZip https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/media/zip.png
// @connect      sinaimg.cn
// @connect      miaopai.com
// @connect      youku.com
// @connect      weibo.com
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// ==/UserScript==

/*jshint esversion: 6 */

(function() {
    'use strict';

    class Config {

        /********************* ↓ 用户可配置区域 ↓ *********************/

        /**
         * 媒体类型
         *
         * 可通过修改此间数据，影响资源名称中的 @mdeia_type 参数值
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
         * 可通过调配、增删其返回值，修改资源名称
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
         * @param  {字符串} resource_id  资源原始名称（如：0065x5rwly1g3c6exw0a2j30u012utyg）
         * @param  {字符串} no           序号（如：01）
         * @param  {字符串} mdeia_type   媒体类型（如：P）
         * 
         * @return {字符串}              由以上字符串组合而成的名称
         */
        static getResourceName(wb_user_name, wb_user_id, wb_id, resource_id, no, mdeia_type) {
            return `${wb_user_name}-${wb_id}-${no}`;
        }

        /**
         * 得到打包名称
         * 可通过调配、增删其返回值，修改打包名称
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
            if (!Array.isArray(methods)) {
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


    /**
     * 微博解析器接口
     */
    const WeiBoResolver = new Interface("SearchWeiBoResolver",
        [
            "getOperationList",
            "getPhoto",
            "getLivePhotoContainer",
            "getWeiBoId",
            "getWeiBoUserId",
            "getWeiBoUserName",
            "getProgressContainer",
            "getVideoBox",
            "geiVideoSrc"
        ]);


    /**
     * 搜索微博解析器
     */
    const SearchWeiBoResolver = {};

    Interface.impl(SearchWeiBoResolver, WeiBoResolver, {
        getOperationList: () => $(`div .menu ul:not([class='${Config.handledWeiBoCardClass}'])`),
        getPhoto: $ul => $ul.parents(".card-wrap").find(".media.media-piclist img"),
        getLivePhotoContainer: $ul => $(null),
        getWeiBoId: $ul => $ul.parents(".card-wrap").attr("mid").trim(),
        getWeiBoUserId: $ul => {
            const $a = $ul.parents(".card-wrap").find("a.name").first();

            const id = $a.attr("href").match(/weibo\.com\/(\d+)/)[1].trim();

            if (Config.isDebug) {
                console.log(`得到的微博ID为：${id}`);
            }

            return id;
        },
        getWeiBoUserName: $ul => {
            const name = $ul.parents(".card-wrap").find("a.name").first().text().trim();

            if (Config.isDebug) {
                console.log(`得到的名称为：${name}`);
            }

            return name;
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


    /**
     * 我的微博解析器（含：我的微博、他人微博、我的收藏、热门微博）
     */
    const MyWeiBoResolver = {};

    Interface.impl(MyWeiBoResolver, WeiBoResolver, {
        getOperationList: () => $(`div .screen_box ul:not([class='${Config.handledWeiBoCardClass}'])`),
        getPhoto: $ul => $ul.parents(".WB_feed_detail").find("li.WB_pic img"),
        getLivePhotoContainer: $ul => $ul.parents(".WB_feed_detail").find(".WB_media_a"),
        getWeiBoId: $ul => $ul.parents(".WB_cardwrap").attr("mid").trim(),
        getWeiBoUserId: $ul => {

            const $a = $ul.parents("div.WB_feed_detail").find("div.WB_info a").first();

            const id = $a.attr("usercard").match(/id=(\d+)/)[1].trim();

            if (Config.isDebug) {
                console.log(`得到的微博ID为：${id}`);
            }

            return id;
        },
        getWeiBoUserName: $ul => {
            const name = $ul.parents("div.WB_feed_detail").find("div.WB_info a").first().text().trim();

            if (Config.isDebug) {
                console.log(`得到的名称为：${name}`);
            }

            return name;
        },
        getProgressContainer: $sub => $sub.parents("div.WB_feed_detail").find("div.WB_info").first(),
        getVideoBox: $ul => $ul.parents(".WB_feed_detail").find(".WB_video,.WB_video_a,.li_story"),
        geiVideoSrc: $box => {

            const video_sources = $box.attr("video-sources");

            // 多清晰度源
            const sources = video_sources.split("&");

            if (Config.isDebug) {
                console.log(sources);
            }

            let src;

            // 逐步下调清晰度
            for (var i = sources.length - 2; i >= 0; i -= 2) {

                if (sources[i].trim().split("=")[1].trim().length > 0) {

                    // 解码
                    var source = decodeURIComponent(decodeURIComponent(sources[i].trim()));

                    if (Config.isDebug) {
                        console.log(source);
                    }

                    src = source.substring(source.indexOf("=") + 1);
                }
            }

            return src;
        }
    });


    /**
     * 图片处理器(含：LivePhoto)
     */
    class PictureHandler {

        /**
         * 处理图片，如果需要
         */
        static handlePictureIfNeed($ul) {

            // 得到大图片
            let $links = PictureHandler.getLargePhoto($ul);

            if (Config.isDebug) {
                console.log(`此Item有图：${$links.length}`);
            }

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
         * 得到大图链接
         * 
         * @param  {$标签对象} $ul      操作列表
         * @return {Link数组}           链接集，可能为null
         */
        static getLargePhoto($ul) {

            // 得到每一个图片
            const links = Core.getWeiBoResolver().getPhoto($ul).map(function(i, it) {

                const parts = $(it).attr("src").split("/");

                // 替换为大图链接
                const src = `http://wx2.sinaimg.cn/large/${parts[parts.length - 1]}`;

                if (Config.isDebug) {
                    console.log(src);
                }

                const name = Core.getResourceName($ul, src, i, Config.mediaType.picture);

                return new Link(name, src);
            });

            return links;
        }
    }


    /**
     * 视频处理器
     */
    class VideoHandler {

        /**
         * 处理视频如果需要
         * @param  {$标签对象} $ul 操作列表
         */
        static handleVideoIfNeed($ul) {

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

                    Tip.error("未能找到视频地址！");

                    throw new Error("未能找到视频地址！");
                }

                name = Core.getResourceName($box, src.split("?")[0], 0, Config.mediaType.video);

                if (Config.isDebug) {

                    console.log(`download：${name}=${src}`);
                }

            } catch (e) {

                console.error(e);

                Tip.error("提取视频地址失败！");
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
    setInterval(Core.handleWeiBoCard, Config.space);
})();