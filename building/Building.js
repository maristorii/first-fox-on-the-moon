'use strict';

class Draggable {
  constructor(domElement, onDragEnd, buildingObj) {
    this.ENABLE_POINTER_EVENTS = false;

    this._domElem = null;
    this._pointerStart = null;
    this._touchEventMode = false;
    this._onDragEnd = null;
    this._buildingObj = null;

    if (domElement) {
      this.init(domElement, onDragEnd, buildingObj);
    }
  }

  init(domElement, onDragEnd, buildingObj) {
    this._domElem = domElement;
    this._onDragEnd = onDragEnd;
    this._buildingObj = buildingObj;

    if (this.ENABLE_POINTER_EVENTS && window.PointerEvent) {
      this._domElem.addEventListener('pointerdown', this._dragStart);
    } else {
      this._domElem.addEventListener('touchstart', this._dragStart);
      this._domElem.addEventListener('mousedown', this._dragStart);
    }
  }

  _dragStart = (e) => {
    if (this._pointerStart !== null) {
      return;
    }

    e.stopPropagation();

    if (this._buildingObj.status !== Building.STATUSES.ACTIVE) {
      return;
    }

    if (e.touches) {
      this._touchEventMode = true;
    } else if (this._touchEventMode === true) {
      return;
    }

    this._pointerStart = this._getPos(e);

    this._domElem.classList.add('draggable_dragging');

    if (this.ENABLE_POINTER_EVENTS && window.PointerEvent) {
      window.addEventListener('pointermove', this._drag);
      window.addEventListener('pointerup', this._dragEnd);
      window.addEventListener('pointercancel', this._dragEnd);
    } else if (this._touchEventMode) {
      window.addEventListener('touchmove', this._drag);
      window.addEventListener('touchend', this._dragEnd);
      window.addEventListener('touchcancel', this._dragEnd);
    } else {
      window.addEventListener('mousemove', this._drag);
      window.addEventListener('mouseup', this._dragEnd);
    }
  }

  _drag = (e) => {
    if (!e.touches && this._touchEventMode === true) {
      return;
    }

    e.stopPropagation();

    if ((e.touches && e.touches.length > 1) || e.isPrimary === false) {
      this._dragEnd(e, true);
      return;
    }

    const { x, y } = this._getPos(e);

    this._domElem.style.setProperty('--x', x - this._pointerStart.x);
    this._domElem.style.setProperty('--y', y - this._pointerStart.y);
  }

  _dragEnd = (e) => {
    if (!e.touches && this._touchEventMode === true) {
      return;
    }

    e.stopPropagation();

    const rect = this._domElem.getBoundingClientRect();

    this._pointerStart = null;

    this._domElem.style.setProperty('--x', 0);
    this._domElem.style.setProperty('--y', 0);

    this._domElem.classList.remove('draggable_dragging');

    if (this.ENABLE_POINTER_EVENTS && window.PointerEvent) {
      window.removeEventListener('pointermove', this._drag);
      window.removeEventListener('pointerup', this._dragEnd);
      window.removeEventListener('pointercancel', this._dragEnd);
    } else if (this._touchEventMode) {
      window.removeEventListener('touchmove', this._drag);
      window.removeEventListener('touchend', this._dragEnd);
      window.removeEventListener('touchcancel', this._dragEnd);
    } else {
      window.removeEventListener('mousemove', this._drag);
      window.removeEventListener('mouseup', this._dragEnd);
    }

    if (this._onDragEnd) {
      this._onDragEnd(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  _getPos(e) {
    if (['touchstart', 'touchmove'].includes(e.type)) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }

    if (e.type === 'touchend') {
      return {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };
    }

    return {
      x: e.clientX,
      y: e.clientY
    };
  }
};

class Building {
  static STATUSES = {
    LOADING: 'loading',
    ACTIVE: 'active',
    DISABLED: 'disabled'
  };

  static PHASES = [
    {// 0
      startTime: 0,
      endTime: 0,
      endPhase: 0,
      pauseStatus: Building.STATUSES.ACTIVE,
      yesItem: 0,
      noPhase: 1,
      yesPhase: 2,
      image: 0
    },
    {// 1 - no
      startTime: 0,
      endTime: 1,
      endPhase: 0,
      status: Building.STATUSES.DISABLED
    },
    {// 2 - cement
      startTime: 1.2,
      endTime: 7.8,
      endPhase: 2,
      status: Building.STATUSES.DISABLED,
      pauseStatus: Building.STATUSES.ACTIVE,
      yesItem: 1,
      noPhase: 3,
      yesPhase: 4,
      image: 1
    },
    {// 3 - no
      startTime: 8,
      endTime: 9,
      endPhase: 2,
      status: Building.STATUSES.DISABLED
    },
    {// 4 - walls
      startTime: 9.4,
      endTime: 14.4,
      endPhase: 4,
      status: Building.STATUSES.DISABLED,
      pauseStatus: Building.STATUSES.ACTIVE,
      yesItem: 2,
      noPhase: 5,
      yesPhase: 6,
      image: 2
    },
    {// 5 - no
      startTime: 14.4,
      endTime: 15.4,
      endPhase: 4,
      status: Building.STATUSES.DISABLED
    },
    {// 6 - roof
      startTime: 15.6,
      endTime: 18,
      endPhase: 6,
      status: Building.STATUSES.DISABLED,
      pauseStatus: Building.STATUSES.ACTIVE,
      yesItem: 3,
      noPhase: 7,
      yesPhase: 8,
      image: 3
    },
    {// 7 - no
      startTime: 18,
      endTime: 19,
      endPhase: 6,
      status: Building.STATUSES.DISABLED
    },
    {// 8 - light
      startTime: 19.2,
      endTime: 23.2,
      endPhase: 8,
      status: Building.STATUSES.DISABLED,
      pauseStatus: Building.STATUSES.ACTIVE,
      yesItem: 4,
      yesPhase: 9,
      image: 4
    },
    {// 9 - windows
      startTime: 23.4,
      endTime: 40.2,
      endPhase: 9,
      status: Building.STATUSES.DISABLED,
      pauseStatus: Building.STATUSES.DISABLED,
      image: 5
    }
  ];

  constructor({
    domElem,
    video,
    book,
    pageIndex,
    leftPage,
    rightPage
  }) {
    this._domElem = domElem;
    this._video = video;
    this._book = book;
    this._pageIndex = pageIndex;
    this._leftPage = leftPage;
    this._rightPage = rightPage;
    this._enterFrameInterval = null;

    const items = this._domElem.querySelectorAll('.building__item');
    const platform = this._domElem.querySelectorAll('.building__platform')[0];

    this._phase = 0;
    this._status = Building.STATUSES.LOADING;

    items.forEach((item, index) => {
      const onDragEnd = (x, y) => {
        const rect = platform.getBoundingClientRect();

        if (
          x < rect.left ||
          x > rect.right ||
          y < rect.top ||
          y > rect.bottom
        ) {
          return;
        }

        this._onSetItem(index);
      }

      new Draggable(item, onDragEnd, this);
    });

    book.bookElement.addEventListener('currentPageChange', this._onCurrentPageChange);

    this._video.addEventListener('canplaythrough', this._start);

    this._resetAll();
  }

  _onCurrentPageChange = ({ detail: { currentPage }}) => {
    if (currentPage !== this._pageIndex - 1) {
      this._resetAll();
    }
  };

  _start = () => {
    if (this._enterFrameInterval) {
      return;
    }

    this._enterFrameInterval = setInterval(this._onEnterFrame);
    this._setStatus(Building.PHASES[this._phase].pauseStatus);
  };

  _onEnterFrame = () => {
    const { endTime, endPhase } = Building.PHASES[this._phase];

    if (this._video.paused) {
      return;
    }

    if (this._video.currentTime < endTime) {
      return;
    }

    this._setPhase(endPhase);

    const { endTime: endPhaseEndTime, pauseStatus: endPhasePauseStatus, pauseStatus, image } = Building.PHASES[this._phase];

    this._setStatus(pauseStatus);
    this._video.pause();
    this._video.currentTime = endPhaseEndTime;
    this._status = endPhasePauseStatus;

    if (typeof image !== 'undefined') {
      this._setImages(image);
    }
  };

  _onSetItem = (item) => {
    const { yesItem, yesPhase, noPhase } = Building.PHASES[this._phase];

    if (item === yesItem) {
      this._setPhase(yesPhase);
    } else {
      this._setPhase(noPhase);
    }

    const { startTime, status } = Building.PHASES[this._phase];

    this._setStatus(status);
    this._video.play();
    this._video.currentTime = startTime;
  };

  _setPhase(phase) {
    if (typeof phase !== 'number') {
      return;
    }

    this._domElem.classList.remove('building_phase_' + this._phase);
    this._phase = phase;
    this._domElem.classList.add('building_phase_' + this._phase);
  }

  _setStatus(status) {
    this._domElem.classList.remove('building_status_' + this._status);
    this._status = status;
    this._domElem.classList.add('building_status_' + this._status);
  }

  _setImages(index) {
    this._leftPage.src = `building/img/building-${index}-l_640.jpg`;
    this._rightPage.src = `building/img/building-${index}-r_640.jpg`;
  }

  _resetAll() {
    clearInterval(this._enterFrameInterval);
    this._enterFrameInterval = null;

    this._video.pause();
    this._video.currentTime = 0;
    this._setPhase(0);
    this._setImages(0);
    this._setStatus(Building.STATUSES.ACTIVE);
  }

  get status() {
    return this._status;
  }
};
