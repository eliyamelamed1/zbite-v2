import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string;
}

export default function ImageUpload({ value, onChange, existingUrl }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    onChange(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview || value) {
    return (
      <div className={styles.preview}>
        <img className={styles.previewImage} src={preview!} alt="Preview" />
        <button type="button" className={styles.removeBtn} onClick={handleRemove}><X size={14} /></button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.dropzone}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      >
        <div className={styles.icon}><Camera size={32} /></div>
        <div className={styles.text}>Click or drag to upload image</div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className={styles.hidden} onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}
