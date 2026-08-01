function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

const GAME_KEYS = new Set([
  "Space",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyE",
  "KeyQ",
  "KeyF",
  "KeyR",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "ShiftLeft",
  "ShiftRight",
]);

export class Input {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    this.enabled = false;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
    this.pointerLocked = false;
    this.attackClicked = false;
    this._canvas = null;
  }

  bind(canvas) {
    this._canvas = canvas;

    window.addEventListener("keydown", (event) => {
      if (!this.enabled) return;
      if (GAME_KEYS.has(event.code)) event.preventDefault();
      if (!this.keys.has(event.code)) this.justPressed.add(event.code);
      this.keys.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
    });

    document.addEventListener("mousemove", (event) => {
      if (!this.enabled || !this.pointerLocked) return;
      // Clamp spikes (OS context-menu / lock transitions often dump huge deltas)
      const dx = clamp(event.movementX || 0, -80, 80);
      const dy = clamp(event.movementY || 0, -80, 80);
      this.mouseDeltaX += dx;
      this.mouseDeltaY += dy;
    });

    // Block context menu / middle-click chrome while playing (RMB was unused and
    // often released pointer-lock or opened the browser menu → hitching).
    const blockSecondary = (event) => {
      if (!this.enabled) return;
      if (event.button === 2 || event.button === 1 || event.type === "contextmenu" || event.type === "auxclick") {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    canvas.addEventListener("contextmenu", blockSecondary);
    canvas.addEventListener("auxclick", blockSecondary);
    document.addEventListener("contextmenu", (event) => {
      if (this.enabled && this.pointerLocked) event.preventDefault();
    });

    canvas.addEventListener("mousedown", (event) => {
      if (!this.enabled) return;
      // Ignore right / middle entirely
      if (event.button !== 0) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      if (!this.pointerLocked) {
        this.requestPointerLock(canvas);
        return;
      }
      this.attackClicked = true;
    });

    canvas.addEventListener(
      "wheel",
      (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        this.wheelDelta += Math.sign(event.deltaY);
      },
      { passive: false }
    );

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === canvas;
      if (!this.pointerLocked) {
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
      }
    });

    document.addEventListener("pointerlockerror", () => {
      this.pointerLocked = false;
    });
  }

  requestPointerLock(canvas) {
    const target = canvas || this._canvas;
    if (!this.enabled || !target || document.pointerLockElement === target) return;
    // Prefer unadjusted movement when available (less OS accel / better FPS feel)
    const promise = target.requestPointerLock?.({ unadjustedMovement: true });
    if (promise?.catch) {
      promise.catch(() => target.requestPointerLock?.());
    }
  }

  exitPointerLock() {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  enable() {
    this.enabled = true;
    this.keys.clear();
    this.justPressed.clear();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
    this.attackClicked = false;
  }

  disable() {
    this.enabled = false;
    this.keys.clear();
    this.justPressed.clear();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
    this.attackClicked = false;
    this.exitPointerLock();
  }

  consumeMouseLook() {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }

  consumeWheel() {
    const d = this.wheelDelta;
    this.wheelDelta = 0;
    return d;
  }

  wasAttackClicked() {
    return this.enabled && this.attackClicked;
  }

  isDown(code) {
    return this.enabled && this.keys.has(code);
  }

  wasPressed(code) {
    return this.enabled && this.justPressed.has(code);
  }

  endFrame() {
    this.justPressed.clear();
    this.attackClicked = false;
  }

  getMoveInput() {
    return {
      forward:
        (this.isDown("KeyW") || this.isDown("ArrowUp") ? 1 : 0) -
        (this.isDown("KeyS") || this.isDown("ArrowDown") ? 1 : 0),
      right:
        (this.isDown("KeyD") || this.isDown("ArrowRight") ? 1 : 0) -
        (this.isDown("KeyA") || this.isDown("ArrowLeft") ? 1 : 0),
      run: this.isDown("ShiftLeft") || this.isDown("ShiftRight"),
    };
  }
}
