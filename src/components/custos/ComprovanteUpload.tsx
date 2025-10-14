import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ComprovanteUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
}

export function ComprovanteUpload({ onUploadComplete, currentUrl }: ComprovanteUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || "");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo: 5MB");
        return;
      }

      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("comprovantes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("comprovantes").getPublicUrl(filePath);

      setPreviewUrl(data.publicUrl);
      onUploadComplete(data.publicUrl);
      toast.success("Comprovante enviado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="comprovante">Comprovante</Label>
      {previewUrl ? (
        <div className="flex items-center gap-2 p-3 border border-border rounded-md">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex-1"
          >
            Ver comprovante anexado
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPreviewUrl("");
              onUploadComplete("");
            }}
          >
            Remover
          </Button>
        </div>
      ) : (
        <div>
          <label htmlFor="comprovante">
            <div className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary transition-colors cursor-pointer">
              {uploading ? (
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading ? "Enviando..." : "Clique para anexar comprovante"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF ou imagem (máx. 5MB)</p>
            </div>
          </label>
          <Input
            id="comprovante"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}
