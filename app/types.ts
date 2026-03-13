export interface TextBox { id: string; x: number; y: number; w: number; h: number; content: string }
export type BoxesMap = { [pageIdx: number]: TextBox[] }
export interface NoteData { 
  id: string; 
  subject: string; 
  pages: string[]; 
  folderId: number | null; 
  boxes: BoxesMap 
}
export interface FolderData { id: number; name: string; open: boolean }

export type DialogConfig =
  | { type: "prompt";  title: string; defaultValue?: string; placeholder?: string; confirmLabel?: string; onConfirm: (val: string) => void }
  | { type: "confirm"; title: string; message?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }
  | { type: "alert";   title: string; message?: string }
