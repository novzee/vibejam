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
    this.initBuildings();
    this.initSpeedEffects(); // Пыль
    this.initTShapeParticles(); // Добавляем инициализацию T-образных частиц
    this.addEventListeners();
    this.animate();
  }

  initTShapeParticles() {
    // Создаем группу для частиц (не привязана к машине)
    this.tShapeParticles = [];
    
    const particleCount = 200; // Частицы для покрытия карты
    const pinkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff69b4, // Розовый цвет
      emissive: 0xff69b4,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9
    });
    
    const redMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xfa8072, // Красный цвет
      emissive: 0xfa8072,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    
    // Определяем размер карты (используем размер плоскости)
    const mapSize = 100; // Половина размера карты в каждом направлении
    
    for (let i = 0; i < particleCount; i++) {
      // Создаем T-образную форму
      const verticalBar = new THREE.BoxGeometry(0.08, 0.2, 0.08); // Немного короче для добавления красного кончика
      const horizontalBar = new THREE.BoxGeometry(0.25, 0.08, 0.08);
      const redTip = new THREE.BoxGeometry(0.08, 0.05, 0.08); // Красный кончик у основания
      
      const verticalMesh = new THREE.Mesh(verticalBar, pinkMaterial);
      const horizontalMesh = new THREE.Mesh(horizontalBar, pinkMaterial);
      const redTipMesh = new THREE.Mesh(redTip, redMaterial);
      
      // Позиционируем части T-формы
      horizontalMesh.position.y = 0.12;
      redTipMesh.position.y = -0.125; // Располагаем красный кончик у основания вертикальной части
      
      const tShape = new THREE.Group();
      tShape.add(verticalMesh);
      tShape.add(horizontalMesh);
      tShape.add(redTipMesh);
      
      // Случайное расположение по всей карте
      const x = Math.random() * mapSize * 2 - mapSize;
      const y = 0.5 + Math.random() * 5; // Высота над землей
      const z = Math.random() * mapSize * 2 - mapSize;
      
      tShape.position.set(x, y, z);
      
      // Данные для анимации в стиле "частиц ветра"
      tShape.userData = {
        // Параметры для движения
        velocity: new THREE.Vector3(
          (Math.random() * 2 - 1) * 0.05, // Случайная скорость по X
          (Math.random() * 2 - 1) * 0.02, // Небольшая вертикальная скорость
          (Math.random() * 2 - 1) * 0.05  // Случайная скорость по Z
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
      
      this.scene.add(tShape); // Добавляем прямо в сцену, а не в группу
      this.tShapeParticles.push(tShape);
    }
  }
  
  updateTShapeParticles() {
    // Получаем направление ветра на основе положения и движения машины
    // (это создаст эффект, что ветер дует в направлении движения машины)
    const windDirection = new THREE.Vector3();
    if (Math.abs(this.carSpeed) > 0.02) {
      windDirection.x = Math.sin(this.car.rotation.y) * this.carSpeed * 0.5;
      windDirection.z = Math.cos(this.car.rotation.y) * this.carSpeed * 0.5;
    } else {
      // Слабый фоновый ветер, когда машина не движется
      windDirection.x = 0.01;
      windDirection.z = 0.01;
    }
    
    this.tShapeParticles.forEach(particle => {
      // Обновляем вращение частиц
      particle.rotation.x += particle.userData.rotationSpeed.x;
      particle.rotation.y += particle.userData.rotationSpeed.y;
      particle.rotation.z += particle.userData.rotationSpeed.z;
      
      // Счетчик для случайной смены направления
      particle.userData.changeDirectionCounter++;
      
      // Периодически меняем направление для естественного движения
      if (particle.userData.changeDirectionCounter >= particle.userData.changeDirectionTime) {
        particle.userData.velocity.x += (Math.random() * 2 - 1) * 0.05;
        particle.userData.velocity.y += (Math.random() * 2 - 1) * 0.02;
        particle.userData.velocity.z += (Math.random() * 2 - 1) * 0.05;
        
        // Ограничиваем максимальную скорость
        particle.userData.velocity.clampLength(0, 0.1);
        
        // Сбрасываем счетчик и устанавливаем новое время до смены
        particle.userData.changeDirectionCounter = 0;
        particle.userData.changeDirectionTime = 100 + Math.random() * 200;
      }
      
      // Добавляем влияние ветра (от движения машины)
      particle.userData.velocity.x += windDirection.x * 0.01;
      particle.userData.velocity.z += windDirection.z * 0.01;
      
      // Перемещаем частицу
      particle.position.x += particle.userData.velocity.x;
      particle.position.y += particle.userData.velocity.y;
      particle.position.z += particle.userData.velocity.z;
      
      // Проверяем границы карты и возвращаем частицы, если они вышли за пределы
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
      
      // Ограничиваем высоту (не ниже земли и не выше определенного уровня)
      if (particle.position.y < 0.5) {
        particle.position.y = 0.5;
        particle.userData.velocity.y *= -0.5; // Отскок от земли
      } else if (particle.position.y > 10) {
        particle.position.y = 10;
        particle.userData.velocity.y *= -0.5; // Отскок от верхней границы
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
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    initCar() {
      const geometry = new THREE.BoxGeometry(1, 0.5, 2);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      this.car = new THREE.Mesh(geometry, material);
      this.scene.add(this.car);
      
      // Добавляем переменные для физики и дрифта
      this.carSpeed = 0;
      this.carVelocity = new THREE.Vector3(0, 0, 0);
      this.carDirection = new THREE.Vector3(0, 0, 1);
      this.isDrifting = false;
      this.driftFactor = 0;
      this.traction = 1.0; // Сцепление с дорогой (1.0 = полное, 0.0 = нет сцепления)
      
      // Создаем систему частиц для дыма при дрифте
      this.smokeParticles = [];
      
      this.keys = {};
      window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
      window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
  }
  
  updateCar() {
      // Обновляем направление машины на основе её вращения
      this.carDirection.set(Math.sin(this.car.rotation.y), 0, Math.cos(this.car.rotation.y));
      
      // Управление ускорением и торможением (WASD)
      let acceleration = 0;
      if (this.keys["KeyW"]) {
          // Ускорение с шифтом
          if (this.keys["ShiftLeft"] || this.keys["ShiftRight"]) {
              acceleration = 0.01; // Сильное ускорение
          } else {
              acceleration = 0.005; // Обычное ускорение
          }
      }
      else if (this.keys["KeyS"]) acceleration = -0.005; // Торможение/задний ход
      
      // Применяем ускорение к скорости
      this.carSpeed += acceleration;
      
      // Естественное замедление
      this.carSpeed *= 0.98;
      
      // Управление поворотом (A/D)
      let steering = 0;
      if (this.keys["KeyA"]) steering = 0.03;
      if (this.keys["KeyD"]) steering = -0.03;
      
      // Определяем, находимся ли мы в дрифте
      // Дрифт случается при резком повороте на высокой скорости
      const steeringIntensity = Math.abs(steering);
      const speedThreshold = 0.08;
      
      if (Math.abs(this.carSpeed) > speedThreshold && steeringIntensity > 0) {
          // Начинаем дрифт или усиливаем его
          this.isDrifting = true;
          // Уменьшаем сцепление с дорогой во время дрифта
          this.traction = Math.max(0.3, this.traction - 0.1);
          // Создаем эффект дыма
          this.createDriftSmoke();
      } else {
          // Постепенно восстанавливаем сцепление
          this.traction = Math.min(1.0, this.traction + 0.05);
          this.isDrifting = false;
      }
      
      // Поворачиваем машину
      this.car.rotation.y += steering * (this.isDrifting ? 1.5 : 1.0); // Быстрее поворачиваем в дрифте
      
      // Сохраняем текущую позицию для проверки коллизий
      const originalPosition = this.car.position.clone();
      
      // Вычисляем новое направление движения с учетом дрифта
      // При низком сцеплении машина продолжает двигаться в старом направлении
      this.carVelocity.x = this.carVelocity.x * (1 - this.traction) + this.carDirection.x * this.carSpeed * this.traction;
      this.carVelocity.z = this.carVelocity.z * (1 - this.traction) + this.carDirection.z * this.carSpeed * this.traction;
      
      // Применяем скорость к позиции
      this.car.position.x += this.carVelocity.x;
      this.car.position.z += this.carVelocity.z;
      
      // Проверка коллизий с зданиями
      for (const building of this.buildings) {
          const buildingBox = new THREE.Box3().setFromObject(building);
          const carBox = new THREE.Box3().setFromObject(this.car);
          if (carBox.intersectsBox(buildingBox)) {
              this.car.position.copy(originalPosition);
              // Отскок при столкновении
              this.carSpeed *= -0.5;
              this.carVelocity.multiplyScalar(0.5);
              break;
          }
      }
      
      // Устанавливаем машину на уровень земли
      this.car.position.y = 0.25;
  }
  
  // Метод для создания дыма при дрифте
  createDriftSmoke() {
      // Создаем дым только при движении
      if (Math.abs(this.carSpeed) < 0.03) return;
      
      // Создаем частицы дыма позади колес
      for (let i = 0; i < 2; i++) {
          const smokeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
          const smokeMaterial = new THREE.MeshBasicMaterial({
              color: 0xdddddd,
              transparent: true,
              opacity: 0.7
          });
          
          const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
          
          // Позиционируем дым за колесами
          const wheelOffset = i === 0 ? -0.5 : 0.5; // Левое или правое колесо
          
          // Позиция дыма
          smoke.position.set(
              this.car.position.x - Math.sin(this.car.rotation.y) * 1 + Math.cos(this.car.rotation.y) * wheelOffset,
              0.1, // Чуть выше земли
              this.car.position.z - Math.cos(this.car.rotation.y) * 1 - Math.sin(this.car.rotation.y) * wheelOffset
          );
          
          // Добавляем в сцену
          this.scene.add(smoke);
          
          // Параметры для анимации дыма
          smoke.userData = {
              life: 1.0, // Время жизни
              decay: 0.03 + Math.random() * 0.02, // Скорость исчезновения
              scale: 0.1, // Начальный размер
              scaleRate: 0.08 + Math.random() * 0.05, // Скорость увеличения
              velocity: new THREE.Vector3(
                  this.carVelocity.x * 0.2 + (Math.random() * 0.1 - 0.05),
                  0.05 + Math.random() * 0.05, // Подъем вверх
                  this.carVelocity.z * 0.2 + (Math.random() * 0.1 - 0.05)
              )
          };
          
          this.smokeParticles.push(smoke);
      }
  }
  
  // Добавьте этот метод для обновления частиц дыма
  updateSmoke() {
      for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
          const smoke = this.smokeParticles[i];
          
          // Уменьшаем время жизни
          smoke.userData.life -= smoke.userData.decay;
          
          // Удаляем, если время жизни закончилось
          if (smoke.userData.life <= 0) {
              this.scene.remove(smoke);
              this.smokeParticles.splice(i, 1);
              continue;
          }
          
          // Обновляем прозрачность
          smoke.material.opacity = smoke.userData.life * 0.7;
          
          // Увеличиваем размер
          smoke.userData.scale += smoke.userData.scaleRate;
          smoke.scale.set(smoke.userData.scale, smoke.userData.scale, smoke.userData.scale);
          
          // Перемещаем согласно скорости
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

    initBuildings() {
        this.buildings = [];
        for (let i = 0; i < 10; i++) {
            const width = Math.random() * 5 + 5;
            const depth = Math.random() * 5 + 5;
            const height = Math.random() * 10 + 10;
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
            const building = new THREE.Mesh(geometry, material);
            building.position.set(
                Math.random() * 100 - 50,
                height / 2,
                Math.random() * 100 - 50
            );
            this.scene.add(building);
            this.buildings.push(building);
        }
    }

    initSpeedEffects() {
      // Линии скорости
      this.speedLines = [];
      for (let i = 0; i < 2; i++) { // Уменьшаем количество линий
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(3 * 2);
          
          // Начальная и конечная точки линии
          positions.set([0, 0.1, 0, 0, 0.1, -1.5]); // Делаем короче
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const material = new THREE.LineBasicMaterial({ 
              color: 0xffffff, // Белый цвет
              transparent: true, 
              opacity: 0.0
          });
          
          const line = new THREE.Line(geometry, material);
          
          // Создаем группу для каждой линии
          const lineGroup = new THREE.Group();
          lineGroup.add(line);
          
          // Смещаем линии в разные стороны от центра
          const offset = i / 2 * 2 - 1; // От -1 до 1
          lineGroup.userData = {
              offset: offset,
              length: 1 + Math.random() * 1 // Короче базовая длина
          };
          
          this.scene.add(lineGroup);
          this.speedLines.push(lineGroup);
      }
  
      // Частицы ветра в мире - уменьшаем количество
      this.windParticles = [];
      const particleGeometry = new THREE.BufferGeometry();
      const particleCount = 300; // Меньше частиц
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
          size: 0.15, // Меньше размер
          transparent: true, 
          opacity: 0.4 // Менее заметные
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      this.scene.add(particles);
      this.windParticles.push(particles);
      
      // Частицы скорости за машиной
      this.speedParticles = [];
      this.lastSpeedParticleTime = 0;
  }
  
  updateSpeedEffects() {
      const currentTime = Date.now();
      const isAccelerating = this.keys["KeyW"] && (this.keys["ShiftLeft"] || this.keys["ShiftRight"]);
      const speedThreshold = 0.07;
      const absSpeed = Math.abs(this.carSpeed);
      
      // Обновление линий скорости
      this.speedLines.forEach((lineGroup, index) => {
          // Получаем линию из группы
          const line = lineGroup.children[0];
          const positions = line.geometry.attributes.position.array;
          
          // Если машина движется быстро или ускоряется, показываем линии скорости
          if (absSpeed > speedThreshold || isAccelerating) {
              // Делаем линии видимыми, но не слишком яркими
              line.material.opacity = Math.min(absSpeed * 3, 0.5);
              
              // Располагаем группу линии строго за машиной
              lineGroup.position.copy(this.car.position);
              lineGroup.rotation.y = this.car.rotation.y;
              
              // Смещаем группу назад от машины
              const backDistance = 1.0;
              lineGroup.position.x -= Math.sin(this.car.rotation.y) * backDistance;
              lineGroup.position.z -= Math.cos(this.car.rotation.y) * backDistance;
              
              // Добавляем боковое смещение для каждой линии
              const sideOffset = lineGroup.userData.offset;
              lineGroup.position.x += Math.cos(this.car.rotation.y) * sideOffset * 0.5; // Меньше разброс
              lineGroup.position.z -= Math.sin(this.car.rotation.y) * sideOffset * 0.5;
              
              // Устанавливаем высоту
              lineGroup.position.y = 0.2;
              
              // Обновляем точки линии для создания эффекта скорости
              positions[0] = 0;
              positions[1] = 0;
              positions[2] = 0;
              
              // Конечная точка - позади, длина зависит от скорости, но короче
              const lineLength = lineGroup.userData.length * absSpeed * 7; // Меньше множитель
              positions[3] = 0;
              positions[4] = 0;
              positions[5] = -lineLength;
              
              // Минимальные случайные отклонения
              positions[3] += (Math.random() - 0.5) * 0.02;
              positions[5] += (Math.random() - 0.5) * 0.02;
          } else {
              // Если машина медленная, скрываем линии
              line.material.opacity = 0;
          }
          
          // Обновляем геометрию линии
          line.geometry.attributes.position.needsUpdate = true;
      });
  
      // Создаем частицы скорости за машиной при ускорении, но реже
      if ((absSpeed > speedThreshold || isAccelerating) && 
          currentTime - this.lastSpeedParticleTime > 80) { // Увеличиваем интервал
          
          this.createSpeedParticle();
          this.lastSpeedParticleTime = currentTime;
      }
      
      // Обновляем существующие частицы скорости
      this.updateSpeedParticles();
  
      // Обновление общих частиц ветра в мире - минимальное влияние
      const particlePositions = this.windParticles[0].geometry.attributes.position.array;
      for (let i = 0; i < particlePositions.length; i += 3) {
          // Добавляем минимальное случайное движение
          particlePositions[i] += (Math.random() - 0.5) * 0.05;
          particlePositions[i + 2] += (Math.random() - 0.5) * 0.05;
          
          // Влияние скорости машины на ближайшие частицы
          const dx = particlePositions[i] - this.car.position.x;
          const dz = particlePositions[i + 2] - this.car.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < 8 && absSpeed > 0.05) { // Меньше радиус влияния
              particlePositions[i] -= Math.sin(this.car.rotation.y) * this.carSpeed * 0.15;
              particlePositions[i + 2] -= Math.cos(this.car.rotation.y) * this.carSpeed * 0.15;
          }
      }
      
      this.windParticles[0].geometry.attributes.position.needsUpdate = true;
  }
  
  // Метод для создания частицы скорости за машиной
  createSpeedParticle() {
      // Создаем короткую линию за машиной
      const geometry = new THREE.BufferGeometry();
      const length = 0.8 + Math.random() * 0.7; // Короче длина
      
      // Создаем точки для линии
      const positions = new Float32Array(3 * 2);
      positions.set([0, 0, 0, 0, 0, -length]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      // Создаем материал с черно-серо-белой гаммой в зависимости от скорости
      let color;
      const absSpeed = Math.abs(this.carSpeed);
      
      if (absSpeed > 0.12) {
          color = 0x000000; // Черный для очень высокой скорости
      } else if (absSpeed > 0.08) {
          color = 0x888888; // Серый для высокой скорости
      } else {
          color = 0xffffff; // Белый для обычной скорости
      }
      
      const material = new THREE.LineBasicMaterial({ 
          color: color, 
          transparent: true, 
          opacity: 0.5 + Math.random() * 0.2 // Меньше заметность
      });
      
      const line = new THREE.Line(geometry, material);
      
      // Располагаем частицу строго позади машины
      const backX = this.car.position.x - Math.sin(this.car.rotation.y) * 1;
      const backZ = this.car.position.z - Math.cos(this.car.rotation.y) * 1;
      
      // Добавляем небольшое боковое смещение
      const sideOffset = (Math.random() - 0.5) * 0.8; // Меньше разброс
      const posX = backX + Math.cos(this.car.rotation.y) * sideOffset;
      const posZ = backZ - Math.sin(this.car.rotation.y) * sideOffset;
      
      line.position.set(
          posX,
          0.1 + Math.random() * 0.2, // Ниже над землей
          posZ
      );
      
      // Поворачиваем линию в направлении движения машины
      line.rotation.y = this.car.rotation.y;
      
      // Добавляем в мир
      this.scene.add(line);
      
      // Данные для анимации - быстрее исчезают
      line.userData = {
          life: 1.0,
          decay: 0.05 + Math.random() * 0.03, // Быстрее исчезают
          velocity: new THREE.Vector3(
              this.carVelocity.x * 0.7,
              0.005 + Math.random() * 0.01, // Минимальный подъем
              this.carVelocity.z * 0.7
          ),
          carDirection: this.car.rotation.y
      };
      
      this.speedParticles.push(line);
  }
  
  // Метод для обновления частиц скорости
  updateSpeedParticles() {
      if (!this.speedParticles) return;
      
      for (let i = this.speedParticles.length - 1; i >= 0; i--) {
          const particle = this.speedParticles[i];
          
          // Быстрее уменьшаем время жизни
          particle.userData.life -= particle.userData.decay;
          
          // Удаляем, если время жизни закончилось
          if (particle.userData.life <= 0) {
              this.scene.remove(particle);
              this.speedParticles.splice(i, 1);
              continue;
          }
          
          // Обновляем прозрачность - быстрее исчезают
          particle.material.opacity = particle.userData.life * 0.5;
          
          // Перемещаем частицу
          particle.position.add(particle.userData.velocity);
          
          // Быстрее уменьшаем скорость частицы
          particle.userData.velocity.multiplyScalar(0.95);
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

    animate() {
      this.updateCar();
      this.updateSpeedEffects();
      this.updateTShapeParticles();
      this.updateSmoke(); // Добавляем обновление дыма
      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(() => this.animate());
  }
}

new ThreeJSTemplate();
