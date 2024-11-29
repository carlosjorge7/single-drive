export interface Archivo {
  id?: number;
  name: string;
  file: File | string;
  description: string;
  created_at?: string;
}
