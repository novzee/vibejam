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
    this.initSpeedEffects();
    this.initTShapeParticles(); // Добавляем инициализацию T-образных частиц
    this.addEventListeners();
    this.animate();
  }

  initTShapeParticles() {
    // Создаем группу для частиц (не привязана к машине)
    this.tShapeParticles = [];
    
    const particleCount = 400; // Частицы для покрытия карты
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
        this.carSpeed = 0;
        this.keys = {};
        window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
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
        for (let i = 0; i < 10; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(3 * 2);
            positions.set([0, 0.1, 0, 0, 0.1, -2]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
            const line = new THREE.Line(geometry, material);
            this.car.add(line);
            this.speedLines.push(line);
        }

        // Частицы ветра
        this.windParticles = [];
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 500;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            particlePositions.set([Math.random() * 200 - 100, Math.random() * 5, Math.random() * 200 - 100], i * 3);
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.5 });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        this.windParticles.push(particles);
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

    updateCar() {
        if (this.keys["ArrowUp"]) this.carSpeed = 0.1;
        else if (this.keys["ArrowDown"]) this.carSpeed = -0.05;
        else this.carSpeed *= 0.9;

        const originalPosition = this.car.position.clone();
        this.car.position.x += Math.sin(this.car.rotation.y) * this.carSpeed;
        this.car.position.z += Math.cos(this.car.rotation.y) * this.carSpeed;

        if (this.keys["ArrowLeft"]) this.car.rotation.y += 0.03;
        if (this.keys["ArrowRight"]) this.car.rotation.y -= 0.03;

        // Проверка коллизий с зданиями
        for (const building of this.buildings) {
            const buildingBox = new THREE.Box3().setFromObject(building);
            const carBox = new THREE.Box3().setFromObject(this.car);
            if (carBox.intersectsBox(buildingBox)) {
                this.car.position.copy(originalPosition);
                break;
            }
        }

        // Устанавливаем машину на уровень земли
        this.car.position.y = 0.25;
    }

    updateSpeedEffects() {
        // Обновление линий скорости
        this.speedLines.forEach((line, index) => {
            const positions = line.geometry.attributes.position.array;
            positions[3] = positions[4] = positions[5] = 0;
            positions[3] -= Math.sin(this.car.rotation.y/6) * (this.carSpeed * 10 + index * 0.3);
            positions[5] -= Math.cos(this.car.rotation.y/6) * (this.carSpeed * 10 + index * 0.3);
            line.geometry.attributes.position.needsUpdate = true;
        });

        // Обновление частиц ветра
        const particlePositions = this.windParticles[0].geometry.attributes.position.array;
        for (let i = 0; i < particlePositions.length; i += 3) {
            particlePositions[i] += (Math.random() - 0.5) * 0.1;
            particlePositions[i + 2] += (Math.random() - 0.5) * 0.1;
        }
        this.windParticles[0].geometry.attributes.position.needsUpdate = true;
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
      this.updateTShapeParticles(); // Добавляем обновление T-образных частиц
      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(() => this.animate());
    }
}

new ThreeJSTemplate();
