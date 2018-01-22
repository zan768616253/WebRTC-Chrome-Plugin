// this background script is used to invoke desktopCapture API
// to capture screen-MediaStream.

var screenOptions = ['screen', 'window'];
var isReady = true;
var isInit = false;

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(portOnMessageHanlder);
    
    // this one is called for each message from "content-script.js"
    function portOnMessageHanlder(message) {
        if(message == 'get-sourceId' && isReady) {          
            isReady = false  
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
        }

        if(message == 'audio-plus-tab') {        
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
        }
    }

    if (!isInit) {
        chrome.browserAction.onClicked.addListener(function(){
            chrome.storage.sync.get(null, function(items) {
                if (items['isRecording'] == 'true') {
                    chrome.storage.sync.set({
                        isRecording: 'false' // FALSE
                    }, function() {
                        if (recorder && recorder.streams) {
                            recorder.streams.forEach(function(stream, idx) {
                                stream.getTracks().forEach(function(track) {
                                    track.stop();
                                });
        
                                if (idx == 0 && typeof stream.onended === 'function') {
                                    stream.onended();
                                }
                            });
                            recorder.streams = null;
                        }
        
                        isRecording = false;
                        setBadgeText('');
                        chrome.browserAction.setIcon({
                            path: 'images/main-icon.png'
                        });
                        return;
                    });
      
                } else {
                    chrome.storage.sync.set({
                        enableTabCaptureAPI: 'true', // TRUE
                        enableMicrophone: 'false',
                        enableCamera: 'false',
                        enableScreen: 'false',
                        isRecording: 'true', // TRUE
                        enableSpeakers: 'false'
                    }, function() {
                        if (!!isRecordingVOD) {
                            stopVODRecording();
                            return;
                        }
        
                        getUserConfigs();
                        return;
                    });
                }
            })
        })
        isInit = true;
    }

    // on getting sourceId
    // "sourceId" will be empty if permission is denied.
    function onAccessApproved(sourceId) {
        isReady = true;
        
        // if "cancel" button is clicked
        if(!sourceId || !sourceId.length) {
            return port.postMessage('PermissionDeniedError');
        }
        
        // "ok" button is clicked; share "sourceId" with the
        // content-script which will forward it to the webpage
        port.postMessage({
            sourceId: sourceId
        });
    }
});