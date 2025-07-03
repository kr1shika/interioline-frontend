// Roomjs.jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Roomjs = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(10, 7, 10);
        camera.lookAt(0, 1, 0);

        // Renderer (transparent background)
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountRef.current.appendChild(renderer.domElement);

        // Controls (rotation only)
        // OrbitControls (rotation only, slight up/down)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.enablePan = false;

        // Allow slight up/down (polar angle controls vertical rotation)
        controls.minPolarAngle = Math.PI / 2.4; // ~48° from top
        controls.maxPolarAngle = Math.PI / 2;   // 90° (horizontal)

        // Side-to-side only up to 90 degrees left/right
        controls.minAzimuthAngle = -Math.PI / 2;
        controls.maxAzimuthAngle = Math.PI / 2;

        controls.target.set(0, 1.5, 0);
        controls.update();


        // Lights
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.8);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(8, 15, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(1024, 1024);
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = -10;
        dirLight.shadow.camera.left = -10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 50;
        scene.add(dirLight);

        // Room Dimensions & Materials
        const roomSize = 10;
        const wallHeight = 6;
        const wallThickness = 0.2;
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xE0CBA8, roughness: 0.8, metalness: 0.2 });
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xF0EDE5, roughness: 0.9 });
        const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xBC8F8F, roughness: 0.7 });

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Back Wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(roomSize, wallHeight, wallThickness),
            wallMaterial
        );
        backWall.position.set(0, wallHeight / 2, -roomSize / 2 + wallThickness / 2);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        scene.add(backWall);

        // Right Wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
            wallMaterial
        );
        rightWall.position.set(roomSize / 2 - wallThickness / 2, wallHeight / 2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        scene.add(rightWall);

        // Shoji-style Left Wall
        const leftWall = new THREE.Group();
        scene.add(leftWall);
        leftWall.position.set(-roomSize / 2 + wallThickness / 2, 0, 0);

        const frameThickness = 0.1;
        const screenHeight = wallHeight * 0.9;
        const screenWidth = roomSize * 0.8;

        // Outer frame
        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, frameThickness, screenWidth), woodMaterial);
        topBeam.position.set(0, screenHeight, screenWidth / 2 - roomSize / 2);
        topBeam.castShadow = true;
        leftWall.add(topBeam);

        const bottomBeam = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, frameThickness, screenWidth), woodMaterial);
        bottomBeam.position.set(0, frameThickness, screenWidth / 2 - roomSize / 2);
        bottomBeam.castShadow = true;
        leftWall.add(bottomBeam);

        const leftBeam = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, screenHeight, frameThickness), woodMaterial);
        leftBeam.position.set(0, screenHeight / 2, -roomSize / 2 + frameThickness / 2);
        leftBeam.castShadow = true;
        leftWall.add(leftBeam);

        const rightBeam = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, screenHeight, frameThickness), woodMaterial);
        rightBeam.position.set(0, screenHeight / 2, screenWidth - roomSize / 2 - frameThickness / 2);
        rightBeam.castShadow = true;
        leftWall.add(rightBeam);

        // Shoji Grid
        const numVertical = 3;
        for (let i = 1; i <= numVertical; i++) {
            const vBeam = new THREE.Mesh(new THREE.BoxGeometry(frameThickness * 0.8, screenHeight, frameThickness * 0.8), woodMaterial);
            vBeam.position.set(0, screenHeight / 2, (screenWidth / (numVertical + 1)) * i - roomSize / 2);
            vBeam.castShadow = true;
            leftWall.add(vBeam);
        }

        const numHorizontal = 5;
        for (let i = 1; i <= numHorizontal; i++) {
            const hBeam = new THREE.Mesh(new THREE.BoxGeometry(frameThickness * 0.8, frameThickness * 0.8, screenWidth), woodMaterial);
            hBeam.position.set(0, (screenHeight / (numHorizontal + 1)) * i, screenWidth / 2 - roomSize / 2);
            hBeam.castShadow = true;
            leftWall.add(hBeam);
        }

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };

    }, []);

    return <div className="Roomjs" ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default Roomjs;
