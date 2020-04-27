// ==UserScript==
// @name         微博 [ 图片 | 视频 ] 下载
// @namespace    http://tampermonkey.net/
// @version      2.3
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

// @更新日志
// v2.3     2020-04-27      1、修复视频下载未默认最高清晰度的bug；2、修复逐个下载最多10张的bug；3、修复部分情况下，图片重复的bug。
// v2.2     2020-01-12      1、更新9+图片解析策略。
// v2.1     2019-12-19      1、支持9+图片下载。
// v2.0     2019-06-23      1、重构代码逻辑；2、优化自定义命名方式。
// v1.1     2019-05-24      1、新增支持热门微博、微博搜索；2、新增可选文件命名方式。
// v1.0     2019-05-23      1、支持LivePhoto、短视频、动/静图，可以打包下载。

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