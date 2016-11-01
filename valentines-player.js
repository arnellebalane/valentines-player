const $overlay = $('.overlay');
const $playlist = $('.playlist');
const $playlistToggle = $('.playlist-toggle');
const $player = $('.player-container');

const PLAYLIST_FILE = 'playlist.json';
const VISUALIZATION_SLICES = 300;
const VISUALIZATION_FPS = 60;


fetchPlaylistFile(PLAYLIST_FILE)
    .then(fetchPlaylistAudioFiles)
    .then(playlist => {
        player.initialize(playlist);
        visualization.initialize();
    });



/** data-fetching helpers **/

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
        this._connectPlaylistAudioFiles();
        this._renderPlaylist();
        this.play(this.index);
    },

    _connectPlaylistAudioFiles() {
        this.playlist.forEach(item => {
            const source = this.context.createMediaElementSource(item.audio);
            source.connect(this.analyser);
        });
    },

    _renderPlaylist() {
        this.playlist.forEach(item => {
            const playlistItem = element(`<li>${item.title}</li>`);
            $playlist.append(playlistItem);
        });
    },

    current() {
        return this.playlist[this.index].audio;
    },

    play(index) {
        if (index === undefined) {
            this.current().play();
        } else if (index < this.playlist.length) {
            this.stop();
            this.playlist[index].audio.play();
            this.index = index;

            $$('li', $playlist).forEach(item => item.classList.remove('current'));
            $(`li:nth-of-type(${index + 1})`, $playlist).classList.add('current');
        }
    },

    pause() {
        this.current().pause();
    },

    stop() {
        this.current().pause();
        this.current().currentTime = 0;
    },

    prev() {
        const index = this.index > 0 ? this.index - 1 : this.playlist.length - 1;
        this.play(index);
    },

    next() {
        const index = (this.index + 1) % this.playlist.length;
        this.play(index);
    }
};



/** audio visualization component **/

const visualization = {
    initialize() {
        this.data = new Uint8Array(player.analyser.frequencyBinCount);
        this.step = Math.floor(this.data.length / VISUALIZATION_SLICES);
        this.nosignal = 128;
        this.slices = [];

        this._initializeContainer();
        this._runRenderLoop();
    },

    _initializeContainer() {
        const element = $('.element');
        const { width, height } = element.getBoundingClientRect();
        const sliceWidth = width / VISUALIZATION_SLICES;

        const container = document.createElement('div');
        container.classList.add('container');
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        element.parentNode.replaceChild(container, element);

        for (let i = 0; i < VISUALIZATION_SLICES; i++) {
            const offset = i * sliceWidth;

            const mask = document.createElement('div');
            mask.classList.add('mask');
            mask.style.width = `${sliceWidth}px`;
            mask.style.height = `${height}px`;
            mask.style.transform = `translateX(${offset}px)`;

            const clone = document.createElement('div');
            clone.classList.add('clone');
            clone.style.width = `${width}px`;
            clone.style.height = `${height}px`;
            clone.style.transform = `translateX(${-offset}px)`;

            mask.appendChild(clone);
            container.appendChild(mask);

            this.slices.push({ offset, element: mask });
        }
    },

    _runRenderLoop() {
        let then = null;
        const renderLoop = _ => {
            requestAnimationFrame(renderLoop);

            const now = new Date();
            if (!then || now - then >= 1000 / VISUALIZATION_FPS) {
                then = now;
                this.render();
            }
        };
        renderLoop();
    },

    render() {
        if (player.current().paused) {
            return null;
        }

        player.analyser.getByteTimeDomainData(this.data);

        for (let i = 0, n = 0; i < VISUALIZATION_SLICES; i++, n += this.step) {
            const { element, offset } = this.slices[i];
            const data = this.data[n] === undefined ? this.nosignal : this.data[n];
            const value = Math.abs(data) / this.nosignal;
            element.style.transform = `translateX(${offset}px) scaleY(${value})`;
        }
    }
};



/** user interface interactions **/

$playlistToggle.addEventListener('click', function() {
    this.classList.toggle('open');
    $playlist.classList.toggle('open');
    $player.classList.toggle('shrinked');
});

delegate($playlist, 'click', 'li', function() {
    const index = $$('li', $playlist).indexOf(this);
    player.play(index);
});

delegate($player, 'click', '[data-action]', function() {
    player[this.dataset.action]();
});

delegate($player, 'click', '.container', _ => {
    if (player.current().paused) {
        player.play();
    } else {
        player.pause();
    }
});



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

function delegate(root, eventname, target, callback) {
    $(root).addEventListener(eventname, e => {
        if (e.target.closest(target) && typeof callback === 'function') {
            callback.call(e.target.closest(target), e);
        }
    });
}

function element(template, stage) {
    stage = stage || document.createElement('div');
    stage.innerHTML = template;
    return stage.firstElementChild;
}
