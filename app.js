// ==UserScript==
// @name         微博 [ 图片 | 视频 ] 下载
// @namespace    http://tampermonkey.net/
// @version      1.0
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

(function() {
    'use strict';

    // TODO 直播回放，【热门、搜索】视频

    /**
     * 资源命名策略
     *
     * 0：资源原始名称（如：0065x5rwly1g3c6exw0a2j30u012utyg.jpg）
     * 1：微博用户名-微博ID-序号（如：小米商城-4375413591293810-01.jpg）[缺省]
     * 2：微博用户ID-微博ID-序号（如：5578564422-4375413591293810-01.jpg）
     * 
     * @type 整数
     */
    var resourceNamingStrategy = 1;

    /**
     * 打包命名策略
     * 
     * 1：微博用户名-微博ID（如：小米商城-4375413591293810.zip）[缺省]
     * 2：微博用户ID-微博ID（如：5578564422-4375413591293810.zip）
     * 
     * @type 整数
     */
    var zipNamingStrategy = 0;

    /**
     * 命名连接符
     * 即：“微博用户名-微博ID-序号”，中的短横线“-”
     * @type {String}
     */
    var nameingSeparator = "-";

    /**
     * 最大等待请求时间（超时时间），单位：毫秒
     * 若经常请求超时，可适当增大此值
     * 
     * @type {Number}
     */
    var maxRequestTime = 8000;

    /**
     * 每隔 space 毫秒检查一次，是否有新的微博被加载出来
     * 此值越小，检查越快；过小会造成浏览器卡顿
     * @type {Number}
     */
    var space = 5000;

    /**
     * 是否启用调试模式
     * 启用后，浏览器控制台会显示此脚本运行时的调试数据
     * @type {Boolean}
     */
    var isDebug = false;

    /**
     * 添加扩展如果需要
     */
    function addExtendIfNeed() {

        // 查找未被扩展的box
        var $uls = $("div .screen_box ul:not([class='pic_copy_extend'])");

        if ($uls.length > 0) {

            console.info("找到未扩展的box：" + $uls.length);

            $uls.each(function(i, it) {

                handlePictureIfNeed($(it));

                handleVideoIfNeed($(it));
            });

            // 批量给这些box添加已扩展标记
            $uls.addClass("pic_copy_extend");
        }
    }



    /**
     * 处理图片，如果需要
     */
    function handlePictureIfNeed($ul) {

        // 得到大图片
        var $links = getLargePhoto($ul);

        if (isDebug) {
            console.log("此Item有图：" + $links.length);
        }

        // 判断图片是否存在
        if ($links.length > 0) {

            // 得到LivePhoto的链接
            var lp_links = getLivePhoto($ul, $links.length);

            // 存在LivePhoto
            if (lp_links) {

                $links = $($links.get().concat(lp_links));
            }

            handleCopy($ul, $links);

            handleDownload($ul, $links);

            handleDownloadZip($ul, $links);
        }
    }

    /**
     * 处理视频如果需要
     * @param  {$标签对象} $ul 操作列表
     */
    function handleVideoIfNeed($ul) {

        var $box = $ul.parents(".WB_feed_detail").find(".WB_video,.WB_video_a,.li_story");

        // 不存在视频
        if ($box.length === 0) {
            return;
        }

        var type = getVideoType($box);

        var fun;

        if (type === "feedvideo") { // 短视屏（秒拍、梨视频、优酷）

            fun = function() { downloadBlowVideo($box); };

        } else if (type === "feedlive") { // 直播回放

            //TODO 暂不支持

        } else if (type === "story") { // 微博故事

            fun = function() { downloadWeiboStory($box); };

        } else {

            console.warn("未知的类型：" + type);
        }

        if (fun) {

            putButton($ul, "下载当前视频", fun);
        }
    }

    /**
     * 提取LivePhoto的地址
     * @param  {$标签对象} $owner ul或li
     * @return {字符串数组}       LivePhoto地址集，可能为null
     */
    function extractLivePhotoSrc($owner) {

        var action_data = $owner.attr("action-data");

        if (action_data) {

            var urlsRegex = action_data.match(/pic_video=([\w:,]+)/);

            if (urlsRegex) {

                var urls = urlsRegex[1].split(",").map(function(it, i) {
                    return it.split(":")[1];
                });

                return urls;
            }
        }

        return null;
    }

    /**
     * 得到视频类型
     * @param  {$标签对象} $box 视频容器
     * @return {字符串}         视频类型[video、live]
     */
    function getVideoType($box) {

        // console.log($box);

        // console.log($box.attr("action-data"));

        var typeRegex = $box.attr("action-data").match(/type=(\w+)&/);

        // console.log(typeRegex);

        return typeRegex[1];
    }

    /**
     * 添加按钮
     * @param  {$标签对象} $ul  操作列表
     * @param  {字符串} name 按钮名称
     * @param  {方法} op   按钮操作
     */
    function putButton($ul, name, op) {

        var $li = $("<li><a href='javascript:void(0)'>—> " + name + " <—</a></li>");

        $li.click(op);

        $ul.append($li);
    }

    // 处理拷贝
    function handleCopy($ul, $links) {

        putButton($ul, "复制图片链接", function() {

            var link = $links.get().map(function(it, i) {
                return it.src;
            }).join("\n");

            GM_setClipboard(link, "text");

            tipSuccess("链接已复制到剪贴板！");
        });
    }

    // 处理下载
    function handleDownload($ul, $links) {

        putButton($ul, "逐个下载图片", function() {

            $links.each(function(i, it) {

                // console.log("name:" + it.name + ",src=" + it.src);

                GM_download(it.src, it.name);
            });
        });
    }

    /**
     * 处理打包下载
     */
    function handleDownloadZip($ul, $links) {

        putButton($ul, "打包下载图片", function() {

            startZip($ul, $links);
        });
    }

    /**
     * 下载微博故事视频
     * 
     * @param  {$标签对象} $box 视频box
     */
    function downloadWeiboStory($box) {

        var action_data = $box.attr("action-data");

        var urlRegex = action_data.match(/gif_url=([\w%.]+)&/);

        var url = urlRegex[1];

        var src = decodeURIComponent(decodeURIComponent(url));

        var name = getResourceName($box, src.split("?")[0], 0);

        if (src.indexOf("//") === 0) {
            src = "https:" + src;
        }

        downloadVideo($box, name, src);
    }

    /**
     * 下载酷燃视频
     * @param  {$标签对象} $box 视频box
     */
    function downloadBlowVideo($box) {

        var src, name;

        try {

            var video_sources = $box.attr("video-sources");

            // 多清晰度源
            var sources = video_sources.split("&");

            if (isDebug) {
                console.log(sources);
            }


            // 逐步下调清晰度
            for (var i = sources.length - 2; i >= 0; i -= 2) {

                if (sources[i].trim().split("=")[1].trim().length > 0) {

                    // 解码
                    var source = decodeURIComponent(decodeURIComponent(sources[i].trim()));

                    if (isDebug) {
                        console.log(source);
                    }

                    src = source.substring(source.indexOf("=") + 1);
                }
            }

            if (!src) { // 未找到合适的视频地址

                tipError("未能找到视频地址！");

                throw new Error("未能找到视频地址！");
            }

            name = getResourceName($box, src.split("?")[0], 0);

            if (isDebug) {
                console.log("download：" + name + "=" + src);
            }

        } catch (e) {

            console.error(e);

            tipError("提取视频地址失败！");
        }


        downloadVideo($box, name, src);
    }

    /**
     * 下载直播回放
     * @param  {$标签对象} $li 视频box
     */
    function downloadLiveVCRVideo($ul, $li) {
        // TODO 暂不支持
    }

    /**
     * 下载视频
     * @param  {$标签对象} $box 视频box
     */
    function downloadVideo($box, name, src) {

        tipInfo("即将开始下载...");

        var progress = bornProgress($box);

        GM_download({
            url: src,
            name: name,
            onprogress: function(p) {

                var value = p.loaded / p.total;
                progress.value = value;
            },
            onerror: function(e) {

                console.error(e);

                tipError("视频下载出错！");
            }
        });
    }

    /**
     * 得到LivePhoto链接集
     * 
     * @param   {$标签对象} $ul     操作列表
     * @param   {整数}      start   下标开始的位置
     * @return  {Link数组}          链接集，可能为null
     */
    function getLivePhoto($ul, start) {

        var $box = $ul.parents(".WB_feed_detail").find(".WB_media_a");

        var srcs;

        // 仅有一张LivePhoto
        if ($box.hasClass('WB_media_a_m1')) {

            srcs = extractLivePhotoSrc($box.find(".WB_pic"));

        } else {

            srcs = extractLivePhotoSrc($box);
        }

        // 判断是否存在LivePhoto的链接
        if (srcs) {

            srcs = srcs.map(function(it, i) {

                var src = "https://video.weibo.com/media/play?livephoto=//us.sinaimg.cn/" + it + ".mov&KID=unistore,videomovSrc";

                var name = getResourceName($ul, "https://weibo.com/" + it + ".mp4", i + start);

                return bornLink(name, src);
            });
        }

        return srcs;
    }

    function bornLink(name, src) {
        return { name: name, src: src };
    }

    /**
     * 得到大图链接
     * 
     * @param  {$标签对象} $ul      操作列表
     * @return {Link数组}           链接集，可能为null
     */
    function getLargePhoto($ul) {

        // 得到每一个图片
        var links = $ul.parents(".WB_feed_detail").find("li.WB_pic img").map(function(i, it) {

            var parts = $(it).attr("src").split("/");

            // 替换为大图链接
            var src = "http://wx2.sinaimg.cn/large/" + parts[parts.length - 1];

            if (isDebug) {
                console.log(src);
            }

            var name = getResourceName($ul, src, i);

            return bornLink(name, src);
        });

        return links;
    }

    /**
     * 得到打包名称
     * 
     * @param  {$标签对象} $ul      操作列表
     * @return {字符串}             压缩包名称(不含后缀)
     */
    function getZipName($ul) {

        var name;

        // 2：微博用户ID-微博ID（如：5578564422-4375413591293810.zip）
        if (zipNamingStrategy === 2) {

            name = getWeiBoUserId($ul) + nameingSeparator + getWeiBoId($ul);

        } else { // 1：微博用户名-微博ID（如：小米商城-4375413591293810.zip）[缺省]

            name = getWeiBoUserName($ul) + nameingSeparator + getWeiBoId($ul);
        }

        return name;
    }

    /**
     * 得到资源名称
     * 
     * @param  {$标签对象} $ul      操作列表
     * @param  {字符串}    src      资源地址
     * @param  {整数}      index    序号
     * @return {字符串}             资源名称(含后缀)
     */
    function getResourceName($ul, src, index) {

        var name;

        // 0：资源原始名称（如：0065x5rwly1g3c6exw0a2j30u012utyg.jpg）
        if (resourceNamingStrategy === 0) {

            name = getPathName(src);

        } else {

            // 修正，从1开始
            index++;

            // 补齐位数：01、02、03...
            if (index.toString().length === 1) {
                index = "0" + index.toString();
            }

            var postfix = getPathPostfix(src);

            // 2：微博用户ID-微博ID-序号（如：5578564422-4375413591293810-01.jpg）
            if (resourceNamingStrategy == 2) {

                name = getWeiBoUserId($ul) + nameingSeparator + getWeiBoId($ul) + nameingSeparator + index + postfix;

            } else { // 1：微博用户名-微博ID-序号（如：小米商城-4375413591293810-01.jpg）[缺省]

                name = getWeiBoUserName($ul) + nameingSeparator + getWeiBoId($ul) + nameingSeparator + index + postfix;

            }
        }

        return name;
    }

    /**
     * 得到后缀
     * @param  {字符串} path 路径
     * @return {字符串}     后缀（含.）
     */
    function getPathPostfix(path) {

        var postfix = path.substring(path.lastIndexOf("."));

        if (isDebug) {
            console.log("截得后缀为：" + postfix);
        }

        return postfix;
    }

    /**
     * 得到资源原始名称
     * @param  {字符串} path 路径
     * @return {字符串}     名称（含后缀）
     */
    function getPathName(path) {

        var name = path.substring(path.lastIndexOf("/") + 1);

        if (isDebug) {
            console.log("截得名称为：" + name);
        }

        return name;
    }

    /**
     * 得到微博ID
     * @param  {$标签对象} $ul 操作列表
     * @return {字符串}        微博ID
     */
    function getWeiBoId($ul) {

        var mid = $ul.parents(".WB_cardwrap").attr("mid");

        return mid;
    }

    /**
     * 得到微博用户ID
     * @param  {$标签对象} $ul 操作列表
     * @return {字符串}        微博用户ID
     */
    function getWeiBoUserId($ul) {

        var $a = $ul.parents("div.WB_feed_detail").find("div.WB_info a").first();

        var id = $a.attr("usercard").match(/id=(\d+)/)[1];

        if (isDebug) {
            console.log("得到的微博ID为：" + id);
        }

        return id;
    }

    /**
     * 得到微博用户名称
     * @param  {$标签对象} $ul 操作列表
     * @return {字符串}        微博用户名称
     */
    function getWeiBoUserName($ul) {

        var name = $ul.parents("div.WB_feed_detail").find("div.WB_info a").first().text();

        if (isDebug) {
            console.log("得到的名称为：" + name);
        }

        return name;
    }

    /**
     * 生成一个进度条
     * @param  {$标签对象} $sub card的子节点
     * @param  {int}      max  最大值
     * @return {标签对象}     进度条
     */
    function bornProgress($sub) {

        var $div = $sub.parents("div.WB_feed_detail").find("div.WB_info").first();

        // 尝试获取进度条
        var $progress = $div.find('progress');

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
    function startZip($ul, $links) {

        tip("正在提取，请稍候...","iconExtract");

        var progress = bornProgress($ul);

        var zip = new JSZip();

        var names = [];

        $links.each(function(i, it) {

            var name = it.name;

            GM_xmlhttpRequest({
                method: 'GET',
                url: it.src,
                timeout: maxRequestTime,
                responseType: "blob",
                onload: function(response) {

                    zip.file(name, response.response);

                    downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                },
                onerror: function(e) {

                    console.error(e);

                    tipError("第" + (i + 1) + "个对象，获取失败！");

                    downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                },
                ontimeout: function() {

                    tipError("第" + (i + 1) + "个对象，请求超时！");

                    downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                }
            });
        });
    }

    /**
     * 下载打包，如果完成
     */
    function downloadZipIfComplete($ul, progress, name, zip, names, length) {

        names.push(name);

        var value = names.length / length;

        progress.value = value;

        if (names.length === length) {

            tip("正在打包，请稍候...","iconZip");

            zip.generateAsync({
                type: "blob"
            }, function(metadata) {

                progress.value = metadata.percent / 100;

            }).then(function(content) {

                tipSuccess("打包完成，即将开始下载！");

                var zipName = getZipName($ul);

                saveAs(content, zipName + ".zip");
            });
        }
    }

    function tip(text, iconName) {
        GM_notification({
            text: text,
            image: GM_getResourceURL(iconName)
        });
    }

    function tipInfo(text) {
        tip(text, "iconInfo");
    }

    function tipError(text) {
        tip(text, "iconError");
    }

    function tipSuccess(text) {
        tip(text, "iconSuccess");
    }

    setInterval(addExtendIfNeed, space);
})();