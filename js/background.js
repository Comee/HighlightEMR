var storage = chrome.storage.local,
	emailToMeMsg = "email2me",
	notHighlightId,
	context,
	evTimeStamp = 0,
	title,
	menuItemId,
	contexts = ["selection", "selection"],
	titles = ["红色高亮", "蓝色高亮"],
	menuItemIds = ["red", "blue"],
	twopatterns = {
		"red": {
			"desc": "红色高亮",
			"style": "background-color:red;color:white;",
			"pattern": ""
		},
		"blue": {
			"desc": "蓝色高亮",
			"style": "background-color:blue;color:white;",
			"pattern": ""
		}
	};


// 检查 url 是否满足正则表达式。
function checkUrl(url, patterns) {
	var reg = new RegExp(),
		index = 0;
	for(; index < patterns.length; index++)	{
		reg.compile(patterns[index]);
		if(reg.test(url)) {
			return true;
		}
	}
	return false;
};

// Check whether new version is installed.
chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install") {
		console.info("This is a first install!");
		//window.open(chrome.extension.getURL('options.html#about'));
	} else if (details.reason == "update") {
		var thisVersion = chrome.runtime.getManifest().version;
		console.info("Updated from " + details.previousVersion + " to " + thisVersion + "!");
		//window.open(chrome.extension.getURL('options.html#upgrade'));
	}

	window.open(chrome.extension.getURL('options.html'));
});

// 在已经打开的 tab 中进行切换时，更新 chrome.browserAction 的状态。
chrome.tabs.onActivated.addListener(function(activeInfo) {

	chrome.tabs.get(activeInfo.tabId, function(tab) {

		// console.info("onActivated");
		chrome.browserAction.setBadgeText({
			text: ""
		});

		if (tab.url && tab.url.indexOf('chrome') != 0) {

			storage.get('hlconfig', function(items) {
				// To avoid checking items.hlconfig we could specify storage.get({hlconfig: ''}) to
				// return a default value of '' if there is no hlconfig value yet.
				var active_url_patterns;
				
				if (items.hlconfig) {
					active_url_patterns = items.hlconfig.activeUrls.split(";");

					if(checkUrl(tab.url, active_url_patterns)) {
						// console.info("Tab change!...");
						chrome.browserAction.setBadgeText({
							text: "ON"
						});

						var now = +new Date();
						if (now - evTimeStamp < 100) {
        					return;
    					}
    					evTimeStamp = now;

						chrome.tabs.executeScript(null, {
							file: "js/content_script.js"
						});
					}

					return;

				} else {
					return;
				}
			});
		}
	});
});

// tab 更新时，重新进行高亮渲染。
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// console.info("chrome.tabs.onUpdated");
	chrome.browserAction.setBadgeText({
		text: ""
	});
	if (tab.url.indexOf('chrome') != 0) {
		// console.info(tab.url);
		storage.get('hlconfig', function(items) {
			var active_url_patterns;
			if (items.hlconfig) {
				active_url_patterns = items.hlconfig.activeUrls.split(";");

				if (checkUrl(tab.url, active_url_patterns)) {

					// console.info("refresh .............");

					chrome.browserAction.setBadgeText({
						text: "ON"
					});

					var now = +new Date();
					if (now - evTimeStamp < 100) {
        				return;
    				}
    				evTimeStamp = now;

    				
					chrome.tabs.executeScript(null, {
						file: "js/content_script.js"
					});
					
				}

				return;

			} else {
				return;
			}
		});
	}
});

// 根据 desc 属性判断 pattern 是否存在。
function containsRedOrBlue(custom_patterns, targetDesc) {

	var result = {
		"contain": false,
		"index": -1
	}, i = 0, len = custom_patterns.length;

	for (; i < len; i++) {
		if (custom_patterns[i].desc == targetDesc) {
			result.contain = true;
			result.index = i;
			break;
		}
	}

	return result;
};


//========================== 
//contextMenus
//==========================

// Post selectionText to Server.
function genericOnClick(info, tab) {
	// console.log("item " + info.menuItemId + " was clicked");
	// console.log("info: " + JSON.stringify(info));
	// console.log("tab: " + JSON.stringify(tab));

	var targetPattern = twopatterns[info.menuItemId].pattern,
		patternArray = targetPattern == "" ? [] : targetPattern.split(";");

	if (patternArray.indexOf(info.selectionText) == -1) {
		patternArray.push(info.selectionText);
		twopatterns[info.menuItemId].pattern = patternArray.join(";");
	}

	chrome.tabs.sendMessage(tab.id, {
		"hl": twopatterns[info.menuItemId]
	});

	storage.get('hlconfig', function(items) {
		var custom_patterns,
			isContainObject,
			request_url;

		if (items.hlconfig) {

			custom_patterns = items.hlconfig.customPatterns;

			custom_patterns = custom_patterns ? custom_patterns : "[]";
			custom_patterns = JSON.parse(custom_patterns);

			isContainObject = containsRedOrBlue(custom_patterns, twopatterns[info.menuItemId].desc);

			if (isContainObject.contain) {
				custom_patterns[isContainObject.index].pattern = twopatterns[info.menuItemId].pattern;
			} else {
				custom_patterns.push(twopatterns[info.menuItemId]);
			}

			items.hlconfig.customPatterns = JSON.stringify(custom_patterns);

			storage.set({
				'hlconfig': items.hlconfig
			}, function() {
				console.info('Settings saved');
			});

			request_url = items.hlconfig.requestUrl;
			if (request_url) {
				request_url += "?action=update&value=" + JSON.stringify(twopatterns[info.menuItemId]);
				var xhr = new XMLHttpRequest();
				xhr.open("POST", request_url, true);
				xhr.onreadystatechange = function() {
					// console.info(JSON.parse(xhr.responseText));
				}
				xhr.send(null);
			}
		}
	});
};

chrome.contextMenus.removeAll(function() {
	// console.info("remove all contextMenus!");
});

// 绑定右键菜单：红色高亮和蓝色高亮
for (var i = 0; i < contexts.length; i++) {
	context = contexts[i],
	title = titles[i],
	menuItemId = menuItemIds[i];

	id = chrome.contextMenus.create({
		"id": menuItemId,
		"title": title,
		"contexts": [context],
		"onclick": genericOnClick
	});
};


// notHighlight
function notHighlight(info, tab) {

	// console.info(info.selectionText);

	menuItemIds.forEach(function(menuItemId) {

		// console.info(menuItemId);
		
		var targetPattern,
			patternArray,
			index = 0;

			// console.info(twopatterns);

		targetPattern = twopatterns[menuItemId].pattern;
		// console.info(targetPattern);
		patternArray = targetPattern == "" ? [] : targetPattern.split(";");

		index = patternArray.indexOf(info.selectionText);
		if (index >= 0) {
			patternArray.splice(index, 1);
		}
		twopatterns[menuItemId].pattern = patternArray.join(";");
	});

	chrome.tabs.sendMessage(tab.id, {
		"uhlword": info.selectionText
	});

};

// 绑定右键菜单：取消高亮
notHighlightId = chrome.contextMenus.create({
	"title": "取消高亮",
	"contexts": ["selection"],
	"onclick": notHighlight
});

// Intentionally create an invalid item, to show off error checking in the
// create callback.
// console.log("About to try creating an invalid item - an error about " + "item 999 should show up");

// chrome.contextMenus.create({
// 	"title": "Oops",
// 	"parentId": 999
// }, function() {
// 	if (chrome.extension.lastError) {
// 		console.log("Got expected error: " + chrome.extension.lastError.message);
// 	}
// });

// bug report notification
show = function() {

	chrome.notifications.clear("bug_report", function(wasCleared) {});

	var notification = chrome.notifications.create("bug_report", {
		type: "image",
		title: "报告 bug",
		message: "发送至：" + chrome.i18n.getMessage(emailToMeMsg),
		iconUrl: "img/thumbs-up.jpg",
		buttons: [{
			title: "跳转到邮箱"
		}, {
			title: "取消发送"
		}],
		imageUrl: "img/send2me.png"
	}, function(notificationId) {
		console.info(notificationId + " was created!");
	});
};

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
	var action_url;

	// send email
	if (buttonIndex == 0) {
		action_url = "mailto:" + chrome.i18n.getMessage(emailToMeMsg) + "?";
		action_url += "subject=" + encodeURIComponent("Highlight Emr Bug Report!");
		//console.info(action_url);
		chrome.tabs.create({
			url: action_url
		});
		return;

	}
	// cancel
	if (buttonIndex == 1) {
		chrome.notifications.clear(notificationId, function(wasCleared) {
			if (wasCleared) {
				console.info("notification-" + notificationId + " was cleared!");
			}
		});
		return;
	}
});