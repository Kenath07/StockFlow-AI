import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeVisual({
  value,
  format = 'auto',
  width = 2,
  height = 55,
  displayValue = true,
  fontSize = 14,
  font = 'Inter, monospace',
  className = '',
}) {
  const svgRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!value || !svgRef.current) {
      setError(null);
      return;
    }

    try {
      setError(null);

      // Auto-detect or sanitize format
      let chosenFormat = 'CODE128';
      const cleanValue = value.toString().trim();

      if (/^\d{13}$/.test(cleanValue)) {
        chosenFormat = 'EAN13';
      } else if (/^\d{12}$/.test(cleanValue)) {
        chosenFormat = 'UPC';
      } else if (/^\d{8}$/.test(cleanValue)) {
        chosenFormat = 'EAN8';
      }

      JsBarcode(svgRef.current, cleanValue, {
        format: format !== 'auto' ? format : chosenFormat,
        width: width,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        font: font,
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 4,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 10,
      });
    } catch (err) {
      // Fallback to Code128 if EAN checksum fails
      try {
        JsBarcode(svgRef.current, value.toString().trim(), {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          font: font,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 4,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 10,
        });
        setError(null);
      } catch (fallbackErr) {
        setError('Invalid Barcode Format');
      }
    }
  }, [value, format, width, height, displayValue, fontSize, font]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded-xl border border-stone-200 shadow-xs ${className}`}>
      {error ? (
        <div className="py-4 px-6 text-center">
          <p className="text-xs font-semibold text-rose-600">{error}</p>
          <p className="text-xs text-stone-400 font-mono mt-1">{value}</p>
        </div>
      ) : (
        <svg ref={svgRef} className="max-w-full h-auto" />
      )}
    </div>
  );
}
