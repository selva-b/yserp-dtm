"use client";

import React from 'react';
import Image from 'next/image';

interface SecurityCameraProps {
  imageSrc?: string;
  imageAlt?: string;
}

const SecurityCamera: React.FC<SecurityCameraProps> = ({
  imageSrc = "/website/illustrations/image1.png",
  imageAlt = "Technical Drawings & Engineering"
}) => {
  return (
    <>
      <style>{`
        @keyframes cameraScan {
          0%, 100% {
            transform: translateX(-50%) translateY(-50%) rotateY(-8deg) rotateX(5deg);
          }
          50% {
            transform: translateX(-50%) translateY(-50%) rotateY(8deg) rotateX(5deg);
          }
        }

        @keyframes lensGlow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(68, 239, 74, 0.6)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 30px rgba(68, 239, 74, 0.6)) drop-shadow(0 0 60px rgba(239, 68, 68, 0.5));
          }
        }

        @keyframes recordingBlink {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(0.9);
          }
        }

        @keyframes scanLine {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          5% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          95% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        .camera-container {
          animation: cameraScan 8s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .lens-glow {
          animation: lensGlow 3s ease-in-out infinite;
        }

        .recording-indicator {
          animation: recordingBlink 2s ease-in-out infinite;
        }

        .scan-line {
          animation: scanLine 4s linear infinite;
        }
      `}</style>

      <div className="flex items-center justify-center h-screen" style={{ perspective: '1500px' }}>
        {/* Main Container with 3D perspective */}
        <div className="relative w-[500px] h-[450px]">

          {/* Scanning Effect Background */}
          <div className="absolute inset-0 rounded-full overflow-hidden opacity-15">
            <div className="scan-line absolute left-0 right-0 h-3 bg-gradient-to-r from-transparent via-red-500 to-transparent blur-lg" />
          </div>

          {/* Security Camera Image with 3D effects */}
          <div className="camera-container absolute top-1/2 left-1/2 w-full h-full">
            <div className="lens-glow relative w-full h-full">
              {/* Security Camera Image */}
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={500}
                height={450}
                quality={75}
                priority={false}
                loading="lazy"
                className="w-full h-full object-contain drop-shadow-2xl"
                style={{
                  filter: 'brightness(1.2) contrast(1.3) saturate(0.9)',
                }}
              />
            </div>
          </div>

          {/* Professional Overlay Elements */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
            <div className="recording-indicator flex items-center gap-2 px-4 py-2 bg-red-600/90 backdrop-blur-md rounded-lg border border-red-400 shadow-xl">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-white text-sm font-bold tracking-wider">REC</span>
            </div>

            <div className="px-4 py-2 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl">
              <span className="text-gray-300 text-sm font-mono">CAM-01</span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-6 left-6 px-4 py-2 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl">
            <span className="text-blue-400 text-sm font-mono">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* Status Text */}
          <div className="absolute bottom-6 right-6 px-4 py-2 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl">
            <span className="text-green-400 text-xs font-mono uppercase tracking-wider">● MONITORING</span>
          </div>

          {/* Corner Brackets - Surveillance Aesthetic */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-red-500/50" />
          <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-red-500/50" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-red-500/50" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-red-500/50" />

          {/* Crosshair Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="relative w-48 h-48">
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500" />
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500" />
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-red-500 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-red-500 rounded-full" />
            </div>
          </div>

          {/* Grid Overlay */}
          <div className="absolute inset-12 pointer-events-none opacity-10">
            {/* Vertical lines */}
            {[...Array(5)].map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 w-px bg-blue-400"
                style={{ left: `${(i + 1) * 20}%` }}
              />
            ))}
            {/* Horizontal lines */}
            {[...Array(5)].map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0 h-px bg-blue-400"
                style={{ top: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>

          {/* System Info Overlay */}
          <div className="absolute top-20 left-6 space-y-1">
            <div className="text-xs font-mono text-green-400 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded border border-green-500/30">
              RES: 4K UHD
            </div>
            <div className="text-xs font-mono text-green-400 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded border border-green-500/30">
              FPS: 30
            </div>
            <div className="text-xs font-mono text-green-400 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded border border-green-500/30">
              IR: ON
            </div>
          </div>

          {/* Detection Zone */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 opacity-5">
            <div
              className="w-full h-full bg-gradient-to-t from-red-500 to-transparent"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default SecurityCamera;
