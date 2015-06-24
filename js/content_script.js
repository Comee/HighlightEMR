var storage = chrome.storage.local;
var keywords = keywords || []; //所有关键匹配的正则表达式

// 判断规则集合里的规则是否可以匹配该关键字
function containAWord(word) {
	var result = false;
	for (var i = 0; i < keywords.length; i++) {
		if (keywords[i].test(word)) {
			result = true;
			break;
		}
	}
	return result;
};

// 高亮实现
function searchHighlight(htmlElement, keyword, style) {
	var pucl = htmlElement;
	if ("" == keyword) return;
	var temp = pucl.innerHTML;
	var htmlReg = new RegExp("\<.*?\>", "i");
	var arrA = new Array();

	//替换HTML标签
	for (var i = 0; true; i++) {
		var m = htmlReg.exec(temp);
		if (m) {
			arrA[i] = m;
		} else {
			break;
		}
		temp = temp.replace(m, "{[(" + i + ")]}");
	}

	words = unescape(keyword.replace(/\+/g, ' ')).split(";");
	//替换关键字
	for (w = 0; w < words.length; w++) {
		if (!containAWord(words[w])) {
			// var r = new RegExp("(" + words[w].replace(/[(){}.+*?^$|\\\[\]]/g, "\\$&") + ")", "ig"); //不启用正则表达式
			var r = new RegExp("(" + words[w] + ")", "ig"); //启用正则
			temp = temp.replace(r, "<em style=\"" + style + "\">$1</em>");

			keywords.push(r); //高亮规则->避免重复高亮
		}
	}

	//恢复HTML标签
	for (var i = 0; i < arrA.length; i++) {
		temp = temp.replace("{[(" + i + ")]}", arrA[i]);
	}

	pucl.innerHTML = temp;
};

// 对 searchHighlight 的简单封装
function searchHighlightArray(jsonArray) {
	jsonArray.forEach(function(hl) {
		searchHighlight(document.body, hl.pattern, hl.style);
	});
};

// 默认的高亮模式
function defaultHighligt() {
	var highlight = '[{"desc":"腹泻","style":"background-color:blue;color:white;","pattern":"腹泻;腹痛"},{"desc":"泌尿道感染","style":"background-color:red;color:white;","pattern":"泌尿系感染;泌尿系统感染;尿频;尿急;尿痛"},{"desc":"下呼吸道感染","style":"background-color:yellow;","pattern":"肺部感染;下呼吸道感染;咳嗽;咳痰;咯痰;痰鸣音;肺部阴影;双肺炎症可能;双肺炎症;感染性休克;湿\\\\W音;干罗音"},{"desc":"上呼吸道感染","style":"background-color:deeppink;color:white;","pattern":"上呼吸道感染;感冒;上感;流涕;咽喉部不适;咽部稍红"},{"desc":"伤口感染","style":"background-color:lightsalmon;","pattern":"切口感染;切口裂开;切口渗出;刀口红肿;切口下端有明显渗出;肌肉层锋线全部裂开"},{"desc":"颅内感染","style":"background-color:deepskyblue;color:white;","pattern":"颅内感染;蛛网膜下腔感染"},{"desc":"腹腔感染","style":"background-color:darkgoldenrod;color:white;","pattern":"腹腔感染"}]';
	var jsonArray = JSON.parse(highlight);

	searchHighlightArray(jsonArray);
};


storage.get('hlconfig', function(items) {
	// To avoid checking items.hlconfig we could specify storage.get({hlconfig: ''}) to
	// return a default value of '' if there is no hlconfig value yet.

	if (items.hlconfig) {
		var use_default = items.hlconfig.useDefault;
		var custom_patterns = items.hlconfig.customPatterns;
		var request_url = items.hlconfig.requestUrl;

		if (use_default) {
			defaultHighligt();
		}

		if (custom_patterns) {
			var custom_patterns_array = JSON.parse(custom_patterns);
			searchHighlightArray(custom_patterns_array);
		}

		// Ajax 获取高亮 元素
		if (request_url) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", request_url, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					// JSON.parse does not evaluate the attacker's scripts.
					var resp = JSON.parse(xhr.responseText);
					searchHighlightArray(resp);
				}
			}
			xhr.send();
		}

	} else {
		defaultHighligt();
	}

});


chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	var hl = request.hl;
	var uhlword = request.uhlword;
	var alertMsg = request.alertMsg;

	// 高亮
	if (hl) {
		searchHighlight(document.body, hl.pattern, hl.style);
	}

	// 取消高亮
	if (uhlword) {
		resetHighlight(document.body, uhlword);
	}

});


// notHighlight
function resetHighlight(htmlElement, keyword) {
	// 正则表达式：/(<em\sstyle=['|\"][^\s|>|<]*?>(切口裂开)<\/em>)/;
	var regStr = "(<em\\sstyle=['|\\\"][^\\s|>|<]*?>(" + keyword + ")<\\/em>)";
	// console.info(regStr);
	var re = new RegExp(regStr, "ig");
	var str = htmlElement.innerHTML;

	var m;

	while ((m = re.exec(str)) !== null) {
		// if (m.index === re.lastIndex) {
		// 	re.lastIndex++;
		// }
		// console.info(m.index);
		// console.info(m[1]);
		// console.info(m[2]);
		str = str.replace(m[1], m[2]);
		re.lastIndex = re.lastIndex + (m[2].length - m[1].length);
	}

	htmlElement.innerHTML = str;

	// document.location.reload(); // 需要刷新，不如上面的页面替换高效。

	storage.get('hlconfig', function(items) {

		// 删除元素
		if (items.hlconfig) {
			var custom_patterns = items.hlconfig.customPatterns;
			var request_url = items.hlconfig.requestUrl;

			if (custom_patterns) {
				var custom_patterns_array = JSON.parse(custom_patterns);
				for (var i = 0; i < custom_patterns_array.length; i++) {
					var patterns = custom_patterns_array[i].pattern.split(";");

					// 在 customPatterns 中删除 keyword
					var index = patterns.indexOf(keyword);
					if (index >= 0) {
						patterns.splice(index, 1);
					}

					custom_patterns_array[i].pattern = patterns.join(";");

					custom_patterns = JSON.stringify(custom_patterns_array);

					// console.info(custom_patterns);
					items.hlconfig.customPatterns = custom_patterns;

					storage.set({
						'hlconfig': items.hlconfig
					});
				}
			}

			if (request_url) {
				request_url += "?action=remove&value=" + keyword;
				var xhr = new XMLHttpRequest();
				xhr.open("POST", request_url, true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						// JSON.parse does not evaluate the attacker's scripts.
						var resp = JSON.parse(xhr.responseText);

						console.info(resp);
					}
				}
				xhr.send(null);
			}
		}
	});
};