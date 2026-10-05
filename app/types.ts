export interface TextBox { id: string; x: number; y: number; w: number; h: number; content: string; textAlign?: "left" | "center" | "right" | "justify"; boxFontFamily?: string; boxFontSize?: number; boxHeadingStyle?: "default" | "h1" | "h2" | "h3"; boxHighlightColor?: string; boxOutlineWidth?: number; boxRotation?: number; boxTextColor?: string; isTitle?: boolean; sizeLocked?: boolean }
export type BoxesMap = { [pageIdx: number]: TextBox[] }
export interface NoteData {
  id: string;
  subject: string;
  pages: string[];
  folderId: number | null;
  parentId?: string;
  icon?: string;
  cover?: string;
  noteType?: "notebook" | "singlepage" | "vault" | "cornell";
  password?: string;
  boxes: BoxesMap;
  lines?: { [pageIdx: number]: number[] };
  hlines?: { [pageIdx: number]: HLine[] };
  drawings?: { [pageIdx: number]: DrawingPath[] };
  deletedAt?: string;
  archived?: boolean;
}
export interface DrawingPath {
  id: string;
  tool: string;
  color: string;
  fill?: string;
  opacity?: number;
  dash?: boolean;
  points: { x: number; y: number }[];
  width: number;
}
export interface HLine { id: string; x: number; y: number; width: number; direction?: "horizontal" | "vertical" }
export interface FolderData { id: number; name: string; open: boolean }

export interface Achievement {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  reward: number
  rewardType: 'sap' | 'time'
  completed: boolean
  claimed: boolean
  progress?: number
  goal?: number
}

export interface Bookmark { id: string; noteId: string; pageIdx: number; noteTitle: string; label?: string; icon?: string }

export type DialogConfig =
  | { type: "prompt"; title: string; defaultValue?: string; placeholder?: string; confirmLabel?: string; icon?: string; onConfirm: (val: string) => void }
  | { type: "confirm"; title: string; message?: string; confirmLabel?: string; danger?: boolean; onConfirm: (checkboxChecked?: boolean) => void; showCheckbox?: boolean; checkboxLabel?: string }
  | { type: "alert"; title: string; message?: string }
export interface Tree {
  id: number
  type: string
  stage: number
  progress: number
  plantedAt: number
  notebookId?: string
  focusMinutes?: number
  growthTarget?: number
  lastHarvest?: number
  // Topics-as-trees (see docs/timer-recall-design.txt). Trees without
  // `recallNeeded` are legacy and keep their timer-only growth rules.
  topic?: string        // AI-named topic of the session that planted it
  recallNeeded?: number // correct-answer weight needed to go sapling -> full
  recallDone?: number   // correct-answer weight absorbed so far
}

export interface SlashMenuState {
  x: number
  y: number
  filter: string
  type: "editor" | "textarea"
  mode: "@" | "/"
  target?: HTMLElement
  isSelectionMode?: boolean
}

export interface User {
  id: string
  email?: string
  user_metadata?: { avatar_url?: string; [key: string]: unknown }
}

export interface NoteVersion {
  timestamp: number
  subject: string
  pages: string[]
  boxes: BoxesMap
  lines?: { [pageIdx: number]: number[] }
  hlines?: { [pageIdx: number]: HLine[] }
  drawings?: { [pageIdx: number]: DrawingPath[] }
}
