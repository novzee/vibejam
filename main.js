import "./styles/style.css";
import * as THREE from "three";

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
        this.initBot();
        this.initScreamAudio();
        this.initMobileControls();
    }
    initBot() {
      this.bot = new THREE.Group();
      const botTexture = new THREE.TextureLoader().load("/image.jpg");
      const botMaterial = new THREE.MeshBasicMaterial({
          map: botTexture,
          transparent: true,
          opacity: 0.9,
          color: 0xff0000
      });
      const botMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), botMaterial);
      botMesh.scale.set(3, 3, 3);
      this.bot.add(botMesh);
  
      this.bot.position.set(Math.random() * 20 - 10, 0, Math.random() * 20 - 10);
      this.scene.add(this.bot);
  }
  
  updateBot() {
      if (!this.bot || !this.car) return;
  
      // Движение бота к машине
      const speed = 0.13;
      const direction = new THREE.Vector3();
      direction.subVectors(this.car.position, this.bot.position).normalize();
      this.bot.position.addScaledVector(direction, speed);
  
      // Поворот бота к камере
      this.bot.lookAt(this.camera.position);
  
      // Проверка расстояния для звука
      const distance = this.bot.position.distanceTo(this.car.position);
      if (distance < 2 && this.screamAudio && !this.screamAudio.isPlaying) {
          this.screamAudio.play();
      }
  }

    initScreamAudio() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        this.screamAudio = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('/audio.mp3', (buffer) => {
            this.screamAudio.setBuffer(buffer);
            this.screamAudio.setLoop(false);
            this.screamAudio.setVolume(0.5);
        });
    }
    
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
        const particleCount = 200;
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
            const y = 0.5 + Math.random() * 5;
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
            if (particle.position.y < 0.5) {
                particle.position.y = 0.5;
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
  }
  
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
          this.frontWheelGroup.rotation.y = steering * 10; // Усиливаем эффект для видимости
      } else {
          // Плавно возвращаем колеса в прямое положение
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
      
      this.car.rotation.y += steering * (this.isDrifting ? 1.5 : 1.0);
      
      // Вращаем колеса при движении с учетом направления
      const wheelRotationSpeed = this.carSpeed * 0.5;
      this.wheels.forEach(wheel => {
          wheel.rotation.x += wheelRotationSpeed;
      });
      
      // Добавляем небольшую анимацию подвески при движении
      if (this.carSpeed !== 0) {
          const bounceAmount = Math.sin(Date.now() * 0.01) * 0.005 * Math.abs(this.carSpeed) * 5;
          this.car.position.y = bounceAmount + 0.05;
          
          // Наклоняем машину при разгоне/торможении
          if (acceleration > 0) {
              this.car.rotation.x = -0.03 * Math.abs(this.carSpeed) * 3;
          } else if (acceleration < 0) {
              this.car.rotation.x = 0.03 * Math.abs(this.carSpeed) * 3;
          } else {
              this.car.rotation.x *= 0.9; // Плавно возвращаемся к горизонтальному положению
          }
          
          // Наклоняем машину в сторону поворота
          if (steering !== 0) {
              this.car.rotation.z = -steering * Math.abs(this.carSpeed) * 2;
          } else {
              this.car.rotation.z *= 0.9; // Плавно возвращаемся к вертикальному положению
          }
      }
      
      this.carVelocity.x = this.carVelocity.x * (1 - this.traction) + this.carDirection.x * this.carSpeed * this.traction;
      this.carVelocity.z = this.carVelocity.z * (1 - this.traction) + this.carDirection.z * this.carSpeed * this.traction;
      
      this.car.position.x += this.carVelocity.x;
      this.car.position.z += this.carVelocity.z;
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
          this.initMountainsFromJSON(data);
      })
      .catch(error => {
          console.error("Ошибка загрузки JSON:", error);
      });
}

initSimpleToys() {
  // Загрузка гор из JSON-файла
  this.loadMountainsFromFile('/coords.json');
  this.createSimpleMountain();
  
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
          const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
          const rockMaterial = mountainMaterial.clone();
          rockMaterial.color.offsetHSL(0, 0, (Math.random() * 0.2) - 0.1);
  
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
  
          // Размещаем камни вокруг основания гор
          const angle = (i / 12) * Math.PI * 2;
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
            this.updateBot();
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
