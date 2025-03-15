import React, { useEffect, useRef } from 'react';

interface QRCodeProps {
  url: string;
  size?: number;
}

const QRCode: React.FC<QRCodeProps> = ({ url, size = 200 }) => {
  const qrCodeContainerRef = useRef<HTMLDivElement>(null);
  
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
          
          // Generate the QR code on the canvas
          await QRCodeModule.toCanvas(canvas, url, {
            width: size,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };
    
    loadQRCode();
  }, [url, size]);
  
  return (
    <div className="flex flex-col items-center">
      <div ref={qrCodeContainerRef} className="bg-white p-2 rounded-lg shadow-md"></div>
      <p className="mt-2 text-sm text-gray-600">Scan to join the table</p>
    </div>
  );
};

export default QRCode;