import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Code,
  List,
  Heading2,
  Image as ImageIcon,
  Table,
  Eye,
  Edit3,
  Loader2,
  UploadCloud,
  Check,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { api } from '../api';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  helpText?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  label = 'Soru Metni (Markdown Destekli)',
  placeholder = 'Soru metnini yazınız. Panodan kopyaladığınız bir resmi doğrudan Ctrl+V ile yapıştırabilirsiniz...',
  rows = 5,
  required = false,
  helpText,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Insert markdown syntax around or at cursor
  const insertSyntax = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const newText =
      value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Process image file (from clipboard paste, file picker or drag-drop)
  const processAndInsertImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Lütfen geçerli bir resim dosyası seçiniz (PNG, JPG, WebP, SVG).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : value.length;
    const end = textarea ? textarea.selectionEnd : value.length;

    const placeholderText = `\n![Görsel yükleniyor: ${file.name}...]()\n`;
    const textWithPlaceholder =
      value.substring(0, start) + placeholderText + value.substring(end);

    onChange(textWithPlaceholder);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      try {
        // Upload to server
        const res = await api.uploadImage(base64Data, file.name);
        const imageUrl = res.url;
        const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Soru Görseli';
        const finalMarkdown = `\n![${cleanName}](${imageUrl})\n`;

        onChange(textWithPlaceholder.replace(placeholderText, finalMarkdown));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch {
        // Fallback: Embed base64 directly
        const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Soru Görseli';
        const fallbackMarkdown = `\n![${cleanName}](${base64Data})\n`;
        onChange(textWithPlaceholder.replace(placeholderText, fallbackMarkdown));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Görsel okunurken bir hata oluştu.');
      onChange(value);
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Clipboard Paste Handler (Ctrl+V / Cmd+V with image)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processAndInsertImage(file);
        }
        break;
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await processAndInsertImage(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processAndInsertImage(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-700 text-xs">{label}</label>

        {/* Tab Controls: Write vs Preview */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'write'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Yaz (Markdown)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Canlı Önizleme</span>
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900 transition-all">
        {/* Markdown Toolbar */}
        {activeTab === 'write' && (
          <div className="flex flex-wrap items-center justify-between gap-1 px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => insertSyntax('**', '**', 'kalın metin')}
                className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="Kalın Metin (**kalın**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('*', '*', 'italik metin')}
                className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="İtalik Metin (*italik*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('### ', '', 'Başlık')}
                className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="Başlık (### Başlık)"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-4 bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => insertSyntax('`', '`', 'kod_veya_formül')}
                className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="Satır İçi Kod / Formül (`kod`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('\n```\n', '\n```\n', '// kod bloğu')}
                className="px-1.5 py-1 font-mono text-[11px] rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="Çok Satırlı Kod Bloğu"
              >
                {'{ }'}
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('- ', '', 'Madde')}
                className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="Madde İşaretli Liste"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertSyntax(
                    '\n| Başlık 1 | Başlık 2 |\n|----------|----------|\n| Değer 1  | Değer 2  |\n',
                    ''
                  )
                }
                className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tablo Ekle"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-4 bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Bilgisayardan Görsel Seç veya Doğrudan Yapıştır (Ctrl+V)"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
                <span>Görsel Yükle</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Upload Status Indicator */}
            <div className="flex items-center gap-1.5 text-[11px]">
              {isUploading ? (
                <span className="text-blue-700 flex items-center gap-1 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Görsel Yükleniyor...
                </span>
              ) : uploadSuccess ? (
                <span className="text-emerald-700 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" />
                  Görsel Eklendi
                </span>
              ) : (
                <span className="text-slate-400 hidden sm:inline">
                  Pano resmi için <kbd className="font-mono bg-slate-200 px-1 rounded text-[10px]">Ctrl+V</kbd>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Editor Body */}
        {activeTab === 'write' ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={rows}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              required={required}
              placeholder={placeholder}
              className={`w-full p-3 text-xs leading-relaxed font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none resize-y min-h-[120px] ${
                isDragging ? 'bg-blue-50/50 ring-2 ring-blue-500' : 'bg-white'
              }`}
            />
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-2xs flex items-center justify-center pointer-events-none text-blue-700 text-xs font-semibold gap-2 border-2 border-dashed border-blue-400 rounded-b-lg">
                <UploadCloud className="w-5 h-5 animate-bounce" />
                <span>Görseli bırakın, soruya eklensin</span>
              </div>
            )}
          </div>
        ) : (
          /* Live Markdown Preview */
          <div className="p-4 min-h-[140px] max-h-[300px] overflow-y-auto bg-slate-50/50">
            {value.trim() ? (
              <MarkdownRenderer content={value} className="text-xs" />
            ) : (
              <p className="text-xs text-slate-400 italic">
                Önizlenecek soru metni henüz girilmedi.
              </p>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <div className="text-[11px] text-rose-600 font-medium">
          {uploadError}
        </div>
      )}

      {/* Helpful Hint Footnote */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
        <span>{helpText || '💡 Kopyaladığınız ekran görüntüsünü veya resmi alana tıklayıp Ctrl+V (veya Cmd+V) ile yapıştırabilirsiniz.'}</span>
        <span className="font-mono">{value.length} karakter</span>
      </div>
    </div>
  );
};
