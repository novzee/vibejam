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
    this.initTShapeParticles();
    this.initLODSystem();
    this.optimizeStaticGeometries();
    this.addEventListeners();
    this.animate();
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
    this.carVelocity = new THREE.Vector3(0, 0, 0);
    this.carDirection = new THREE.Vector3(0, 0, 1);
    this.isDrifting = false;
    this.driftFactor = 0;
    this.traction = 1.0;
    this.smokeParticles = [];
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
    const originalPosition = this.car.position.clone();
    this.carVelocity.x = this.carVelocity.x * (1 - this.traction) + this.carDirection.x * this.carSpeed * this.traction;
    this.carVelocity.z = this.carVelocity.z * (1 - this.traction) + this.carDirection.z * this.carSpeed * this.traction;
    this.car.position.x += this.carVelocity.x;
    this.car.position.z += this.carVelocity.z;
    for (const building of this.buildings) {
      const buildingBox = new THREE.Box3().setFromObject(building);
      const carBox = new THREE.Box3().setFromObject(this.car);
      if (carBox.intersectsBox(buildingBox)) {
        this.car.position.copy(originalPosition);
        this.carSpeed *= -0.5;
        this.carVelocity.multiplyScalar(0.5);
        break;
      }
    }
    this.car.position.y = 0.25;
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

  initBuildings() {
    this.buildings = [];
    const gridSize = 5;
    const blockSize = 30;
    const streetWidth = 10;
    for (let blockX = 0; blockX < gridSize; blockX++) {
      for (let blockZ = 0; blockZ < gridSize; blockZ++) {
        const centerX = (blockX - gridSize / 2) * (blockSize + streetWidth);
        const centerZ = (blockZ - gridSize / 2) * (blockSize + streetWidth);
        const buildingsInBlock = 2 + Math.floor(Math.random() * 3);
        for (let b = 0; b < buildingsInBlock; b++) {
          const buildingGroup = new THREE.Group();
          const width = 8 + Math.random() * 4;
          const depth = 8 + Math.random() * 4;
          const floorHeight = 3;
          const floors = Math.floor(Math.random() * 5) + 3;
          const totalHeight = floorHeight * floors;
          const buildingGeometry = new THREE.BoxGeometry(width, totalHeight, depth);
          let buildingColor;
          const colorChoice = Math.random();
          if (colorChoice < 0.3) {
            buildingColor = 0xd3d3d3;
          } else if (colorChoice < 0.6) {
            buildingColor = 0xa9a9a9;
          } else if (colorChoice < 0.8) {
            buildingColor = 0xf5f5dc;
          } else {
            buildingColor = 0xe8e4c9;
          }
          const buildingMaterial = new THREE.MeshStandardMaterial({
            color: buildingColor,
            flatShading: true
          });
          const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
          building.position.y = totalHeight / 2;
          buildingGroup.add(building);
          const roofGeometry = new THREE.BoxGeometry(width + 0.5, 0.5, depth + 0.5);
          const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333
          });
          const roof = new THREE.Mesh(roofGeometry, roofMaterial);
          roof.position.y = totalHeight + 0.25;
          buildingGroup.add(roof);
          const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            emissive: 0x555555,
            transparent: true,
            opacity: 0.8
          });
          const windowWidth = 1.2;
          const windowHeight = 1.5;
          const windowDepth = 0.05;
          const edgeMargin = 1;
          const availableWidth = width - 2 * edgeMargin;
          const availableDepth = depth - 2 * edgeMargin;
          const windowsPerWidth = Math.max(1, Math.floor(availableWidth / (windowWidth + 0.5)));
          const windowsPerDepth = Math.max(1, Math.floor(availableDepth / (windowWidth + 0.5)));
          const spacingWidth = availableWidth / windowsPerWidth;
          const spacingDepth = availableDepth / windowsPerDepth;
          for (let floor = 1; floor < floors; floor++) {
            const floorY = floor * floorHeight + floorHeight / 2;
            for (let w = 0; w < windowsPerWidth; w++) {
              const windowX = (w * spacingWidth + spacingWidth / 2) - availableWidth / 2;
              const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
              const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
              windowMesh.material.emissiveIntensity = Math.random() > 0.6 ? 0.5 : 0;
              windowMesh.position.set(windowX, floorY, depth / 2 + 0.05);
              buildingGroup.add(windowMesh);
            }
            for (let w = 0; w < windowsPerWidth; w++) {
              const windowX = (w * spacingWidth + spacingWidth / 2) - availableWidth / 2;
              const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
              const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
              windowMesh.material.emissiveIntensity = Math.random() > 0.6 ? 0.5 : 0;
              windowMesh.position.set(windowX, floorY, -depth / 2 - 0.05);
              windowMesh.rotation.y = Math.PI;
              buildingGroup.add(windowMesh);
            }
            for (let d = 0; d < windowsPerDepth; d++) {
              const windowZ = (d * spacingDepth + spacingDepth / 2) - availableDepth / 2;
              const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
              const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
              windowMesh.material.emissiveIntensity = Math.random() > 0.6 ? 0.5 : 0;
              windowMesh.position.set(-width / 2 - 0.05, floorY, windowZ);
              windowMesh.rotation.y = Math.PI / 2;
              buildingGroup.add(windowMesh);
            }
            for (let d = 0; d < windowsPerDepth; d++) {
              const windowZ = (d * spacingDepth + spacingDepth / 2) - availableDepth / 2;
              const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
              const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
              windowMesh.material.emissiveIntensity = Math.random() > 0.6 ? 0.5 : 0;
              windowMesh.position.set(width / 2 + 0.05, floorY, windowZ);
              windowMesh.rotation.y = -Math.PI / 2;
              buildingGroup.add(windowMesh);
            }
          }
          const storeFrontMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            emissive: 0x666666,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9
          });
          const storeFrontWidth = 2.5;
          const storeFrontHeight = 2.2;
          const storeFrontsPerSide = Math.min(2, windowsPerWidth);
          for (let sf = 0; sf < storeFrontsPerSide; sf++) {
            const sfX = (sf * (width / storeFrontsPerSide) + width / (storeFrontsPerSide * 2)) - width / 2;
            const frontSF = new THREE.Mesh(
              new THREE.BoxGeometry(storeFrontWidth, storeFrontHeight, windowDepth),
              storeFrontMaterial.clone()
            );
            frontSF.position.set(sfX, storeFrontHeight / 2, depth / 2 + 0.05);
            buildingGroup.add(frontSF);
            const backSF = new THREE.Mesh(
              new THREE.BoxGeometry(storeFrontWidth, storeFrontHeight, windowDepth),
              storeFrontMaterial.clone()
            );
            backSF.position.set(sfX, storeFrontHeight / 2, -depth / 2 - 0.05);
            backSF.rotation.y = Math.PI;
            buildingGroup.add(backSF);
          }
          const doorWidth = 1.8;
          const doorHeight = 2.5;
          const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.1);
          const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            metalness: 0.5,
            roughness: 0.7
          });
          const door = new THREE.Mesh(doorGeometry, doorMaterial);
          const facingStreet = Math.floor(Math.random() * 4);
          if (facingStreet === 0) {
            door.position.set(0, doorHeight / 2, depth / 2 + 0.1);
          } else if (facingStreet === 1) {
            door.position.set(0, doorHeight / 2, -depth / 2 - 0.1);
            door.rotation.y = Math.PI;
          } else if (facingStreet === 2) {
            door.position.set(-width / 2 - 0.1, doorHeight / 2, 0);
            door.rotation.y = Math.PI / 2;
          } else {
            door.position.set(width / 2 + 0.1, doorHeight / 2, 0);
            door.rotation.y = -Math.PI / 2;
          }
          buildingGroup.add(door);
          const canopyGeometry = new THREE.BoxGeometry(doorWidth + 0.5, 0.3, 1);
          const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
          const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
          if (facingStreet === 0) {
            canopy.position.set(0, doorHeight + 0.15, depth / 2 + 0.5);
          } else if (facingStreet === 1) {
            canopy.position.set(0, doorHeight + 0.15, -depth / 2 - 0.5);
            canopy.rotation.y = Math.PI;
          } else if (facingStreet === 2) {
            canopy.position.set(-width / 2 - 0.5, doorHeight + 0.15, 0);
            canopy.rotation.y = Math.PI / 2;
          } else {
            canopy.position.set(width / 2 + 0.5, doorHeight + 0.15, 0);
            canopy.rotation.y = -Math.PI / 2;
          }
          buildingGroup.add(canopy);
          let posX, posZ;
          switch (b % 4) {
            case 0:
              posX = centerX - blockSize / 2 + width / 2 + 1;
              posZ = centerZ - blockSize / 2 + depth / 2 + 1;
              break;
            case 1:
              posX = centerX + blockSize / 2 - width / 2 - 1;
              posZ = centerZ - blockSize / 2 + depth / 2 + 1;
              break;
            case 2:
              posX = centerX + blockSize / 2 - width / 2 - 1;
              posZ = centerZ + blockSize / 2 - depth / 2 - 1;
              break;
            case 3:
              posX = centerX - blockSize / 2 + width / 2 + 1;
              posZ = centerZ + blockSize / 2 - depth / 2 - 1;
              break;
          }
          buildingGroup.position.set(posX, 0, posZ);
          if (b % 4 === 0) {
            buildingGroup.rotation.y = Math.PI * 0.5;
          } else if (b % 4 === 1) {
            buildingGroup.rotation.y = Math.PI * 1.0;
          } else if (b % 4 === 2) {
            buildingGroup.rotation.y = Math.PI * 1.5;
          } else {
            buildingGroup.rotation.y = 0;
          }
          const collisionBox = new THREE.Box3().setFromObject(building);
          building.userData = {
            group: buildingGroup,
            collisionBox: collisionBox
          };
          this.scene.add(buildingGroup);
          this.buildings.push(building);
        }
        const sidewalkHeight = 0.2;
        const sidewalkWidth = 3;
        const sidewalkMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.9
        });
        const topSidewalk = new THREE.Mesh(
          new THREE.BoxGeometry(blockSize + 2 * sidewalkWidth, sidewalkHeight, sidewalkWidth),
          sidewalkMaterial
        );
        topSidewalk.position.set(
          centerX,
          sidewalkHeight / 2,
          centerZ - blockSize / 2 - sidewalkWidth / 2
        );
        this.scene.add(topSidewalk);
        const bottomSidewalk = new THREE.Mesh(
          new THREE.BoxGeometry(blockSize + 2 * sidewalkWidth, sidewalkHeight, sidewalkWidth),
          sidewalkMaterial
        );
        bottomSidewalk.position.set(
          centerX,
          sidewalkHeight / 2,
          centerZ + blockSize / 2 + sidewalkWidth / 2
        );
        this.scene.add(bottomSidewalk);
        const leftSidewalk = new THREE.Mesh(
          new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, blockSize),
          sidewalkMaterial
        );
        leftSidewalk.position.set(
          centerX - blockSize / 2 - sidewalkWidth / 2,
          sidewalkHeight / 2,
          centerZ
        );
        this.scene.add(leftSidewalk);
        const rightSidewalk = new THREE.Mesh(
          new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, blockSize),
          sidewalkMaterial
        );
        rightSidewalk.position.set(
          centerX + blockSize / 2 + sidewalkWidth / 2,
          sidewalkHeight / 2,
          centerZ
        );
        this.scene.add(rightSidewalk);
      }
    }
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    });
    for (let i = 0; i <= gridSize; i++) {
      const roadZ = (i - gridSize / 2) * (blockSize + streetWidth) - blockSize / 2;
      const roadLength = gridSize * (blockSize + streetWidth);
      const horizontalRoad = new THREE.Mesh(
        new THREE.BoxGeometry(roadLength, 0.1, streetWidth),
        roadMaterial
      );
      horizontalRoad.position.set(0, 0.05, roadZ);
      this.scene.add(horizontalRoad);
      const lineLength = 3;
      const lineGap = 3;
      const totalLines = Math.floor(roadLength / (lineLength + lineGap));
      const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      for (let j = 0; j < totalLines; j++) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(lineLength, 0.15, 0.2),
          lineMaterial
        );
        const lineX = (j * (lineLength + lineGap)) - roadLength / 2 + lineLength / 2;
        line.position.set(lineX, 0.1, roadZ);
        this.scene.add(line);
      }
    }
    for (let i = 0; i <= gridSize; i++) {
      const roadX = (i - gridSize / 2) * (blockSize + streetWidth) - blockSize / 2;
      const roadLength = gridSize * (blockSize + streetWidth);
      const verticalRoad = new THREE.Mesh(
        new THREE.BoxGeometry(streetWidth, 0.1, roadLength),
        roadMaterial
      );
      verticalRoad.position.set(roadX, 0.05, 0);
      this.scene.add(verticalRoad);
      const lineLength = 3;
      const lineGap = 3;
      const totalLines = Math.floor(roadLength / (lineLength + lineGap));
      const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      for (let j = 0; j < totalLines; j++) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.15, lineLength),
          lineMaterial
        );
        const lineZ = (j * (lineLength + lineGap)) - roadLength / 2 + lineLength / 2;
        line.position.set(roadX, 0.1, lineZ);
        this.scene.add(line);
      }
    }
  }

  initSpeedEffects() {
    this.speedLines = [];
    for (let i = 0; i < 2; i++) {
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
      this.deltaAccumulator %= this.frameTime;
      this.renderer.render(this.scene, this.camera);
    }
    requestAnimationFrame(() => this.animate());
  }

  updateVisibleObjects() {
    this.updateCar();
    this.updateVisibleBuildings();
    this.updateNearbyEffects();
    this.updateCamera();
  }

  updateVisibleBuildings() {
    const cameraPosition = this.camera.position;
    for (const building of this.buildings) {
      const buildingGroup = building.userData.group;
      const distance = cameraPosition.distanceTo(buildingGroup.position);
      if (distance > this.visibilityDistance) {
        if (buildingGroup.visible) {
          buildingGroup.visible = false;
        }
        continue;
      }
      if (!buildingGroup.visible) {
        buildingGroup.visible = true;
      }
      if (distance < this.LODlevels.near) {
        this.setHighDetailLOD(buildingGroup);
      } else if (distance < this.LODlevels.medium) {
        this.setMediumDetailLOD(buildingGroup);
      } else {
        this.setLowDetailLOD(buildingGroup);
      }
    }
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