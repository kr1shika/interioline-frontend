import { Badge, Button, Card, CardBody, Progress, Tooltip } from "@heroui/react";
import { DollarSign, Download, Eye, EyeOff, Package, RotateCw, Ruler, Trash2 } from "lucide-react";

const PlacedItemsList = ({
    items,
    onRotate,
    onRemove,
    onClearAll,
    onToggleVisibility,
    loadingState,
}) => {
    const totalArea = items.reduce((total, item) => {
        if (item.dimensions) {
            return total + item.dimensions.width * item.dimensions.depth;
        }
        return total;
    }, 0);

    const totalValue = items.reduce((total, item) => {
        return total + (item.price || 0);
    }, 0);

    const getTypeInfo = (type) => {
        const typeMap = {
            sofa: { icon: "🛋️", color: "primary", bgColor: "bg-blue-50" },
            chair: { icon: "🪑", color: "secondary", bgColor: "bg-purple-50" },
            table: { icon: "🪆", color: "success", bgColor: "bg-green-50" },
            bed: { icon: "🛏️", color: "warning", bgColor: "bg-yellow-50" },
            storage: { icon: "🗄️", color: "danger", bgColor: "bg-red-50" },
            desk: { icon: "🖥️", color: "default", bgColor: "bg-gray-50" },
            entertainment: { icon: "📺", color: "primary", bgColor: "bg-blue-50" },
            lighting: { icon: "💡", color: "warning", bgColor: "bg-yellow-50" },
            decoration: { icon: "🌿", color: "success", bgColor: "bg-green-50" },
            default: { icon: "📦", color: "default", bgColor: "bg-gray-50" },
        };

        return typeMap[type] || typeMap.default;
    };

    const getCategoryStats = () => {
        const stats = {};
        items.forEach(item => {
            if (!stats[item.category]) {
                stats[item.category] = { count: 0, value: 0 };
            }
            stats[item.category].count++;
            stats[item.category].value += item.price || 0;
        });
        return stats;
    };

    const categoryStats = getCategoryStats();

    if (items.length === 0 && !loadingState?.isLoading) {
        return (
            <Card className="mt-6 shadow-sm">
                <CardBody className="p-6">
                    <div className="text-center">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                            No 3D Furniture Placed
                        </h3>
                        <p className="text-sm text-gray-500">
                            Select 3D furniture models from the catalog above to start designing your room
                        </p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="mt-6 shadow-sm">
            <CardBody className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            3D Furniture Collection
                        </h3>
                        <Badge variant="flat" color="primary" size="sm">
                            {items.length} {items.length === 1 ? "model" : "models"}
                        </Badge>
                        {totalValue > 0 && (
                            <Badge variant="flat" color="success" size="sm">
                                ${totalValue.toLocaleString()}
                            </Badge>
                        )}
                    </div>
                    {items.length > 0 && (
                        <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            onPress={onClearAll}
                            startContent={<Trash2 className="w-4 h-4" />}
                            className="text-xs"
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Loading State */}
                {loadingState?.isLoading && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Download className="w-4 h-4 text-blue-600 animate-bounce" />
                            <span className="text-sm font-medium text-blue-800">
                                Loading 3D Model: {loadingState.currentItem || "Processing..."}
                            </span>
                        </div>
                        <Progress
                            value={loadingState.progress || 0}
                            color="primary"
                            size="sm"
                            className="mb-1"
                        />
                        <div className="text-xs text-blue-600">
                            {loadingState.progress ? `${Math.round(loadingState.progress)}% complete` : "Initializing..."}
                            {loadingState.totalItems > 0 && (
                                <span className="ml-2">
                                    ({loadingState.completedItems}/{loadingState.totalItems} items)
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Statistics */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Total Models:</span>
                            <span className="font-medium ml-2">{items.length}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Floor Coverage:</span>
                            <span className="font-medium ml-2">
                                {totalArea.toFixed(2)} m²
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Collection Value:</span>
                            <span className="font-medium ml-2 text-green-600">
                                ${totalValue.toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Categories:</span>
                            <span className="font-medium ml-2">
                                {Object.keys(categoryStats).length}
                            </span>
                        </div>
                    </div>

                    {/* Category breakdown */}
                    {Object.keys(categoryStats).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(categoryStats).map(([category, stats]) => (
                                    <Badge
                                        key={category}
                                        variant="flat"
                                        size="sm"
                                        className="text-xs capitalize"
                                    >
                                        {category}: {stats.count} (${stats.value.toLocaleString()})
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Furniture List */}
                {items.length > 0 && (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                        {items.map((item) => {
                            const typeInfo = getTypeInfo(item.type || "default");

                            return (
                                <div
                                    key={item.id}
                                    className={`${typeInfo.bgColor} border border-gray-200 rounded-lg p-3 transition-all hover:shadow-sm ${item.visible === false ? "opacity-50" : ""
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            {/* Model preview */}
                                            <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-white border border-gray-200">
                                                {item.imagePath ? (
                                                    <img
                                                        src={item.imagePath}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className="w-full h-full bg-gray-100 items-center justify-center" style={{ display: item.imagePath ? 'none' : 'flex' }}>
                                                    <span className="text-lg">{typeInfo.icon}</span>
                                                </div>
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-sm text-gray-800 truncate">
                                                        {item.name}
                                                    </h4>
                                                    <Badge
                                                        size="sm"
                                                        variant="flat"
                                                        color={typeInfo.color}
                                                        className="text-xs capitalize"
                                                    >
                                                        {item.type}
                                                    </Badge>
                                                    <Badge
                                                        size="sm"
                                                        variant="flat"
                                                        color="success"
                                                        className="text-xs"
                                                    >
                                                        3D
                                                    </Badge>
                                                </div>

                                                {/* Dimensions and specs */}
                                                {item.dimensions && (
                                                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                                                        <div className="flex items-center gap-1">
                                                            <Ruler className="w-3 h-3" />
                                                            <span>
                                                                {item.dimensions.width}×{item.dimensions.depth}×
                                                                {item.dimensions.height}m
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-400">•</span>
                                                        <span>
                                                            {(item.dimensions.width * item.dimensions.depth).toFixed(2)} m²
                                                        </span>
                                                        {item.appliedScale && item.appliedScale !== 1 && (
                                                            <>
                                                                <span className="text-gray-400">•</span>
                                                                <span className="text-blue-600">
                                                                    Scale: {item.appliedScale.toFixed(2)}x
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Material and price */}
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        {item.material && (
                                                            <span className="text-gray-500">
                                                                {item.material}
                                                            </span>
                                                        )}
                                                        {item.style && (
                                                            <>
                                                                <span className="text-gray-400">•</span>
                                                                <span className="text-gray-500">
                                                                    {item.style}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {item.price && (
                                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                                            <DollarSign className="w-3 h-3" />
                                                            {item.price}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Model path */}
                                                {item.modelPath && (
                                                    <div className="text-xs text-blue-600 mt-1 truncate">
                                                        Model: {item.modelPath.split('/').pop()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 ml-2">
                                            {onToggleVisibility && (
                                                <Tooltip
                                                    content={item.visible === false ? "Show Model" : "Hide Model"}
                                                >
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => onToggleVisibility(item.id)}
                                                        className="text-gray-500 hover:text-gray-700 min-w-8 h-8"
                                                    >
                                                        {item.visible === false ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </Tooltip>
                                            )}

                                            <Tooltip content="Rotate 45°">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => onRotate(item.id)}
                                                    className="text-blue-500 hover:text-blue-700 min-w-8 h-8"
                                                >
                                                    <RotateCw className="w-4 h-4" />
                                                </Button>
                                            </Tooltip>

                                            <Tooltip content="Remove from room">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => onRemove(item.id)}
                                                    className="text-red-500 hover:text-red-700 min-w-8 h-8"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Drag 3D models in the scene to reposition them</span>
                        <div className="flex items-center gap-2">
                            <span>
                                {items.filter((item) => item.visible !== false).length} visible
                            </span>
                            {loadingState?.cacheSize > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{loadingState.cacheSize} cached models</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default PlacedItemsList;