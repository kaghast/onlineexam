import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { X, ZoomIn } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowZoom?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  allowZoom = true,
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Configure marked for academic clean rendering
  const html = useMemo(() => {
    if (!content) return '';
    try {
      const parsed = marked.parse(content, {
        async: false,
        breaks: true,
        gfm: true,
      });
      return typeof parsed === 'string' ? parsed : '';
    } catch (err) {
      console.error('Markdown parse error:', err);
      return content;
    }
  }, [content]);

  // Click on rendered content to inspect images in high-res modal
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowZoom) return;
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'img') {
      const src = (target as HTMLImageElement).src;
      if (src) {
        setZoomedImage(src);
      }
    }
  };

  return (
    <>
      <div
        onClick={handleContainerClick}
        className={`markdown-body prose prose-slate max-w-none text-slate-900 leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Lightbox Modal for high-res images */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-2xl p-2 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-medium flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-slate-700" />
                Soru Görseli (Tam Boyut)
              </span>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center max-h-[80vh]">
              <img
                src={zoomedImage}
                alt="Büyütülmüş Soru Görseli"
                className="max-w-full max-h-[75vh] object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
