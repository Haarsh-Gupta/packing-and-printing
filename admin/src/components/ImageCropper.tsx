import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import getCroppedImg from '@/lib/cropUtils';
import { X, Crop, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspect?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ 
  image, 
  onCropComplete, 
  onCancel, 
  aspect = 1 
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131b2e] w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-[#434655]/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 flex justify-between items-center bg-slate-50 dark:bg-[#0b1326]/50">
          <div className="flex items-center gap-2">
            <Crop size={16} className="text-blue-600 dark:text-[#adc6ff]" />
            <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-[#dae2fd]">Visual Framing Engine</h2>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="relative h-[400px] bg-slate-100 dark:bg-[#0b1326]/50">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        <div className="p-8 flex flex-col gap-8 bg-white dark:bg-[#131b2e]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Magnification Force</label>
                <div className="flex items-center gap-2 text-[10px] font-mono text-blue-600 dark:text-[#adc6ff]">{Math.round(zoom * 100)}%</div>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut size={16} className="text-slate-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 dark:bg-[#434655]/30 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                <ZoomIn size={16} className="text-slate-400" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Angular Rotation</label>
                <div className="flex items-center gap-2 text-[10px] font-mono text-blue-600 dark:text-[#adc6ff]">{rotation}°</div>
              </div>
              <div className="flex items-center gap-4">
                <RotateCw size={16} className="text-slate-400" />
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 dark:bg-[#434655]/30 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-[#434655]/10">
            <button 
              onClick={onCancel}
              className="h-10 px-6 bg-transparent text-slate-600 dark:text-[#c3c5d8] hover:text-slate-900 border border-slate-300 dark:border-[#434655]/50 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Discard Changes
            </button>
            <button 
              onClick={handleCrop}
              disabled={loading}
              className="h-10 px-10 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Finalize Frame'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
