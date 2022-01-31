const CONSTANTS = {
  YA_MUSIC_URL: "https://music.yandex.com/home",
  YA_MUSIC_BASE_URL: "https://music.yandex.com",
  YA_MUSIC_TAB_ID_KEY: "YA_MUSIC_TAB_ID"
}

let gYandexMusicTab;

let ExtensionController = new (function () {
  
  let mInstance = null;
  
  function ExtensionControllerImpl() {
      let _self = this;

      /**
       * Locates an existing Yandex Music tab and updates the media session action handlers and metadata.
       * Note: This method will create a new Yandex Music tab after installation.
       */
      this.update = () => {
        chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, async (tabs) => {
          tabs.forEach(tab => {
            if (tab.url.includes("music.yandex.com")) {
              gYandexMusicTab = tab;
              console.log("Using existing Yandex music tab");
              return false;
            }
          });

          if (gYandexMusicTab == null) {
            gYandexMusicTab = await chrome.tabs.create({ url: CONSTANTS.YA_MUSIC_URL });
            console.log("Created a tab with yandex music");
          }

          chrome.storage.sync.set({"YA_MUSIC_TAB_ID": gYandexMusicTab.id}, function(result) {
            // TODO: set the tab id for further use in popup.js
            console.log("Set the tab ID: ", result);
          });

          _self.updateMediaSession();
        });
      }

      /**
       * Remove the unneeded variables.
       */
      this.destroy = () => {
        gYandexMusicTab = null;
      }

      /**
       * Inject the media session initializer js to the DOM of the page
       */
      this.updateMediaSession = () => {
          let mediaSessionScript = chrome.runtime.getURL('js/media-session.js');
          chrome.scripting.executeScript({
            target: {tabId: gYandexMusicTab.id},
            func: injectScript,
            args: [mediaSessionScript]
          }, function (result) {
            console.log("Injection completed:", result);
          });
      }
  }

  return {
      getInstance: () => {
          if (mInstance == null) {
            mInstance = new ExtensionControllerImpl();
          }
          return mInstance;
      }
  } 
})()

async function tryInitTab() {
  await chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT}, async (tabs) => {
    tabs.forEach(tab => {
      if (tab.url.includes("music.yandex.com")) {
        gYandexMusicTab = tab;
        console.log("Initialized the Yandex music tab");
      }
    });
  });
}

function injectScript(uri) {
  let exisitingScript = document.querySelector('script[src="' + uri + '"]');
  if (exisitingScript) {
    document.body.removeChild(exisitingScript);
  }

  let script = document.createElement('script');
  script.src = uri;
  document.body.appendChild(script);
}

chrome.runtime.onInstalled.addListener(async () => {
  ExtensionController.getInstance().update();
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  await tryInitTab();
  if (!gYandexMusicTab) {
    return;
  }

  if (tabId != gYandexMusicTab.id) {
    return;
  }

  ExtensionController.getInstance().update();
});

chrome.tabs.onRemoved.addListener(async function(tabId, removeInfo) {
  await tryInitTab();
  if (!gYandexMusicTab) {
    return;
  }

  if (tabId != gYandexMusicTab.id) {
    return;
  }

  ExtensionController.getInstance().destroy();
});
