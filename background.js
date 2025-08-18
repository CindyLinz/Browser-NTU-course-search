// NTU Course Search Helper - Background Script

console.log('Background script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'conflict-show-select') {
        // 轉發給所有相關的 content scripts
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, message).catch(() => {}); // 忽略錯誤（tab 可能沒有 content script）
            });
        });
    }
});
