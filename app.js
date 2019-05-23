// ==UserScript==
// @name         微博 [ 图片 | 视频 ] 下载
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  下载微博(weibo.com)的图片和视频。（支持LivePhoto、短视频、动/静图，可以打包下载）
// @author       Mr.Po
// @match        https://weibo.com/*
// @match        https://www.weibo.com/*
// @require      https://code.jquery.com/jquery-1.11.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @connect      sinaimg.cn
// @connect      miaopai.com
// @connect      youku.com
// @connect      weibo.com
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 是否启用调试模式
    var isDebug = false;

    //每隔 space 毫秒执行一次
    var space = 5000;

    // TODO livePhoto、直播回放

    // 添加扩展如果需要
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

            var lp_links = getLivePhoto($ul);

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

            GM_notification("链接已复制到剪贴板！");
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
     * 下载微博故事
     * @param  {$标签对象} $box 视频box
     */
    function downloadWeiboStory($box) {

        var action_data = $box.attr("action-data");

        var urlRegex = action_data.match(/gif_url=([\w%.]+)&/);

        var url = urlRegex[1];

        var src = decodeURIComponent(decodeURIComponent(url));

        var name = getPathName(src.split("?")[0]);

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

                GM_notification("未能找到视频地址！");

                throw new Error("未能找到视频地址！");
            }

            name = getPathName(src.split("?")[0]);

            if (isDebug) {
                console.log("download：" + name + "=" + src);
            }

        } catch (e) {

            console.error(e);

            GM_notification("提取视频地址失败！");
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

        GM_notification("即将开始下载...");

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

                GM_notification("视频下载出错！");
            }
        });
    }

    /**
     * 得到LivePhoto链接集
     * @param  {$标签对象} $ul 操作列表
     * @return {Link数组}     链接集，可能为null
     */
    function getLivePhoto($ul) {

        var $box = $ul.parents(".WB_feed_detail").find(".WB_media_a");

        var srcs;

        // 仅有一张LivePhoto
        if ($box.hasClass('WB_media_a_m1')) {

            srcs = extractLivePhotoSrc($box.find(".WB_pic"));

        } else {

            srcs = extractLivePhotoSrc($box);
        }

        if (srcs) {
            srcs = srcs.map(function(it, i) {

                var src = "https://video.weibo.com/media/play?livephoto=//us.sinaimg.cn/" + it + ".mov&KID=unistore,videomovSrc";

                return bornLink(it + ".mp4", src);
            });
        }

        return srcs;
    }

    function bornLink(name, src) {
        return { name: name, src: src };
    }

    /**
     * 得到大图链接
     * @param  {$标签对象} $ul 操作列表
     * @return {Link数组}     链接集，可能为null
     */
    function getLargePhoto($ul) {

        // 得到每一个图片
        var links = $ul.parents(".WB_feed_detail").find("li.WB_pic img").map(function() {

            var parts = $(this).attr("src").split("/");

            // 替换为大图链接
            var src = "http://wx2.sinaimg.cn/large/" + parts[parts.length - 1];

            if (isDebug) {
                console.log(src);
            }

            return bornLink(getPathName(src), src);
        });

        return links;
    }

    /**
     * 得到图片名称
     * @param  {字符串} src 图片地址
     * @return {字符串}     图片名称（含后缀）
     */
    function getPathName(src) {

        var name = src.substring(src.lastIndexOf("/") + 1);

        if (isDebug) {
            console.log("截得名称为：" + name);
        }

        return name;
    }

    /**
     * 得到当前卡片的名称
     * @param  {$标签对象} $ul 操作列表
     * @return {字符串}        卡片名称
     */
    function getCardName($ul) {

        var cardName = $ul.parents("div.WB_feed_detail").find("div.WB_info a").first().text();

        if (isDebug) {
            console.log("得到的名称为：" + cardName);
        }

        return cardName;
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

            $progress.removeAttr('value');
        }

        return $progress[0];
    }

    /**
     * 开始打包
     * @param  {$数组} $links 图片地址集
     */
    function startZip($ul, $links) {

        GM_notification("正在打包，请稍候...");

        var progress = bornProgress($ul);

        var zip = new JSZip();

        var names = [];

        $links.each(function(i, it) {

            var name = it.name;

            GM_xmlhttpRequest({
                method: 'GET',
                url: it.src,
                responseType: "blob",
                onload: function(response) {

                    zip.file(name, response.response);

                    downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                },
                onerror: function(e) {

                    console.error(e);

                    GM_notification("第" + (i + 1) + "个对象时，获取失败！");

                    downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                }
            });
        });
    }


    function downloadZipIfComplete($ul, progress, name, zip, names, length) {

        names.push(name);

        var value = names.length / length;

        progress.value = value;

        if (names.length === length) {

            zip.generateAsync({
                    type: "blob"
                })
                .then(function(content) {

                    var cardName = getCardName($ul);

                    saveAs(content, cardName + "-" + (new Date().getTime()) + ".zip");
                });
        }
    }

    setInterval(addExtendIfNeed, space);
})();