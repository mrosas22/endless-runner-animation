var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 1050;
canvas.height = 350; 
document.body.appendChild(canvas);

function main() {

    update();
    requestAnimFrame(main);
};

function init() {
    terrainPattern = ctx.createPattern(resources.get('./images/terrain.png'), 'repeat');

    main();
}

resources.load([
    './images/falling.png',
    './images/terrain.png',
    './images/jumping.png',
    './images/running.png'
]);
resources.onReady(init);

//global variables
var terrainPattern;
/**
   * A vector for 2d space.
   * @param {integer} x - Center x coordinate.
   * @param {integer} y - Center y coordinate.
   * @param {integer} dx - Change in x.
   * @param {integer} dy - Change in y.
   */
function Vector(x, y, dx, dy) {
    // position
    this.x     = x  || 0;
    this.y     = y  || 0;
    // direction
    this.dx    = dx || 0;
    this.dy    = dy || 0;
}

/**
* Advance the vectors position by dx,dy
*/
Vector.prototype.advance = function() {
 this.x += this.dx;
 this.y += this.dy;
};
/**
   * Creates a Spritesheet
   * @param {string} - Path to the image.
   * @param {number} - Width (in px) of each frame.
   * @param {number} - Height (in px) of each frame.
*/
function SpriteSheet(path, frameWidth, frameHeight) {
    this.image = new Image();
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    // calculate the number of frames in a row after the image loads
    var self = this;
    this.image.onload = function() {
      self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
    };

    this.image.src = path;
}

  /**
   * Creates an animation from a spritesheet.
   * @param {SpriteSheet} - The spritesheet used to create the animation.
   * @param {number}      - Number of frames to wait for before transitioning the animation.
   * @param {array}       - Range or sequence of frame numbers for the animation.
   * @param {boolean}     - Repeat the animation once completed.
   */
  function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

    var animationSequence = [];  // array holding the order of the animation
    var currentFrame = 0;        // the current frame to draw
    var counter = 0;             // keep track of frame rate

    // start and end range for frames
    for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
      animationSequence.push(frameNumber);

    /**
     * Update the animation
     */
    this.update = function() {

      // update to the next frame if it is time
      if (counter == (frameSpeed - 1))
        currentFrame = (currentFrame + 1) % animationSequence.length;

      // update the counter
      counter = (counter + 1) % frameSpeed;
    };

    /**
     * Draw the current frame
     * @param {integer} x - X position to draw
     * @param {integer} y - Y position to draw
     */
    this.draw = function(x, y) {
      // get the row and col of the frame
      var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
      var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

      ctx.drawImage(
        spritesheet.image,
        col * spritesheet.frameWidth, row * spritesheet.frameHeight,
        spritesheet.frameWidth, spritesheet.frameHeight,
        x, y,
        spritesheet.frameWidth, spritesheet.frameHeight);
    };
  }

//CREATE PLAYER
function Player(x, y) {
    this.dy        = 0;
    this.gravity   = 1;
    this.speed     = 6;
    this.jumpDy    = -10;
    this.isJumping = false;
    this.width     = 144;
    this.height    = 190;
    this.runningSheet     = new SpriteSheet('./images/running.png', this.width, this.height);
    this.jumpingSheet     = new SpriteSheet('./images/jumping.png', this.width, this.height);
    this.fallingSheet     = new SpriteSheet('./images/falling.png', this.width, this.height);
    this.walkAnim  = new Animation(this.runningSheet, 10, 0, 5);
    this.jumpAnim  = new Animation(this.jumpingSheet, 4, 0, 5);
    this.fallAnim  = new Animation(this.fallingSheet, 4, 0, 8);
    this.anim      = this.walkAnim;
    Vector.call(this, x, y, 0, this.dy)
    var jumpCounter = 0;  // how long the jump button can be pressed down

    /**
     * Update the player's position and animation
     */
    this.update = function() {

      // jump if not currently jumping or falling
      if (KEY_STATUS.space && this.dy === 0 && !this.isJumping) {
        this.isJumping = true;
        this.dy = this.jumpDy;
        jumpCounter = 12;
      }

      // jump higher if the space bar is continually pressed
      if (KEY_STATUS.space && jumpCounter) {
        this.dy = this.jumpDy;
      }

      jumpCounter = Math.max(jumpCounter-1, 0);

      this.advance();

      // add gravity
      if (this.isFalling || this.isJumping) {
        this.dy += this.gravity;
      }

      // change animation if falling
      if (this.dy > 0) {
        this.anim = this.fallAnim;
      }
      // change animation is jumping
      else if (this.dy < 0) {
        this.anim = this.jumpAnim;
      }
      else {
        this.anim = this.walkAnim;
      }

      this.anim.update();
    };

    /**
     * Draw the player at it's current position
     */
    this.draw = function() {
      this.anim.draw(this.x, this.y);
    };
}
Player.prototype = Object.create(Vector.prototype);


// spritesheet = new SpriteSheet('./images/running.png', 144, 194);
// walk = new Animation(spritesheet, 20, 0, 1);

// Game state
let player = new Player(60, 15)
// function updatePlayer(){
//     player.update();
//     player.draw();
// }

 //render the image
function update(){
    ctx.fillStyle = terrainPattern;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    //Updating the frame 
    player.update();
    //Drawing the image 
    player.draw();
    // ctx.drawImage(character,srcX,srcY,width,height,x,y,width,height);
}

/**
   * Keep track of the spacebar events
*/
var KEY_CODES = {
    32: 'space'
};
var KEY_STATUS = {};
  for (var code in KEY_CODES) {
    if (KEY_CODES.hasOwnProperty(code)) {
       KEY_STATUS[KEY_CODES[code]] = false;
    }
  }
document.onkeydown = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
};
document.onkeyup = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
};
