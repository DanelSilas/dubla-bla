function populateVoices(voiceSelect, synth) {
    console.log('entrei')
    const voices = synth.getVoices();
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} - ${voice.lang}`;
        console.log('option.textContent', option.textContent)
        option.setAttribute('value', voice.voiceURI);
        voiceSelect.appendChild(option);
    });
}

function sendMessageToContentScript(content, type) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: type, content });
    });
}

function loadSavedVoice(voiceSelect) {
    const savedVoice = localStorage.getItem('selectedVoice');
    if (savedVoice) {
        voiceSelect.value = savedVoice;
        sendMessageToContentScript(savedVoice, 'updateVoice');
    }
}

function loadDubState(initButton) {
    const currentState = localStorage.getItem('dubState');
    if (currentState === 'active') {
        initButton.textContent = 'Desativar';
    } else {
        initButton.textContent = 'Ativar';
    }
}

function toggleDubbing(controlButton) {
    const currentState = localStorage.getItem('dubState');
    if (currentState === 'active') {
        localStorage.setItem('dubState', 'inactive');
        controlButton.textContent = 'Ativar';
        sendMessageToContentScript(false, 'dubState');
    } else {
        localStorage.setItem('dubState', 'active');
        controlButton.textContent = 'Desativar';
        sendMessageToContentScript(true, 'dubState');
    }
}

function changeVoice(voiceSelect) {
    const selectedVoice = voiceSelect.value;
    localStorage.setItem('selectedVoice', selectedVoice);
    sendMessageToContentScript(selectedVoice, 'updateVoice');
}

function init() {
    const voiceSelect = document.getElementById('voice');
    const controlButton = document.getElementById('control');
    const synth = window.speechSynthesis;

    populateVoices(voiceSelect, synth);
    loadDubState(controlButton);
    loadSavedVoice(voiceSelect);

    synth.onvoiceschanged = function () {
        populateVoices(voiceSelect, synth);
        loadSavedVoice(voiceSelect);
    };

    voiceSelect.addEventListener('change', () => changeVoice(voiceSelect));

    controlButton.addEventListener('click', () => toggleDubbing(controlButton));
}

init();
