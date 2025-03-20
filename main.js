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
        this.addEventListeners();
        this.animate();
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
        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

new ThreeJSTemplate();
