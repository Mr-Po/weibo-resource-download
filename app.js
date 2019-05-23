// ==UserScript==
// @name         微博 [ 图片 | 视频 ] 下载
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  下载微博的图片和视频。（支持多图打包下载）
// @author       Mr.Po
// @match        https://weibo.com/*
// @match        https://www.weibo.com/*
// @require      http://code.jquery.com/jquery-1.11.0.min.js
// @require      https://stuk.github.io/jszip/dist/jszip.min.js
// @require      https://raw.githubusercontent.com/eligrey/FileSaver.js/master/dist/FileSaver.min.js
// @require      https://raw.githubusercontent.com/Mr-Po/weibo-resource-download/master/StreamSaver.js
// @connect      sinaimg.cn
// @connect      miaopai.com
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    /* jshint esversion: 6 */
    'use strict';

    // 是否启用调试模式
    var isDebug = false;

    //每隔 space 毫秒执行一次
    var space = 5000;

    // TODO livePhoto、直播回放、【蒲熠星的转发视频】

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

        var $srcs = getPicSrc($ul);

        if (isDebug) {
            console.log("此Item有图：" + $srcs.length);
        }

        // 判断图片是否存在
        if ($srcs.length > 0) {

            handleCopy($ul, $srcs);

            handleDownload($ul, $srcs);

            handleDownloadZip($ul, $srcs);
        }
    }

    var videoHandlers = $([handleBlowVideo]);

    /**
     * 处理视频如果需要
     * @param  {$标签对象} $ul 操作列表
     */
    function handleVideoIfNeed($ul) {

        var $detail = $ul.parents(".WB_feed_detail");

        videoHandlers.each(function(i, it) {

            var fun = it($detail);

            if (fun) {

                putButton($ul, "下载当前视频", fun);
                return false;
            }
        });
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
    function handleCopy($ul, $srcs) {

        putButton($ul, "复制图片链接", function() {

            var link = $srcs.get().join("\n");

            GM_setClipboard(link, "text");

            GM_notification("链接已复制到剪贴板！");
        });
    }

    // 处理下载
    function handleDownload($ul, $srcs) {

        putButton($ul, "逐个下载图片", function() {

            $srcs.each(function(i, it) {

                GM_download(it, getPathName(it));
            });
        });
    }

    /**
     * 处理打包下载
     */
    function handleDownloadZip($ul, $srcs) {

        putButton($ul, "打包下载图片", function() {

            zipPicture($ul, $srcs);
        });
    }

    function handleBlowVideo($detail) {

        var $box = $detail.find(".WB_video_a");

        if ($box.length > 0) {

            return function() {
                downloadBlowVideo($box);
            };
        }
    }

    /**
     * 下载酷燃视频
     * @param  {$标签对象} $box 视频box
     */
    function downloadBlowVideo($box) {

        var video_sources = $box.attr("video-sources");

        // 多清晰度源
        var sources = video_sources.split("&");

        if (isDebug) {
            console.log(sources);
        }

        // http://xxx?xxx=123
        var src;

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

            throw new new Error("未能找到视频地址！");
        }

        var name = getPathName(src.split("?")[0]);

        if (isDebug) {
            console.log("download：" + name + "=" + src);
        }


        GM_notification("即将开始下载...");

        /*fetch(src.replace("http:", "https:"), {
            method: 'GET',
            mode: 'cors',
        }).then(res => {

            const fileStream = streamSaver.createWriteStream(name);

            // more optimized
            if (res.body.pipeTo) {
                return res.body.pipeTo(fileStream);
            }

            const writer = fileStream.getWriter();
            const reader = res.body.getReader();
            const pump = () => reader.read().then(({ value, done }) =>
                done ? writer.close() : writer.write(value).then(pump)
            );

            // Start the reader
            pump().then(() =>
                console.log('Closed the stream, Done writing')
            );
        });*/

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
     * 下载直播回放
     * @param  {$标签对象} $li 视频box
     */
    function downloadLiveVCRVideo($ul, $li) {

    }

    // 得到大图片链接
    function getPicSrc($ul) {

        // 得到每一个图片
        var srcs = $ul.parents(".WB_feed_detail").find("li.WB_pic img").map(function() {

            var parts = $(this).attr("src").split("/");

            // 替换为大图链接
            var src = "http://wx2.sinaimg.cn/large/" + parts[parts.length - 1];

            if (isDebug) {
                console.log(src);
            }

            return src;
        });


        return srcs;
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
     * 打包图片
     * @param  {$数组} $srcs 图片地址集
     */
    function zipPicture($ul, $srcs) {

        GM_notification("正在打包，请稍候...");

        var progress = bornProgress($ul);

        var zip = new JSZip();

        var names = [];

        $srcs.each(function(i, it) {

            var name = getPathName(it);

            GM_xmlhttpRequest({
                method: 'GET',
                url: it,
                responseType: "blob",
                onload: function(response) {

                    zip.file(name, response.response);

                    downloadZipIfComplete($ul, progress, name, zip, names, $srcs.length);
                },
                onerror: function(e) {

                    console.error(e);

                    GM_notification("第" + (i + 1) + "张图片，获取失败！");

                    downloadZipIfComplete($ul, progress, name, zip, names, $srcs.length);
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