let isDubbingActive = false;
let lastSubtitle = null;
let lastSubtitleTime = null;
let previousSubtitleTime = null;
let defaultSpeechRate = 1.0;
let currentTimeVideo = 0;
let currentRateVideo = 0;
let selectedVoice = null;
let selectedLanguage = "pt-BR";
let subtitles;
let nextSubtitleIndex = 0;


function stopDubbing() {
    isDubbingActive = false;
}

function startDubbing() {
    isDubbingActive = true;
}

function calculateSpeechRate(duration, text, videoRate) {
    const minSpeechRate = 0.5;
    const maxSpeechRate = 10.0;
    const k = 56.185 * (videoRate ?? 1);
    const c = 27.215;
    let speechRate;
    if (duration && text?.length) {
        const t = ((duration / 3) / text?.length)
        if (t < c) {
            speechRate = 10
        } else {
            speechRate = k / (t - c);
        }
    } else {
        speechRate = 10
    }
    return Math.min(Math.max(speechRate, minSpeechRate), maxSpeechRate);
}

function dub(text, voiceRate) {
    if (isDubbingActive) {
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.lang = selectedLanguage;
        utterance.rate = voiceRate;
        speechSynthesis.speak(utterance);
    }
}

function loadOptions(selectedVoiceLocal) {
    if (selectedVoiceLocal) {
        const voices = speechSynthesis.getVoices();
        const findSelectedVoice = voices.find(voice => voice.voiceURI === selectedVoiceLocal);
        if (findSelectedVoice) {
            selectedVoice = findSelectedVoice;
        }
    }
}

function processVideoSubtitles(videoPlayer) {
    currentTimeVideo = videoPlayer.currentTime * 1000;
    currentRateVideo = videoPlayer?.playbackRate || 1

    for (let i = nextSubtitleIndex; i < subtitles?.events?.length; i++) {
        const event = subtitles.events[i];
        if (event.segs && currentRateVideo < 3) {
            const text = event.segs.map(seg => seg.utf8).join(' ');
            const subtitleStartTime = event.tStartMs;
            const subtitleDuration = event.dDurationMs;

            const totalStartTime = subtitleStartTime;
            const totalEndTime = subtitleStartTime + subtitleDuration;

            if (currentTimeVideo >= totalStartTime && currentTimeVideo <= totalEndTime && text.trim().length) {
                const startDelayTime = totalStartTime - currentTimeVideo;
                const rate = calculateSpeechRate(subtitleDuration, text, currentRateVideo);
                setTimeout(() => {
                    dub(text, rate);
                }, startDelayTime);
                nextSubtitleIndex = i + 1;
                break;
            }
        }
    }
}

function initVideoPlayer() {
    const videoPlayer = document.querySelector("video.video-stream.html5-main-video");
    if (videoPlayer) {
        videoPlayer.addEventListener("timeupdate", () => processVideoSubtitles(videoPlayer));
    }
}

window.onload = function () {
    setTimeout(() => {
        initVideoPlayer();
    }, 1000);
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "startDubbing") {
        subtitles = message.content;
        nextSubtitleIndex = 0;
    }

    if (message.type === 'updateVoice') {
        loadOptions(message.content)
    }

    if (message.type === 'dubState') {
        message.content ? startDubbing() : stopDubbing();
    }
});
