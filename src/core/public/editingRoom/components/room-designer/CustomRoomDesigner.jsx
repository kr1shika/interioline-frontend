
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
  useDisclosure,
} from "@heroui/react";
import {
  Download,
  FileText,
  FolderOpen,
  Home,
  Package,
  Plus,
  Save,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Header from "../../../../../components/header.jsx";
import FurnitureCatalog from "./FurnitureCatalog";
// Import components and hooks
import { useFurniturePlacement } from "../hooks/useFurniturePlacement";
import { useRoomMeasurements } from "../hooks/useRoomMeasurements";
import { useRoomScene } from "../hooks/useRoomScene";
import {
  calculateTotalCost,
  deleteRoomConfiguration,
  exportRoomConfigurationWithGLB,
  getRoomConfigurationByProjectId,
  getSavedRoomConfigurations,
  saveRoomConfigurationWithGLB,
  sendRoomToBackend,
  serializeGLBData
} from "./furniture-Catalog";
import PlacedItemsList from "./PlacedItemsList";

// Import furniture catalog functions

const ROOM_PRESETS = [
  {
    name: "Small Bedroom",
    width: 3,
    length: 3.5,
    height: 2.7,
    type: "bedroom",
  },
  {
    name: "Medium Living Room",
    width: 5,
    length: 6.5,
    height: 3,
    type: "living",
  },
  {
    name: "Large Living Room",
    width: 6,
    length: 8,
    height: 3.2,
    type: "living",
  },
  { name: "Home Office", width: 3.5, length: 4, height: 2.7, type: "office" },
  { name: "Dining Room", width: 4, length: 5, height: 2.7, type: "dining" },
];

const CustomRoomDesigner = () => {
  // Project state management
  const [projectInfo, setProjectInfo] = useState({
    id: null,
    title: "New Room Design",
    data: null
  });

  const location = useLocation();

  // Room configuration state
  const [selectedRoomType, setSelectedRoomType] = useState(ROOM_PRESETS[1]);
  const [roomDimensions, setRoomDimensions] = useState({
    width: 5,
    length: 6.5,
    height: 3,
  });

  const [doors, setDoors] = useState([
    { id: "door1", wall: "south", position: 2, width: 0.9, height: 2.1 },
  ]);
  const [windows, setWindows] = useState([
    {
      id: "window1",
      wall: "north",
      position: 2.5,
      width: 1.5,
      height: 1.2,
      sillHeight: 0.9,
    },
  ]);

  const [wallColor, setWallColor] = useState("#f8f8f8");
  const [floorColor, setFloorColor] = useState("#d4b896");

  // Room management state
  const [roomName, setRoomName] = useState("");
  const [savedRooms, setSavedRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(uuidv4());
  const [pendingGLBLoad, setPendingGLBLoad] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Loading and initialization state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [roomInitialized, setRoomInitialized] = useState(false);
  const [projectProcessed, setProjectProcessed] = useState(false);

  // New state for project room loading
  const [hasProjectRoom, setHasProjectRoom] = useState(false);
  const [projectRoomLoaded, setProjectRoomLoaded] = useState(false);

  // Modal state
  const {
    isOpen: isSaveOpen,
    onOpen: onSaveOpen,
    onOpenChange: onSaveOpenChange,
  } = useDisclosure();
  const {
    isOpen: isLoadOpen,
    onOpen: onLoadOpen,
    onOpenChange: onLoadOpenChange,
  } = useDisclosure();

  // UI state
  const [activeTab, setActiveTab] = useState("basic");
  const mountRef = useRef(null);

  // Scene and furniture hooks
  const {
    scene,
    renderer,
    camera,
    updateRoomDimensions,
    updateDoors,
    updateWindows,
    updateWallColor,
    updateFloorColor,
  } = useRoomScene(mountRef);

  const { roomArea, roomVolume, calculateRoomMetrics } = useRoomMeasurements();

  const {
    placedFurniture,
    selectedFurnitureItem,
    setSelectedFurnitureItem,
    addFurnitureToRoom,
    rotateFurnitureItem,
    removeFurnitureItem,
    clearAllFurniture,
    loadFurnitureFromConfig,
    areaCoveredByFurniture,
    furnitureAreaPercentage,
    gltfLoader,
    getLoadingState,        // NEW
    clearModelCache,        // NEW
    preloadModels,         // NEW
    getModelInfo,          // NEW
  } = useFurniturePlacement(scene, roomArea);

  const [furnitureLoadingState, setFurnitureLoadingState] = useState({
    isLoading: false,
    currentItem: null,
    progress: 0
  });

  // Refs to track values without causing re-renders
  const lastRoomDimensionsRef = useRef(roomDimensions);
  const lastDoorsRef = useRef(doors);
  const lastWindowsRef = useRef(windows);
  const lastWallColorRef = useRef(wallColor);
  const lastFloorColorRef = useRef(floorColor);

  // Initialize saved rooms on component mount
  useEffect(() => {
    const saved = getSavedRoomConfigurations();
    setSavedRooms(saved);
  }, []);

  // Process project information from location state - ONCE ONLY
  useEffect(() => {
    if (location.state?.projectId && !projectProcessed) {
      console.log("Processing project info:", location.state);

      const projectData = {
        id: location.state.projectId,
        title: location.state.projectTitle || "Project Design",
        data: location.state.projectData || null
      };

      setProjectInfo(projectData);
      setRoomName(location.state.projectTitle || "");

      // Check if a room exists for this project
      const existingRoom = getRoomConfigurationByProjectId(location.state.projectId);
      setHasProjectRoom(!!existingRoom);

      setProjectProcessed(true);
    } else if (!location.state?.projectId && !projectProcessed) {
      setProjectProcessed(true);
    }
  }, []); // Empty dependency array - run only once

  // Initialize scene without auto-loading project room
  useEffect(() => {
    if (scene && !roomInitialized && projectProcessed) {
      setRoomInitialized(true);
    }
  }, [scene, roomInitialized, projectProcessed]);

  // Function to manually load project room
  const loadProjectRoom = useCallback(async () => {
    if (!projectInfo.id) {
      alert("No project ID found!");
      return;
    }

    const existingRoom = getRoomConfigurationByProjectId(projectInfo.id);
    if (!existingRoom) {
      alert("No room configuration found for this project!");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingProgress(10);
      console.log("Loading project room:", existingRoom.name);

      // Clear existing furniture
      clearAllFurniture();
      setPendingGLBLoad(null);
      setLoadingProgress(20);

      // Set room configuration
      setCurrentRoomId(existingRoom.id);
      setRoomName(existingRoom.name);
      setLoadingProgress(30);

      setRoomDimensions(existingRoom.roomDimensions);
      setWallColor(existingRoom.wallColor);
      setFloorColor(existingRoom.floorColor);
      setLoadingProgress(40);

      if (existingRoom.doors) {
        setDoors(existingRoom.doors);
      }
      if (existingRoom.windows) {
        setWindows(existingRoom.windows);
      }
      setLoadingProgress(50);

      // Separate GLB and regular furniture
      const hasGLBModels = existingRoom.placedFurniture?.some(item => item.isGLB) || false;
      const regularFurniture = existingRoom.placedFurniture?.filter(item => !item.isGLB) || [];
      setLoadingProgress(60);

      // Load regular furniture immediately
      if (regularFurniture.length > 0) {
        console.log("Loading regular furniture immediately...");
        await loadFurnitureFromConfig(regularFurniture);
        setLoadingProgress(80);
      }

      // Set pending GLB models for later loading
      if (hasGLBModels) {
        const glbModels = existingRoom.placedFurniture.filter(item => item.isGLB);
        setPendingGLBLoad(glbModels);
        console.log(`Project room loaded successfully! ${glbModels.length} GLB models pending.`);
      }

      setLoadingProgress(100);
      setProjectRoomLoaded(true);

      // Small delay to show completion
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        alert("Project room loaded successfully!");
      }, 500);

    } catch (error) {
      console.error("Error loading project room:", error);
      setIsLoading(false);
      setLoadingProgress(0);
      alert("Error occurred while loading project room.");
    }
  }, [projectInfo.id, clearAllFurniture, loadFurnitureFromConfig]);

  // Create room configuration object - STABLE FUNCTION
  const createRoomConfig = useCallback(() => {
    return {
      id: currentRoomId,
      name: roomName || projectInfo.title || `Room Design ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: "2.0",
      projectId: projectInfo.id,
      projectTitle: projectInfo.title,
      roomDimensions,
      doors: doors.map((door) => ({
        id: door.id,
        wall: door.wall,
        position: door.position,
        width: door.width,
        height: door.height,
      })),
      windows: windows.map((window) => ({
        id: window.id,
        wall: window.wall,
        position: window.position,
        width: window.width,
        height: window.height,
        sillHeight: window.sillHeight,
      })),
      wallColor,
      floorColor,
      wallTexture: "smooth",
      placedFurniture: placedFurniture.filter(item => item && item.id).map((item) => ({
        id: item.id,
        furnitureId: item.id,
        name: item.name,
        type: item.type,
        category: item.category,
        position: item.position
          ? { x: item.position.x, y: item.position.y, z: item.position.z }
          : { x: 0, y: 0, z: 0 },
        rotation: item.rotation
          ? { x: item.rotation.x, y: item.rotation.y, z: item.rotation.z }
          : { x: 0, y: 0, z: 0 },
        dimensions: item.dimensions,
        color: item.color,
        material: item.material,
        style: item.style,
        price: item.price,           // NEW
        isGLB: true,                 // ALWAYS true now
        modelPath: item.modelPath,   // NEW
        imagePath: item.imagePath,   // NEW
        appliedScale: item.appliedScale, // NEW
        glbData: item.object ? serializeGLBData(item.object, item) : null
      })),
      placedCarpets: [],
      totalCost: calculateTotalCost(
        placedFurniture.filter(item => item && item.id).map((item) => ({ furnitureId: item.id }))
      ),
      roomArea,
      furnitureAreaPercentage,
    };
  }, [
    currentRoomId,
    roomName,
    projectInfo.id,
    projectInfo.title,
    roomDimensions,
    doors,
    windows,
    wallColor,
    floorColor,
    placedFurniture,
    roomArea,
    furnitureAreaPercentage
  ]);

  // Load room configuration for non-project rooms
  const loadRoom = useCallback(async (config) => {
    if (isLoading) {
      console.log("Room loading already in progress, skipping...");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingProgress(10);
      console.log("Loading room configuration:", config.name);

      // Clear existing furniture
      clearAllFurniture();
      setPendingGLBLoad(null);
      setLoadingProgress(20);

      // Set room configuration
      setCurrentRoomId(config.id);
      setRoomName(config.name);
      setLoadingProgress(30);

      setRoomDimensions(config.roomDimensions);
      setWallColor(config.wallColor);
      setFloorColor(config.floorColor);
      setLoadingProgress(40);

      if (config.doors) {
        setDoors(config.doors);
      }
      if (config.windows) {
        setWindows(config.windows);
      }
      setLoadingProgress(50);

      // Separate GLB and regular furniture
      const hasGLBModels = config.placedFurniture?.some(item => item.isGLB) || false;
      const regularFurniture = config.placedFurniture?.filter(item => !item.isGLB) || [];
      setLoadingProgress(60);

      // Load regular furniture immediately
      if (regularFurniture.length > 0) {
        console.log("Loading regular furniture immediately...");
        await loadFurnitureFromConfig(regularFurniture);
        setLoadingProgress(80);
      }

      // Set pending GLB models for later loading
      if (hasGLBModels) {
        const glbModels = config.placedFurniture.filter(item => item.isGLB);
        setPendingGLBLoad(glbModels);
        console.log(`Room loaded successfully! ${glbModels.length} GLB models pending.`);
      }

      setLoadingProgress(100);

      // Small delay to show completion
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        if (onLoadOpenChange) {
          onLoadOpenChange(false);
        }
      }, 500);

    } catch (error) {
      console.error("Error loading room:", error);
      setIsLoading(false);
      setLoadingProgress(0);
      alert("Error occurred while loading room.");
    }
  }, [clearAllFurniture, loadFurnitureFromConfig, onLoadOpenChange, isLoading]);

  // Load pending GLB models
  const loadPendingGLBModels = async () => {
    if (!pendingGLBLoad || pendingGLBLoad.length === 0) return;

    try {
      console.log("Loading pending GLB models...");
      setIsLoading(true);
      setLoadingProgress(0);

      const result = await loadFurnitureFromConfig(pendingGLBLoad);

      if (result.errors && result.errors.length > 0) {
        console.warn("Some GLB models failed to load:", result.errors);
        alert(`3D Models loaded with ${result.errors.length} warnings. Check console for details.`);
      } else {
        alert("3D Models loaded successfully!");
      }

      setPendingGLBLoad(null);
    } catch (error) {
      console.error("Error loading GLB models:", error);
      alert("Error occurred while loading 3D models.");
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  // Save room manually
  const saveCurrentRoom = async () => {
    const config = createRoomConfig();

    try {
      const success = saveRoomConfigurationWithGLB(config);

      if (success) {
        try {
          await sendRoomToBackend(config);
          alert("Room saved successfully!");
        } catch (backendError) {
          console.warn("Failed to send to backend:", backendError);
          alert("Room saved locally successfully!");
        }

        setSavedRooms(getSavedRoomConfigurations());
        onSaveOpenChange(false);

        // Update project room status
        if (projectInfo.id) {
          setHasProjectRoom(true);
          setProjectRoomLoaded(true);
        }
      } else {
        alert("Failed to save room configuration.");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Error occurred while saving room.");
    }
  };

  // Export room
  const exportCurrentRoom = () => {
    const config = createRoomConfig();
    exportRoomConfigurationWithGLB(config, false);
  };

  // Delete saved room
  const deleteSavedRoom = (id) => {
    deleteRoomConfiguration(id);
    setSavedRooms(getSavedRoomConfigurations());
  };

  // Door management functions
  const handleAddDoor = () => {
    const newDoor = {
      id: `door${doors.length + 1}`,
      wall: "east",
      position: Math.min(2, roomDimensions.width / 2),
      width: 0.9,
      height: 2.1,
    };
    setDoors([...doors, newDoor]);
  };

  const handleUpdateDoor = (id, updates) => {
    setDoors(
      doors.map((door) => (door.id === id ? { ...door, ...updates } : door))
    );
  };

  const handleRemoveDoor = (id) => {
    setDoors(doors.filter((door) => door.id !== id));
  };

  // Window management functions
  const handleAddWindow = () => {
    const newWindow = {
      id: `window${windows.length + 1}`,
      wall: "west",
      position: Math.min(2, roomDimensions.length / 2),
      width: 1.2,
      height: 1.2,
      sillHeight: 0.9,
    };
    setWindows([...windows, newWindow]);
  };

  const handleUpdateWindow = (id, updates) => {
    setWindows(
      windows.map((window) =>
        window.id === id ? { ...window, ...updates } : window
      )
    );
  };
  const handleAddFurnitureError = useCallback((error) => {
    console.error("Error adding 3D furniture:", error);

    let errorMessage = "Failed to load 3D model";
    if (error.message.includes("timeout")) {
      errorMessage = "3D model loading timed out. Please try again.";
    } else if (error.message.includes("network")) {
      errorMessage = "Network error loading 3D model. Check your connection.";
    } else if (error.message.includes("GLB")) {
      errorMessage = "Invalid 3D model file. Please contact support.";
    }

    alert(errorMessage);
  }, []);

  const handleRemoveWindow = (id) => {
    setWindows(windows.filter((window) => window.id !== id));
  };
  // 4. UPDATE the loading state tracking effect

  useEffect(() => {
    const updateLoadingState = () => {
      const state = getLoadingState();
      setFurnitureLoadingState(state);
    };

    // Update loading state every 500ms when loading
    let interval;
    if (getLoadingState().isLoading) {
      interval = setInterval(updateLoadingState, 500);
    } else {
      updateLoadingState();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [getLoadingState]);

  // Update room dimensions when scene is ready - CONTROLLED UPDATES
  useEffect(() => {
    if (!updateRoomDimensions || !roomInitialized || isLoading) return;

    const currentDims = roomDimensions;
    const lastDims = lastRoomDimensionsRef.current;

    // Only update if dimensions actually changed
    if (
      currentDims.width !== lastDims.width ||
      currentDims.length !== lastDims.length ||
      currentDims.height !== lastDims.height
    ) {
      lastRoomDimensionsRef.current = currentDims;

      const updateRoom = async () => {
        try {
          await updateRoomDimensions(currentDims, (progress) => {
            if (progress === 1) {
              calculateRoomMetrics(currentDims);
            }
          });
        } catch (error) {
          console.error("Error updating room dimensions:", error);
        }
      };
      updateRoom();
    }
  }, [roomDimensions.width, roomDimensions.length, roomDimensions.height, updateRoomDimensions, calculateRoomMetrics, roomInitialized, isLoading]);

  // Update doors - CONTROLLED UPDATES
  useEffect(() => {
    if (!updateDoors || !roomInitialized) return;

    const currentDoors = doors;
    const lastDoors = lastDoorsRef.current;

    // Only update if doors actually changed
    if (JSON.stringify(currentDoors) !== JSON.stringify(lastDoors)) {
      lastDoorsRef.current = currentDoors;
      updateDoors(currentDoors);
    }
  }, [doors, updateDoors, roomInitialized]);

  // Update windows - CONTROLLED UPDATES
  useEffect(() => {
    if (!updateWindows || !roomInitialized) return;

    const currentWindows = windows;
    const lastWindows = lastWindowsRef.current;

    // Only update if windows actually changed
    if (JSON.stringify(currentWindows) !== JSON.stringify(lastWindows)) {
      lastWindowsRef.current = currentWindows;
      updateWindows(currentWindows);
    }
  }, [windows, updateWindows, roomInitialized]);

  // Update colors - CONTROLLED UPDATES
  useEffect(() => {
    if (!updateWallColor || !roomInitialized) return;

    if (wallColor !== lastWallColorRef.current) {
      lastWallColorRef.current = wallColor;
      updateWallColor(wallColor);
    }
  }, [wallColor, updateWallColor, roomInitialized]);

  useEffect(() => {
    if (!updateFloorColor || !roomInitialized) return;

    if (floorColor !== lastFloorColorRef.current) {
      lastFloorColorRef.current = floorColor;
      updateFloorColor(floorColor);
    }
  }, [floorColor, updateFloorColor, roomInitialized]);

  // Update room type - CONTROLLED UPDATES
  useEffect(() => {
    if (!selectedRoomType || !roomInitialized || isLoading) return;

    const newDimensions = {
      width: selectedRoomType.width,
      length: selectedRoomType.length,
      height: selectedRoomType.height,
    };

    const currentDims = roomDimensions;

    // Only update if dimensions actually changed
    if (
      newDimensions.width !== currentDims.width ||
      newDimensions.length !== currentDims.length ||
      newDimensions.height !== currentDims.height
    ) {
      setRoomDimensions(newDimensions);
    }
  }, [selectedRoomType.name, roomInitialized, isLoading]);

  // Auto-save functionality - MINIMAL DEPENDENCIES
  const performAutoSave = useCallback(() => {
    if (!autoSaveEnabled || !projectInfo.id || !roomInitialized) {
      return;
    }

    // Only auto-save if project room is loaded or if there's meaningful content
    if (!projectRoomLoaded && placedFurniture.length === 0) {
      return;
    }

    // Check if there's any meaningful content to save
    const hasContent = placedFurniture.length > 0 ||
      roomDimensions.width !== 5 ||
      roomDimensions.length !== 6.5 ||
      roomDimensions.height !== 3 ||
      doors.length > 1 ||
      windows.length > 1 ||
      wallColor !== "#f8f8f8" ||
      floorColor !== "#d4b896";

    if (!hasContent && !projectRoomLoaded) {
      return;
    }

    console.log("Auto-saving room for project:", projectInfo.id, projectInfo.title);

    const config = createRoomConfig();

    try {
      const success = saveRoomConfigurationWithGLB(config);
      if (success) {
        console.log("Auto-saved room successfully for project:", projectInfo.title);
      }
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  }, [
    autoSaveEnabled,
    projectInfo.id,
    projectInfo.title,
    roomInitialized,
    projectRoomLoaded,
    placedFurniture.length,
    roomDimensions,
    doors.length,
    windows.length,
    wallColor,
    floorColor,
    createRoomConfig
  ]);

  // Auto-save timer - STABLE DEPENDENCIES
  useEffect(() => {
    if (!autoSaveEnabled || !projectInfo.id || !roomInitialized) return;

    const autoSaveTimer = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [
    roomDimensions.width,
    roomDimensions.length,
    roomDimensions.height,
    doors.length,
    windows.length,
    wallColor,
    floorColor,
    placedFurniture.length,
    projectInfo.id,
    roomInitialized,
    autoSaveEnabled,
    projectRoomLoaded,
    performAutoSave
  ]);
  useEffect(() => {
    return () => {
      // Clear model cache when component unmounts
      if (clearModelCache) {
        clearModelCache();
      }
    };
  }, [clearModelCache]);

  const totalCost = calculateTotalCost(
    placedFurniture.filter(item => item && item.id).map((item) => ({ furnitureId: item.id }))
  );

  return (
    <div className="flex flex-col w-100vw mx-auto bg-[#FCFCEC]">
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B86A45] mx-auto"></div>
            </div>
            <h2 className="text-2xl font-semibold text-[#B86A45] mb-2">
              {furnitureLoadingState.isLoading ? "Loading 3D Model..." : "Loading Room..."}
            </h2>
            <p className="text-gray-600 mb-4">
              {furnitureLoadingState.isLoading
                ? `Loading: ${furnitureLoadingState.currentItem || "3D Model"}`
                : projectInfo.title
                  ? `Loading "${projectInfo.title}" project room`
                  : "Please wait while we prepare your room"
              }
            </p>
            <div className="w-80 mx-auto">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#B86A45] h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${furnitureLoadingState.isLoading
                      ? furnitureLoadingState.progress
                      : loadingProgress}%`
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round(furnitureLoadingState.isLoading
                  ? furnitureLoadingState.progress
                  : loadingProgress)}% complete
              </p>
              {furnitureLoadingState.totalItems > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {furnitureLoadingState.completedItems}/{furnitureLoadingState.totalItems} models processed
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Header />
      <div className="bg-[#FFFFF6] rounded-lg shadow-sm p-6 my-3 mx-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#B86A45]">
              {projectInfo.id ? `Project: ${projectInfo.title}` : "Room Designer"}
            </h1>
            <p className="text-[#B86A45]">
              {projectInfo.id
                ? "Design and edit your project room"
                : "Design your perfect space with doors, windows, and furniture"
              }
              {projectInfo.id && (
                <span className="block text-sm mt-1 text-gray-600">
                  Project ID: {projectInfo.id}
                  {hasProjectRoom && (
                    <span className="ml-2 text-green-600">
                      • {projectRoomLoaded ? "Room loaded" : "Room available"}
                    </span>
                  )}
                  {!hasProjectRoom && (
                    <span className="ml-2 text-blue-600">• No room design yet</span>
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 text-black">
            {/* Project Room Load Button */}
            {projectInfo.id && hasProjectRoom && !projectRoomLoaded && (
              <Button
                color="primary"
                variant="solid"
                startContent={<FolderOpen className="w-4 h-4" />}
                onPress={loadProjectRoom}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Load Project Room
              </Button>
            )}

            <Button
              color="default"
              variant="solid"
              startContent={<Save className="w-4 h-4" />}
              onPress={onSaveOpen}
              className="bg-white text-black border border-gray-300 hover:bg-gray-50"
            >
              Save
            </Button>
            <Button
              color="default"
              variant="solid"
              startContent={<Upload className="w-4 h-4" />}
              onPress={onLoadOpen}
              className="bg-white text-black border border-gray-300 hover:bg-gray-50"
            >
              Load Other Room
            </Button>
            <Button
              color="default"
              variant="solid"
              startContent={<Download className="w-4 h-4" />}
              onPress={exportCurrentRoom}
              className="bg-white text-black border border-gray-300 hover:bg-gray-50"
            >
              Export
            </Button>
            {pendingGLBLoad && pendingGLBLoad.length > 0 && (
              <Button
                color="warning"
                startContent={<Package className="w-4 h-4" />}
                onPress={loadPendingGLBModels}
                className="animate-pulse bg-orange-500 text-white"
              >
                Load 3D Models ({pendingGLBLoad.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className="w-full ml-6 mt-2 lg:w-80 text-[#B86A45] bg-[#FFFFF6] rounded-lg shadow-sm p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key)}
            variant="underlined"
            classNames={{
              tabList: "gap-4 w-full",
              cursor: "bg-blue-500",
              tab: "px-0 h-12",
            }}
          >
            <Tab
              key="basic"
              title={
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>Basic</span>
                </div>
              }
            >
              <div className="space-y-6 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type & Size
                  </label>
                  <select
                    value={ROOM_PRESETS.findIndex(
                      (room) => room === selectedRoomType
                    )}
                    onChange={(e) =>
                      setSelectedRoomType(
                        ROOM_PRESETS[parseInt(e.target.value)]
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                  >
                    {ROOM_PRESETS.map((room, index) => (
                      <option key={index} value={index}>
                        {room.name} ({room.width}m × {room.length}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#B86A45] mb-3">
                    Custom Dimensions
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-[#B86A45] mb-1">
                        Width (m)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="20"
                        step="0.1"
                        value={roomDimensions.width}
                        onChange={(e) =>
                          setRoomDimensions((prev) => ({
                            ...prev,
                            width: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#B86A45] mb-1">
                        Length (m)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="20"
                        step="0.1"
                        value={roomDimensions.length}
                        onChange={(e) =>
                          setRoomDimensions((prev) => ({
                            ...prev,
                            length: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#B86A45] mb-1">
                        Height (m)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="4"
                        step="0.1"
                        value={roomDimensions.height}
                        onChange={(e) =>
                          setRoomDimensions((prev) => ({
                            ...prev,
                            height: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full p-2 border text-[#B86A45] rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[#B86A45]">
                  <h3 className="text-sm font-medium text-[#B86A45] mb-3">
                    Colors
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#B86A45] mb-1">
                        Wall Color
                      </label>
                      <input
                        type="color"
                        value={wallColor}
                        onChange={(e) => setWallColor(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Floor Color
                      </label>
                      <input
                        type="color"
                        value={floorColor}
                        onChange={(e) => setFloorColor(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab
              key="openings"
              title={
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Doors & Windows</span>
                </div>
              }
            >
              <div className="space-y-6 pt-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Doors</h3>
                    <Button
                      size="sm"
                      color="primary"
                      onPress={handleAddDoor}
                      startContent={<Plus className="w-4 h-4" />}
                    >
                      Add Door
                    </Button>
                  </div>

                  {doors.length > 0 ? (
                    <div className="space-y-3">
                      {doors.map((door) => (
                        <div
                          key={door.id}
                          className="p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm">
                              Door {door.id.replace("door", "")}
                            </h4>
                            <button
                              onClick={() => handleRemoveDoor(door.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-gray-600 mb-1">
                                Wall
                              </label>
                              <select
                                value={door.wall}
                                onChange={(e) =>
                                  handleUpdateDoor(door.id, {
                                    wall: e.target.value,
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              >
                                <option value="north">North</option>
                                <option value="east">East</option>
                                <option value="south">South</option>
                                <option value="west">West</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-gray-600 mb-1">
                                Position (m)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={door.position}
                                onChange={(e) =>
                                  handleUpdateDoor(door.id, {
                                    position: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 mb-1">
                                Width (m)
                              </label>
                              <input
                                type="number"
                                min="0.6"
                                max="2"
                                step="0.1"
                                value={door.width}
                                onChange={(e) =>
                                  handleUpdateDoor(door.id, {
                                    width: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 mb-1">
                                Height (m)
                              </label>
                              <input
                                type="number"
                                min="1.8"
                                max="3"
                                step="0.1"
                                value={door.height}
                                onChange={(e) =>
                                  handleUpdateDoor(door.id, {
                                    height: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      No doors added yet
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Windows
                    </h3>
                    <Button
                      size="sm"
                      color="primary"
                      onPress={handleAddWindow}
                      startContent={<Plus className="w-4 h-4" />}
                    >
                      Add Window
                    </Button>
                  </div>

                  {windows.length > 0 ? (
                    <div className="space-y-3">
                      {windows.map((window) => (
                        <div
                          key={window.id}
                          className="p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm">
                              Window {window.id.replace("window", "")}
                            </h4>
                            <button
                              onClick={() => handleRemoveWindow(window.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-gray-600 mb-1">
                                Wall
                              </label>
                              <select
                                value={window.wall}
                                onChange={(e) =>
                                  handleUpdateWindow(window.id, {
                                    wall: e.target.value,
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              >
                                <option value="north">North</option>
                                <option value="east">East</option>
                                <option value="south">South</option>
                                <option value="west">West</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-gray-600 mb-1">
                                Position (m)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={window.position}
                                onChange={(e) =>
                                  handleUpdateWindow(window.id, {
                                    position: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 mb-1">
                                Width (m)
                              </label>
                              <input
                                type="number"
                                min="0.4"
                                max="3"
                                step="0.1"
                                value={window.width}
                                onChange={(e) =>
                                  handleUpdateWindow(window.id, {
                                    width: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 mb-1">
                                Height (m)
                              </label>
                              <input
                                type="number"
                                min="0.4"
                                max="2.5"
                                step="0.1"
                                value={window.height}
                                onChange={(e) =>
                                  handleUpdateWindow(window.id, {
                                    height: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-gray-600 mb-1">
                                Sill Height (m)
                              </label>
                              <input
                                type="number"
                                min="0.3"
                                max="1.5"
                                step="0.1"
                                value={window.sillHeight}
                                onChange={(e) =>
                                  handleUpdateWindow(window.id, {
                                    sillHeight: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full p-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      No windows added yet
                    </p>
                  )}
                </div>
              </div>
            </Tab>
          </Tabs>

          {/* Room Stats */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">
              Room Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Floor Area:</span>
                <span className="font-medium">{roomArea.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium">{roomVolume.toFixed(2)} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">3D Models:</span>
                <span className="font-medium text-green-600">{placedFurniture.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Furniture Coverage:</span>
                <span className="font-medium">
                  {furnitureAreaPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Doors:</span>
                <span className="font-medium">{doors.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Windows:</span>
                <span className="font-medium">{windows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-medium text-green-600">${totalCost.toLocaleString()}</span>
              </div>
              {furnitureLoadingState.cacheSize > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cached Models:</span>
                  <span className="font-medium text-blue-600">{furnitureLoadingState.cacheSize}</span>
                </div>
              )}
            </div>
          </div>

          {/* Furniture Catalog */}
          <FurnitureCatalog
            selectedFurnitureItem={selectedFurnitureItem}
            setSelectedFurnitureItem={setSelectedFurnitureItem}
            addFurnitureToRoom={addFurnitureToRoom}
            isLoading={furnitureLoadingState.isLoading}
            loadingProgress={furnitureLoadingState.progress}
          />

          {/* Placed Furniture List */}
          {placedFurniture.length > 0 && (
            <PlacedItemsList
              items={placedFurniture}
              onRotate={rotateFurnitureItem}
              onRemove={removeFurnitureItem}
              onClearAll={clearAllFurniture}
              loadingState={furnitureLoadingState}
            />
          )}
        </div>

        {/* 3D View */}
        <div className="mt-2 flex-1 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedRoomType.name} - 3D Preview
            {projectInfo.id && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({projectInfo.title})
              </span>
            )}
          </h2>

          <div
            ref={mountRef}
            className="relative w-full h-[600px] border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-b from-blue-50 to-gray-100"
          >
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 z-10 rounded-lg">
                <div className="text-gray-800 text-lg mb-4 font-medium">
                  Loading Room...
                </div>
                <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {Math.round(loadingProgress)}%
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Status:</strong>
                <span className="text-green-600 font-medium">
                  {" "}Doors: {doors.length} active
                </span>{" "}
                |
                <span className="text-blue-600 font-medium">
                  {" "}Windows: {windows.length} active
                </span>{" "}
                |
                <span className="text-purple-600 font-medium">
                  {" "}3D Models: {placedFurniture.length} items
                </span>
                {furnitureLoadingState.isLoading && (
                  <>
                    {" "}|
                    <span className="text-orange-600 font-medium">
                      {" "}Loading: {furnitureLoadingState.currentItem || "Processing..."}
                    </span>
                  </>
                )}
                {projectInfo.id && (
                  <>
                    {" "}|
                    <span className="text-indigo-600 font-medium">
                      {" "}Project: {projectRoomLoaded ? "Loaded" : hasProjectRoom ? "Available" : "New"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      <Modal isOpen={isSaveOpen} onOpenChange={onSaveOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Save Room Design
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Room Name"
                  placeholder="Enter a name for your room design"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
                <div className="text-sm text-gray-600">
                  <p>This will save your room configuration including:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Room dimensions and colors</li>
                    <li>
                      Doors ({doors.length}) and windows ({windows.length})
                    </li>
                    <li>
                      Furniture placement ({placedFurniture.length} items)
                    </li>
                    <li>Total cost: ${totalCost}</li>
                    {projectInfo.id && (
                      <li className="text-blue-600">
                        ✓ Linked to project: {projectInfo.title}
                      </li>
                    )}
                  </ul>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={saveCurrentRoom}>
                  Save Room
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Load Modal */}
      <Modal isOpen={isLoadOpen} onOpenChange={onLoadOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Load Saved Room
              </ModalHeader>
              <ModalBody>
                {savedRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No saved rooms found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedRooms
                      .filter(room => !projectInfo.id || room.projectId !== projectInfo.id)
                      .map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{room.name}</h4>
                            <p className="text-sm text-gray-600">
                              {room.roomDimensions.width}×
                              {room.roomDimensions.length}m •
                              {room.placedFurniture?.length || 0} items •
                              {room.doors?.length || 0} doors •
                              {room.windows?.length || 0} windows • $
                              {room.totalCost || 0}
                              {room.version === "2.0" && (
                                <span className="ml-2 text-green-600 text-xs">
                                  • GLB Support
                                </span>
                              )}
                              {room.projectId && (
                                <span className="ml-2 text-blue-600 text-xs">
                                  • Project: {room.projectTitle}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created:{" "}
                              {new Date(room.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              color="primary"
                              onPress={() => {
                                loadRoom(room);
                              }}
                            >
                              Load
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => deleteSavedRoom(room.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {projectInfo.id && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This will load a different room design.
                      Your current project room will not be affected.
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CustomRoomDesigner;