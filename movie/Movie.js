'use strict';

const MOVIE_FRAMERATE = 6;
const MOVIE_FINISH_TIME = 42;
const MOVIE_CONFIG = [
  {
    should: 0,
    must: 0,
    camera: 1
  },
  {
    should: 36 / MOVIE_FRAMERATE,
    must: 45 / MOVIE_FRAMERATE,
    camera: 3
  },
  {
    should: 59 / MOVIE_FRAMERATE,
    must: 68 / MOVIE_FRAMERATE,
    camera: 2
  },
  {
    should: 129 / MOVIE_FRAMERATE,
    must: 138 / MOVIE_FRAMERATE,
    camera: 3
  },
  {
    should: 209 / MOVIE_FRAMERATE,
    must: 218 / MOVIE_FRAMERATE,
    camera: 1
  }
];

class Movie {
  constructor({
    page,
    book,
    pageIndex,
  }) {
    this._page = page;
    this._book = book;
    this._pageIndex = pageIndex;

    this._rootL = document.getElementById('movie-l');
    this._rootR = document.getElementById('movie-r');
    this._restartButton = document.getElementById('movie-restart-button');
    this._buttons = Array.from(this._rootR.querySelectorAll('.movie__number-button'));
    this._cameras = Array.from(this._rootL.querySelectorAll('.movie__camera'));
    this._smallVideo = document.getElementById('movie-video-l');
    this._bigVideo = document.getElementById('movie-video-r');
    this._bigVideoSource = this._bigVideo.querySelector('source');

    this._currentSection = 0;
    this._currentCamera = 1;
    this._neededCamera = 1;
    this._loosed = false;
    this._finished = false;

    this._onCurrentPageChange = this._onCurrentPageChange.bind(this);
    this._updateClassName = this._updateClassName.bind(this);
    this._setCurrentCamera = this._setCurrentCamera.bind(this);
    this._setNeededCamera = this._setNeededCamera.bind(this);
    this._enterFrame = this._enterFrame.bind(this);
    this._finish = this._finish.bind(this);
    this._loose = this._loose.bind(this);
    this._reset = this._reset.bind(this);

    this._restartButton.addEventListener('touchstart', e => e.stopPropagation());
    if (window.PointerEvent) {
      this._restartButton.addEventListener('pointerdown', this._reset);
      this._restartButton.addEventListener('mousedown', e => e.stopPropagation());
    } else {
      this._restartButton.addEventListener('pointerdown', e => e.stopPropagation());
      this._restartButton.addEventListener('mousedown', this._reset);
    }

    this._buttons.forEach((button, i) => {
      button.addEventListener('touchstart', e => e.stopPropagation());
      if (window.PointerEvent) {
        button.addEventListener('pointerdown', this._onCameraClick.bind(this, i + 1));
        button.addEventListener('mousedown', e => e.stopPropagation());
      } else {
        button.addEventListener('pointerdown', e => e.stopPropagation());
        button.addEventListener('mousedown', this._onCameraClick.bind(this, i + 1));
      }
    });
    this._cameras.forEach((camera, i) => {
      camera.addEventListener('touchstart', e => e.stopPropagation());
      if (window.PointerEvent) {
        camera.addEventListener('pointerdown', this._onCameraClick.bind(this, i + 1));
        camera.addEventListener('mousedown', e => e.stopPropagation());
      } else {
        camera.addEventListener('pointerdown', e => e.stopPropagation());
        camera.addEventListener('mousedown', this._onCameraClick.bind(this, i + 1));
      }
    });

    book.bookElement.addEventListener('currentPageChange', this._onCurrentPageChange);

    this._updateClassName();
    setInterval(this._enterFrame, 100);

    this._reset();
  }

  _onCurrentPageChange({ detail: { currentPage }}) {
    this._reset();
  }

  _enterFrame() {
    const t = this._smallVideo.currentTime;
    const currentConfig = MOVIE_CONFIG[this._currentSection];
    const nextConfig = MOVIE_CONFIG[this._currentSection + 1];

    if (t >= MOVIE_FINISH_TIME) {
      this._finish();
    }

    if (t >= currentConfig.must && this._currentCamera !== currentConfig.camera) {
      this._loose();
    }

    if (!nextConfig) {
      return;
    }

    if (t >= nextConfig.should) {
      this._currentSection++;
      this._setNeededCamera(nextConfig.camera);
    }
  }

  _finish() {
    this._finished = true;
    this._updateClassName();
  }

  _loose() {
    this._loosed = true;
    this._smallVideo.pause();
    this._bigVideo.pause();
    this._updateClassName();
  }

  _reset(event) {
    if (event) {
      event.stopPropagation();
    }

    this._currentSection = 0;
    this._currentCamera = MOVIE_CONFIG[this._currentSection].camera;
    this._neededCamera = MOVIE_CONFIG[this._currentSection].camera;
    this._loosed = false;
    this._finished = false;

    this._smallVideo.currentTime = 0;
    this._bigVideo.currentTime = 0;

    if (this._book.currentPage === this._pageIndex) {
      this._smallVideo.play();
      this._bigVideo.play();
    } else {
      this._smallVideo.pause();
      this._bigVideo.pause();
    }

    this._updateClassName();
  }

  _updateClassName() {
    let className = `movie movie_current-camera_${this._currentCamera} movie_needed-camera_${this._neededCamera}`;

    if (this._loosed) {
      className += ' movie_loose';
    }

    if (this._finished) {
      className += ' movie_finished';

      if (!this._loosed) {
        className += ' movie_win';
      }
    }

    this._rootL.className = className;
    this._rootR.className = className;
  }

  _onCameraClick(n, event) {
    event.stopPropagation();
    this._setCurrentCamera(n);
  }

  _setCurrentCamera(n) {
    this._currentCamera = n;

    if (!this._finished && n !== MOVIE_CONFIG[this._currentSection].camera) {
      this._loose();
    }

    this._updateClassName();
  }

  _setNeededCamera(n) {
    this._neededCamera = n;
    this._updateClassName();
  }
};
