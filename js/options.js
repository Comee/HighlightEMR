// Store CSS data in the "local" storage area.
//
// Usually we try to store settings in the "sync" area since a lot of the time
// it will be a better user experience for settings to automatically sync
// between browsers.
//
// However, "sync" is expensive with a strict quota (both in storage space and
// bandwidth) so data that may be as large and updated as frequently as the CSS
// may not be suitable.

var storage = chrome.storage.local;

// Get at the DOM controls used in the sample.
var resetButton = document.querySelector('button.reset');
var submitButton = document.querySelector('button.submit');
var textarea = document.querySelector('textarea');
var activeUrls = document.getElementById("activeUrls");
var requestUrl = document.getElementById("requestUrl");
var useDefault = document.getElementById("useDefault");

// Load any CSS that may have previously been saved.
loadChanges();

submitButton.addEventListener('click', saveChanges);
resetButton.addEventListener('click', reset);

function saveChanges() {
  // Get the current hlconfig snippet from the form.
  var custom_patterns = textarea.value;
  var active_urls = activeUrls.value;
  var request_url = requestUrl.value;
  var use_default = useDefault.checked;

  // console.info(request_url);
  // console.info(use_default);
  // console.info(custom_patterns);

  // Check that there's some code there.
  if (!active_urls) {
    message('Error: No activeUrls specified');
    return;
  }

  if (!custom_patterns && !request_url && !use_default) {
    message('Warn: Nothing need to save');
    return;
  }

  var hlconfig = hlconfig || {};

  hlconfig.customPatterns = custom_patterns;
  hlconfig.activeUrls = active_urls;
  hlconfig.requestUrl = request_url;
  hlconfig.useDefault = use_default;

  // Save it using the Chrome extension storage API.
  storage.set({
    'hlconfig': hlconfig
  }, function() {
    // Notify that we saved.
    message('Settings saved');
  });
}

function loadChanges() {
  storage.get('hlconfig', function(items) {
    // To avoid checking items.hlconfig we could specify storage.get({hlconfig: ''}) to
    // return a default value of '' if there is no hlconfig value yet.
    if (items.hlconfig) {
      textarea.value = items.hlconfig.customPatterns;
      activeUrls.value = items.hlconfig.activeUrls;
      requestUrl.value = items.hlconfig.requestUrl;
      useDefault.checked = items.hlconfig.useDefault;
      message('Loaded saved hlconfig.');
    }
  });
}

function reset() {
  // Remove the saved value from storage. storage.clear would achieve the same
  // thing.
  storage.remove('hlconfig', function(items) {
    message('Reset stored hlconfig');
  });
  // Refresh the text area.
  textarea.value = '';
  activeUrls.value = '';
  requestUrl.value = '';
  useDefault.checked = true;

}

function message(msg) {
  var message = document.querySelector('.message');
  message.innerText = msg;
  setTimeout(function() {
    message.innerText = '';
  }, 3000);
}