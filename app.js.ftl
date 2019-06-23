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

(function() {
    'use strict';

    <#include "/bin/Config.js" parse=false>

    <#include "/lib/Interface.js" parse=false>

    <#include "/bin/Link.js" parse=false>

    <#include "/bin/resolver/WeiBoResolver.js" parse=false>

    <#include "/bin/resolver/impl/SearchWeiBoResolver.js" parse=false>

    <#include "/bin/resolver/impl/MyWeiBoResolver.js" parse=false>

    <#include "/bin/handler/PictureHandler.js" parse=false>

    <#include "/bin/handler/VideoHandler.js" parse=false>

    <#include "/bin/handler/ZipHandler.js" parse=false>

    <#include "/bin/Tip.js" parse=false>

    <#include "/bin/Core.js" parse=false>

    setInterval(Core.handleWeiBoCard, Config.space);
})();