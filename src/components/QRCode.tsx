import React, { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

const QRCode: React.FC<QRCodeProps> = ({ url, size = 200, className = '' }) => {
  const qrCodeContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    const loadQRCode = async () => {
      if (qrCodeContainerRef.current) {
        // Using QRCode.js dynamically imported
        const QRCodeModule = await import('qrcode');
        
        // Clear previous QR code if any
        qrCodeContainerRef.current.innerHTML = '';
        
        try {
          // Create a canvas element for the QR code
          const canvas = document.createElement('canvas');
          qrCodeContainerRef.current.appendChild(canvas);
          
          // Determine colors based on theme
          const darkColor = theme === 'dark' ? '#FFFFFF' : '#000000';
          const lightColor = theme === 'dark' ? '#1E293B' : '#FFFFFF';
          
          // Generate the QR code on the canvas
          await QRCodeModule.toCanvas(canvas, url, {
            width: size,
            margin: 2,  // Increased margin for better scanning
            color: {
              dark: darkColor,
              light: lightColor
            }
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };
    
    loadQRCode();
  }, [url, size, theme]);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div ref={qrCodeContainerRef} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-600"></div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-bold">Scan to join the table</p>
    </div>
  );
};

export default QRCode;