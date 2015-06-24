# HighlightEMR
谷歌浏览器高亮电子病历插件，用于高亮关键字，方便快速浏览（如感控人员高亮感染相关的关键字）。

> egnahC > You need change!

##效果预览图
![效果图](http://7xi5qz.com1.z0.glb.clouddn.com/github/highlightemr/main_view.png)

##使用说明
###安装
1. 如果想基于此进行二次开发，可以直接将 HighlightEMR 文件夹拖拽到 Chrome 浏览器的【设置>扩展程序】中,直接就可以安装成功。该种方式便于调试。
![Drag and Install](http://7xi5qz.com1.z0.glb.clouddn.com/github/highlightemr/drag_install.png)
2. 仅仅使用的话，建议打包成 crx 进行安装。
![Package to CRX](http://7xi5qz.com1.z0.glb.clouddn.com/github/highlightemr/package_to_crx.png)

###配置
有以下三种方式可以打开配置界面：

+ 第一次安装该扩展
+ 单击扩展图标下的【设置】按钮 
+ chrome 浏览器下的【设置>扩展程序】中的【该插件】的【选项】按钮

配置文件与配置选项

|配置项    |   说明    |
|:---------|:----------|
|Custom Patterns | 自定义高亮规则，自定义的高亮规则应满足如下格式：`[{"desc":"蓝色高亮","style":"background-color:blue;color:white;","pattern":"和尚"}]`，pattern中多个关键字用 ; 分隔。|
|Active Urls     | 高亮激活规则；多个 url 激活规则请用 ; 分隔。Example：`file:*;http:*`|
|Request Url     | 跨站点交互，主要包含三个事件：1、获取高亮规则：请求方式：`GET`，要求返回结果格式：`[{"desc":"蓝色高亮","style":"background-color:blue;color:white;","pattern":"和尚"}]`；2、取消高亮某个关键字：请求方式：`POST`，请求内容格式：`action=remove&value=关键字`；3、页面右键菜单新增的高亮规则：请求方式：`POST`，请求内容格式：`action=update&value=[{"desc":"蓝色高亮","style":"background-color:blue;color:white;","pattern":"和尚"}]`。
|Use Default Patterns | 是否启用默认高亮规则。

Active Urls 的校验规则（参数 `url` 为根据分号（`;`）切分后的单个值）：

```JavaScript
function checkUrl(url, pattern) {
	var reg = new RegExp();
	reg.compile(pattern);
	if (!reg.test(url)) {
		return false;
	}
	return true;
};
```

![配置](http://7xi5qz.com1.z0.glb.clouddn.com/github/highlightemr/config.png)


