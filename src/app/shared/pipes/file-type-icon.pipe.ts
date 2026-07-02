import { Pipe, PipeTransform } from '@angular/core';

const MIME_ICONS: Record<string, { icon: string; color: string }> = {
  'application/pdf':                                                          { icon: 'pi-file-pdf',   color: '#ef4444' },
  'application/msword':                                                       { icon: 'pi-file-word',  color: '#3b82f6' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':  { icon: 'pi-file-word',  color: '#3b82f6' },
  'application/vnd.ms-excel':                                                 { icon: 'pi-file-excel', color: '#22c55e' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':        { icon: 'pi-file-excel', color: '#22c55e' },
  'text/plain':                                                               { icon: 'pi-file',       color: '#94a3b8' },
  'application/zip':                                                          { icon: 'pi-box',        color: '#f59e0b' },
  'application/x-rar-compressed':                                             { icon: 'pi-box',        color: '#f59e0b' },
};

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  image:    { icon: 'pi-image',  color: '#a855f7' },
  video:    { icon: 'pi-video',  color: '#3b82f6' },
  audio:    { icon: 'pi-volume-up', color: '#06b6d4' },
  document: { icon: 'pi-file',   color: '#94a3b8' },
  other:    { icon: 'pi-paperclip', color: '#64748b' },
};

@Pipe({ name: 'fileTypeIcon', standalone: true })
export class FileTypeIconPipe implements PipeTransform {
  transform(mimeType: string, fileType: string): { icon: string; color: string } {
    return MIME_ICONS[mimeType] ?? TYPE_ICONS[fileType] ?? TYPE_ICONS['other'];
  }
}
