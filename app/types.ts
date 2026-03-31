export interface TextBox { id: string; x: number; y: number; w: number; h: number; content: string; textAlign?: "left" | "center" | "right" | "justify"; boxFontFamily?: string; boxFontSize?: number; boxHeadingStyle?: "default" | "h1" | "h2" | "h3"; boxHighlightColor?: string; boxOutlineWidth?: number; boxRotation?: number }
export type BoxesMap = { [pageIdx: number]: TextBox[] }
export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
}

export interface NoteData {
  id: string;
  subject: string;
  pages: string[];
  folderId: number | null;
  parentId?: string;
  icon?: string;
  cover?: string;
  noteType?: "notebook" | "singlepage" | "flashcard";
  flashcards?: FlashcardItem[];
  boxes: BoxesMap;
  lines?: { [pageIdx: number]: number[] };
  hlines?: { [pageIdx: number]: number[] };
  drawings?: { [pageIdx: number]: DrawingPath[] };
}
export interface DrawingPath {
  id: string;
  tool: string;
  color: string;
  points: { x: number; y: number }[];
  width: number;
}
export interface FolderData { id: number; name: string; open: boolean }

export interface Bookmark { id: string; noteId: string; pageIdx: number; noteTitle: string; icon?: string }

export type DialogConfig =
  | { type: "prompt"; title: string; defaultValue?: string; placeholder?: string; confirmLabel?: string; onConfirm: (val: string) => void }
  | { type: "confirm"; title: string; message?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }
  | { type: "alert"; title: string; message?: string }
