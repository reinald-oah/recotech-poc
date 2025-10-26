import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ImportButtonProps {
  onImportComplete: () => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onImportComplete }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const parseTextContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());

    const title = lines[0]?.trim() || 'Document importé';
    const description = lines.slice(1).join('\n').trim() || 'Contenu importé du document';

    return { title, description };
  };

  const parsePDF = async (file: File): Promise<{ title: string; description: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          let text = '';
          for (let i = 0; i < uint8Array.length; i++) {
            if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
              text += String.fromCharCode(uint8Array[i]);
            } else if (uint8Array[i] === 10 || uint8Array[i] === 13) {
              text += '\n';
            }
          }

          text = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();

          if (text.length < 10) {
            reject(new Error('Impossible d\'extraire le texte du PDF. Le PDF pourrait être protégé ou contenir uniquement des images.'));
            return;
          }

          const parsed = parseTextContent(text);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Erreur lors de l\'analyse du PDF'));
        }
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parsePowerPoint = async (file: File): Promise<{ title: string; description: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          let text = '';
          for (let i = 0; i < uint8Array.length; i++) {
            if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
              text += String.fromCharCode(uint8Array[i]);
            } else if (uint8Array[i] === 10 || uint8Array[i] === 13) {
              text += '\n';
            }
          }

          text = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();

          if (text.length < 10) {
            reject(new Error('Impossible d\'extraire le texte du PowerPoint'));
            return;
          }

          const parsed = parseTextContent(text);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Erreur lors de l\'analyse du PowerPoint'));
        }
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !['pdf', 'pptx', 'ppt'].includes(fileExtension)) {
      alert('Format de fichier non supporté. Veuillez uploader un fichier PDF ou PowerPoint.');
      return;
    }

    setImporting(true);

    try {
      let parsedContent: { title: string; description: string };

      if (fileExtension === 'pdf') {
        parsedContent = await parsePDF(file);
      } else if (fileExtension === 'pptx' || fileExtension === 'ppt') {
        parsedContent = await parsePowerPoint(file);
      } else {
        throw new Error('Format de fichier non supporté');
      }

      const { error } = await supabase.from('recommendations').insert({
        title: parsedContent.title,
        description: parsedContent.description,
        category: 'Strategy',
        priority: 'Medium',
        status: 'Draft',
        tags: ['importé', fileExtension],
        context: `Importé depuis ${file.name}`,
        prompt: '',
        created_by: user?.id,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      alert('Document importé avec succès!');
      onImportComplete();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert(`Erreur lors de l'import: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.ppt"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition shadow-sm disabled:cursor-not-allowed"
      >
        {importing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Importation...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Importer
          </>
        )}
      </button>
    </>
  );
};
