import {
    Button
} from "@heroui/react";
import {
    ArrowLeft,
    Eye,
    FolderOpen,
    Package
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../../../components/header.jsx";
import Toast from "../../../../../components/toastMessage.jsx";
import ViewOnlySidebar from "./ViewOnlySidebar.jsx";

// Import components and hooks
import { useFurniturePlacement } from "../hooks/useFurniturePlacement";
import { useRoomMeasurements } from "../hooks/useRoomMeasurements";
import { useRoomScene } from "../hooks/useRoomScene";
import {
    calculateTotalCost,
    getRoomConfigurationByProjectId
} from "./furniture-Catalog";

const ViewOnlyRoomDesigner = () => {
    // Project state management
    const [projectInfo, setProjectInfo] = useState({
        id: null,
        title: "Room View",
        data: null
    });

    const location = useLocation();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    // Room configuration state
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
    const [roomName, setRoomName] = useState("");

    // Loading and initialization state
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [roomInitialized, setRoomInitialized] = useState(false);
    const [projectProcessed, setProjectProcessed] = useState(false);
    const [projectRoomLoaded, setProjectRoomLoaded] = useState(false);
    const [pendingGLBLoad, setPendingGLBLoad] = useState(null);

    // Add states for room availability
    const [hasProjectRoom, setHasProjectRoom] = useState(false);

    // UI state
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
        loadFurnitureFromConfig,
        areaCoveredByFurniture,
        furnitureAreaPercentage,
        getLoadingState,
        clearModelCache,
        clearAllFurniture,
    } = useFurniturePlacement(scene, roomArea);

    const [furnitureLoadingState, setFurnitureLoadingState] = useState({
        isLoading: false,
        currentItem: null,
        progress: 0
    });

    // Show toast message
    const showToast = (message, type = "info") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    // Process project information from location state - ONCE ONLY
    useEffect(() => {
        if (location.state?.projectId && !projectProcessed) {
            console.log("Processing project info for view-only mode:", location.state);

            const projectData = {
                id: location.state.projectId,
                title: location.state.projectTitle || "Project View",
                data: location.state.projectData || null
            };

            setProjectInfo(projectData);
            setRoomName(location.state.projectTitle || "");

            // Check if a room exists for this project
            const existingRoom = getRoomConfigurationByProjectId(location.state.projectId);
            setHasProjectRoom(!!existingRoom);

            if (!existingRoom) {
                showToast("Room design is not available yet. Please wait for the designer to create it.", "warning");
                setTimeout(() => {
                    navigate(-1);
                }, 3000);
                return;
            }

            setProjectProcessed(true);
        } else if (!location.state?.projectId && !projectProcessed) {
            showToast("No project information found.", "error");
            setTimeout(() => {
                navigate(-1);
            }, 2000);
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
            showToast("No project ID found!", "error");
            setTimeout(() => navigate(-1), 2000);
            return;
        }

        const existingRoom = getRoomConfigurationByProjectId(projectInfo.id);
        if (!existingRoom) {
            showToast("No room configuration found for this project!", "warning");
            setTimeout(() => navigate(-1), 2000);
            return;
        }

        try {
            setIsLoading(true);
            setLoadingProgress(10);
            console.log("Loading project room for viewing:", existingRoom.name);

            // Clear existing furniture
            clearAllFurniture();
            setPendingGLBLoad(null);
            setLoadingProgress(20);

            // Set room configuration
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
                console.log("Loading regular furniture...");
                await loadFurnitureFromConfig(regularFurniture);
                setLoadingProgress(80);
            }

            // Set pending GLB models for later loading
            if (hasGLBModels) {
                const glbModels = existingRoom.placedFurniture.filter(item => item.isGLB);
                setPendingGLBLoad(glbModels);
                console.log(`Room loaded! ${glbModels.length} GLB models pending.`);
            }

            setLoadingProgress(100);
            setProjectRoomLoaded(true);

            // Small delay to show completion
            setTimeout(() => {
                setIsLoading(false);
                setLoadingProgress(0);
                showToast("Room loaded successfully!", "success");
            }, 500);

        } catch (error) {
            console.error("Error loading project room:", error);
            setIsLoading(false);
            setLoadingProgress(0);
            showToast("Error occurred while loading room.", "error");
        }
    }, [projectInfo.id, loadFurnitureFromConfig, clearAllFurniture]);

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
                showToast(`3D Models loaded with ${result.errors.length} warnings.`, "warning");
            } else {
                showToast("3D Models loaded successfully!", "success");
            }

            setPendingGLBLoad(null);
        } catch (error) {
            console.error("Error loading GLB models:", error);
            showToast("Error occurred while loading 3D models.", "error");
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    // Refs to track values without causing re-renders
    const lastRoomDimensionsRef = useRef(roomDimensions);
    const lastDoorsRef = useRef(doors);
    const lastWindowsRef = useRef(windows);
    const lastWallColorRef = useRef(wallColor);
    const lastFloorColorRef = useRef(floorColor);

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

    // Update the loading state tracking effect
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

    useEffect(() => {
        return () => {
            if (clearModelCache) {
                clearModelCache();
            }
        };
    }, [clearModelCache]);

    const totalCost = calculateTotalCost(
        placedFurniture?.filter(item => item && item.id)?.map((item) => ({ furnitureId: item.id })) || []
    );

    return (
        <div className="flex flex-col w-100vw mx-auto bg-[#FCFCEC]">
            {/* Toast Message */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                />
            )}

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
                                    ? `Loading "${projectInfo.title}" room design`
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

            {/* Project Section */}
            <div className="bg-[#FFFFF6] rounded-lg shadow-sm p-3 my-2 mx-6">
                <div className="flex justify-between items-center px-1">
                    <div>
                        <h1 className="text-2xl font-bold mb-1 text-[#B86A45]">
                            <Eye className="w-6 h-6 inline mr-2 text-blue-600" />
                            Viewing: {projectInfo.title}
                        </h1>
                        <p className="text-[#B86A45] text-sm">
                            <span className="text-blue-600 font-medium">View-Only Mode</span>

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
                                className="bg-green-600 text-white hover:bg-green-700 flex rounded-md"
                            >
                                Load Project Room
                            </Button>
                        )}

                        {/* Back button */}
                        <Button
                            color="default"
                            variant="bordered"
                            startContent={<ArrowLeft className="w-4 h-4" />}
                            onPress={() => navigate(-1)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Back to Projects
                        </Button>

                        {/* Load 3D Models button */}
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

            <div className="flex flex-col lg:flex-row gap-6 flex-1 h-8">
                {/* View-Only Sidebar */}
                <ViewOnlySidebar
                    placedFurniture={placedFurniture}
                    wallColor={wallColor}
                    floorColor={floorColor}
                    roomArea={roomArea}
                    roomVolume={roomVolume}
                    furnitureAreaPercentage={furnitureAreaPercentage}
                    totalCost={totalCost}
                    doors={doors}
                    windows={windows}
                    roomDimensions={roomDimensions}
                    furnitureLoadingState={furnitureLoadingState}
                    projectRoomLoaded={projectRoomLoaded}
                />

                {/* 3D View */}
                <div style={{ height: "590px" }} className=" mt-2 flex-1 bg-white rounded-lg shadow-sm p-4 mr-6 min-w-0 overflow-hidden mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        3D Room View - {roomName || projectInfo.title}
                        <span className="text-sm font-normal text-blue-600 ml-2">
                            • View Only
                        </span>
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
                                <strong>Room Status:</strong>
                                <span className="text-green-600 font-medium">
                                    {" "}Doors: {doors.length}
                                </span>{" "}
                                |
                                <span className="text-blue-600 font-medium">
                                    {" "}Windows: {windows.length}
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
                                <span className="text-blue-600 font-medium">
                                    {" "}| View-Only Mode
                                </span>
                            </p>
                            <p className="text-blue-600 text-xs mt-2">
                                💡 You are viewing this room design in read-only mode. Contact your designer for modifications.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewOnlyRoomDesigner;