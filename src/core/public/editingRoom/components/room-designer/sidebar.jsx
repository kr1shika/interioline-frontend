import {
    Button,
    Tab,
    Tabs
} from "@heroui/react";
import { ChevronDown, ChevronUp, Home, Package, Ruler, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import FurnitureCatalog from './FurnitureCatalog';
import PlacedItemsList from './PlacedItemsList';
import './sidebar.css';

const Sidebar = ({
    // Room Settings Props
    selectedRoomType,
    setSelectedRoomType,
    roomDimensions,
    setRoomDimensions,
    wallColor,
    setWallColor,
    floorColor,
    setFloorColor,
    doors,
    windows,
    handleAddDoor,
    handleUpdateDoor,
    handleRemoveDoor,
    handleAddWindow,
    handleUpdateWindow,
    handleRemoveWindow,

    // Measurements Props
    roomArea,
    roomVolume,
    furnitureAreaPercentage,
    totalCost,

    // Furniture Props
    selectedFurnitureItem,
    setSelectedFurnitureItem,
    addFurnitureToRoom,
    placedFurniture,
    rotateFurnitureItem,
    removeFurnitureItem,
    clearAllFurniture,
    furnitureLoadingState,

    // Loading Props
    isLoading,
    loadingProgress
}) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [measurementsOpen, setMeasurementsOpen] = useState(false);

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

    return (
        <div className="sidebar">
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
                            <Home className="icon-sm" />
                            <span>Basic</span>
                        </div>
                    }
                >
                    <div className="tab-content-spacing">
                        <div>
                            <label className="form-label">
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
                                className="room-select"
                            >
                                {ROOM_PRESETS.map((room, index) => (
                                    <option key={index} value={index}>
                                        {room.name} ({room.width}m × {room.length}m)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <h3 className="section-title">
                                Custom Dimensions
                            </h3>
                            <div className="dimensions-grid">
                                <div>
                                    <label className="input-label">
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
                                        className="dimension-input"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
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
                                        className="dimension-input"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
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
                                        className="dimension-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="section-title">
                                Colors
                            </h3>
                            <div className="color-grid">
                                <div>
                                    <label className="input-label">
                                        Wall Color
                                    </label>
                                    <input
                                        type="color"
                                        value={wallColor}
                                        onChange={(e) => setWallColor(e.target.value)}
                                        className="color-input"
                                    />
                                </div>
                                <div>
                                    <label className="input-label secondary">
                                        Floor Color
                                    </label>
                                    <input
                                        type="color"
                                        value={floorColor}
                                        onChange={(e) => setFloorColor(e.target.value)}
                                        className="color-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Room Stats */}
                        <div className="stats-container">
                            <button
                                className="stats-toggle"
                                onClick={() => setMeasurementsOpen(!measurementsOpen)}
                            >
                                <h3 className="stats-title">
                                    <Ruler className="icon-sm stats-icon" />
                                    Room Stats
                                </h3>
                                {measurementsOpen ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
                            </button>

                            {measurementsOpen && (
                                <div className="stats-content">
                                    <div className="stat-item">
                                        <span className="stat-label">Floor Area:</span>
                                        <span className="stat-value">{(roomArea || 0).toFixed(2)} m²</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Volume:</span>
                                        <span className="stat-value">{(roomVolume || 0).toFixed(2)} m³</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">3D Models:</span>
                                        <span className="stat-value highlight">{placedFurniture?.length || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Furniture Coverage:</span>
                                        <span className="stat-value">
                                            {(furnitureAreaPercentage || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Doors:</span>
                                        <span className="stat-value">{doors?.length || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Windows:</span>
                                        <span className="stat-value">{windows?.length || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Total Cost:</span>
                                        <span className="stat-value highlight">${(totalCost || 0).toLocaleString()}</span>
                                    </div>
                                    {furnitureLoadingState?.cacheSize > 0 && (
                                        <div className="stat-item">
                                            <span className="stat-label">Cached Models:</span>
                                            <span className="stat-value blue">{furnitureLoadingState.cacheSize}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </Tab>

                <Tab
                    key="openings"
                    title={
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="icon-sm" />
                            <span>Doors & Windows</span>
                        </div>
                    }
                >
                    <div className="tab-content-spacing">
                        {/* Doors Section */}
                        <div>
                            <div className="section-header">
                                <h3 className="section-title small">Doors</h3>
                                <Button
                                    size="sm"
                                    color="primary"
                                    onPress={handleAddDoor}
                                    startContent={<div className="icon-sm">+</div>}
                                >
                                    Add Door
                                </Button>
                            </div>

                            {doors && doors.length > 0 ? (
                                <div className="items-list">
                                    {doors.map((door) => (
                                        <div key={door.id} className="item-card">
                                            <div className="item-header">
                                                <h4 className="item-title">
                                                    Door {door.id.replace("door", "")}
                                                </h4>
                                                <button
                                                    onClick={() => handleRemoveDoor(door.id)}
                                                    className="remove-btn"
                                                >
                                                    <div className="icon-sm">×</div>
                                                </button>
                                            </div>

                                            <div className="controls-grid">
                                                <div>
                                                    <label className="control-label">
                                                        Wall
                                                    </label>
                                                    <select
                                                        value={door.wall}
                                                        onChange={(e) =>
                                                            handleUpdateDoor(door.id, {
                                                                wall: e.target.value,
                                                            })
                                                        }
                                                        className="control-select"
                                                    >
                                                        <option value="north">North</option>
                                                        <option value="east">East</option>
                                                        <option value="south">South</option>
                                                        <option value="west">West</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="control-label">
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
                                                        className="control-input"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="control-label">
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
                                                        className="control-input"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="control-label">
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
                                                        className="control-input"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-message">
                                    No doors added yet
                                </p>
                            )}
                        </div>

                        {/* Windows Section */}
                        <div>
                            <div className="section-header">
                                <h3 className="section-title small">
                                    Windows
                                </h3>
                                <Button
                                    size="sm"
                                    color="primary"
                                    onPress={handleAddWindow}
                                    startContent={<div className="icon-sm">+</div>}
                                >
                                    Add Window
                                </Button>
                            </div>

                            {windows && windows.length > 0 ? (
                                <div className="items-list">
                                    {windows.map((window) => (
                                        <div key={window.id} className="item-card">
                                            <div className="item-header">
                                                <h4 className="item-title">
                                                    Window {window.id.replace("window", "")}
                                                </h4>
                                                <button
                                                    onClick={() => handleRemoveWindow(window.id)}
                                                    className="remove-btn"
                                                >
                                                    <div className="icon-sm">×</div>
                                                </button>
                                            </div>

                                            <div className="controls-grid">
                                                <div>
                                                    <label className="control-label">
                                                        Wall
                                                    </label>
                                                    <select
                                                        value={window.wall}
                                                        onChange={(e) =>
                                                            handleUpdateWindow(window.id, {
                                                                wall: e.target.value,
                                                            })
                                                        }
                                                        className="control-select"
                                                    >
                                                        <option value="north">North</option>
                                                        <option value="east">East</option>
                                                        <option value="south">South</option>
                                                        <option value="west">West</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="control-label">
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
                                                        className="control-input"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="control-label">
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
                                                        className="control-input"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="control-label">
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
                                                        className="control-input"
                                                    />
                                                </div>

                                                <div className="full-width">
                                                    <label className="control-label">
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
                                                        className="control-input"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-message">
                                    No windows added yet
                                </p>
                            )}
                        </div>
                    </div>
                </Tab>

                <Tab
                    key="furniture"
                    title={
                        <div className="flex items-center gap-2">
                            <Package className="icon-sm" />
                            <span>Furniture</span>
                        </div>
                    }
                >
                    <div className="furniture-tab">
                        <FurnitureCatalog
                            selectedFurnitureItem={selectedFurnitureItem}
                            setSelectedFurnitureItem={setSelectedFurnitureItem}
                            addFurnitureToRoom={addFurnitureToRoom}
                            isLoading={furnitureLoadingState?.isLoading || isLoading}
                            loadingProgress={furnitureLoadingState?.progress || loadingProgress}
                        />
                    </div>
                </Tab>
            </Tabs>

            {/* Placed Furniture List */}
            {placedFurniture && placedFurniture.length > 0 && (
                <PlacedItemsList
                    items={placedFurniture}
                    onRotate={rotateFurnitureItem}
                    onRemove={removeFurnitureItem}
                    onClearAll={clearAllFurniture}
                    loadingState={furnitureLoadingState}
                />
            )}
        </div>
    );
};

export default Sidebar;