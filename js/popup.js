var cob = document.getElementById("cob"),
	bug = document.getElementById("bug");

function cobButtonClick(e) {

	var option_url = chrome.extension.getURL('options.html');

	chrome.tabs.query({
		url: option_url
	}, function(tabs) {
		if (tabs.length) {
			chrome.tabs.update(tabs[0].id, {
				active: true
			});
		} else {
			//chrome.tabs.create({url: option_url});
			window.open(option_url);
		}
	});
	window.close();
};

function bugButtonClick(e) {
	if (window.Notification) {
		//show();
		var bkg = chrome.extension.getBackgroundPage();
		bkg.show();
		
	}
	window.close();
};


cob.parentNode.parentNode.addEventListener('click', cobButtonClick);
bug.parentNode.parentNode.addEventListener('click', bugButtonClick);

document.addEventListener('DOMContentLoaded', function() {

	var spans = document.querySelectorAll('a>span'),
		i = 0,
		msg;

	for (; i < spans.length; i++) {
		msg = "id_" + spans[i].id;
		spans[i].innerHTML = chrome.i18n.getMessage(msg);
	}
});