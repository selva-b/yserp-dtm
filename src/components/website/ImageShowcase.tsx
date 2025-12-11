"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface ImageShowcaseProps {
  imageUrl: string;
  alt: string;
  title?: string;
  description?: string;
  position?: "left" | "right" | "center";
  className?: string;
}

export default function ImageShowcase({
  imageUrl,
  alt,
  title,
  description,
  position = "center",
  className = "",
}: ImageShowcaseProps) {
  const positionClasses = {
    left: "md:flex-row",
    right: "md:flex-row-reverse",
    center: "flex-col items-center",
  };

  return (
    <motion.div
      className={`flex flex-col ${positionClasses[position]} gap-8 items-center ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Image Container */}
      <div className="relative w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 z-10 pointer-events-none" />
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Text Content */}
      {(title || description) && (
        <div className="w-full md:w-1/2 space-y-4">
          {title && (
            <motion.h3
              className="text-2xl md:text-3xl font-bold text-white"
              initial={{ opacity: 0, x: position === "left" ? -20 : position === "right" ? 20 : 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {title}
            </motion.h3>
          )}
          {description && (
            <motion.p
              className="text-gray-400 text-lg leading-relaxed"
              initial={{ opacity: 0, x: position === "left" ? -20 : position === "right" ? 20 : 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {description}
            </motion.p>
          )}
        </div>
      )}
    </motion.div>
  );
}
