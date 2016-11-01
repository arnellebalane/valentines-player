const $overlay = $('.overlay');
const $playlist = $('.playlist');
const $playlistToggle = $('.playlist-toggle');
const $player = $('.player-container');

const PLAYLIST_FILE = 'playlist.json';


fetchPlaylistFile(PLAYLIST_FILE)
    .then(fetchPlaylistAudioFiles)
    .then(playlist => player.initialize(playlist));


function fetchPlaylistFile(path) {
    return fetch(path).then(response => response.json());
}


function fetchPlaylistAudioFile(path) {
    return fetch(path).then(response => response.blob());
}


function fetchPlaylistAudioFiles(playlist) {
    return Promise.all(playlist.map(item => {
        return fetchPlaylistAudioFile(item.url).then(blob => {
            item.audio = new Audio();
            item.audio.src = URL.createObjectURL(blob);
            return item;
        });
    }));
}



/** audio player component **/

const player = {
    initialize(playlist) {
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.connect(this.context.destination);

        this.playlist = playlist;
        this.index = 0;

        $overlay.classList.add('removed');
        this.connectPlaylistAudioFiles();
        this.renderPlaylist();
        this.play(this.index);
    },

    connectPlaylistAudioFiles() {
        this.playlist.forEach(item => {
            const source = this.context.createMediaElementSource(item.audio);
            source.connect(this.analyser);
        });
    },

    renderPlaylist() {
        this.playlist.forEach(item => {
            const playlistItem = element(`<li>${item.title}</li>`);
            $playlist.append(playlistItem);
        });
    },

    play(index) {
        if (index === undefined) {
            this.current.play();
        } else if (index < this.playlist.length) {
            this.playlist[this.index].audio.pause();
            this.playlist[this.index].audio.currentTime = 0;
            this.playlist[index].audio.play();
            this.index = index;

            $$('li', $playlist).forEach(item => item.classList.remove('current'));
            $(`li:nth-of-type(${index + 1})`, $playlist).classList.add('current');
        }
    }
};



/** utility functions **/

function $(selector, context) {
    if (typeof selector === 'string') {
        return (context || document).querySelector(selector);
    }
    return selector;
}


function $$(selector, context) {
    const results = (context || document).querySelectorAll(selector);
    return Array.prototype.slice.call(results);
}


function element(template, stage) {
    stage = stage || document.createElement('div');
    stage.innerHTML = template;
    return stage.firstElementChild;
}
