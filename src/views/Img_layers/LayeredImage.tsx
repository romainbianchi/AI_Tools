import React, { useRef, useEffect } from 'react';

// Images correspondinng to the different layers
const layers = [
  { src: 'public/layer0.png' },
  { src: 'public/layer1.png' },
  { src: 'public/layer2.png' },
  { src: 'public/layer3.png' },
  { src: 'public/layer4.png' },
  { src: 'public/layer5.png' },
  { src: 'public/layer6.png' },
  { src: '/public/layerBase.png'},
];

type LayeredImageProps = {
  visibleLayers: number[];
};

const LayeredImage: React.FC<LayeredImageProps> = ({ visibleLayers }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        const loadImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
          });
        };

        const drawLayers = async () => {
          // Draw the base layer first
          try {
            const img = await loadImage(layers[7].src);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          } catch (error) {
            console.error(`Failed to load image at ${layers[7].src}`, error);
          }
          // Draw layers on top of the base layer
          for (let layerIndex=0; layerIndex < layers.length; layerIndex++) {
            if (visibleLayers[layerIndex] === 1) {
              console.log(layers[layerIndex])
              try {
                const img = await loadImage(layers[layerIndex].src);
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
              } catch (error) {
                console.error(`Failed to load image at ${layers[layerIndex].src}`, error);
              }
            }


            // if (layerIndex < layers.length) {
            //   try {
            //     const img = await loadImage(layers[layerIndex].src);
            //     context.drawImage(img, 0, 0);
            //   } catch (error) {
            //     console.error(`Failed to load image at ${layers[layerIndex].src}`, error);
            //   }
            // }
          }
        };

        drawLayers();
      }
    }
  }, []); // Empty dependency array to ensure this runs only once on mount

  return <canvas ref={canvasRef} width={150} height={100}></canvas>;
};

export default LayeredImage;