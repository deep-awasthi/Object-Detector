import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut } from 'lucide-react'
import styles from './ImageZoom.module.css'

interface ImageZoomProps {
  src?: string
  alt?: string
  title?: string
  className?: string
  caption?: string
  width?: string | number
  height?: string | number
}

export const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt, caption, title, className, width, height }) => {
  const [isZoomed, setIsZoomed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  // Use title or alt as caption if explicit caption is not provided
  const imageCaption = caption || title || alt

  return (
    <figure className={styles.figure}>
      <div className={styles.wrapper}>
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${styles.image} ${loaded ? styles.loaded : ''} ${className || ''}`}
          onLoad={() => setLoaded(true)}
          onClick={toggleZoom}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          width={width}
          height={height}
        />
        {loaded && (
          <button 
            className={styles.zoomButton} 
            onClick={toggleZoom}
            aria-label={isZoomed ? "Zoom out image" : "Zoom in image"}
          >
            <ZoomIn size={16} />
          </button>
        )}
      </div>

      {imageCaption && <figcaption className={styles.caption}>{imageCaption}</figcaption>}

      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.overlay}
            onClick={toggleZoom}
          >
            <motion.div 
              className={styles.lightboxContainer}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <img src={src} alt={alt} className={styles.lightboxImage} />
              {imageCaption && <div className={styles.lightboxCaption}>{imageCaption}</div>}
              <button className={styles.closeButton} onClick={toggleZoom}>
                <ZoomOut size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  )
}

export default ImageZoom
