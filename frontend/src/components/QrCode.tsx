import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** QR code en SVG (généré dans le navigateur, rien n'est envoyé à un service tiers). */
export const QrCode: React.FC<{ value: string; label: string; size?: number }> = ({ value, label, size = 168 }) => {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      className="shrink-0 rounded-md bg-white p-1"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
