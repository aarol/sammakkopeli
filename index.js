///<reference types="phaser" />

class Game {
  constructor() {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      pixelArt: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 450, x: 0 },
          debug: false,
        },
      },
      scene: MainScene,
    });
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene")
  }
  preload() {
    this.load.image("background", "assets/scifi_bg.jpg")
    this.load.audio("bounce", "assets/bounce.ogg");
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("wall", "assets/platform.png")
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("frog", "assets/frog.png", {
      frameWidth: 16,
      frameHeight: 27,
    });
  }

  score = 0;
  gameOver = false;
  falling = false;

  numberOfObstacles = 5
  distanceBetweenObstacles = 500
  obstacleSpeedMultiplier = 0.4

  create() {
    //  A simple background for our game
    this.add.image(400, 300, "sky");
    this.background = this.add.tileSprite(0, 0, 0, 0, "background").setOrigin(0, 0)
    this.bgAspectRatio = this.background.width / this.background.height
    this.background.displayHeight = this.sys.canvas.height
    this.background.displayWidth = this.sys.canvas.height * (this.bgAspectRatio)

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();

    this.player = this.physics.add.sprite(100, 450, "frog");
    this.player.setScale(4);


    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("frog", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "fall",
      frames: this.anims.generateFrameNumbers("frog", { start: 6, end: 6 }),
      frameRate: 5,
    });

    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("frog", { start: 1, end: 5 }),
      frameRate: 20,
    });

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    this.stars = this.physics.add.group({
      key: "star",
      repeat: this.numberOfObstacles,
      allowGravity: false,
      setXY: { x: 200, y: 500, stepX: this.distanceBetweenObstacles },
    });

    this.walls = this.physics.add.group({
      key: "wall",
      repeat: this.numberOfObstacles,
      allowGravity: false,
      setXY: { x: 550, y: 650, stepX: this.distanceBetweenObstacles },
      setRotation: { value: Math.PI / 2 },
    })

    this.walls.children.iterate(wall => {
      // flip width and height to align with collision box
      // better to have an actual horizontal obstacle texture
      // @ts-ignore
      wall.body.setSize(32, 400)
      return true
    })

    this.bombs = this.physics.add.group();

    //  The score
    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      color: "#000",
    });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.collider(this.player, this.platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

    this.physics.add.collider(this.player, this.walls, this.hitWall, null, this);
  }

  updatePlayer() {
    if (this.player.body.touching.down) {
      this.player.anims.play("walk", true)
      this.falling = false

      if (this.cursors.up.isDown || this.input.activePointer.isDown) {
        this.player.setVelocityY(-400)
        this.player.anims.play("jump", true);
        this.sound.play("bounce");
      }
    } else {
      // in air
      if (this.player.body.velocity.y > 0 && !this.falling) {
        // 🤓 uhmm.. actually we are falling
        this.player.anims.stop()
        this.player.play("fall", true);
        // set falling flag to not play animation repeatedly
        this.falling = true
      }
    }
  }

  moveObstacles(delta) {
    this.stars.children.iterate((star) => {
      star.body.position.x -= delta * this.obstacleSpeedMultiplier

      if (star.body.position.x < -100) {
        star.body.position.x += this.numberOfObstacles * this.distanceBetweenObstacles
      }

      return true
    })

    this.walls.children.iterate(wall => {
      wall.body.position.x -= delta * this.obstacleSpeedMultiplier

      if (wall.body.position.x < -300) {
        wall.body.position.x += this.numberOfObstacles * this.distanceBetweenObstacles
      }

      return true
    })

    this.background.tilePositionX += 1
  }


  update(_, delta) {
    if (this.gameOver) {
      return;
    }
    this.moveObstacles(delta)
    this.updatePlayer()
  }

  hitWall(player, wall) {
    this.physics.pause()
    this.player.anims.stop()

    player.setTint(0xff0000)

    this.gameOver = true
  }

  collectStar(player, star) {
    star.disableBody(true, true)

    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
  }
}

new Game()