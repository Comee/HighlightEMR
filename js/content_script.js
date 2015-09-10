var storage = chrome.storage.local,
	evTimeStamp = 0,
	keywords = keywords || []; //所有关键匹配的正则表达式

// 判断规则集合里的规则是否可以匹配该关键字
function containAWord(word) {
	var result = false,
		i = 0;

	for (; i < keywords.length; i++) {
		if (keywords[i].test(word)) {
			result = true;
			break;
		}
	}
	return result;
};

// 高亮实现
function searchHighlight(htmlElement, keyword, style) {
	var now = +new Date();
	if (now - evTimeStamp < 1000) {
        return;
    }
    evTimeStamp = now;

	var pucl = htmlElement,
		temp,
		index,
		w,
		i,
		m,
		r,
		sourcesAfterHighlight,
		htmlReg = new RegExp("\<.*?\>", "i"),
		arrA = [],
		sources = [];

	sources.push(pucl);

	if(window.frames && window.frames.length > 0 ) {
		for(i = 0; i < window.frames.length; i++) {
			// console.info(window.frames[i].document.body);
			sources.push(window.frames[i].document.body);
		}
	}

	temp = pucl.innerHTML;
	for(index = 1; index < sources.length; index++) {
		temp += "☃" + sources[index].innerHTML;
	}
	// console.info("before highlight: " + temp);

	//替换HTML标签
	for (i = 0; true; i++) {
		m = htmlReg.exec(temp);
		if (m) {
			arrA[i] = m;
		} else {
			break;
		}
		temp = temp.replace(m, "{[(" + i + ")]}");
	}
	// console.info("after tag replace: " + temp);


	if ("" == keyword) return;

	words = unescape(keyword.replace(/\+/g, ' ')).split(";");
	//替换关键字
	for (w = 0; w < words.length; w++) {
		if (!containAWord(words[w])) {
			// var r = new RegExp("(" + words[w].replace(/[(){}.+*?^$|\\\[\]]/g, "\\$&") + ")", "ig"); //不启用正则表达式
			r = new RegExp("(" + words[w] + ")", "ig"); //启用正则
			temp = temp.replace(r, "<em style=\"" + style + "\">$1</em>");

			keywords.push(r); //高亮规则->避免重复高亮
		}
	}

	//恢复HTML标签
	for (i = 0; i < arrA.length; i++) {
		temp = temp.replace("{[(" + i + ")]}", arrA[i]);
	}
	// console.info("after highlight: " + temp);

	sourcesAfterHighlight = temp.split("☃");

	if(sources.length == 1) {
		// frames 不可以再更新当前的页面的值，否则后面的关键字替换则不生效。
		pucl.innerHTML = sourcesAfterHighlight[0];
	}

	for(index = 1; index < sources.length; index++) {
		sources[index].innerHTML = sourcesAfterHighlight[index];
		// console.info("index="+index+" "+sourcesAfterHighlight[index]);
	}
	
	
};

// 对 searchHighlight 的简单封装
// @Deprecated 2015-09-04
function searchHighlightArrayOld(jsonArray) {
	jsonArray.forEach(function(hl) {
		searchHighlight(document.body, hl.pattern, hl.style);
	});
};

function searchHighlightArray(jsonArray) {

	var pucl = document.body,
		keyword,
		style,
		temp,
		index,
		w,
		i,
		m,
		r,
		sourcesAfterHighlight,
		htmlReg = new RegExp("\<.*?\>", "i"),
		arrA = [],
		replaceArray = [],
		added,
		sources = [];

	sources.push(pucl);

	if(window.frames && window.frames.length > 0 ) {
		for(i = 0; i < window.frames.length; i++) {
			
			// console.info(window.frames[i].document.body);
			sources.push(window.frames[i].document.body);
		}
	}

	temp = pucl.innerHTML;
	for(index = 1; index < sources.length; index++) {
		temp += "☃" + sources[index].innerHTML;
	}
	// console.info("before highlight: " + temp);

	//替换HTML标签
	for (i = 0; true; i++) {
		m = htmlReg.exec(temp);
		if (m) {
			arrA[i] = m;
		} else {
			break;
		}
		temp = temp.replace(m, "{[(" + i + ")]}");
	}
	// console.info("after tag replace: " + temp);

    // 不可以一个一个关键字高亮，这样会导致高亮的html标签存在被高亮的风险。
	jsonArray.forEach(function(hl) {
		keyword = hl.pattern;
		style = hl.style;

		if ("" == keyword) return;

		words = unescape(keyword.replace(/\+/g, ' ')).split(";");
		//找到关键字
		for (w = 0; w < words.length; w++) {
			if (!containAWord(words[w])) {
				// var r = new RegExp("(" + words[w].replace(/[(){}.+*?^$|\\\[\]]/g, "\\$&") + ")", "ig"); //不启用正则表达式
				r = new RegExp("(" + words[w] + ")", "ig"); //启用正则
				// console.info(style);
				// temp = temp.replace(r, "<em style=\"" + style + "\">$1</em>");

				while ((m = r.exec(temp)) !== null) {
					// if (m.index === r.lastIndex) {
					// 	r.lastIndex++;
					// }
					// console.info(m.index);
					// console.info(m[1]);

					replaceArray.push({start:m.index, end:m.index + m[1].length, replaced: "<em style=\"" + style + "\">" + m[1] + "</em>"});
				}

				keywords.push(r); //高亮规则->避免重复高亮
			}
		}
	});

	// 替换
	replaceArray.sort(compare("start"));
	added = 0;

	for(i = 0; i < replaceArray.length; i++) {
		temp = temp.substring(0, replaceArray[i].start + added) + replaceArray[i].replaced + temp.substring(replaceArray[i].end + added);
		added += replaceArray[i].replaced.length - (replaceArray[i].end - replaceArray[i].start);
	}

	//恢复HTML标签
	for (i = 0; i < arrA.length; i++) {
		temp = temp.replace("{[(" + i + ")]}", arrA[i]);
	}
	// console.info("after highlight: " + temp);

	sourcesAfterHighlight = temp.split("☃");

	if(sources.length == 1) {
		// frames 不可以再更新当前的页面的值，否则后面的关键字替换则不生效。
		pucl.innerHTML = sourcesAfterHighlight[0];
	}

	// pucl.innerHTML = sourcesAfterHighlight[0];
	// console.info(pucl);
	for(index = 1; index < sources.length; index++) {
		sources[index].innerHTML = sourcesAfterHighlight[index];
		// console.info("index="+index+" "+sourcesAfterHighlight[index]);
	}
};

// 默认的高亮模式
// @Deprecated 2015-09-04
function defaultHighligt() {
	var highlight = '[{"desc":"腹泻","style":"background-color:blue;color:white;","pattern":"腹泻;腹痛"},{"desc":"泌尿道感染","style":"background-color:red;color:white;","pattern":"泌尿系感染;泌尿系统感染;尿频;尿急;尿痛"},{"desc":"下呼吸道感染","style":"background-color:yellow;","pattern":"肺部感染;下呼吸道感染;咳嗽;咳痰;咯痰;痰鸣音;肺部阴影;双肺炎症可能;双肺炎症;感染性休克;湿\\\\W音;干罗音"},{"desc":"上呼吸道感染","style":"background-color:deeppink;color:white;","pattern":"上呼吸道感染;感冒;上感;流涕;咽喉部不适;咽部稍红"},{"desc":"伤口感染","style":"background-color:lightsalmon;","pattern":"切口感染;切口裂开;切口渗出;刀口红肿;切口下端有明显渗出;肌肉层锋线全部裂开"},{"desc":"颅内感染","style":"background-color:deepskyblue;color:white;","pattern":"颅内感染;蛛网膜下腔感染"},{"desc":"腹腔感染","style":"background-color:darkgoldenrod;color:white;","pattern":"腹腔感染"}]';
	var jsonArray = JSON.parse(highlight);

	searchHighlightArray(jsonArray);
};


storage.get('hlconfig', function(items) {
	// To avoid checking items.hlconfig we could specify storage.get({hlconfig: ''}) to
	// return a default value of '' if there is no hlconfig value yet.
	var use_default,
		custom_patterns,
		request_url,
		custom_patterns_array,
		xhr,
		resp,
		highlight,
		jsonArray,
		patternObjs = [];

	if (items.hlconfig) {
		use_default = items.hlconfig.useDefault;
		custom_patterns = items.hlconfig.customPatterns;
		request_url = items.hlconfig.requestUrl;

		if (use_default) {
			highlight = '[{"desc":"腹泻","style":"background-color:blue;color:white;","pattern":"腹泻;腹痛"},{"desc":"泌尿道感染","style":"background-color:red;color:white;","pattern":"泌尿系感染;泌尿系统感染;尿频;尿急;尿痛"},{"desc":"下呼吸道感染","style":"background-color:yellow;","pattern":"肺部感染;下呼吸道感染;咳嗽;咳痰;咯痰;痰鸣音;肺部阴影;双肺炎症可能;双肺炎症;感染性休克;湿\\\\W音;干罗音"},{"desc":"上呼吸道感染","style":"background-color:deeppink;color:white;","pattern":"上呼吸道感染;感冒;上感;流涕;咽喉部不适;咽部稍红"},{"desc":"伤口感染","style":"background-color:lightsalmon;","pattern":"切口感染;切口裂开;切口渗出;刀口红肿;切口下端有明显渗出;肌肉层锋线全部裂开"},{"desc":"颅内感染","style":"background-color:deepskyblue;color:white;","pattern":"颅内感染;蛛网膜下腔感染"},{"desc":"腹腔感染","style":"background-color:darkgoldenrod;color:white;","pattern":"腹腔感染"}]';
			jsonArray = JSON.parse(highlight);
			patternObjs = patternObjs.concat(jsonArray);

			// defaultHighligt();
		}

		if (custom_patterns) {
			custom_patterns_array = JSON.parse(custom_patterns);
			patternObjs = patternObjs.concat(custom_patterns_array);
			// searchHighlightArray(custom_patterns_array);
		}

		// Ajax 获取高亮 元素
		if (request_url) {
			xhr = new XMLHttpRequest();
			xhr.open("GET", request_url, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					// JSON.parse does not evaluate the attacker's scripts.
					resp = JSON.parse(xhr.responseText);
					patternObjs = patternObjs.concat(resp);
					//searchHighlightArray(resp);
				}
			}
			xhr.send();
		}

		// console.info(patternObjs);

		if(patternObjs.length > 0) {
			searchHighlightArray(patternObjs);
		}

	} else {
		return;
	}

});


chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	var hl = request.hl,
		uhlword = request.uhlword,
		alertMsg = request.alertMsg;

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
	var regStr = "(<em\\sstyle=['|\\\"][^\\s|>|<]*?>(" + keyword + ")<\\/em>)",
		re = new RegExp(regStr, "ig"),
		m,
		i,
		sourcesAfterReset,
		index,
		sources = [];

	//有fram要考虑

	sources.push(htmlElement);

	if(window.frames && window.frames.length > 0 ) {
		for(i = 0; i < window.frames.length; i++) {
			// console.info(window.frames[i].document.body);
			sources.push(window.frames[i].document.body);
		}
	}

	temp = htmlElement.innerHTML;
	for(index = 1; index < sources.length; index++) {
		temp += "☃" + sources[index].innerHTML;
	}

	// console.info(temp);

	while ((m = re.exec(temp)) !== null) {
		// if (m.index === re.lastIndex) {
		// 	re.lastIndex++;
		// }
		// console.info(m.index);
		// console.info(m[1]);
		// console.info(m[2]);
		temp = temp.replace(m[1], m[2]);
		re.lastIndex = re.lastIndex + (m[2].length - m[1].length);
	}

	// console.info(temp);

	sourcesAfterReset = temp.split("☃");

	if(sources.length == 1) {
		// frames 不可以再更新 当前的页面的值，否则后面的关键字替换则不生效。
		htmlElement.innerHTML = sourcesAfterReset[0];
	}

	for(index = 1; index < sources.length; index++) {
		sources[index].innerHTML = sourcesAfterReset[index];
	}

	// document.location.reload(); // 需要刷新，不如上面的页面替换高效。

	storage.get('hlconfig', function(items) {

		var custom_patterns,
			request_url,
			custom_patterns_array,
			i,
			index,
			resp,
			patterns;

		// 删除元素
		if (items.hlconfig) {
			custom_patterns = items.hlconfig.customPatterns;
			request_url = items.hlconfig.requestUrl;

			if (custom_patterns) {
				custom_patterns_array = JSON.parse(custom_patterns);

				for (i = 0; i < custom_patterns_array.length; i++) {
					patterns = custom_patterns_array[i].pattern.split(";");

					// 在 customPatterns 中删除 keyword
					index = patterns.indexOf(keyword);
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
				xhr = new XMLHttpRequest();
				xhr.open("POST", request_url, true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						// JSON.parse does not evaluate the attacker's scripts.
						resp = JSON.parse(xhr.responseText);

						console.info(resp);
					}
				}
				xhr.send(null);
			}
		}
	});
};

//定义一个比较器 
function compare(propertyName) { 
	return function (object1, object2) { 
		var value1 = object1[propertyName]; 
		var value2 = object2[propertyName]; 
		if (value2 < value1) { 
			return 1; 
		} 
		else if (value2 > value1) { 
			return -1; 
		} 
		else { 
			return 0; 
		} 
	} 
};