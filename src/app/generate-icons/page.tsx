'use client';

export default function GenerateIcons() {
  const downloadIcon = (size: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    // Lime circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#c4f000';
    ctx.fill();

    // P letter
    ctx.fillStyle = '#0a0a0a';
    ctx.font = `bold ${size * 0.4}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', size / 2, size / 2 + size * 0.02);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `icon-${size}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-white text-xl font-bold">Generate PWA Icons</h1>
        <p className="text-neutral-500 text-sm">Download these and put in /public/icons/</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => downloadIcon(192)} className="bg-[#c4f000] text-black font-bold px-6 py-3 rounded-xl">Download 192px</button>
          <button onClick={() => downloadIcon(512)} className="bg-[#c4f000] text-black font-bold px-6 py-3 rounded-xl">Download 512px</button>
        </div>
      </div>
    </div>
  );
}
