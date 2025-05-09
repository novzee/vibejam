import "./styles/style.css";
import * as THREE from "three";
import img from '/image.jpg';
import coin1 from '/coin.png'
import audio1 from '/audio.mp3'
import eblan1 from '/eblan1.jpg'
import eblan1mp3 from '/eblan1.mp3'
import eblan2 from '/eblan2.jpg'
import eblan2mp3 from '/eblan2.mp3'
import json from '/coords.json'


class ThreeJSTemplate {
    constructor() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initCar();
        this.initEnvironment();
        this.initTrack();
        this.initSpeedEffects();
        this.initTShapeParticles();
        this.initLODSystem();
        this.optimizeStaticGeometries();
        this.initObjectSpawner()
        this.addEventListeners();
        this.animate();
        this.initSimpleToys();
        this.initControlsInfo();
        this.addParkourVideo();
        this.addSlimeVideo();
        this.initSky();
        this.initClouds();
        this.initBotAheno();
        this.initScreamAudioAheno();
         // this.initBotBoba();
         // this.initScreamAudioBoba();
         this.initBotBiba();
         this.initScreamAudioBiba();
        this.coins = [];
        this.coinCount = 42;
        this.collectedCoins = 0;
        this.initCoins();
        this.walls = [];
        this.initLabyrinth();
        this.createCoinCounter();
        this.initMobileControls();
    }
    // Модифицированная функция initCoins для генерации монет только внутри круга
initCoins() {
  // Создаем группу монет
  const skyRadius = 98; // Радиус чуть меньше чем у неба (100)
  
  for (let i = 0; i < this.coinCount; i++) {
      const coin = new THREE.Group();

      // Текстура монеты
      const coinTexture = new THREE.TextureLoader().load(coin1);
      const coinMaterial = new THREE.MeshBasicMaterial({
          map: coinTexture,
          transparent: true,
          side: THREE.DoubleSide,
          color: 0xffdf00 // Золотой цвет
      });

      const coinMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), coinMaterial);
      coin.add(coinMesh);

      // Генерируем монеты в пределах круга
      let angle = Math.random() * Math.PI * 2;
      let radius = Math.random() * skyRadius * 0.9; // Используем 90% от радиуса неба
      
      // Используем полярные координаты для равномерного распределения
      coin.position.set(
          radius * Math.cos(angle),
          0.5, // Немного над землей
          radius * Math.sin(angle)
      );

      this.coins.push({
          mesh: coin,
          collected: false
      });

      this.scene.add(coin);
  }
}
initLabyrinth() {
  this.walls = [];
  const wallHeight = 4; // Увеличил высоту для лучшей видимости
  const wallThickness = 1.5; // Увеличил толщину
  const cellSize = 10; // Размер ячейки лабиринта
  
  // Материал для стен - серый и видимый
  const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888, // Серый цвет
      roughness: 0.7,
      metalness: 0.2
  });
  
  // Макет лабиринта по схеме
  const maze = [
      "████████████████████████████",
      "█        █  █              █",
      "█  ████  █  █  ███████  █  █",
      "█  █     █        █  █  █  █",
      "█  ███████  ████  █  ████  █",
      "█           █  █           █",
      "█  ██████████  █  ████  ████",
      "█  █     █  █     █     █     █",
      "████  ████  ███████  █  ███████",
      "█  █  █     █  █     █  █     █",
      "█  █  ████  █  ███████  █  ████",
      "█        █              █     █",
      "█  █  ████  ██████████  █  ████",
      "█  █     █  █  █     █  █  █  █",
      "█  ████  █  █  █  ████  █  █  █",
      "█  █  █        █              █",
      "█  █  ███████  ███████  ███████",
      "█     █           █  █     █  █",
      "████  ████  ████  █  ████  █  █",
      "█     █     █        █        ",
      "████████████████████████████  "
  ];
  
  const mazeWidth = maze[0].length;
  const mazeHeight = maze.length;
  
  // Размеры всего лабиринта
  const totalWidth = mazeWidth * cellSize;
  const totalHeight = mazeHeight * cellSize;
  
  // Смещение для центрирования лабиринта
  const offsetX = -totalWidth / 2 + cellSize / 2;
  const offsetZ = -totalHeight / 2 + cellSize / 2;
  
  // Функция для создания стены
  const createWall = (x1, z1, x2, z2) => {
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
      const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, length);
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      
      // Размещаем стену между двумя точками
      wall.position.set((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2);
      
      // Поворачиваем стену, чтобы она была между точками
      const angle = Math.atan2(z2 - z1, x2 - x1);
      wall.rotation.y = angle - Math.PI / 2;
      
      this.scene.add(wall);
      
      // Добавляем информацию о стене для обнаружения столкновений
      this.walls.push({
          mesh: wall,
          start: new THREE.Vector2(x1, z1),
          end: new THREE.Vector2(x2, z2),
          normal: new THREE.Vector2(z2 - z1, x1 - x2).normalize(),
          length: length
      });
  };
  
  // Создаем стены по схеме лабиринта
  for (let row = 0; row < mazeHeight; row++) {
      for (let col = 0; col < mazeWidth; col++) {
          if (maze[row][col] === '█') {
              // Координаты текущей ячейки
              const x = offsetX + col * cellSize;
              const z = offsetZ + row * cellSize;
              
              // Проверяем соседей, чтобы не создавать лишние стены
              // Верхняя стена
              if (row === 0 || maze[row-1][col] !== '█') {
                  createWall(x - cellSize/2, z - cellSize/2, x + cellSize/2, z - cellSize/2);
              }
              
              // Правая стена
              if (col === mazeWidth-1 || maze[row][col+1] !== '█') {
                  createWall(x + cellSize/2, z - cellSize/2, x + cellSize/2, z + cellSize/2);
              }
              
              // Нижняя стена
              if (row === mazeHeight-1 || maze[row+1][col] !== '█') {
                  createWall(x - cellSize/2, z + cellSize/2, x + cellSize/2, z + cellSize/2);
              }
              
              // Левая стена
              if (col === 0 || maze[row][col-1] !== '█') {
                  createWall(x - cellSize/2, z - cellSize/2, x - cellSize/2, z + cellSize/2);
              }
          }
      }
  }
  
  // Определяем стартовую позицию машины в свободном пространстве
  // Ищем первую пустую ячейку в лабиринте
  let startX = 0, startZ = 0;
  
  outerLoop:
  for (let row = 0; row < mazeHeight; row++) {
      for (let col = 0; col < mazeWidth; col++) {
          if (maze[row][col] === ' ') {
              startX = offsetX + col * cellSize;
              startZ = offsetZ + row * cellSize;
              break outerLoop;
          }
      }
  }
  
  this.carStartPosition = new THREE.Vector3(startX, 0.05, startZ);
}

    createCoinCounter() {
        // Создание счетчика на экране
        this.coinCounter = document.createElement('div');
        this.coinCounter.style.position = 'absolute';
        this.coinCounter.style.top = '20px';
        this.coinCounter.style.left = '40%';
        this.coinCounter.style.color = 'white';
        this.coinCounter.style.background = 'rgba(0, 0, 0, 0.5)';
        this.coinCounter.style.padding = '10px';
        this.coinCounter.style.borderRadius = '5px';
        this.coinCounter.style.fontSize = '24px';
        this.coinCounter.style.fontFamily = 'Arial';
        this.coinCounter.textContent = `Монеты: ${this.collectedCoins}/${this.coinCount}`;
        document.body.appendChild(this.coinCounter);
    }

    updateCoins() {
        if (!this.car) return;

        // Обновление монет (вращение и проверка сбора)
        this.coins.forEach(coin => {
            if (!coin.collected) {
                // Вращение монеты для эффекта
                coin.mesh.rotation.y += 0.02;

                // Проверка столкновения
                const distance = coin.mesh.position.distanceTo(this.car.position);
                if (distance < 3) { // Радиус сбора монеты
                    coin.collected = true;
                    coin.mesh.visible = false;
                    this.collectedCoins++;
                    this.coinCounter.textContent = `Монеты: ${this.collectedCoins}/${this.coinCount}`;

                    // Опционально: звук сбора монеты
                    if (this.coinSound) {
                        this.coinSound.play();
                    }
                }
            }
        });
    }
    //-----------------------------------------------------------------------------------------------------------------------

    //бот раб
    initBotAheno() {
        this.botAheno = new THREE.Group();

        const botTexture = new THREE.TextureLoader().load(eblan2);
        const botMaterial = new THREE.MeshStandardMaterial({
            map: botTexture,
            transparent: true,
            opacity: 0.9,
            metalness: 0.2,
            roughness: 0.8
        });

        const botMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), botMaterial);
        botMesh.castShadow = true;
        botMesh.receiveShadow = true;

        this.botAheno.add(botMesh);

        const mapSize = 150;
        const edgeOffset = 30;

        // Spawn botAheno at a random edge
        const xAheno = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
        const zAheno = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);

        this.botAheno.position.set(xAheno, 2, zAheno);
        this.scene.add(this.botAheno);

        this.visionRadiusAheno = 2200;
        this.isChasingAheno = false;
        this.chaseTimeAheno = 0;
        this.maxChaseTimeAheno = 10 * 60;

        this.setRandomPatrolTargetAheno();
    }

    initBotBiba() {
        this.botBiba = new THREE.Group();

        const botTexture = new THREE.TextureLoader().load(eblan1);
        const botMaterial = new THREE.MeshStandardMaterial({
            map: botTexture,
            transparent: true,
            opacity: 0.9,
            metalness: 0.2,
            roughness: 0.8
        });

        const botMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), botMaterial);
        botMesh.castShadow = true;
        botMesh.receiveShadow = true;

        this.botBiba.add(botMesh);

        const mapSize = 150;
        const edgeOffset = 30;

        // Spawn botBiba at a different random edge
        let xBiba, zBiba;
        do {
            xBiba = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
            zBiba = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
        } while (xBiba === this.botAheno.position.x && zBiba === this.botAheno.position.z);

        this.botBiba.position.set(xBiba, 2, zBiba);
        this.scene.add(this.botBiba);

        this.visionRadiusBiba = 200;
        this.isChasingBiba = false;
        this.chaseTimeBiba = 0;
        this.maxChaseTimeBiba = 10 * 60;

        this.setRandomPatrolTargetBiba();
    }
    updateBotAheno() {
      if (!this.botAheno || !this.car) return;

      const playerDistance = this.botAheno.position.distanceTo(this.car.position);
      const speed = this.isChasingAheno ? 1.43 : 0.1;

      if (this.isChasingAheno) {
          const direction = new THREE.Vector3();
          direction.subVectors(this.car.position, this.botAheno.position).normalize();
          this.botAheno.position.addScaledVector(direction, speed);

          this.chaseTimeAheno++;

          if (playerDistance > this.visionRadiusAheno && this.chaseTimeAheno > this.maxChaseTimeAheno) {
              this.isChasingAheno = false;
              this.chaseTimeAheno = 0;
              this.setRandomPatrolTargetAheno();
          }

          this.screamAudioAheno.setVolume(Math.max(0, 1 - playerDistance / this.visionRadiusAheno));
          if (!this.screamAudioAheno.isPlaying) {
              this.screamAudioAheno.play();
          }

      } else {
          const direction = new THREE.Vector3();
          direction.subVectors(this.patrolTargetAheno, this.botAheno.position).normalize();
          this.botAheno.position.addScaledVector(direction, speed);

          if (this.botAheno.position.distanceTo(this.patrolTargetAheno) < 2) {
              this.setRandomPatrolTargetAheno();
          }

          if (playerDistance < this.visionRadiusAheno) {
              this.isChasingAheno = true;
              this.chaseTimeAheno = 0;
          }
      }
  }

  updateBotBiba() {
      if (!this.botBiba || !this.car) return;

      const playerDistance = this.botBiba.position.distanceTo(this.car.position);
      const speed = this.isChasingBiba ? 1.43 : 0.1;

      if (this.isChasingBiba) {
          const direction = new THREE.Vector3();
          direction.subVectors(this.car.position, this.botBiba.position).normalize();
          this.botBiba.position.addScaledVector(direction, speed);

          this.chaseTimeBiba++;

          if (playerDistance > this.visionRadiusBiba && this.chaseTimeBiba > this.maxChaseTimeBiba) {
              this.isChasingBiba = false;
              this.chaseTimeBiba = 0;
              this.setRandomPatrolTargetBiba();
          }

          this.screamAudioBiba.setVolume(Math.max(0, 1 - playerDistance / this.visionRadiusBiba));
          if (!this.screamAudioBiba.isPlaying) {
              this.screamAudioBiba.play();
          }

      } else {
          const direction = new THREE.Vector3();
          direction.subVectors(this.patrolTargetBiba, this.botBiba.position).normalize();
          this.botBiba.position.addScaledVector(direction, speed);

          if (this.botBiba.position.distanceTo(this.patrolTargetBiba) < 2) {
              this.setRandomPatrolTargetBiba();
          }

          if (playerDistance < this.visionRadiusBiba) {
              this.isChasingBiba = true;
              this.chaseTimeBiba = 0;
          }
      }
  }
    //-----------------------------------------------------------------------------------------------------------------------

    initScreamAudioAheno() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        this.screamAudioAheno = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(audio1, (buffer) => {
            this.screamAudioAheno.setBuffer(buffer);
            this.screamAudioAheno.setLoop(false);
            this.screamAudioAheno.setVolume(0.5);
        });
    }

    initScreamAudioBiba() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        this.screamAudioBiba = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(eblan1, (buffer) => {
            this.screamAudioBiba.setBuffer(buffer);
            this.screamAudioBiba.setLoop(false);
            this.screamAudioBiba.setVolume(0.8);
        });
    }
    
    setRandomPatrolTargetAheno() {
        this.patrolTargetAheno = new THREE.Vector3(
            Math.random() * 100 - 50,
            0,
            Math.random() * 100 - 50
        );
    }

    setRandomPatrolTargetBiba() {
        this.patrolTargetBiba = new THREE.Vector3(
            Math.random() * 100 - 50,
            0,
            Math.random() * 100 - 50
        );
    }



    initCoins() {
        // Создаем группу монет
        for (let i = 0; i < this.coinCount; i++) {
            const coin = new THREE.Group();

            // Текстура монеты
            const coinTexture = new THREE.TextureLoader().load(coin1);
            const coinMaterial = new THREE.MeshBasicMaterial({
                map: coinTexture,
                transparent: true,
                side: THREE.DoubleSide,
                color: 0xffdf00 // Золотой цвет
            });

            const coinMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), coinMaterial);
            coin.add(coinMesh);

            // Случайное размещение монет на карте
            coin.position.set(
                Math.random() * 120 - 40,
                0.5, // Немного над землей
                Math.random() * 120 - 40
            );

            this.coins.push({
                mesh: coin,
                collected: false
            });

            this.scene.add(coin);
        }
    }

    createCoinCounter() {
        // Создание счетчика на экране
        this.coinCounter = document.createElement('div');
        this.coinCounter.style.position = 'absolute';
        this.coinCounter.style.top = '20px';
        this.coinCounter.style.right = '40%';
        this.coinCounter.style.color = 'white';
        this.coinCounter.style.background = 'rgba(0, 0, 0, 0.5)';
        this.coinCounter.style.padding = '10px';
        this.coinCounter.style.borderRadius = '5px';
        this.coinCounter.style.fontSize = '24px';
        this.coinCounter.style.fontFamily = 'Arial';
        this.coinCounter.textContent = `Монеты: ${this.collectedCoins}/${this.coinCount}`;
        document.body.appendChild(this.coinCounter);
    }

    updateCoins() {
        if (!this.car) return;

        // Обновление монет (вращение и проверка сбора)
        this.coins.forEach(coin => {
            if (!coin.collected) {
                // Вращение монеты для эффекта
                coin.mesh.rotation.y += 0.02;

                // Проверка столкновения
                const distance = coin.mesh.position.distanceTo(this.car.position);
                if (distance < 3) { // Радиус сбора монеты
                    coin.collected = true;
                    coin.mesh.visible = false;
                    this.collectedCoins++;
                    this.coinCounter.textContent = `Монеты: ${this.collectedCoins}/${this.coinCount}`;

                    // Опционально: звук сбора монеты
                    if (this.coinSound) {
                        this.coinSound.play();
                    }
                }
            }
        });
    }
    initBotAheno() {
        this.botAheno = new THREE.Group();

        const botTexture = new THREE.TextureLoader().load(img);
        const botMaterial = new THREE.MeshStandardMaterial({
            map: botTexture,
            transparent: true,
            opacity: 0.9,
            metalness: 0.2,
            roughness: 0.8
        });

        const botMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), botMaterial);
        botMesh.castShadow = true;
        botMesh.receiveShadow = true;

        this.botAheno.add(botMesh);

        const mapSize = 150;
        const edgeOffset = 30;

        // Spawn botAheno at a random edge
        const xAheno = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
        const zAheno = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);

        this.botAheno.position.set(xAheno, 2, zAheno);
        this.scene.add(this.botAheno);

        this.visionRadiusAheno = 20;
        this.isChasingAheno = false;
        this.chaseTimeAheno = 0;
        this.maxChaseTimeAheno = 10 * 60;

        this.setRandomPatrolTargetAheno();
    }

    initBotBiba() {
        this.botBiba = new THREE.Group();

        const botTexture = new THREE.TextureLoader().load(eblan1);
        const botMaterial = new THREE.MeshStandardMaterial({
            map: botTexture,
            transparent: true,
            opacity: 0.9,
            metalness: 0.2,
            roughness: 0.8
        });

        const botMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), botMaterial);
        botMesh.castShadow = true;
        botMesh.receiveShadow = true;

        this.botBiba.add(botMesh);

        const mapSize = 150;
        const edgeOffset = 30;

        // Spawn botBiba at a different random edge
        let xBiba, zBiba;
        do {
            xBiba = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
            zBiba = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
        } while (xBiba === this.botAheno.position.x && zBiba === this.botAheno.position.z);

        this.botBiba.position.set(xBiba, 2, zBiba);
        this.scene.add(this.botBiba);

        this.visionRadiusBiba = 10;
        this.isChasingBiba = false;
        this.chaseTimeBiba = 0;
        this.maxChaseTimeBiba = 10 * 60;

        this.setRandomPatrolTargetBiba();
    }
    initBotBoba() {
      this.botBoba = new THREE.Group();
  
      const botTexture = new THREE.TextureLoader().load(eblan2);
      const botMaterial = new THREE.MeshStandardMaterial({
          map: botTexture,
          transparent: true,
          opacity: 0.9,
          metalness: 0.2,
          roughness: 0.8
      });
  
      const botMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), botMaterial);
      botMesh.castShadow = true;
      botMesh.receiveShadow = true;
  
      this.botBoba.add(botMesh);
  
      const mapSize = 100; // Увеличил размер карты для лучшего распределения
      const edgeOffset = 5;
  
      // Spawn botBoba at a different random edge
      let xBoba, zBoba;
      do {
          xBoba = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
          zBoba = Math.random() < 0.5 ? -(mapSize / 2 - edgeOffset) : (mapSize / 2 - edgeOffset);
      } while (this.botAheno && xBoba === this.botAheno.position.x && zBoba === this.botAheno.position.z);
  
      this.botBoba.position.set(xBoba, 2, zBoba);
      this.scene.add(this.botBoba);
  
      this.visionRadiusBoba = 20; // Увеличил радиус обзора
      this.isChasingBoba = false;
      this.chaseTimeBoba = 0;
      this.maxChaseTimeBoba = 10 * 60;
  
      this.setRandomPatrolTargetBoba();
  }
  
  setRandomPatrolTargetBoba() {
      this.patrolTargetBoba = new THREE.Vector3(
          Math.random() * 100 - 50,
          0,
          Math.random() * 100 - 50
      );
  }
  
  initScreamAudioBoba() {
      const listener = new THREE.AudioListener();
      this.camera.add(listener);
  
      this.screamAudioBoba = new THREE.Audio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(eblan2mp3, (buffer) => {
          this.screamAudioBoba.setBuffer(buffer);
          this.screamAudioBoba.setLoop(false);
          this.screamAudioBoba.setVolume(0.5);
      });
  }
  
  updateBotBoba(deltaTime) {
      if (!this.botBoba) return;
      
      // Проверка расстояния до игрока
      const distanceToPlayer = this.botBoba.position.distanceTo(this.camera.position);
      
      // Если игрок в зоне видимости, начать преследование
      if (distanceToPlayer < this.visionRadiusBoba) {
          this.isChasingBoba = true;
          this.chaseTimeBoba = 0;
          
          // Воспроизвести звук, если не воспроизводится
          if (this.screamAudioBoba && !this.screamAudioBoba.isPlaying) {
              this.screamAudioBoba.play();
          }
      }
      
      // Обновление таймера преследования
      if (this.isChasingBoba) {
          this.chaseTimeBoba += deltaTime;
          if (this.chaseTimeBoba > this.maxChaseTimeBoba) {
              this.isChasingBoba = false;
              this.setRandomPatrolTargetBoba();
          }
      }
      
      // Определение цели движения
      let targetPosition;
      if (this.isChasingBoba) {
          // Преследование игрока
          targetPosition = this.camera.position.clone();
      } else {
          // Патрулирование
          targetPosition = this.patrolTargetBoba;
          
          // Если достигли цели патрулирования, установить новую
          if (this.botBoba.position.distanceTo(this.patrolTargetBoba) < 2) {
              this.setRandomPatrolTargetBoba();
          }
      }
      
      // Расчет направления движения
      const direction = new THREE.Vector3();
      direction.subVectors(targetPosition, this.botBoba.position).normalize();
      
      // Скорость движения (быстрее при преследовании)
      const speed = this.isChasingBoba ? 0.15 : 0.05;
      
      // Обновление позиции
      this.botBoba.position.x += direction.x * speed;
      this.botBoba.position.z += direction.z * speed;
      
      // Поворот в направлении движения
      if (direction.length() > 0.01) {
          this.botBoba.lookAt(
              this.botBoba.position.x + direction.x,
              this.botBoba.position.y,
              this.botBoba.position.z + direction.z
          );
      }
  }

    initScreamAudioAheno() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        this.screamAudioAheno = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(eblan2mp3, (buffer) => {
            this.screamAudioAheno.setBuffer(buffer);
            this.screamAudioAheno.setLoop(false);
            this.screamAudioAheno.setVolume(0.5);
        });
    }

    initScreamAudioBiba() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        this.screamAudioBiba = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(eblan1mp3, (buffer) => {
            this.screamAudioBiba.setBuffer(buffer);
            this.screamAudioBiba.setLoop(false);
            this.screamAudioBiba.setVolume(0.5);
        });
    }
    // initScreamAudioBoba() {
    //     const listener = new THREE.AudioListener();
    //     this.camera.add(listener);
    
    //     this.screamAudioBoba = new THREE.Audio(listener);
    //     const audioLoader = new THREE.AudioLoader();
    //     audioLoader.load('/eblan2.mp3', (buffer) => {
    //         this.screamAudioBoba.setBuffer(buffer);
    //         this.screamAudioBoba.setLoop(false);
    //         this.screamAudioBoba.setVolume(0.5);
    //     });
    // }
    setRandomPatrolTargetAheno() {
        this.patrolTargetAheno = new THREE.Vector3(
            Math.random() * 100 - 50,
            0,
            Math.random() * 100 - 50
        );
    }

    setRandomPatrolTargetBiba() {
        this.patrolTargetBiba = new THREE.Vector3(
            Math.random() * 100 - 50,
            0,
            Math.random() * 100 - 50
        );
    }

    updateBotAheno() {
        if (!this.botAheno || !this.car) return;

        const playerDistance = this.botAheno.position.distanceTo(this.car.position);
        const speed = this.isChasingAheno ? 0.13 : 0.1;

        if (this.isChasingAheno) {
            const direction = new THREE.Vector3();
            direction.subVectors(this.car.position, this.botAheno.position).normalize();
            this.botAheno.position.addScaledVector(direction, speed);

            this.chaseTimeAheno++;

            if (playerDistance > this.visionRadiusAheno && this.chaseTimeAheno > this.maxChaseTimeAheno) {
                this.isChasingAheno = false;
                this.chaseTimeAheno = 0;
                this.setRandomPatrolTargetAheno();
            }

            this.screamAudioAheno.setVolume(Math.max(0, 1 - playerDistance / this.visionRadiusAheno));
            if (!this.screamAudioAheno.isPlaying) {
                this.screamAudioAheno.play();
            }

        } else {
            const direction = new THREE.Vector3();
            direction.subVectors(this.patrolTargetAheno, this.botAheno.position).normalize();
            this.botAheno.position.addScaledVector(direction, speed);

            if (this.botAheno.position.distanceTo(this.patrolTargetAheno) < 2) {
                this.setRandomPatrolTargetAheno();
            }

            if (playerDistance < this.visionRadiusAheno) {
                this.isChasingAheno = true;
                this.chaseTimeAheno = 0;
            }
        }
    }

    updateBotBiba() {
        if (!this.botBiba || !this.car) return;

        const playerDistance = this.botBiba.position.distanceTo(this.car.position);
        const speed = this.isChasingBiba ? 0.13 : 0.1;

        if (this.isChasingBiba) {
            const direction = new THREE.Vector3();
            direction.subVectors(this.car.position, this.botBiba.position).normalize();
            this.botBiba.position.addScaledVector(direction, speed);

            this.chaseTimeBiba++;

            if (playerDistance > this.visionRadiusBiba && this.chaseTimeBiba > this.maxChaseTimeBiba) {
                this.isChasingBiba = false;
                this.chaseTimeBiba = 0;
                this.setRandomPatrolTargetBiba();
            }

            this.screamAudioBiba.setVolume(Math.max(0, 1 - playerDistance / this.visionRadiusBiba));
            if (!this.screamAudioBiba.isPlaying) {
                this.screamAudioBiba.play();
            }

        } else {
            const direction = new THREE.Vector3();
            direction.subVectors(this.patrolTargetBiba, this.botBiba.position).normalize();
            this.botBiba.position.addScaledVector(direction, speed);

            if (this.botBiba.position.distanceTo(this.patrolTargetBiba) < 2) {
                this.setRandomPatrolTargetBiba();
            }

            if (playerDistance < this.visionRadiusBiba) {
                this.isChasingBiba = true;
                this.chaseTimeBiba = 0;
            }
        }
    }
    // updateBotBoba() {
    //     if (!this.botBoba || !this.car) return;
    //
    //     const playerDistance = this.botBoba.position.distanceTo(this.car.position);
    //     const speed = this.isChasingBoba ? 0.13 : 0.1;
    //
    //     if (this.isChasingBoba) {
    //         const direction = new THREE.Vector3();
    //         direction.subVectors(this.car.position, this.botBoba.position).normalize();
    //         this.botBoba.position.addScaledVector(direction, speed);
    //
    //         this.chaseTimeBoba++;
    //
    //         if (playerDistance > this.visionRadiusBoba && this.chaseTimeBoba > this.maxChaseTimeBoba) {
    //             this.isChasingBoba = false;
    //             this.chaseTimeBiba = 0;
    //             this.setRandomPatrolTargetBoba();
    //         }
    //
    //         this.screamAudioBoba.setVolume(Math.max(0, 1 - playerDistance / this.visionRadiusBoba));
    //         if (!this.screamAudioBoba.isPlaying) {
    //             this.screamAudioBoba.play();
    //         }
    //
    //     } else {
    //         const direction = new THREE.Vector3();
    //         direction.subVectors(this.patrolTargetBoba, this.botBoba.position).normalize();
    //         this.botBoba.position.addScaledVector(direction, speed);
    //
    //         if (this.botBoba.position.distanceTo(this.patrolTargetBoba) < 2) {
    //             this.setRandomPatrolTargetBiba();
    //         }
    //
    //         if (playerDistance < this.visionRadiusBoba) {
    //             this.isChasingBoba = true;
    //             this.chaseTimeBoba = 0;
    //         }
    //     }
    // }

    initSky() {
        const skyGeometry = new THREE.SphereGeometry(100, 32, 32);

        // Градиент неба заката
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x6A0DAD) }, // Фиолетовый
                bottomColor: { value: new THREE.Color(0xFF4500) }, // Оранжевый
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, pow(max(h, 0.0), exponent)), 1.0);
                }
            `,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }

    initClouds() {
        this.clouds = [];
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < 5; i++) {
            const cloud = new THREE.Group();
            for (let j = 0; j < 3; j++) {
                const cloudPart = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), cloudMaterial);
                cloudPart.position.set(j * 1.5 - 1.5, Math.random(), 0);
                cloud.add(cloudPart);
            }
            cloud.position.set(Math.random() * 50 - 25, Math.random() * 10 + 5, Math.random() * 50 - 25);
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    addParkourVideo() {
        const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // Создаем контейнер для видео
        const videoContainer = document.createElement('div');
        videoContainer.style.position = 'fixed';
        isMobile ?  videoContainer.style.top = '10px' : videoContainer.style.bottom = '10px';
        videoContainer.style.right = '10px';
        videoContainer.style.width = '25%'; // 1/5 ширины экрана
        videoContainer.style.zIndex = '1000';
        videoContainer.style.pointerEvents = 'none'; // Отключаем взаимодействие с видео
        videoContainer.style.borderRadius = '8px';
        videoContainer.style.overflow = 'hidden';
        videoContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        // Создаем iframe для YouTube видео
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.style.aspectRatio = '16/9';

        // Параметры видео:
        // - autoplay=1: автоматически воспроизводить
        // - mute=1: без звука
        // - controls=0: без элементов управления
        // - loop=1: зацикливание
        // - disablekb=1: отключение клавиатурного управления
        // - modestbranding=1: минимальный брендинг
        // - start=50: начать с 50-й секунды
        iframe.src = 'https://www.youtube.com/embed/n_Dv4JMiwK8?autoplay=1&mute=1&controls=0&loop=1&disablekb=1&modestbranding=1&start=50&playlist=n_Dv4JMiwK8';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = false;

        // Добавляем iframe в контейнер
        videoContainer.appendChild(iframe);

        // Добавляем контейнер на страницу
        document.body.appendChild(videoContainer);
    }
    addSlimeVideo() {
        const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Создаем контейнер для видео
        const videoContainer = document.createElement('div');
        videoContainer.style.position = 'fixed';
        isMobile ? videoContainer.style.top = '10px' :  videoContainer.style.bottom = '10px';
        videoContainer.style.left = '10px';
        videoContainer.style.width = '25%'; // 1/5 ширины экрана
        videoContainer.style.zIndex = '1000';
        videoContainer.style.pointerEvents = 'none'; // Отключаем взаимодействие с видео
        videoContainer.style.borderRadius = '8px';
        videoContainer.style.overflow = 'hidden';
        videoContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        // Создаем iframe для YouTube видео
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.style.aspectRatio = '16/9';

        // Параметры видео:
        // - autoplay=1: автоматически воспроизводить
        // - mute=1: без звука
        // - controls=0: без элементов управления
        // - loop=1: зацикливание
        // - disablekb=1: отключение клавиатурного управления
        // - modestbranding=1: минимальный брендинг
        // - start=50: начать с 50-й секунды
        iframe.src = 'https://www.youtube.com/embed/HDp6r4dCedw?autoplay=1&mute=1&controls=0&loop=1&disablekb=1&modestbranding=1&playlist=HDp6r4dCedw';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = false;

        // Добавляем iframe в контейнер
        videoContainer.appendChild(iframe);

        // Добавляем контейнер на страницу
        document.body.appendChild(videoContainer);
    }
// Добавьте этот новый метод в класс
    initControlsInfo() {
        const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) return;
        const controlsInfo = document.createElement('div');
        controlsInfo.style.position = 'absolute';
        controlsInfo.style.top = '10px';
        controlsInfo.style.left = '10px';
        controlsInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        controlsInfo.style.color = 'white';
        controlsInfo.style.padding = '10px';
        controlsInfo.style.borderRadius = '5px';
        controlsInfo.style.fontFamily = 'Arial, sans-serif';
        controlsInfo.style.zIndex = '1000';
        controlsInfo.innerHTML = 'Управление - WASD, Ускорение - SHIFT, Создать скалу - J, Создать куст - K, Создать домик - L';
        document.body.appendChild(controlsInfo);
    }

    initTShapeParticles() {
      this.tShapeParticles = [];
      const particleCount = 350; // Увеличил количество с 200 до 350
      const pinkMaterial = new THREE.MeshStandardMaterial({
          color: 0xff69b4,
          emissive: 0xff69b4,
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.9
      });
      const redMaterial = new THREE.MeshStandardMaterial({
          color: 0xfa8072,
          emissive: 0xfa8072,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9
      });
      const mapSize = 100;
      for (let i = 0; i < particleCount; i++) {
          const verticalBar = new THREE.BoxGeometry(0.08, 0.2, 0.08);
          const horizontalBar = new THREE.BoxGeometry(0.25, 0.08, 0.08);
          const redTip = new THREE.BoxGeometry(0.08, 0.05, 0.08);
          const verticalMesh = new THREE.Mesh(verticalBar, pinkMaterial);
          const horizontalMesh = new THREE.Mesh(horizontalBar, pinkMaterial);
          const redTipMesh = new THREE.Mesh(redTip, redMaterial);
          horizontalMesh.position.y = 0.12;
          redTipMesh.position.y = -0.125;
          const tShape = new THREE.Group();
          tShape.add(verticalMesh);
          tShape.add(horizontalMesh);
          tShape.add(redTipMesh);
          const x = Math.random() * mapSize * 2 - mapSize;
          const y = 2.5 + Math.random() * 5; // Увеличил начальную высоту с 0.5 до 2.5
          const z = Math.random() * mapSize * 2 - mapSize;
          tShape.position.set(x, y, z);
          tShape.userData = {
              velocity: new THREE.Vector3(
                  (Math.random() * 2 - 1) * 0.05,
                  (Math.random() * 2 - 1) * 0.02,
                  (Math.random() * 2 - 1) * 0.05
              ),
              rotationSpeed: {
                  x: (Math.random() * 2 - 1) * 0.02,
                  y: (Math.random() * 2 - 1) * 0.02,
                  z: (Math.random() * 2 - 1) * 0.02
              },
              changeDirectionCounter: 0,
              changeDirectionTime: 100 + Math.random() * 200,
              mapBounds: mapSize
          };
          this.scene.add(tShape);
          this.tShapeParticles.push(tShape);
      }
  }
  
  updateTShapeParticles() {
      const windDirection = new THREE.Vector3();
      if (Math.abs(this.carSpeed) > 0.02) {
          windDirection.x = Math.sin(this.car.rotation.y) * this.carSpeed * 0.5;
          windDirection.z = Math.cos(this.car.rotation.y) * this.carSpeed * 0.5;
      } else {
          windDirection.x = 0.01;
          windDirection.z = 0.01;
      }
      this.tShapeParticles.forEach(particle => {
          particle.rotation.x += particle.userData.rotationSpeed.x;
          particle.rotation.y += particle.userData.rotationSpeed.y;
          particle.rotation.z += particle.userData.rotationSpeed.z;
          particle.userData.changeDirectionCounter++;
          if (particle.userData.changeDirectionCounter >= particle.userData.changeDirectionTime) {
              particle.userData.velocity.x += (Math.random() * 2 - 1) * 0.05;
              particle.userData.velocity.y += (Math.random() * 2 - 1) * 0.02;
              particle.userData.velocity.z += (Math.random() * 2 - 1) * 0.05;
              particle.userData.velocity.clampLength(0, 0.1);
              particle.userData.changeDirectionCounter = 0;
              particle.userData.changeDirectionTime = 100 + Math.random() * 200;
          }
          particle.userData.velocity.x += windDirection.x * 0.01;
          particle.userData.velocity.z += windDirection.z * 0.01;
          particle.position.x += particle.userData.velocity.x;
          particle.position.y += particle.userData.velocity.y;
          particle.position.z += particle.userData.velocity.z;
          const bounds = particle.userData.mapBounds;
          if (particle.position.x > bounds) {
              particle.position.x = -bounds;
          } else if (particle.position.x < -bounds) {
              particle.position.x = bounds;
          }
          if (particle.position.z > bounds) {
              particle.position.z = -bounds;
          } else if (particle.position.z < -bounds) {
              particle.position.z = bounds;
          }
          if (particle.position.y < 2.0) { // Увеличил минимальную высоту с 0.5 до 2.0
              particle.position.y = 2.0;
              particle.userData.velocity.y *= -0.5;
          } else if (particle.position.y > 10) {
              particle.position.y = 10;
              particle.userData.velocity.y *= -0.5;
          }
      });
  }

    initScene() {
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
    }

    initCamera() {
        this.sizes = { width: window.innerWidth, height: window.innerHeight };
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
        this.camera.position.set(0, 5, -10);
        this.scene.add(this.camera);
    }

    initRenderer() {
        this.canvas = document.querySelector("canvas.webgl");
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.clock = new THREE.Clock();
        this.targetFPS = 60;
        this.frameTime = 1 / this.targetFPS;
        this.deltaAccumulator = 0;
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0xFF8C00, 0.5));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    initCar() {
      // Основные настройки
      const carColor = 0xf7b731; // Яркий золотисто-желтый цвет вместо красного
      
      // Создаем основной корпус машины
      const bodyGeometry = new THREE.BoxGeometry(1, 0.25, 2);
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
          color: carColor,
          metalness: 0.7,
          roughness: 0.3
      });
      this.car = new THREE.Group();
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.3;
      this.car.add(body);
      
      // Добавляем крышу (более низкую, как у Ламборгини)
      const roofGeometry = new THREE.BoxGeometry(0.8, 0.25, 0.9);
      const roofMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x000000,
          metalness: 0.7,
          roughness: 0.3,
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 0.4;
      roof.position.z = -0.05;
      roof.rotation.x = Math.PI / 2 - 105;
      this.car.add(roof);
      
      // Добавляем капот (заостренный, как у старой Ламборгини)
      const hoodGeometry = new THREE.BoxGeometry(0.9, 0.1, 0.6);
      const hoodMaterial = new THREE.MeshStandardMaterial({ 
          color: carColor,
          metalness: 0.7,
          roughness: 0.3
      });
      const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
      hood.position.y = 0.35;
      hood.position.z = 0.7;
      this.car.add(hood);
      
      // Создаем группы для передних колес чтобы их можно было поворачивать
      this.frontWheelGroup = new THREE.Group();
      this.frontWheelGroup.position.set(0, 0, 0.6);
      this.car.add(this.frontWheelGroup);
      
      // Добавляем колеса (позиционируем ближе к корпусу)
      const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
      const wheelMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x111111,
          roughness: 0.7
      });
      const wheelRimMaterial = new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          metalness: 0.9,
          roughness: 0.1
      });
      
      // Функция для создания колеса с дисками
      const createWheel = () => {
          const wheelGroup = new THREE.Group();
          
          // Шина
          const tire = new THREE.Mesh(wheelGeometry, wheelMaterial);
          wheelGroup.add(tire);
          
          // Диск
          const rimGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.11, 8);
          const rim = new THREE.Mesh(rimGeometry, wheelRimMaterial);
          wheelGroup.add(rim);
          
          // Спицы
          for (let i = 0; i < 5; i++) {
              const spokeGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.2);
              const spoke = new THREE.Mesh(spokeGeometry, wheelRimMaterial);
              spoke.rotation.x = Math.PI / 2;
              spoke.rotation.y = (Math.PI / 2.5) * i;
              wheelGroup.add(spoke);
          }
          
          wheelGroup.rotation.z = Math.PI / 2;
          return wheelGroup;
      };
      
      // Переднее левое колесо
      this.frontLeftWheel = createWheel();
      this.frontLeftWheel.position.set(0.5, 0.2, 0.1);
      this.frontWheelGroup.add(this.frontLeftWheel);
      
      // Переднее правое колесо
      this.frontRightWheel = createWheel();
      this.frontRightWheel.position.set(-0.5, 0.2, 0.1);
      this.frontWheelGroup.add(this.frontRightWheel);
      
      // Заднее левое колесо - исправляем позицию
      this.rearLeftWheel = createWheel();
      this.rearLeftWheel.position.set(0.5, 0.2, -0.6); // Было -1.2, теперь ближе к центру машины
      this.car.add(this.rearLeftWheel);
      
      // Заднее правое колесо - исправляем позицию
      this.rearRightWheel = createWheel();
      this.rearRightWheel.position.set(-0.5, 0.2, -0.6); // Было -1.2, теперь ближе к центру машины
      this.car.add(this.rearRightWheel);
      
      // Добавляем фары
      const headlightGeometry = new THREE.SphereGeometry(0.1, 12, 12);
      const headlightMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffffcc, 
          emissive: 0xffffcc,
          emissiveIntensity: 1
      });
      
      const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      leftHeadlight.position.set(0.3, 0.3, 1.0);
      this.car.add(leftHeadlight);
      
      const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      rightHeadlight.position.set(-0.3, 0.3, 1.0);
      this.car.add(rightHeadlight);
      
      // Добавляем задние фонари
      const tailLightGeometry = new THREE.SphereGeometry(0.07, 8, 8);
      const tailLightMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xff0000, 
          emissive: 0xff0000,
          emissiveIntensity: 0.8
      });
      
      const leftTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
      leftTailLight.position.set(0.3, 0.3, -1.0);
      this.car.add(leftTailLight);
      
      const rightTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
      rightTailLight.position.set(-0.3, 0.3, -1.0);
      this.car.add(rightTailLight);
      
      // Добавляем лобовое стекло
      const windshieldGeometry = new THREE.PlaneGeometry(0.7, 0.3);
      const windshieldMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x88ccff,
          transparent: true,
          opacity: 0.7
      });
      const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
      windshield.rotation.x = -Math.PI / 4;
      windshield.position.set(0, 0.5, 0.25);
      this.car.add(windshield);
      this.carSpeed = 0;
      this.carVelocity = new THREE.Vector3(0, 0, 0);
      this.carDirection = new THREE.Vector3(0, 0, 1);
      
      // Добавляем параметры для прыжка
      this.isJumping = false;
      this.jumpForce = 0;
      this.jumpHeight = 0;
      this.gravity = 0.015;
      this.maxJumpForce = 0.4;
      this.jumpCooldown = 0;
      this.jumpCooldownTime = 50; // Кулдаун между прыжками
      
      this.scene.add(this.car);
      this.carSpeed = 0;
      this.carVelocity = new THREE.Vector3(0, 0, 0);
      this.carDirection = new THREE.Vector3(0, 0, 1);
      this.isDrifting = false;
      this.driftFactor = 0;
      this.traction = 1.0;
      this.smokeParticles = [];
      this.wheels = [this.frontLeftWheel, this.frontRightWheel, this.rearLeftWheel, this.rearRightWheel];
      this.keys = {};
      window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
      window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
      window.addEventListener("keydown", (e) => {
          this.keys[e.code] = true;
          
          // Прыжок при нажатии пробела
          if (e.code === "Space" && !this.isJumping && this.jumpCooldown === 0) {
              this.isJumping = true;
              this.jumpForce = this.maxJumpForce;
              
              // Добавляем эффект прыжка - машина слегка наклоняется вперед
              this.car.rotation.x = -0.2;
          }
      });
      window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
  }
  
  createLandingSmoke() {
    // Если у вас уже есть метод createDriftSmoke, можно использовать его с небольшими изменениями
    // или создать новый метод для дыма при приземлении
    for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xdddddd,
                transparent: true,
                opacity: 0.6
            })
        );
        
        // Размещаем частицы вокруг машины
        const angle = Math.random() * Math.PI * 2;
        const distance = 0.5 + Math.random() * 1;
        particle.position.set(
            this.car.position.x + Math.cos(angle) * distance,
            0.1 + Math.random() * 0.3,
            this.car.position.z + Math.sin(angle) * distance
        );
        
        // Задаем скорость и направление частиц
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() * 2 - 1) * 0.03,
                0.03 + Math.random() * 0.05,
                (Math.random() * 2 - 1) * 0.03
            ),
            life: 30 + Math.random() * 30
        };
        
        this.scene.add(particle);
        this.smokeParticles.push(particle);
    }
}
updateSmokeParticles() {
  // Обновляем существующие частицы дыма
  for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const particle = this.smokeParticles[i];
      
      // Применяем скорость
      particle.position.x += particle.userData.velocity.x;
      particle.position.y += particle.userData.velocity.y;
      particle.position.z += particle.userData.velocity.z;
      
      // Уменьшаем скорость по Y (гравитация)
      particle.userData.velocity.y -= 0.001;
      
      // Увеличиваем размер частиц со временем
      particle.scale.x += 0.01;
      particle.scale.y += 0.01;
      particle.scale.z += 0.01;
      
      // Уменьшаем прозрачность
      particle.material.opacity -= 0.01;
      
      // Уменьшаем время жизни
      particle.userData.life--;
      
      // Удаляем частицы, которые исчезли или закончился их срок жизни
      if (particle.material.opacity <= 0 || particle.userData.life <= 0) {
          this.scene.remove(particle);
          this.smokeParticles.splice(i, 1);
      }
  }
}
// Модифицируйте метод updateCar для обработки прыжка
updateCar() {
  this.carDirection.set(Math.sin(this.car.rotation.y), 0, Math.cos(this.car.rotation.y));
  let acceleration = 0;
  if (this.keys["KeyW"]) {
      acceleration = this.keys["ShiftLeft"] || this.keys["ShiftRight"] ? 0.01 : 0.005;
  } else if (this.keys["KeyS"]) acceleration = -0.005;
  this.carSpeed += acceleration;
  this.carSpeed *= 0.98;
  
  let steering = 0;
  if (this.keys["KeyA"]) steering = 0.03;
  if (this.keys["KeyD"]) steering = -0.03;
  
  // Поворачиваем передние колеса при повороте
  if (steering !== 0) {
      this.frontWheelGroup.rotation.y = steering * 10;
  } else {
      this.frontWheelGroup.rotation.y *= 0.8;
  }
  
  const steeringIntensity = Math.abs(steering);
  const speedThreshold = 0.08;
  
  if (Math.abs(this.carSpeed) > speedThreshold && steeringIntensity > 0) {
      this.isDrifting = true;
      this.traction = Math.max(0.3, this.traction - 0.1);
      this.createDriftSmoke();
  } else {
      this.traction = Math.min(1.0, this.traction + 0.05);
      this.isDrifting = false;
  }
  
  // Уменьшаем управляемость в воздухе при прыжке
  if (this.isJumping) {
      steering *= 0.3;
  }
  
  this.car.rotation.y += steering * (this.isDrifting ? 1.5 : 1.0);
  
  // Вращаем колеса при движении
  const wheelRotationSpeed = this.carSpeed * 0.5;
  this.wheels.forEach(wheel => {
      wheel.rotation.x += wheelRotationSpeed;
  });
  
  // Обновляем кулдаун прыжка
  if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
  }
  
  // Обработка прыжка
  if (this.isJumping) {
      // Применяем силу прыжка
      this.jumpHeight += this.jumpForce;
      this.jumpForce -= this.gravity;
      
      // Если машина приземлилась
      if (this.jumpHeight <= 0) {
          this.jumpHeight = 0;
          this.isJumping = false;
          this.jumpForce = 0;
          this.jumpCooldown = this.jumpCooldownTime;
          
          // Эффект приземления - машина слегка подпрыгивает и наклоняется
          this.car.rotation.x = 0.15;
          
          // Эффект дыма при приземлении
          if (Math.abs(this.carSpeed) > 0.05) {
              this.createLandingSmoke();
          }
      }
      
      // Устанавливаем высоту машины
      this.car.position.y = this.jumpHeight + 0.05;
  } else {
      // Анимация подвески при движении по земле
      if (this.carSpeed !== 0) {
          const bounceAmount = Math.sin(Date.now() * 0.01) * 0.005 * Math.abs(this.carSpeed) * 5;
          this.car.position.y = bounceAmount + 0.05;
          
          if (acceleration > 0) {
              this.car.rotation.x = -0.03 * Math.abs(this.carSpeed) * 3;
          } else if (acceleration < 0) {
              this.car.rotation.x = 0.03 * Math.abs(this.carSpeed) * 3;
          } else {
              this.car.rotation.x *= 0.9;
          }
      } else {
          this.car.rotation.x *= 0.9;
      }
  }
  
  if (steering !== 0) {
      this.car.rotation.z = -steering * Math.abs(this.carSpeed) * 2;
  } else {
      this.car.rotation.z *= 0.9;
  }
  
  this.carVelocity.x = this.carVelocity.x * (1 - this.traction) + this.carDirection.x * this.carSpeed * this.traction;
  this.carVelocity.z = this.carVelocity.z * (1 - this.traction) + this.carDirection.z * this.carSpeed * this.traction;
  
  // Новые координаты машины
  let newPosX = this.car.position.x + this.carVelocity.x;
  let newPosZ = this.car.position.z + this.carVelocity.z;
  
  // Проверка границы круга
  const skyRadius = 97;
  const distanceFromCenter = Math.sqrt(newPosX * newPosX + newPosZ * newPosZ);
  
  let collision = false;
  
  if (distanceFromCenter > skyRadius) {
      // Обработка столкновения с границей круга
      const dirX = newPosX / distanceFromCenter;
      const dirZ = newPosZ / distanceFromCenter;
      
      this.car.position.x = dirX * skyRadius * 0.98;
      this.car.position.z = dirZ * skyRadius * 0.98;
      
      const dotProduct = this.carVelocity.x * dirX + this.carVelocity.z * dirZ;
      this.carVelocity.x -= 2 * dotProduct * dirX;
      this.carVelocity.z -= 2 * dotProduct * dirZ;
      
      this.carVelocity.x *= 0.3;
      this.carVelocity.z *= 0.3;
      this.carSpeed *= 0.3;
      
      collision = true;
  }
  
  // Проверка столкновения со стенами лабиринта только если машина не в прыжке или высота прыжка ниже высоты стен
  if (!collision && this.walls && (!this.isJumping || this.jumpHeight < 4.0)) {
      const carRadius = 1.0; // Примерный радиус машины для обнаружения столкновений
      
      for (const wall of this.walls) {
          // Проверяем, находится ли машина достаточно близко к стене
          const wallStart = wall.start;
          const wallEnd = wall.end;
          
          // Вектор от начала стены до машины
          const wallToCarX = newPosX - wallStart.x;
          const wallToCarZ = newPosZ - wallStart.y;
          
          // Вектор стены
          const wallVectorX = wallEnd.x - wallStart.x;
          const wallVectorZ = wallEnd.y - wallStart.y;
          const wallLength = wall.length;
          
          // Проекция вектора (машина - начало стены) на вектор стены
          const projection = (wallToCarX * wallVectorX + wallToCarZ * wallVectorZ) / wallLength;
          
          // Ближайшая точка на стене к машине
          let closestX, closestZ;
          
          if (projection <= 0) {
              // Ближайшая точка - начало стены
              closestX = wallStart.x;
              closestZ = wallStart.y;
          } else if (projection >= wallLength) {
              // Ближайшая точка - конец стены
              closestX = wallEnd.x;
              closestZ = wallEnd.y;
          } else {
              // Ближайшая точка - проекция на стену
              closestX = wallStart.x + (projection / wallLength) * wallVectorX;
              closestZ = wallStart.y + (projection / wallLength) * wallVectorZ;
          }
          
          // Расстояние от машины до ближайшей точки на стене
          const distanceToWall = Math.sqrt(
              Math.pow(newPosX - closestX, 2) + 
              Math.pow(newPosZ - closestZ, 2)
          );
          
          // Если расстояние меньше суммы радиуса машины и половины толщины стены, 
          // то произошло столкновение
          if (distanceToWall < carRadius + 0.5) {
              // Нормаль к стене (направление отталкивания)
              const normalX = wall.normal.x;
              const normalZ = wall.normal.y;
              
              // Отталкиваем машину от стены
              newPosX = closestX + normalX * (carRadius + 0.5);
              newPosZ = closestZ + normalZ * (carRadius + 0.5);
              
              // Отражаем скорость относительно нормали стены
              const dotProduct = this.carVelocity.x * normalX + this.carVelocity.z * normalZ;
              this.carVelocity.x -= 2 * dotProduct * normalX;
              this.carVelocity.z -= 2 * dotProduct * normalZ;
              
              // Уменьшаем скорость (эффект трения о стену)
              this.carVelocity.x *= 0.5;
              this.carVelocity.z *= 0.5;
              this.carSpeed *= 0.5;
              
              collision = true;
              break;
          }
      }
  }
  
  // Обновляем позицию машины
  if (!collision) {
      this.car.position.x = newPosX;
      this.car.position.z = newPosZ;
  }
}
initMobileControls() {
  // Проверяем, является ли устройство мобильным по ширине экрана или user-agent
  const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) return; // Не создаем кнопки для десктопа
  
  // Создаем контейнер для всех кнопок
  const controlsContainer = document.createElement('div');
  controlsContainer.style.position = 'fixed';
  controlsContainer.style.bottom = '20px';
  controlsContainer.style.left = '0';
  controlsContainer.style.width = '100%';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.justifyContent = 'space-between';
  controlsContainer.style.zIndex = '1000';
  document.body.appendChild(controlsContainer);
  
  // Создаем левую панель для газа/тормоза (вертикальное расположение)
  const leftPanel = document.createElement('div');
  leftPanel.style.display = 'flex';
  leftPanel.style.flexDirection = 'column'; // Вертикальное расположение
  leftPanel.style.marginLeft = '20px';
  controlsContainer.appendChild(leftPanel);
  
  // Создаем правую панель для поворотов и ускорения
  const rightPanel = document.createElement('div');
  rightPanel.style.display = 'flex';
  rightPanel.style.paddingTop = '10%';    
  rightPanel.style.marginRight = '20px';
  controlsContainer.appendChild(rightPanel);
  
  // Создаем центральную панель для кнопки прыжка
  const centerPanel = document.createElement('div');
  centerPanel.style.display = 'flex';
  centerPanel.style.justifyContent = 'center';
  centerPanel.style.alignItems = 'flex-end';
  centerPanel.style.position = 'absolute';
  centerPanel.style.bottom = '20px';
  centerPanel.style.left = '50%';
  centerPanel.style.transform = 'translateX(-50%)';
  controlsContainer.appendChild(centerPanel);
  
  // Функция для создания кнопки
  const createButton = (text, key, panel) => {
    const button = document.createElement('div');
    button.textContent = text;
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.margin = '10px';
    button.style.fontSize = '24px';
    button.style.fontWeight = 'bold';
    button.style.userSelect = 'none';
    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    
    // Обработчики событий для нажатия
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys[key] = true;
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys[key] = false;
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      button.style.transform = 'scale(1)';
    });
    
    panel.appendChild(button);
    return button;
  };
  
  // Создаем кнопки движения (газ сверху, тормоз снизу) на левой панели
  createButton('↑', 'KeyW', leftPanel); // Газ (вперед)
  createButton('↓', 'KeyS', leftPanel); // Тормоз (назад)
  
  // Создаем кнопки поворота на правой панели
  createButton('←', 'KeyA', rightPanel); // Влево
  createButton('→', 'KeyD', rightPanel); // Вправо
  
  // Кнопка ускорения (турбо) на правой панели
  const turboButton = createButton('⚡', 'ShiftLeft', rightPanel);
  turboButton.style.backgroundColor = 'rgba(255, 220, 0, 0.5)';
  
  // Добавляем кнопку прыжка в центральную панель
  const jumpButton = createButton('↑↑', 'Space', centerPanel);
  jumpButton.style.backgroundColor = 'rgba(0, 255, 255, 0.5)';
  jumpButton.style.width = '70px';
  jumpButton.style.height = '70px';
  jumpButton.style.fontSize = '28px';
  
  // Специальный обработчик для кнопки прыжка
  jumpButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    this.keys['Space'] = true;
    jumpButton.style.backgroundColor = 'rgba(0, 255, 255, 0.8)';
    jumpButton.style.transform = 'scale(0.95)';
    
    // Добавляем логику прыжка из обработчика клавиатуры
    if (!this.isJumping && this.jumpCooldown === 0) {
      this.isJumping = true;
      this.jumpForce = this.maxJumpForce;
      this.car.rotation.x = -0.2;
    }
  });
  
  // Добавляем кнопку полноэкранного режима
  const fullscreenButton = document.createElement('div');
  fullscreenButton.textContent = '⛶';
  fullscreenButton.style.position = 'fixed';
  fullscreenButton.style.top = '20px';
  fullscreenButton.style.right = '20px';
  fullscreenButton.style.width = '50px';
  fullscreenButton.style.height = '50px';
  fullscreenButton.style.borderRadius = '50%';
  fullscreenButton.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
  fullscreenButton.style.display = 'flex';
  fullscreenButton.style.justifyContent = 'center';
  fullscreenButton.style.alignItems = 'center';
  fullscreenButton.style.fontSize = '24px';
  fullscreenButton.style.zIndex = '1000';
  fullscreenButton.style.cursor = 'pointer';
  fullscreenButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
  
  fullscreenButton.addEventListener('click', () => {
    this.toggleFullscreen();
  });
  
  document.body.appendChild(fullscreenButton);
  
  // Обработчик изменения размера окна
  window.addEventListener('resize', () => {
    // Если размер экрана изменился, скрываем или показываем элементы управления
    if (window.innerWidth < 1024) {
      controlsContainer.style.display = 'flex';
      fullscreenButton.style.display = 'flex';
    } else {
      controlsContainer.style.display = 'none';
      fullscreenButton.style.display = 'none';
    }
  });
}
  
  // Метод для переключения полноэкранного режима
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      // Переход в полноэкранный режим
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) { // Safari
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
        document.documentElement.msRequestFullscreen();
      }
    } else {
      // Выход из полноэкранного режима
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    }
  }
  
  // Метод для создания эффекта дыма при дрифте
  createDriftSmoke() {
      if (Math.random() > 0.7 && Math.abs(this.carSpeed) > 0.1) {
          const smokeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
          const smokeMaterial = new THREE.MeshBasicMaterial({
              color: 0xdddddd,
              transparent: true,
              opacity: 0.7
          });
          
          // Создаем частицы дыма у задних колес
          const leftSmoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
          leftSmoke.position.copy(this.rearLeftWheel.position.clone());
          leftSmoke.position.add(this.car.position);
          leftSmoke.position.y = 0.1;
          leftSmoke.scale.set(0.5, 0.5, 0.5);
          leftSmoke.life = 40; // Время жизни частицы
          
          const rightSmoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
          rightSmoke.position.copy(this.rearRightWheel.position.clone());
          rightSmoke.position.add(this.car.position);
          rightSmoke.position.y = 0.1;
          rightSmoke.scale.set(0.5, 0.5, 0.5);
          rightSmoke.life = 40;
          
          this.scene.add(leftSmoke);
          this.scene.add(rightSmoke);
          this.smokeParticles.push(leftSmoke, rightSmoke);
      }
      
      // Обновляем все частицы дыма
      for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
          const particle = this.smokeParticles[i];
          particle.life--;
          particle.scale.multiplyScalar(1.03);
          particle.material.opacity *= 0.95;
          
          if (particle.life <= 0) {
              this.scene.remove(particle);
              this.smokeParticles.splice(i, 1);
          }
      }
  }

    createDriftSmoke() {
        if (Math.abs(this.carSpeed) < 0.03) return;
        for (let i = 0; i < 2; i++) {
            const smokeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const smokeMaterial = new THREE.MeshBasicMaterial({
                color: 0xdddddd,
                transparent: true,
                opacity: 0.7
            });
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            const wheelOffset = i === 0 ? -0.5 : 0.5;
            smoke.position.set(
                this.car.position.x - Math.sin(this.car.rotation.y) * 1 + Math.cos(this.car.rotation.y) * wheelOffset,
                0.1,
                this.car.position.z - Math.cos(this.car.rotation.y) * 1 - Math.sin(this.car.rotation.y) * wheelOffset
            );
            this.scene.add(smoke);
            smoke.userData = {
                life: 1.0,
                decay: 0.03 + Math.random() * 0.02,
                scale: 0.1,
                scaleRate: 0.08 + Math.random() * 0.05,
                velocity: new THREE.Vector3(
                    this.carVelocity.x * 0.2 + (Math.random() * 0.1 - 0.05),
                    0.05 + Math.random() * 0.05,
                    this.carVelocity.z * 0.2 + (Math.random() * 0.1 - 0.05)
                )
            };
            this.smokeParticles.push(smoke);
        }
    }

    updateSmoke() {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const smoke = this.smokeParticles[i];
            smoke.userData.life -= smoke.userData.decay;
            if (smoke.userData.life <= 0) {
                this.scene.remove(smoke);
                this.smokeParticles.splice(i, 1);
                continue;
            }
            smoke.material.opacity = smoke.userData.life * 0.7;
            smoke.userData.scale += smoke.userData.scaleRate;
            smoke.scale.set(smoke.userData.scale, smoke.userData.scale, smoke.userData.scale);
            smoke.position.add(smoke.userData.velocity);
        }
    }

    initEnvironment() {
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshStandardMaterial({ color: 0x228b22 })
        );
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);
    }

    initTrack() {
        const trackGeometry = new THREE.PlaneGeometry(200, 200);
        const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        this.track = new THREE.Mesh(trackGeometry, trackMaterial);
        this.track.rotation.x = -Math.PI / 2;
        this.scene.add(this.track);
    }

    initSpeedEffects() {
        this.speedLines = [];
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(3 * 2);
            positions.set([0, 0.1, 0, 0, 0.1, -1.5]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.0
            });
            const line = new THREE.Line(geometry, material);
            const lineGroup = new THREE.Group();
            lineGroup.add(line);
            const offset = i / 2 * 2 - 1;
            lineGroup.userData = {
                offset: offset,
                length: 1 + Math.random() * 1
            };
            this.scene.add(lineGroup);
            this.speedLines.push(lineGroup);
        }
        this.windParticles = [];
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 300;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            particlePositions.set([
                Math.random() * 200 - 100,
                Math.random() * 5,
                Math.random() * 200 - 100
            ], i * 3);
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            transparent: true,
            opacity: 0.4
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        this.windParticles.push(particles);
        this.speedParticles = [];
        this.lastSpeedParticleTime = 0;
    }

    updateSpeedEffects() {
        const currentTime = Date.now();
        const isAccelerating = this.keys["KeyW"] && (this.keys["ShiftLeft"] || this.keys["ShiftRight"]);
        const speedThreshold = 0.07;
        const absSpeed = Math.abs(this.carSpeed);
        this.speedLines.forEach((lineGroup, index) => {
            const line = lineGroup.children[0];
            const positions = line.geometry.attributes.position.array;
            if (absSpeed > speedThreshold || isAccelerating) {
                line.material.opacity = Math.min(absSpeed * 3, 0.5);
                lineGroup.position.copy(this.car.position);
                lineGroup.rotation.y = this.car.rotation.y;
                const backDistance = 1.0;
                lineGroup.position.x -= Math.sin(this.car.rotation.y) * backDistance;
                lineGroup.position.z -= Math.cos(this.car.rotation.y) * backDistance;
                const sideOffset = lineGroup.userData.offset;
                lineGroup.position.x += Math.cos(this.car.rotation.y) * sideOffset * 0.5;
                lineGroup.position.z -= Math.sin(this.car.rotation.y) * sideOffset * 0.5;
                lineGroup.position.y = 0.2;
                positions[0] = 0;
                positions[1] = 0;
                positions[2] = 0;
                positions[3] = 0;
                positions[4] = 0;
                positions[5] = -lineGroup.userData.length * absSpeed * 7;
                positions[3] += (Math.random() - 0.5) * 0.02;
                positions[5] += (Math.random() - 0.5) * 0.02;
            } else {
                line.material.opacity = 0;
            }
            line.geometry.attributes.position.needsUpdate = true;
        });
        if ((absSpeed > speedThreshold || isAccelerating) &&
            currentTime - this.lastSpeedParticleTime > 80) {
            this.createSpeedParticle();
            this.lastSpeedParticleTime = currentTime;
        }
        this.updateSpeedParticles();
        const particlePositions = this.windParticles[0].geometry.attributes.position.array;
        for (let i = 0; i < particlePositions.length; i += 3) {
            particlePositions[i] += (Math.random() - 0.5) * 0.05;
            particlePositions[i + 2] += (Math.random() - 0.5) * 0.05;
            const dx = particlePositions[i] - this.car.position.x;
            const dz = particlePositions[i + 2] - this.car.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance < 8 && absSpeed > 0.05) {
                particlePositions[i] -= Math.sin(this.car.rotation.y) * this.carSpeed * 0.15;
                particlePositions[i + 2] -= Math.cos(this.car.rotation.y) * this.carSpeed * 0.15;
            }
        }
        this.windParticles[0].geometry.attributes.position.needsUpdate = true;
    }

    createSpeedParticle() {
        const geometry = new THREE.BufferGeometry();
        const length = 0.8 + Math.random() * 0.7;
        const positions = new Float32Array(3 * 2);
        positions.set([0, 0, 0, 0, 0, -length]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        let color;
        const absSpeed = Math.abs(this.carSpeed);
        if (absSpeed > 0.12) {
            color = 0x000000;
        } else if (absSpeed > 0.08) {
            color = 0x888888;
        } else {
            color = 0xffffff;
        }
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.2
        });
        const line = new THREE.Line(geometry, material);
        const backX = this.car.position.x - Math.sin(this.car.rotation.y) * 1;
        const backZ = this.car.position.z - Math.cos(this.car.rotation.y) * 1;
        const sideOffset = (Math.random() - 0.5) * 0.8;
        const posX = backX + Math.cos(this.car.rotation.y) * sideOffset;
        const posZ = backZ - Math.sin(this.car.rotation.y) * sideOffset;
        line.position.set(
            posX,
            0.1 + Math.random() * 0.2,
            posZ
        );
        line.rotation.y = this.car.rotation.y;
        this.scene.add(line);
        line.userData = {
            life: 1.0,
            decay: 0.05 + Math.random() * 0.03,
            velocity: new THREE.Vector3(
                this.carVelocity.x * 0.7,
                0.005 + Math.random() * 0.01,
                this.carVelocity.z * 0.7
            ),
            carDirection: this.car.rotation.y
        };
        this.speedParticles.push(line);
    }

    updateSpeedParticles() {
        if (!this.speedParticles) return;
        for (let i = this.speedParticles.length - 1; i >= 0; i--) {
            const particle = this.speedParticles[i];
            particle.userData.life -= particle.userData.decay;
            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                this.speedParticles.splice(i, 1);
                continue;
            }
            particle.material.opacity = particle.userData.life * 0.5;
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.multiplyScalar(0.95);
        }
    }

//-------------------------------------------------------------------------------------------

// Загрузка JSON из файла
loadMountainsFromFile(filePath) {
  fetch(filePath)
      .then(response => response.json())
      .then(data => {
          this.initMountainsFromJSON(json);
      })
      .catch(error => {
          console.error("Ошибка загрузки JSON:", error);
      });
}



initSimpleToys() {
    let mountainsData = [    
        {
          "type": "mountain",
          "position": {
            "x": 8.670704903153707,
            "y": 0.04988712698648656,
            "z": 98.6184082312447
          },
          "rotation": {
            "y": 1.823791102333131
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 16.207044560476714,
            "y": 0.045435205063138175,
            "z": 96.92403354855998
          },
          "rotation": {
            "y": 0.7492522003031021
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 26.424118697822653,
            "y": 0.04859195154304964,
            "z": 93.14507184336959
          },
          "rotation": {
            "y": 0.7571270407285559
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 31.637638174942442,
            "y": 0.05239484146347796,
            "z": 91.15762748265021
          },
          "rotation": {
            "y": 0.528537575686971
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 38.32533726335035,
            "y": 0.04667409739446466,
            "z": 88.60821150793761
          },
          "rotation": {
            "y": 3.6174034830632675
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 47.31378448891219,
            "y": 0.05305826877378886,
            "z": 85.65073222247868
          },
          "rotation": {
            "y": 2.0855838790430465
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 52.45225062462116,
            "y": 0.054096110897335015,
            "z": 82.98229941516055
          },
          "rotation": {
            "y": 3.7965879227575114
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 57.228071995004164,
            "y": 0.04675519947176201,
            "z": 77.4600180271577
          },
          "rotation": {
            "y": 1.3807790561887656
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 63.54230679812722,
            "y": 0.05372099526332559,
            "z": 71.91655108273578
          },
          "rotation": {
            "y": 4.672495963063656
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 67.83222101362388,
            "y": 0.05176232752839347,
            "z": 66.37452101195824
          },
          "rotation": {
            "y": 3.3683539530068276
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 73.76255199423,
            "y": 0.05056439043107594,
            "z": 58.89497323321719
          },
          "rotation": {
            "y": 3.3089786709776274
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 79.57757433353866,
            "y": 0.05367403071602103,
            "z": 56.11878826164005
          },
          "rotation": {
            "y": 4.307887695341451
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 83.53996839044788,
            "y": 0.052583441620441485,
            "z": 48.760561395852356
          },
          "rotation": {
            "y": 1.5682746201930942
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 85.9764018796538,
            "y": 0.05013901295579033,
            "z": 42.45403611494483
          },
          "rotation": {
            "y": 4.4958611256304115
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 87.7462273170055,
            "y": 0.047575474446880955,
            "z": 36.716316940049175
          },
          "rotation": {
            "y": 5.781510125643176
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 91.8010709158315,
            "y": 0.05045461977552785,
            "z": 30.445514796590505
          },
          "rotation": {
            "y": 2.7224449617142676
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 91.78348978813702,
            "y": 0.052990593501243584,
            "z": 24.548162487373013
          },
          "rotation": {
            "y": 0.24423287527392024
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 93.5917051285143,
            "y": 0.05343996610658502,
            "z": 18.16561064929802
          },
          "rotation": {
            "y": 2.1759647366787678
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 95.9833302267579,
            "y": 0.0524931963818131,
            "z": 11.983126360612859
          },
          "rotation": {
            "y": 2.8278795089032025
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 99.88744418484971,
            "y": 0.04496126947874815,
            "z": 4.003149218541266
          },
          "rotation": {
            "y": 3.40746172492869
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 99.36640171435629,
            "y": 0.0507898539220318,
            "z": -5.365468785883611
          },
          "rotation": {
            "y": 6.139707755772917
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 97.37890525526907,
            "y": 0.05068127325534859,
            "z": -10.823114874371951
          },
          "rotation": {
            "y": 4.259521134324433
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 96.66742625886313,
            "y": 0.0474422570156909,
            "z": -17.9204882348647
          },
          "rotation": {
            "y": 1.638237372710966
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 91.46820305183002,
            "y": 0.046932455981091234,
            "z": -24.7653701987629
          },
          "rotation": {
            "y": 6.171574859512517
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 91.23810688787457,
            "y": 0.051412914134530356,
            "z": -33.37037240755993
          },
          "rotation": {
            "y": 3.073426760532195
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 86.84334943510369,
            "y": 0.045642567915641225,
            "z": -44.048256592049945
          },
          "rotation": {
            "y": 1.552111704453147
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 84.95849090754206,
            "y": 0.04561058966624012,
            "z": -50.79211252925077
          },
          "rotation": {
            "y": 5.442956671084028
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 79.0099341772391,
            "y": 0.04829997756526443,
            "z": -56.945145633537905
          },
          "rotation": {
            "y": 4.8196933472345105
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 73.6943101770097,
            "y": 0.052065879885005543,
            "z": -63.55822289817074
          },
          "rotation": {
            "y": 4.719800908175594
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 64.69343150324814,
            "y": 0.04866355344929339,
            "z": -71.55704158568608
          },
          "rotation": {
            "y": 4.061202537707215
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 62.54019092828216,
            "y": 0.04847602544966918,
            "z": -77.5431571118645
          },
          "rotation": {
            "y": 6.181723805996152
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 56.15501559704912,
            "y": 0.05124222794881429,
            "z": -82.90514087244765
          },
          "rotation": {
            "y": 3.491841744585466
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 50.76136884173573,
            "y": 0.04753968364748053,
            "z": -84.77288551933876
          },
          "rotation": {
            "y": 1.08568366630667
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 41.743751566921695,
            "y": 0.045763867922706016,
            "z": -88.41690500515892
          },
          "rotation": {
            "y": 2.955860073669921
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 34.48512896039621,
            "y": 0.04590777296540034,
            "z": -90.12077788239922
          },
          "rotation": {
            "y": 0.2240085987684795
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 26.315446893145506,
            "y": 0.05204626328243746,
            "z": -91.91262231001107
          },
          "rotation": {
            "y": 5.276525155932288
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 20.279336993377644,
            "y": 0.04734599238834785,
            "z": -93.14304334219754
          },
          "rotation": {
            "y": 5.687244574325923
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 13.31107842957606,
            "y": 0.05253333862896466,
            "z": -94.95612553402631
          },
          "rotation": {
            "y": 3.433408716533195
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 3.209326125867374,
            "y": 0.0457334928881391,
            "z": -95.61743588817896
          },
          "rotation": {
            "y": 5.810824651384567
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -5.5115422880109595,
            "y": 0.05372778010857317,
            "z": -97.20040912225514
          },
          "rotation": {
            "y": 3.19360440966462
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -14.84568689347886,
            "y": 0.04576967677238782,
            "z": -95.64264003394902
          },
          "rotation": {
            "y": 2.315858373256779
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -24.820781585925513,
            "y": 0.05390786803327838,
            "z": -93.08563161876855
          },
          "rotation": {
            "y": 1.4340954093365847
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -35.66046285636556,
            "y": 0.0491876348398558,
            "z": -92.60030006024004
          },
          "rotation": {
            "y": 5.2135010715810886
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -43.11875452525169,
            "y": 0.05337978297666541,
            "z": -87.44852664831566
          },
          "rotation": {
            "y": 3.5595771382392254
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -50.46259158594397,
            "y": 0.04580975758471928,
            "z": -84.90010558765242
          },
          "rotation": {
            "y": 4.182202476987666
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -57.47172282937722,
            "y": 0.05351929915778636,
            "z": -78.56167044810823
          },
          "rotation": {
            "y": 0.5745064227484551
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -63.14934572429437,
            "y": 0.04849212741083571,
            "z": -73.03905106254922
          },
          "rotation": {
            "y": 2.9080944350701463
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -69.15387237129055,
            "y": 0.04575696948862644,
            "z": -65.24610900032536
          },
          "rotation": {
            "y": 3.6949001654178413
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -74.66750295639255,
            "y": 0.05491937693590633,
            "z": -58.44128969134755
          },
          "rotation": {
            "y": 3.2887078735237663
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -80.84321913506163,
            "y": 0.05073896679479406,
            "z": -50.16483870067052
          },
          "rotation": {
            "y": 3.8197522257483603
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -87.04479452779374,
            "y": 0.04626800077811026,
            "z": -43.32365856524003
          },
          "rotation": {
            "y": 5.842023438654507
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -89.56683946209948,
            "y": 0.054384792870949834,
            "z": -35.72499334623819
          },
          "rotation": {
            "y": 5.407435866792541
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -92.58460790953391,
            "y": 0.04573974918985966,
            "z": -27.690261259660975
          },
          "rotation": {
            "y": 3.3765306894395164
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -96.20006145592018,
            "y": 0.052621972611030673,
            "z": -19.209659967616165
          },
          "rotation": {
            "y": 2.9901828335128973
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -98.73647983104483,
            "y": 0.05380611341577405,
            "z": -10.025066742735833
          },
          "rotation": {
            "y": 0.36361079142213043
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -97.68276636550257,
            "y": 0.04783764351875296,
            "z": -1.2761673250019512
          },
          "rotation": {
            "y": 2.77963954397454
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -97.98576594943701,
            "y": 0.05475643654464239,
            "z": 7.19409871253548
          },
          "rotation": {
            "y": 1.318965354745455
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -97.68998636675413,
            "y": 0.04488665693202563,
            "z": 17.63132863050298
          },
          "rotation": {
            "y": 3.184611816129564
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -95.00993029694888,
            "y": 0.05273139506734714,
            "z": 27.14410130821872
          },
          "rotation": {
            "y": 3.9017350405774267
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -91.80822129308753,
            "y": 0.04670741274093913,
            "z": 34.631044097038455
          },
          "rotation": {
            "y": 5.4889820593143686
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -87.47126422780568,
            "y": 0.05175167032063114,
            "z": 45.052922385496316
          },
          "rotation": {
            "y": 0.23372366200940684
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -80.71392930541852,
            "y": 0.053837315576121356,
            "z": 52.666442849996315
          },
          "rotation": {
            "y": 5.2675346766149005
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -75.25316458049201,
            "y": 0.05011614917409085,
            "z": 60.52234717332142
          },
          "rotation": {
            "y": 5.053378712620088
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -70.57214809736803,
            "y": 0.046703151801339826,
            "z": 66.2028740622558
          },
          "rotation": {
            "y": 2.1013738503478954
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -65.12727155017883,
            "y": 0.049477370586223465,
            "z": 71.84177605013667
          },
          "rotation": {
            "y": 4.474637495864378
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -59.23979016912938,
            "y": 0.04598965026808263,
            "z": 77.17551235095004
          },
          "rotation": {
            "y": 5.317804847487656
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -54.01725087344542,
            "y": 0.05244344085386788,
            "z": 82.23539434758084
          },
          "rotation": {
            "y": 0.26867731211061535
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -46.32464268898406,
            "y": 0.047680056473291724,
            "z": 86.66819033301293
          },
          "rotation": {
            "y": 4.012512486108368
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -38.93766777502376,
            "y": 0.050333022535950435,
            "z": 90.51827732901904
          },
          "rotation": {
            "y": 0.5346472373661691
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -31.698205176675934,
            "y": 0.05447849898163649,
            "z": 91.20784558847244
          },
          "rotation": {
            "y": 6.180708170104108
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -25.693137716377684,
            "y": 0.05305918913808308,
            "z": 94.63569214115286
          },
          "rotation": {
            "y": 2.0095522155324494
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -18.71920650633691,
            "y": 0.053430471716820326,
            "z": 95.61144367124449
          },
          "rotation": {
            "y": 1.288960309893009
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -12.580895892793855,
            "y": 0.04795114282180468,
            "z": 97.0991689208043
          },
          "rotation": {
            "y": 4.488815638214536
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": -6.701883595104676,
            "y": 0.045955537787423964,
            "z": 98.12146554788913
          },
          "rotation": {
            "y": 0.4402466908831763
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 1.5565574012452386,
            "y": 0.05365840775701583,
            "z": 99.83100993649006
          },
          "rotation": {
            "y": 1.7443986160333806
          }
        },
        {
          "type": "mountain",
          "position": {
            "x": 7.212898640776554,
            "y": 0.05224870215008588,
            "z": 99.2864693008363
          },
          "rotation": {
            "y": 1.2333078601239067
          }
        }
    ];
    this.initMountainsFromJSON(mountainsData);
    this.createSimpleBush();
  // Создание простого куста
  this.createSimpleBush();
}

    createSimpleMountain() {
        const mountainGroup = new THREE.Group();

        // Основная часть горы - более сглаженная и естественная форма
        const mountainGeometry = new THREE.ConeGeometry(4, 7, 8);

        // Материал для горы с имитацией текстуры камня
        const mountainMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969, // Темно-серый цвет для горы
            roughness: 0.9,
            flatShading: true // Для создания граненой поверхности
        });

        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountainGroup.add(mountain);

        // Добавляем вторую, меньшую гору рядом для создания горного массива
        const smallerMountainGeometry = new THREE.ConeGeometry(8, 12, 8);
        const smallerMountain = new THREE.Mesh(smallerMountainGeometry, mountainMaterial.clone());
        smallerMountain.position.set(2.5, 0, 1.5);
        mountainGroup.add(smallerMountain);

        // Добавляем третью, еще меньшую гору
        const smallestMountainGeometry = new THREE.ConeGeometry(6, 8, 6);
        const smallestMountain = new THREE.Mesh(smallestMountainGeometry, mountainMaterial.clone());
        smallestMountain.position.set(-2, 0, -1.5);
        mountainGroup.add(smallestMountain);

        // Добавляем снежные шапки на вершины гор
        const snowMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5
        });

        // Снежная шапка для основной горы
        const mainSnowCapGeometry = new THREE.ConeGeometry(1.5, 6, 4);
        const mainSnowCap = new THREE.Mesh(mainSnowCapGeometry, snowMaterial);
        mainSnowCap.position.y = 3.5;
        mountainGroup.add(mainSnowCap);

        // Снежная шапка для второй горы
        const smallerSnowCapGeometry = new THREE.ConeGeometry(1.1, 6, 4);
        const smallerSnowCap = new THREE.Mesh(smallerSnowCapGeometry, snowMaterial);
        smallerSnowCap.position.set(2.5, 2.5, 1.5);
        mountainGroup.add(smallerSnowCap);

        // Снежная шапка для третьей горы
        const smallestSnowCapGeometry = new THREE.ConeGeometry(0.8, 0.8, 8);
        const smallestSnowCap = new THREE.Mesh(smallestSnowCapGeometry, snowMaterial);
        smallestSnowCap.position.set(-2, 0, -1.5);
        mountainGroup.add(smallestSnowCap);

        // Добавляем "каменистость" у основания гор
        for (let i = 0; i < 12; i++) {
            const rockSize = 0.5 + Math.random() * 0.8;
            const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0); // Используем додекаэдр для имитации камней
            const rockMaterial = mountainMaterial.clone();
            rockMaterial.color.offsetHSL(0, 0, (Math.random() * 0.2) - 0.1); // Варьируем яркость

            const rock = new THREE.Mesh(rockGeometry, rockMaterial);

            // Размещаем камни вокруг основания гор
            const angle = (i / 12) * Math.PI * 2;
            const radius = 4 + Math.random() * 2;
            rock.position.set(
                Math.cos(angle) * radius,
                rockSize * 0.5 - 0.2, // Слегка погружаем в землю
                Math.sin(angle) * radius
            );

            // Случайно поворачиваем камни
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Случайно масштабируем для большего разнообразия
            rock.scale.set(
                1 + (Math.random() * 0.4 - 0.2),
                1 + (Math.random() * 0.4 - 0.2),
                1 + (Math.random() * 0.4 - 0.2)
            );

            mountainGroup.add(rock);
        }

        this.mountain = mountainGroup;
    }
    createSimpleBush() {
        const bushGroup = new THREE.Group();

        // Ствол - низкий и тонкий
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        });

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.15;
        bushGroup.add(trunk);

        // Создаем "облакоподобную" крону из нескольких сфер
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x2e8b57,
            roughness: 0.7
        });

        // Расположение сфер для создания эффекта пушистого куста
        const spherePositions = [
            { x: 0, y: 0.5, z: 0, radius: 0.7 },
            { x: 0.5, y: 0.4, z: 0, radius: 0.5 },
            { x: -0.5, y: 0.4, z: 0, radius: 0.5 },
            { x: 0, y: 0.4, z: 0.5, radius: 0.5 },
            { x: 0, y: 0.4, z: -0.5, radius: 0.5 },
            { x: 0.35, y: 0.35, z: 0.35, radius: 0.4 },
            { x: -0.35, y: 0.35, z: 0.35, radius: 0.4 },
            { x: 0.35, y: 0.35, z: -0.35, radius: 0.4 },
            { x: -0.35, y: 0.35, z: -0.35, radius: 0.4 }
        ];

        // Используем низкополигональные сферы для лучшей производительности
        spherePositions.forEach(pos => {
            // Уменьшаем количество сегментов для оптимизации
            const sphereGeometry = new THREE.SphereGeometry(pos.radius, 6, 6);
            const sphere = new THREE.Mesh(sphereGeometry, leafMaterial);
            sphere.position.set(pos.x, pos.y, pos.z);
            bushGroup.add(sphere);
        });

        // Добавляем небольшие вариации цвета для разных частей куста
        bushGroup.children.forEach((child, index) => {
            if (index > 0) { // Пропускаем ствол
                // Клонируем материал для каждой сферы, чтобы они могли иметь немного разные оттенки
                child.material = leafMaterial.clone();
                // Слегка варьируем оттенок зеленого
                const hueOffset = (Math.random() * 0.1) - 0.05;
                const lightnessOffset = (Math.random() * 0.1) - 0.05;
                child.material.color.offsetHSL(hueOffset, 0.1, lightnessOffset);
            }
        });

        // Немного сплющиваем куст, чтобы он был ближе к земле
        bushGroup.scale.y = 0.8;

        // Добавляем куст в сцену
        bushGroup.position.set(-5, 0, 0);
        this.scene.add(bushGroup);
        this.woodenBush = bushGroup;
    }

    initMountainsFromJSON(sceneData) {
      // Проверяем, что данные существуют
      if (!sceneData || !Array.isArray(sceneData)) {
          console.error("Неверный формат данных сцены");
          return;
      }
      
      // Перебираем все объекты из JSON
      sceneData.forEach(objectData => {
          if (objectData.type === "mountain") {
              // Создаем гору
              const mountainGroup = this.createMountainObject();
              
              // Устанавливаем позицию из JSON
              mountainGroup.position.set(
                  objectData.position.x,
                  objectData.position.y,
                  objectData.position.z
              );
              
              // Устанавливаем поворот из JSON (если есть)
              if (objectData.rotation) {
                  mountainGroup.rotation.y = objectData.rotation.y;
              }
              
              // Добавляем в сцену
              this.scene.add(mountainGroup);
              
              // Добавляем в массив размещенных объектов для отслеживания
              this.placedObjects.push({
                  type: "mountain",
                  object: mountainGroup,
                  position: { ...objectData.position },
                  rotation: { ...objectData.rotation }
              });
          }
      });
  }
  
  // Вспомогательная функция для создания объекта горы
  createMountainObject() {
      const mountainGroup = new THREE.Group();
  
      // Основная часть горы - более сглаженная и естественная форма
      const mountainGeometry = new THREE.ConeGeometry(4, 4, 3);
  
      // Материал для горы с имитацией текстуры камня
      const mountainMaterial = new THREE.MeshStandardMaterial({
          color: 0x696969, // Темно-серый цвет для горы
          roughness: 0.9,
          flatShading: true // Для создания граненой поверхности
      });
  
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      mountainGroup.add(mountain);
  
      // Добавляем вторую, меньшую гору рядом для создания горного массива
      const smallerMountainGeometry = new THREE.ConeGeometry(8, 6, 4);
      const smallerMountain = new THREE.Mesh(smallerMountainGeometry, mountainMaterial.clone());
      smallerMountain.position.set(2.5, 0, 1.5);
      mountainGroup.add(smallerMountain);
  
      // Добавляем третью, еще меньшую гору
      const smallestMountainGeometry = new THREE.ConeGeometry(6, 4, 3);
      const smallestMountain = new THREE.Mesh(smallestMountainGeometry, mountainMaterial.clone());
      smallestMountain.position.set(-2, 0, -1.5);
      mountainGroup.add(smallestMountain);
  
      // Добавляем снежные шапки на вершины гор
      const snowMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.5
      });
  
      // Снежная шапка для основной горы
      const mainSnowCapGeometry = new THREE.ConeGeometry(1.5, 6, 3);
      const mainSnowCap = new THREE.Mesh(mainSnowCapGeometry, snowMaterial);
      mainSnowCap.position.y = 3.5;
      mountainGroup.add(mainSnowCap);
  
      // Снежная шапка для второй горы
      const smallerSnowCapGeometry = new THREE.ConeGeometry(1.1, 6, 3);
      const smallerSnowCap = new THREE.Mesh(smallerSnowCapGeometry, snowMaterial);
      smallerSnowCap.position.set(2.5, 2.5, 1.5);
      mountainGroup.add(smallerSnowCap);
  
      // Снежная шапка для третьей горы
      const smallestSnowCapGeometry = new THREE.ConeGeometry(0.8, 0.8, 4);
      const smallestSnowCap = new THREE.Mesh(smallestSnowCapGeometry, snowMaterial);
      smallestSnowCap.position.set(-2, 0, -1.5);
      mountainGroup.add(smallestSnowCap);
  
      // Добавляем "каменистость" у основания гор
      for (let i = 0; i < 3; i++) {
          const rockSize = 0.5 + Math.random() * 0.8;
          const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
          const rockMaterial = mountainMaterial.clone();
          rockMaterial.color.offsetHSL(0, 0, (Math.random() * 0.2) - 0.1);
  
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
  
          // Размещаем камни вокруг основания гор
          const angle = (i / 3) * Math.PI * 2;
          const radius = 4 + Math.random() * 2;
          rock.position.set(
              Math.cos(angle) * radius,
              rockSize * 0.5 - 0.2,
              Math.sin(angle) * radius
          );
  
          rock.rotation.set(
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
          );
  
          rock.scale.set(
              1 + (Math.random() * 0.4 - 0.2),
              1 + (Math.random() * 0.4 - 0.2),
              1 + (Math.random() * 0.4 - 0.2)
          );
  
          mountainGroup.add(rock);
      }
  
      return mountainGroup;
  }
//------------------------------------------------------------------

// Добавьте эту функцию в ваш класс
    initMountainSpawner() {
        // Обработчик для клавиши J
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyJ") {
                // Создаем гору на текущей позиции автомобиля
                this.spawnMountainAtCurrentPosition();

                // Собираем данные о всех объектах сцены
                this.logSceneData();
            }
        });

        // Массив для хранения информации о размещенных объектах
        this.placedObjects = [];
    }
// Добавьте эту функцию в ваш класс
    createSimpleHouse() {
        const houseGroup = new THREE.Group();

        // Основание гаража/пит-стопа в ярких цветах
        const baseGeometry = new THREE.BoxGeometry(5, 3, 4);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498db, // Яркий синий
            roughness: 0.5
        });

        const base = new THREE.Mesh(baseGeometry, wallMaterial);
        base.position.y = 1.5;
        houseGroup.add(base);

        // Крыша - навес в стиле пит-стопа
        const roofGeometry = new THREE.BoxGeometry(7, 0.3, 5);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0xe74c3c, // Яркий красный
            roughness: 0.5
        });

        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 3.5;
        houseGroup.add(roof);

        // Колонны поддерживающие навес
        const columnGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
        const columnMaterial = new THREE.MeshStandardMaterial({
            color: 0xf1c40f, // Яркий желтый
            roughness: 0.5
        });

        // Четыре колонны по углам
        const column1 = new THREE.Mesh(columnGeometry, columnMaterial);
        column1.position.set(3, 1.5, 2);
        houseGroup.add(column1);

        const column2 = new THREE.Mesh(columnGeometry, columnMaterial);
        column2.position.set(3, 1.5, -2);
        houseGroup.add(column2);

        const column3 = new THREE.Mesh(columnGeometry, columnMaterial);
        column3.position.set(-3, 1.5, 2);
        houseGroup.add(column3);

        const column4 = new THREE.Mesh(columnGeometry, columnMaterial);
        column4.position.set(-3, 1.5, -2);
        houseGroup.add(column4);

        // Большие двери гаража
        const doorGeometry = new THREE.PlaneGeometry(3, 2.5);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2ecc71, // Яркий зеленый
            roughness: 0.6,
            side: THREE.DoubleSide
        });

        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1.25, 2.01);
        houseGroup.add(door);

        // Полосы на здании в гоночном стиле
        const stripeGeometry = new THREE.BoxGeometry(5.02, 0.5, 0.1);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff // Белый
        });

        const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe1.position.set(0, 1, 2.01);
        houseGroup.add(stripe1);

        const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe2.position.set(0, 1, -2.01);
        houseGroup.add(stripe2);

        // Полосы на боковых сторонах
        const sideStripeGeometry = new THREE.BoxGeometry(0.1, 0.5, 4.02);

        const stripe3 = new THREE.Mesh(sideStripeGeometry, stripeMaterial);
        stripe3.position.set(2.51, 1, 0);
        houseGroup.add(stripe3);

        const stripe4 = new THREE.Mesh(sideStripeGeometry, stripeMaterial);
        stripe4.position.set(-2.51, 1, 0);
        houseGroup.add(stripe4);

        // Окна
        const windowGeometry = new THREE.PlaneGeometry(1.5, 1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xd0d3d4,
            roughness: 0.2,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        // Окна на боковых сторонах
        const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(2.51, 2, 1);
        window1.rotation.y = Math.PI / 2;
        houseGroup.add(window1);

        const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(2.51, 2, -1);
        window2.rotation.y = Math.PI / 2;
        houseGroup.add(window2);

        const window3 = new THREE.Mesh(windowGeometry, windowMaterial);
        window3.position.set(-2.51, 2, 1);
        window3.rotation.y = Math.PI / 2;
        houseGroup.add(window3);

        const window4 = new THREE.Mesh(windowGeometry, windowMaterial);
        window4.position.set(-2.51, 2, -1);
        window4.rotation.y = Math.PI / 2;
        houseGroup.add(window4);

        // Большая вывеска на крыше
        const signGeometry = new THREE.BoxGeometry(4, 1, 0.2);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0xff9800, // Оранжевый
            roughness: 0.5
        });

        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 4.5, 0);
        houseGroup.add(sign);

        // Флаги
        const flagPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const flagPoleMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0
        });

        const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
        flagPole.position.set(0, 5.5, 0);
        houseGroup.add(flagPole);

        const flagGeometry = new THREE.PlaneGeometry(0.8, 0.5);
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Красный
            side: THREE.DoubleSide
        });

        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.4, 5.7, 0);
        flag.rotation.y = Math.PI / 2;
        houseGroup.add(flag);

        return houseGroup;
    }

// Добавьте эту функцию в ваш класс
    spawnHouseAtCurrentPosition() {
        // Создаем новый домик
        const newHouse = this.createSimpleHouse();

        // Устанавливаем позицию на текущую позицию автомобиля
        newHouse.position.copy(this.car.position);

        // Случайный поворот для разнообразия
        newHouse.rotation.y = Math.random() * Math.PI * 2;

        // Добавляем в сцену
        this.scene.add(newHouse);

        // Сохраняем информацию об объекте
        this.placedObjects.push({
            type: 'house',
            position: {
                x: newHouse.position.x,
                y: newHouse.position.y,
                z: newHouse.position.z
            },
            rotation: {
                y: newHouse.rotation.y
            }
        });

        console.log(`Домик создан на позиции: x=${newHouse.position.x.toFixed(2)}, y=${newHouse.position.y.toFixed(2)}, z=${newHouse.position.z.toFixed(2)}`);
    }

// Функция для создания горы на текущей позиции
    spawnMountainAtCurrentPosition() {
        // Клонируем существующую гору
        const newMountain = this.mountain.clone();

        // Устанавливаем позицию на текущую позицию автомобиля
        newMountain.position.copy(this.car.position);

        // Случайный поворот для разнообразия
        newMountain.rotation.y = Math.random() * Math.PI * 2;

        // Добавляем в сцену
        this.scene.add(newMountain);

        // Сохраняем информацию об объекте
        this.placedObjects.push({
            type: 'mountain',
            position: {
                x: newMountain.position.x,
                y: newMountain.position.y,
                z: newMountain.position.z
            },
            rotation: {
                y: newMountain.rotation.y
            }
        });

        console.log(`Гора создана на позиции: x=${newMountain.position.x.toFixed(2)}, y=${newMountain.position.y.toFixed(2)}, z=${newMountain.position.z.toFixed(2)}`);
    }

// Функция для вывода данных о всей сцене в консоль
    logSceneData() {
        console.log("=== ДАННЫЕ О РАЗМЕЩЕННЫХ ОБЪЕКТАХ ===");
        console.log(JSON.stringify(this.placedObjects, null, 2));
        console.log("Скопируйте этот JSON и отправьте его для генерации сцены");

        // Создаем строку для генерации кода
        let codeString = `
// Код для генерации сцены
function generateScene() {
  const sceneData = ${JSON.stringify(this.placedObjects, null, 2)};
  
  sceneData.forEach(obj => {
    if (obj.type === 'mountain') {
      const mountain = this.mountain.clone();
      mountain.position.set(obj.position.x, obj.position.y, obj.position.z);
      mountain.rotation.y = obj.rotation.y;
      this.scene.add(mountain);
    } else if (obj.type === 'bush') {
      const bush = this.woodenBush.clone();
      bush.position.set(obj.position.x, obj.position.y, obj.position.z);
      bush.rotation.y = obj.rotation.y;
      this.scene.add(bush);
    }
  });
}`;

        console.log("=== КОД ДЛЯ ГЕНЕРАЦИИ СЦЕНЫ ===");
        console.log(codeString);
    }

// Добавьте эту функцию в ваш класс
    spawnBushAtCurrentPosition() {
        // Клонируем существующий куст
        const newBush = this.woodenBush.clone();

        // Устанавливаем позицию на текущую позицию автомобиля
        newBush.position.copy(this.car.position);

        // Случайный поворот для разнообразия
        newBush.rotation.y = Math.random() * Math.PI * 2;

        // Добавляем в сцену
        this.scene.add(newBush);

        // Сохраняем информацию об объекте
        this.placedObjects.push({
            type: 'bush',
            position: {
                x: newBush.position.x,
                y: newBush.position.y,
                z: newBush.position.z
            },
            rotation: {
                y: newBush.rotation.y
            }
        });

        console.log(`Куст создан на позиции: x=${newBush.position.x.toFixed(2)}, y=${newBush.position.y.toFixed(2)}, z=${newBush.position.z.toFixed(2)}`);
    }

    initObjectSpawner() {
        // Обработчик для клавиш J, K и L
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyJ") {
                // Создаем гору на текущей позиции автомобиля
                this.spawnMountainAtCurrentPosition();

                // Собираем данные о всех объектах сцены
                this.logSceneData();
            }
            else if (e.code === "KeyK") {
                // Создаем куст на текущей позиции автомобиля
                this.spawnBushAtCurrentPosition();

                // Собираем данные о всех объектах сцены
                this.logSceneData();
            }
            else if (e.code === "KeyL") {
                // Создаем домик на текущей позиции автомобиля
                this.spawnHouseAtCurrentPosition();

                // Собираем данные о всех объектах сцены
                this.logSceneData();
            }
        });

        // Массив для хранения информации о размещенных объектах
        this.placedObjects = [];
    }

//-----------------------------------------------------------------------------------------------------------------

    initLODSystem() {
        this.frustum = new THREE.Frustum();
        this.cameraViewProjectionMatrix = new THREE.Matrix4();
        this.visibilityDistance = 150;
        this.LODlevels = {
            near: 50,
            medium: 100,
            far: this.visibilityDistance
        };
    }

    updateVisibilitySystem() {
        this.camera.updateMatrixWorld();
        this.cameraViewProjectionMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);
    }

    animate() {
        const delta = this.clock.getDelta();
        this.deltaAccumulator += delta;
        if (this.deltaAccumulator >= this.frameTime) {
            this.updateVisibilitySystem();
            this.updateVisibleObjects();
            this.updateBotAheno();
             this.updateBotBiba();
            // this.updateBotBoba();
            this.updateCoins();
            this.deltaAccumulator %= this.frameTime;
            this.renderer.render(this.scene, this.camera);
        }
        requestAnimationFrame(() => this.animate());
    }

    updateVisibleObjects() {
        this.updateCar();
        this.updateNearbyEffects();
        this.updateCamera();
    }

    setHighDetailLOD(buildingGroup) {
        buildingGroup.children.forEach(child => {
            child.visible = true;
        });
    }

    setMediumDetailLOD(buildingGroup) {
        buildingGroup.children.forEach(child => {
            if (child.userData && child.userData.type === 'detail') {
                child.visible = false;
            } else {
                child.visible = true;
            }
        });
    }

    setLowDetailLOD(buildingGroup) {
        buildingGroup.children.forEach(child => {
            if (child.userData && (child.userData.type === 'main' || child.userData.type === 'roof')) {
                child.visible = true;
            } else {
                child.visible = false;
            }
        });
    }

    updateNearbyEffects() {
        const cameraPosition = this.camera.position;
        if (this.smokeParticles && this.smokeParticles.length > 0) {
            this.updateSmoke();
        }
        if (this.tShapeParticles) {
            for (const particle of this.tShapeParticles) {
                const distance = cameraPosition.distanceTo(particle.position);
                if (distance < this.LODlevels.medium && this.frustum.containsPoint(particle.position)) {
                    this.updateParticle(particle);
                } else if (distance < this.visibilityDistance) {
                    this.updateParticleSimple(particle);
                } else {
                    particle.visible = false;
                }
            }
        }
        if (Math.abs(this.carSpeed) > 0.05) {
            this.updateSpeedEffects();
        }
    }

    updateParticle(particle) {
        particle.visible = true;
        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        particle.rotation.z += particle.userData.rotationSpeed.z;
        particle.position.add(particle.userData.velocity);
        const bounds = particle.userData.mapBounds;
        if (particle.position.x > bounds) particle.position.x = -bounds;
        else if (particle.position.x < -bounds) particle.position.x = bounds;
        if (particle.position.z > bounds) particle.position.z = -bounds;
        else if (particle.position.z < -bounds) particle.position.z = bounds;
    }

    updateParticleSimple(particle) {
        particle.visible = true;
        particle.position.add(particle.userData.velocity);
        const bounds = particle.userData.mapBounds;
        if (Math.abs(particle.position.x) > bounds || Math.abs(particle.position.z) > bounds) {
            particle.position.set(
                (Math.random() * bounds * 2) - bounds,
                particle.position.y,
                (Math.random() * bounds * 2) - bounds
            );
        }
    }

    optimizeStaticGeometries() {
        const roadGeometries = [];
        const sidewalkGeometries = [];
        this.scene.traverse(object => {
            if (object.userData && object.userData.type === 'road') {
                roadGeometries.push(object.geometry);
            } else if (object.userData && object.userData.type === 'sidewalk') {
                sidewalkGeometries.push(object.geometry);
            }
        });
        if (roadGeometries.length > 0) {
            const roadBufferGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(roadGeometries);
            const mergedRoads = new THREE.Mesh(roadBufferGeometry, this.roadMaterial);
            this.scene.add(mergedRoads);
        }
        if (sidewalkGeometries.length > 0) {
            const sidewalkBufferGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(sidewalkGeometries);
            const mergedSidewalks = new THREE.Mesh(sidewalkBufferGeometry, this.sidewalkMaterial);
            this.scene.add(mergedSidewalks);
        }
    }

    addEventListeners() {
        window.addEventListener("resize", () => {
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.sizes.width, this.sizes.height);
        });
    }

    updateCamera() {
        const targetPosition = new THREE.Vector3(
            this.car.position.x - Math.sin(this.car.rotation.y) * 6,
            this.car.position.y + 3,
            this.car.position.z - Math.cos(this.car.rotation.y) * 6
        );
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.car.position);
    }
}

new ThreeJSTemplate();
