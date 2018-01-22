var runtimePort;
var isInit = false;
var isReady = true;
var screenOptions = ['screen', 'window'];

chrome.runtime.onConnect.addListener(function(port) {
    runtimePort = port;
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

    runtimePort.onMessage.addListener(function(message) {
        if(message == 'get-sourceId' && isReady) {          
            isReady = false  
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, onAccessApproved);
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
    })



    // runtimePort.onMessage.addListener(function(message) {
    //     if (!message || !message.messageFromContentScript1234) {
    //         return;
    //     }

    //     if (message.startRecording) {
    //         if (!!isRecordingVOD) {
    //             stopVODRecording();
    //             return;
    //         }

    //         getUserConfigs();
    //         return;
    //     }

    //     if (message.stopRecording) {
    //         if (recorder && recorder.streams) {
    //             recorder.streams.forEach(function(stream, idx) {
    //                 stream.getTracks().forEach(function(track) {
    //                     track.stop();
    //                 });

    //                 if (idx == 0 && typeof stream.onended === 'function') {
    //                     stream.onended();
    //                 }
    //             });

    //             recorder.streams = null;
    //         }

    //         isRecording = false;
    //         setBadgeText('');
    //         chrome.browserAction.setIcon({
    //             path: 'images/main-icon.png'
    //         });
    //         return;
    //     }
    // });
});
