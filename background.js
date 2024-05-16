let url = '';

function enviarLegendasAoContentScript(data) {
    const subtitles = JSON.parse(data);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "startDubbing", content: subtitles });
    });
}

chrome.webRequest.onCompleted.addListener(
    function (details) {
        if (details.statusCode === 200 && details.url.startsWith('https://www.youtube.com/api/timedtext') && url !== details.url) {
            fetch(details.url)
                .then(response => response.text())
                .then(data => {
                    url = details.url
                    enviarLegendasAoContentScript(data);
                })
                .catch(error => console.error('Erro ao solicitar legendas:', error));

        }
    },
    { urls: ["<all_urls>"] },
);
