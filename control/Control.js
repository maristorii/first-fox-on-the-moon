'use strict';

class Control {
  constructor({
    page,
    video,
    book,
    pageIndex,
  }) {
    this._page = page;
    this._video = video;
    this._book = book;
    this._pageIndex = pageIndex;

    this.MESSAGE_EMPTY = 'empty';
    this.MESSAGE_SUCCESS = 'success';
    this.MESSAGE_LATE = 'late';
    this.MESSAGE_EARLY = 'early';

    this.PHASE_CLOSED = 'closed';
    this.PHASE_ON_START = 'on-start';
    this.PHASE_LAUNCH = 'launch';
    this.PHASE_AROUND_EARTH = 'around-earth';
    this.PHASE_WAY_TO_MOON = 'way-to-moon';
    this.PHASE_AROUND_MOON = 'around-moon';
    this.PHASE_LANDING = 'landing';
    this.PHASE_COMPLETE = 'complete';

    this.TIME_RESERVE = 0.01;

    this.PHASE_CONFIGS = {
      [this.PHASE_CLOSED]: {},
      [this.PHASE_ON_START]: {
        rewindAfter: 1.25,
        rewindFor: -0.75,
        readyFrom: 0,
        nextPhase: this.PHASE_LAUNCH,
      },
      [this.PHASE_LAUNCH]: {
        rewindOnEnterTo: 1.25,
        nextPhaseAfter: 2.75,
        nextPhase: this.PHASE_AROUND_EARTH,
      },
      [this.PHASE_AROUND_EARTH]: {
        rewindOnEnterFor: 10.25,
        rewindAfter: 20.75,
        rewindFor: -10,
        readyFrom: 20,
        isLateBefore: 15,
        nextPhase: this.PHASE_WAY_TO_MOON,
      },
      [this.PHASE_WAY_TO_MOON]: {
        nextPhaseAfter: 23.75,
        nextPhase: this.PHASE_AROUND_MOON,
      },
      [this.PHASE_AROUND_MOON]: {
        rewindOnEnterFor: 3.75,
        rewindAfter: 29.75,
        rewindFor: -3.5,
        readyFrom: 29,
        isLateBefore: 27.5,
        nextPhase: this.PHASE_LANDING,
      },
      [this.PHASE_LANDING]: {
        nextPhaseAfter: 31.25,
        nextPhase: this.PHASE_COMPLETE,
      },
      [this.PHASE_COMPLETE]: {
      },
    };

    this._phase = null;
    this._message = null;
    this._buttonPressed = false;
    this._buttonReady = false;
    this._isRewined = false;
    this._rewindTimer = null;
    this._currentConfig = null;

    this._onClick = this._onClick.bind(this);
    this._onCurrentPageChange = this._onCurrentPageChange.bind(this);
    this._onPlay = this._onPlay.bind(this);

    this._button = this._page.getElementsByClassName('control__button')[0];
    this._button.addEventListener('touchstart', e => e.stopPropagation());
    if (window.PointerEvent) {
      this._button.addEventListener('pointerdown', this._onClick);
      this._button.addEventListener('mousedown', e => e.stopPropagation());
    } else {
      this._button.addEventListener('pointerdown', e => e.stopPropagation());
      this._button.addEventListener('mousedown', this._onClick);
    }

    book.bookElement.addEventListener('currentPageChange', this._onCurrentPageChange);
    this._video.addEventListener('play', this._onPlay);

    this._resetAll();
  }

  _onCurrentPageChange({ detail: { currentPage }}) {
    if (currentPage !== this._pageIndex) {
      this._resetAll();
    }
  }

  _onPlay() {
    if (this._phase === this.PHASE_CLOSED) {
      this._setPhase(this.PHASE_ON_START);
    }
  }

  _onClick(event) {
    event.stopPropagation();

    if (
      this._phase === this.PHASE_CLOSED ||
      !this.PHASE_CONFIGS[this._phase].nextPhase ||
      this._buttonPressed
    ) {
      return;
    }

    this._setButtonPressed(true);

    if (this._buttonReady) {
      this._setPhase(this.PHASE_CONFIGS[this._phase].nextPhase);
      this._setMessage(this.MESSAGE_SUCCESS);
    } else if (this._video.currentTime < this._currentConfig.isLateBefore) {
      this._setMessage(this.MESSAGE_LATE);
    } else {
      this._setMessage(this.MESSAGE_EARLY);
    }

    setTimeout(() => {
      this._setButtonPressed(false);
      this._setMessage(this.MESSAGE_EMPTY);
    }, 3000);
  }

  _resetAll() {
    this._setPhase(this.PHASE_CLOSED);
    this._setMessage(this.MESSAGE_EMPTY);
    this._setButtonPressed(false);
    this._setButtonReady(false);
    this._isRewined = false;
  }

  _setPhase(phase) {
    if (phase === this._phase) {
      return;
    }

    if (this._phase !== null) {
      this._page.classList.remove(`control_phase_${this._phase}`);
    }

    this._phase = phase;
    this._currentConfig = this.PHASE_CONFIGS[this._phase];
    this._isRewined = false;

    this._page.classList.add(`control_phase_${this._phase}`);

    if (this._currentConfig.rewindOnEnterTo !== undefined) {
      this._video.currentTime = this._currentConfig.rewindOnEnterTo;
    }

    if (this._currentConfig.rewindOnEnterFor !== undefined) {
      this._video.currentTime = this._video.currentTime + this._currentConfig.rewindOnEnterFor;
    }

    this._setNextPhaseTimeout();

    this._setRewindTimeout();

    if (!this._setReadyTimeout()) {
      this._setButtonReady(false);
    }
  }

  _setNextPhaseTimeout() {
    if (this._currentConfig.nextPhaseAfter === undefined) {
      return;
    }

    const phase = this._phase;

    setTimeout(
      () => {
        if (this._phase !== phase) {
          return;
        }

        if (this._video.currentTime >= this._currentConfig.nextPhaseAfter) {
          this._setPhase(this._currentConfig.nextPhase);

          return;
        }

        this._setNextPhaseTimeout();
      },
      (this._currentConfig.nextPhaseAfter - this._video.currentTime + this.TIME_RESERVE) * 1000
    );
  }

  _setRewindTimeout() {
    if (this._currentConfig.rewindAfter === undefined) {
      return;
    }

    const phase = this._phase;

    setTimeout(
      () => {
        if (this._phase !== phase) {
          return;
        }

        const currentTime = this._video.currentTime;

        if (currentTime >= this._currentConfig.rewindAfter) {
          if (this._currentConfig.rewindTo !== undefined) {
            this._video.currentTime = this._currentConfig.rewindTo;
          } else if (this._currentConfig.rewindFor !== undefined) {
            this._video.currentTime = currentTime + this._currentConfig.rewindFor;
          }

          if (!this._setReadyTimeout()) {
            this._setButtonReady(false);
          }

          this._isRewined = true;
        }

        this._setRewindTimeout();
      },
      (this._currentConfig.rewindAfter - this._video.currentTime + this.TIME_RESERVE) * 1000
    );
  }

  _setReadyTimeout() {
    if (this._currentConfig.readyFrom === undefined) {
      return false;
    }

    if (this._video.currentTime >= this._currentConfig.readyFrom) {
      this._setButtonReady(true);

      return true;
    }

    const phase = this._phase;

    setTimeout(
      () => {
        if (this._phase !== phase) {
          return;
        }

        if (this._video.currentTime >= this._currentConfig.readyFrom) {
          this._setButtonReady(true);

          return;
        }

        this._setReadyTimeout();
      },
      (this._currentConfig.readyFrom - this._video.currentTime + this.TIME_RESERVE) * 1000
    );

    return false;
  }

  _setMessage(message) {
    if (message === this._message) {
      return;
    }

    if (this._message !== null) {
      this._page.classList.remove(`control_message_${this._message}`);
    }

    this._message = message;

    this._page.classList.add(`control_message_${this._message}`);
  }

  _setButtonPressed(buttonPressed) {
    if (buttonPressed === this._buttonPressed) {
      return;
    }

    this._buttonPressed = buttonPressed;

    if (buttonPressed) {
      this._page.classList.add('control_button-pressed');
    } else {
      this._page.classList.remove('control_button-pressed');
    }
  }

  _setButtonReady(buttonReady) {
    if (buttonReady === this._buttonReady) {
      return;
    }

    this._buttonReady = buttonReady;

    if (buttonReady) {
      this._page.classList.add('control_button-ready');
    } else {
      this._page.classList.remove('control_button-ready');
    }
  }
};
