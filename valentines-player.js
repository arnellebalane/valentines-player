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
    return fetch(path).then(response => response.arrayBuffer());
}


function fetchPlaylistAudioFiles(playlist) {
    return Promise.all(playlist.map(item => {
        return fetchPlaylistAudioFile(item.url).then(buffer => {
            item.buffer = buffer;
            return item;
        });
    }));
}


const player = {
    initialize(playlist) {
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.connect(this.context.destination);

        this.playlist = playlist;
        this.index = 0;

        $overlay.classList.add('removed');
        this.renderPlaylist();
        this.play(this.index);
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
        } else {
            console.log(`playing item ${index}`);
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


function element(template, stage) {
    stage = stage || document.createElement('div');
    stage.innerHTML = template;
    return stage.firstElementChild;
}
