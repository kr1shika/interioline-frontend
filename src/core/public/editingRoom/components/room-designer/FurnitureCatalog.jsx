import { Badge, Input, Spinner } from "@heroui/react";
import {
    Archive,
    Bed,
    DollarSign,
    Download,
    Flower2,
    LampDesk,
    Lightbulb,
    Package,
    Sofa,
    Table
} from "lucide-react";
import { useMemo, useState } from "react";
import { furnitureCatalog, getAllCategories, getCategoryStats, getStyleStats, searchFurniture } from "./furniture-Catalog";

const categoryIcons = {
    seating: <Sofa className="w-4 h-4" />,
    tables: <Table className="w-4 h-4" />,
    bedroom: <Bed className="w-4 h-4" />,
    storage: <Archive className="w-4 h-4" />,
    lighting: <Lightbulb className="w-4 h-4" />,
    decoration: <Flower2 className="w-4 h-4" />,
    office: <LampDesk className="w-4 h-4" />,
};

const categoryColors = {
    seating: "primary",
    tables: "success",
    bedroom: "warning",
    storage: "secondary",
    lighting: "warning",
    decoration: "success",
    office: "danger"
};

const FurnitureCatalog = ({
    selectedFurnitureItem,
    setSelectedFurnitureItem,
    addFurnitureToRoom,
    isLoading,
    loadingProgress,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeStyle, setActiveStyle] = useState("all");
    const [priceRange, setPriceRange] = useState([0, 1500]);
    const [addingItemId, setAddingItemId] = useState(null);
    const [brokenImages, setBrokenImages] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Filter furniture items with multiple criteria
    const filteredFurniture = useMemo(() => {
        let items = furnitureCatalog;

        // Search filter
        if (searchQuery) {
            items = searchFurniture(searchQuery);
        }

        // Category filter
        if (activeCategory !== "all") {
            items = items.filter(item => item.category === activeCategory);
        }

        // Style filter
        if (activeStyle !== "all") {
            items = items.filter(item => item.style === activeStyle);
        }

        // Price range filter
        items = items.filter(item => {
            const price = item.price || 0;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        return items;
    }, [searchQuery, activeCategory, activeStyle, priceRange]);

    const categories = getAllCategories();
    const categoryStats = getCategoryStats();
    const styleStats = getStyleStats();

    const handleImageError = (itemId) => {
        setBrokenImages(prev => new Set([...prev, itemId]));
    };

    const renderFurnitureImage = (item) => {
        // If image is broken, show fallback
        if (brokenImages.has(item.id)) {
            return (
                <div className="relative w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                    <div className="text-center">
                        <Package className="w-8 h-8 mx-auto mb-1 text-gray-500" />
                        <div className="text-xs text-gray-600 font-medium">{item.type}</div>
                    </div>
                    {/* 3D Model indicator */}
                    <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Download className="w-2.5 h-2.5" />
                        3D
                    </div>
                </div>
            );
        }

        return (
            <div className="relative w-24 h-auto bg-white rounded-md overflow-hidden group ">
                <img
                    src={item.imagePath}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={() => handleImageError(item.id)}
                    loading="lazy"
                />

            </div>

        );
    };

    const handleAddFurniture = async (item) => {
        setAddingItemId(item.id);
        try {
            await addFurnitureToRoom(item);
            setSelectedFurnitureItem("");
        } catch (error) {
            console.error("Error adding furniture:", error);
            alert("Failed to load 3D model. Please try again.");
        } finally {
            setAddingItemId(null);
        }
    };

    const selectedItem = furnitureCatalog.find(
        (item) => item.id === selectedFurnitureItem
    );

    const totalCatalogValue = furnitureCatalog.reduce((sum, item) => sum + (item.price || 0), 0);
    const filteredValue = filteredFurniture.reduce((sum, item) => sum + (item.price || 0), 0);

    const resetFilters = () => {
        setSearchQuery("");
        setActiveCategory("all");
        setActiveStyle("all");
        setPriceRange([0, 1500]);
    };

    return (
        <div className="m-0 border-gray-200 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-600" />
                    <h2 className="text-8 font-semibold text-[#B86A45]">
                        3D Furniture Catalog
                    </h2>
                </div>

            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Input
                    placeholder="Search 3D furniture models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-0"
                    size="sm"
                />
            </div>
            {/* Advanced Filters */}
            {showFilters && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Advanced Filters</h3>
                        <button
                            onClick={resetFilters}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Reset All
                        </button>
                    </div>

                    {/* Style Filter */}
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Style</label>
                        <div className="flex flex-wrap gap-1">
                            <button
                                onClick={() => setActiveStyle("all")}
                                className={`px-2 py-1 text-xs rounded transition-colors ${activeStyle === "all"
                                    ? "bg-purple-500 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border"
                                    }`}
                            >
                                All Styles
                            </button>
                            {Object.entries(styleStats).map(([style, stats]) => (
                                <button
                                    key={style}
                                    onClick={() => setActiveStyle(style)}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${activeStyle === style
                                        ? "bg-purple-500 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border"
                                        }`}
                                    title={`${stats.count} items, avg ${stats.avgPrice}`}
                                >
                                    {style} ({stats.count})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Category filters */}
            <div className="mb-4 text-[#B86A45]">
                <p className="text-xs font-medium mb-2">Categories</p>
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => setActiveCategory("all")}
                        className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${activeCategory === "all"
                            ? "bg-blue-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        All ({furnitureCatalog.length})
                    </button>
                    {categories.map((category) => {
                        const stats = categoryStats[category];
                        return (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-2 py-1.5 text-xs rounded-lg capitalize transition-colors flex items-center gap-1.5 ${activeCategory === category
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                title={`${stats.count} items`}
                            >
                                {categoryIcons[category]}
                                {category} ({stats.count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Results summary */}
            {(searchQuery || activeCategory !== "all" || activeStyle !== "all" || priceRange[0] > 0 || priceRange[1] < 1500) && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-800">
                            Showing {filteredFurniture.length} of {furnitureCatalog.length} models
                        </span>
                    </div>
                </div>
            )}



            {/* Debug info for broken images */}
            {brokenImages.size > 0 && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    {brokenImages.size} image(s) failed to load. Showing fallback previews.
                </div>
            )}

            {/* Furniture grid */}
            <div className="grid grid-cols-2 gap-3 max-h-96 w-70 overflow-y-auto">
                {filteredFurniture.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-white border rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${selectedFurnitureItem === item.id
                            ? "ring-2 ring-blue-500 border-blue-500 shadow-lg"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        onClick={() => setSelectedFurnitureItem(item.id)}
                    >
                        {/* Item image */}
                        {renderFurnitureImage(item)}

                        {/* Item info */}
                        <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                                {item.name}
                            </h4>

                            <div className="flex items-center justify-between mb-2">
                                <Badge
                                    size="sm"
                                    variant="flat"
                                    className="text-xs capitalize"
                                    color={categoryColors[item.category] || "default"}
                                >
                                    {item.type}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                    {item.dimensions.width}×{item.dimensions.depth}m
                                </span>
                            </div>

                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">{item.material}</span>
                            </div>


                        </div>
                    </div>
                ))}
            </div>

            {filteredFurniture.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No 3D Models Found</h3>
                    <p className="text-sm mb-4">
                        No furniture models match your current search criteria.
                    </p>
                    <button
                        onClick={() => {
                            resetFilters();
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* Selected item details */}
            {selectedItem && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-sm bg-white">
                            {!brokenImages.has(selectedItem.id) && selectedItem.imagePath ? (
                                <img
                                    src={selectedItem.imagePath}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-cover"
                                    onError={() => handleImageError(selectedItem.id)}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-500" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg text-blue-900">
                                    {selectedItem.name}
                                </h3>
                                {selectedItem.price && (
                                    <div className="flex items-center gap-1 text-xl font-bold text-green-600">
                                        <DollarSign className="w-5 h-5" />
                                        {selectedItem.price}
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                                {selectedItem.description}
                            </p>

                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                <div className="bg-white p-2 rounded">
                                    <span className="font-medium text-gray-700">Dimensions:</span>
                                    <div className="text-blue-700">
                                        {selectedItem.dimensions.width} × {selectedItem.dimensions.depth} × {selectedItem.dimensions.height}m
                                    </div>
                                </div>
                                <div className="bg-white p-2 rounded">
                                    <span className="font-medium text-gray-700">Material:</span>
                                    <div className="text-blue-700">{selectedItem.material}</div>
                                </div>
                                <div className="bg-white p-2 rounded">
                                    <span className="font-medium text-gray-700">Style:</span>
                                    <div className="text-blue-700">{selectedItem.style}</div>
                                </div>
                                <div className="bg-white p-2 rounded">
                                    <span className="font-medium text-gray-700">Category:</span>
                                    <div className="text-blue-700 capitalize">{selectedItem.category}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 p-3 bg-green-100 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Download className="w-4 h-4 text-green-700" />
                            <span className="font-medium text-green-800">Premium 3D Model</span>
                            {/* <Badge variant="flat" color="success" size="sm">GLB Format</Badge> */}
                        </div>
                        <p className="text-sm text-green-700 mb-1">
                            This furniture will load as a detailed 3D model with realistic textures and lighting.
                        </p>
                        <p className="text-xs text-green-600">
                            Model: {selectedItem.modelPath.split('/').pop()}
                        </p>
                    </div>

                    <button
                        className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleAddFurniture(selectedItem)}
                        disabled={isLoading || addingItemId === selectedItem.id}
                    >
                        {addingItemId === selectedItem.id ? (
                            <>
                                <Spinner size="sm" color="white" />
                                Loading 3D Model...
                            </>
                        ) : isLoading ? (
                            <>
                                <Spinner size="sm" color="white" />
                                Adding... {Math.round(loadingProgress)}%
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Add 3D Model to Room
                                {selectedItem.price && ` `}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FurnitureCatalog;