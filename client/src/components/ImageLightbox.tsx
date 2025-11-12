import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageAlt: string;
}

export function ImageLightbox({
  open,
  onOpenChange,
  imageUrl,
  imageAlt,
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset scale, rotation, and position when opening
  useEffect(() => {
    if (open) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "r" || e.key === "R") {
        handleRotate();
      } else if (e.key === "0") {
        setScale(1);
        setRotation(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, scale, rotation, onOpenChange]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Toggle zoom on image click (only if not dragged)
  const handleImageClick = (e: React.MouseEvent) => {
    // Prevent click event if user was dragging
    if (hasDragged) {
      e.stopPropagation();
      return;
    }

    if (scale === 1) {
      setScale(1.5);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setHasDragged(false); // Reset drag flag
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate drag distance
      const dragDistance = Math.sqrt(
        Math.pow(newX - position.x, 2) + Math.pow(newY - position.y, 2)
      );

      // If moved more than 5 pixels, consider it a drag
      if (dragDistance > 5) {
        setHasDragged(true);
      }

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset hasDragged flag after a short delay to allow click event to check it
    setTimeout(() => {
      setHasDragged(false);
    }, 10);
  };

  // Background click handler
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only close if clicking on the background, not the image or controls
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none"
        aria-describedby={undefined}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Control buttons */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>

          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleZoomIn}
            disabled={scale >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleRotate}
          >
            <RotateCw className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={handleReset}
          >
            초기화
          </Button>
        </div>

        {/* Image */}
        <div
          className="w-full h-full flex items-center justify-center overflow-hidden"
          onClick={handleBackgroundClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={imageAlt}
            className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
            }}
            onClick={handleImageClick}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="absolute top-4 left-4 z-50 text-white/60 text-xs space-y-1">
          <p>클릭: 150% 확대/축소</p>
          <p>확대 시: 드래그로 이동</p>
          <p>배경 클릭: 닫기</p>
          <p>ESC: 닫기</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
