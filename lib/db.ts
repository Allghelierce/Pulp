import { supabase } from './supabase'
import type { Tree, Achievement, FolderData } from '@/app/types'

// ─── Player Profile ───

export interface PlayerProfile {
  gems: number
  juice: number
  xp: number
  level: number
  streak: number
  last_streak_date: string | null
  pro_access: boolean
  pro_expires_at: string | null
  last_char_count: number
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const { data } = await supabase.from('player_profiles').select('*').eq('user_id', userId).single()
  return data
}

export async function upsertPlayerProfile(userId: string, profile: Partial<PlayerProfile>) {
  return supabase.from('player_profiles').upsert({ user_id: userId, ...profile })
}

// ─── Grove (Trees) ───

export async function getGrove(userId: string): Promise<Tree[]> {
  const { data } = await supabase.from('grove').select('*').eq('user_id', userId)
  if (!data) return []
  return data.map(row => ({
    id: row.id,
    type: row.tree_type,
    stage: parseInt(row.stage) || 0,
    progress: row.progress,
    plantedAt: new Date(row.planted_at).getTime(),
    notebookId: row.notebook_id || undefined,
    dead: row.dead
  }))
}

export async function upsertTree(userId: string, tree: Tree & { dead?: boolean }) {
  return supabase.from('grove').upsert({
    id: String(tree.id),
    user_id: userId,
    tree_type: tree.type,
    stage: String(tree.stage),
    progress: tree.progress,
    planted_at: new Date(tree.plantedAt).toISOString(),
    notebook_id: tree.notebookId || null,
    dead: tree.dead || false
  })
}

export async function upsertGrove(userId: string, trees: Tree[]) {
  if (!trees.length) return
  const rows = trees.map(t => ({
    id: String(t.id),
    user_id: userId,
    tree_type: t.type,
    stage: String(t.stage),
    progress: t.progress,
    planted_at: new Date(t.plantedAt).toISOString(),
    notebook_id: t.notebookId || null,
    dead: (t as any).dead || false
  }))
  return supabase.from('grove').upsert(rows)
}

export async function deleteTree(userId: string, treeId: string | number) {
  return supabase.from('grove').delete().eq('id', String(treeId)).eq('user_id', userId)
}

// ─── Inventory ───

export interface InventoryItem {
  item_type: string
  quantity: number
}

export async function getInventory(userId: string): Promise<Record<string, number>> {
  const { data } = await supabase.from('inventory').select('*').eq('user_id', userId)
  if (!data) return {}
  const map: Record<string, number> = {}
  for (const row of data) map[row.item_type] = row.quantity
  return map
}

export async function upsertInventory(userId: string, inventory: Record<string, number>) {
  const rows = Object.entries(inventory)
    .filter(([, qty]) => qty > 0)
    .map(([item_type, quantity]) => ({ user_id: userId, item_type, quantity }))
  if (!rows.length) return
  return supabase.from('inventory').upsert(rows)
}

export async function updateInventoryItem(userId: string, itemType: string, quantity: number) {
  if (quantity <= 0) {
    return supabase.from('inventory').delete().eq('user_id', userId).eq('item_type', itemType)
  }
  return supabase.from('inventory').upsert({ user_id: userId, item_type: itemType, quantity })
}

// ─── Achievements ───

export interface AchievementRow {
  achievement_id: string
  progress: number
  completed: boolean
  completed_at: string | null
}

export async function getAchievements(userId: string): Promise<AchievementRow[]> {
  const { data } = await supabase.from('achievements').select('*').eq('user_id', userId)
  return data || []
}

export async function upsertAchievement(userId: string, achievement: { id: string; progress?: number; completed: boolean }) {
  return supabase.from('achievements').upsert({
    user_id: userId,
    achievement_id: achievement.id,
    progress: achievement.progress || 0,
    completed: achievement.completed,
    completed_at: achievement.completed ? new Date().toISOString() : null
  })
}

export async function upsertAchievements(userId: string, achievements: Achievement[]) {
  const rows = achievements.map(a => ({
    user_id: userId,
    achievement_id: a.id,
    progress: a.progress || 0,
    completed: a.completed,
    completed_at: a.completed ? new Date().toISOString() : null
  }))
  if (!rows.length) return
  return supabase.from('achievements').upsert(rows)
}

// ─── Daily Stats ───

export interface DailyStatRow {
  stat_date: string
  minutes_focused: number
  words_written: number
  trees_grown: number
  sessions_completed: number
}

export async function getDailyStats(userId: string, days = 30): Promise<DailyStatRow[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const { data } = await supabase.from('daily_stats').select('*').eq('user_id', userId).gte('stat_date', since).order('stat_date', { ascending: false })
  return data || []
}

export async function incrementDailyStat(userId: string, field: 'minutes_focused' | 'words_written' | 'trees_grown' | 'sessions_completed', amount: number) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase.from('daily_stats').select('*').eq('user_id', userId).eq('stat_date', today).single()
  if (data) {
    return supabase.from('daily_stats').update({ [field]: (data[field] || 0) + amount }).eq('user_id', userId).eq('stat_date', today)
  }
  return supabase.from('daily_stats').insert({ user_id: userId, stat_date: today, [field]: amount })
}

// ─── Settings ───

export interface SettingsRow {
  accent: string
  theme: string
  auto_save: boolean
  spell_check: boolean
  auto_correct: boolean
  auto_capitalize: boolean
  editor_font: string
  heading_font: string
  line_spacing: string
  paper_style: string
  show_binding: boolean
  reduce_motion: boolean
  reduce_visuals: boolean
  sidebar_on_start: boolean
  bg_effect: boolean
  smear_effect: boolean
  handwritten_effect: boolean
  language: string
  default_sort: string
  word_count_visible: boolean
  focus_mode: boolean
  base_font_size: string
  shortcuts: Record<string, string>
  blocked_sites: string[]
  blocked_apps: string[]
  sidebar_width: number
  skip_delete_confirmation: boolean
  dev_mode: boolean
}

export async function getSettings(userId: string): Promise<SettingsRow | null> {
  const { data } = await supabase.from('settings').select('*').eq('user_id', userId).single()
  return data
}

export async function upsertSettings(userId: string, settings: Partial<SettingsRow>) {
  return supabase.from('settings').upsert({ user_id: userId, ...settings })
}

// ─── Folders ───

export async function getFolders(userId: string): Promise<FolderData[]> {
  const { data } = await supabase.from('folders').select('*').eq('user_id', userId).order('sort_order')
  if (!data) return []
  return data.map(r => ({ id: r.id, name: r.name, open: true }))
}

export async function upsertFolders(userId: string, folders: FolderData[]) {
  const rows = folders.map((f, i) => ({
    id: f.id,
    user_id: userId,
    name: f.name,
    sort_order: i
  }))
  if (!rows.length) return
  return supabase.from('folders').upsert(rows, { onConflict: 'id' })
}

export async function deleteFolder(userId: string, folderId: number) {
  return supabase.from('folders').delete().eq('id', folderId).eq('user_id', userId)
}

// ─── Bookmarks ───

export async function getBookmarks(userId: string): Promise<string[]> {
  const { data } = await supabase.from('bookmarks').select('note_id').eq('user_id', userId).order('sort_order')
  return data?.map(r => r.note_id) || []
}

export async function setBookmarks(userId: string, noteIds: string[]) {
  await supabase.from('bookmarks').delete().eq('user_id', userId)
  if (!noteIds.length) return
  const rows = noteIds.map((note_id, i) => ({ user_id: userId, note_id, sort_order: i }))
  return supabase.from('bookmarks').insert(rows)
}

// ─── Trash ───

export async function getTrash(userId: string): Promise<string[]> {
  const { data } = await supabase.from('trash').select('note_id').eq('user_id', userId)
  return data?.map(r => r.note_id) || []
}

export async function addToTrash(userId: string, noteId: string) {
  return supabase.from('trash').upsert({ user_id: userId, note_id: noteId })
}

export async function removeFromTrash(userId: string, noteId: string) {
  return supabase.from('trash').delete().eq('user_id', userId).eq('note_id', noteId)
}

// ─── Unlocked Cosmetics ───

export async function getUnlockedCosmetics(userId: string): Promise<string[]> {
  const { data } = await supabase.from('unlocked_cosmetics').select('cosmetic_id').eq('user_id', userId)
  return data?.map(r => r.cosmetic_id) || []
}

export async function unlockCosmetic(userId: string, cosmeticId: string) {
  return supabase.from('unlocked_cosmetics').upsert({ user_id: userId, cosmetic_id: cosmeticId })
}

// ─── Unlocked Plots ───

export async function getUnlockedPlots(userId: string): Promise<Record<string, number[]>> {
  const { data } = await supabase.from('unlocked_plots').select('*').eq('user_id', userId)
  if (!data) return {}
  const map: Record<string, number[]> = {}
  for (const row of data) {
    if (!map[row.notebook_id]) map[row.notebook_id] = []
    map[row.notebook_id].push(row.plot_index)
  }
  return map
}

export async function unlockPlot(userId: string, notebookId: string, plotIndex: number) {
  return supabase.from('unlocked_plots').upsert({ user_id: userId, notebook_id: notebookId, plot_index: plotIndex })
}

// ─── Migration helper: move existing user_settings blob to new tables ───

export async function migrateFromLegacy(userId: string) {
  const { data } = await supabase.from('user_settings').select('settings').eq('user_id', userId).single()
  if (!data?.settings) return

  const s = data.settings as any

  // Migrate settings
  const settingsPayload: any = { user_id: userId }
  const settingsKeys = ['accent', 'theme', 'autoSave', 'spellCheck', 'autoCorrect', 'autoCapitalize', 'editorFont', 'headingFont', 'lineSpacing', 'paperStyle', 'showBinding', 'reduceMotion', 'reduceVisuals', 'sidebarOnStart', 'bgEffect', 'smearEffect', 'handwrittenEffect', 'language', 'defaultSort', 'wordCountVisible', 'focusMode', 'baseFontSize', 'shortcuts', 'blockedSites', 'blockedApps', 'skipDeleteConfirmation', 'devMode']
  const camelToSnake = (str: string) => str.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
  for (const key of settingsKeys) {
    if (s[key] !== undefined) settingsPayload[camelToSnake(key)] = s[key]
  }
  await supabase.from('settings').upsert(settingsPayload)

  // Migrate grove data
  if (s.grove) {
    const groveData = s.grove
    await upsertPlayerProfile(userId, {
      gems: groveData.gems ?? 3,
      juice: groveData.juice ?? 50,
      last_char_count: groveData.lastCharCount ?? 0
    })
    if (groveData.grove?.length) await upsertGrove(userId, groveData.grove)
    if (groveData.inventory) await upsertInventory(userId, groveData.inventory)
    if (groveData.achievements?.length) {
      await upsertAchievements(userId, groveData.achievements)
    }
    if (groveData.unlockedCosmetics?.length) {
      for (const c of groveData.unlockedCosmetics) {
        await unlockCosmetic(userId, c)
      }
    }
  }

  // Migrate folders
  if (s.folders?.length) await upsertFolders(userId, s.folders)

  // Migrate bookmarks
  if (s.bookmarks?.length) {
    const noteIds = s.bookmarks.map((b: any) => typeof b === 'string' ? b : b.noteId)
    await setBookmarks(userId, noteIds)
  }

  // Migrate trash
  if (s.trashNotes?.length) {
    for (const noteId of s.trashNotes) await addToTrash(userId, noteId)
  }
}
