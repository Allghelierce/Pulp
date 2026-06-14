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
  grove: Tree[]
  inventory: Record<string, number>
  unlocked_cosmetics: string[]
  unlocked_plots: Record<string, number[]>
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const { data } = await supabase.from('player_profiles').select('*').eq('user_id', userId).single()
  return data
}

export async function upsertPlayerProfile(userId: string, profile: Partial<PlayerProfile>) {
  return supabase.from('player_profiles').upsert({ user_id: userId, ...profile })
}

// ─── Grove (stored as JSONB on player_profiles) ───

export async function getGrove(userId: string): Promise<Tree[]> {
  const { data } = await supabase.from('player_profiles').select('grove').eq('user_id', userId).single()
  return data?.grove || []
}

export async function upsertGrove(userId: string, trees: Tree[]) {
  return supabase.from('player_profiles').upsert({ user_id: userId, grove: trees })
}

export async function upsertTree(userId: string, tree: Tree & { dead?: boolean }) {
  const existing = await getGrove(userId)
  const idx = existing.findIndex(t => String(t.id) === String(tree.id))
  if (idx >= 0) existing[idx] = tree; else existing.push(tree)
  return upsertGrove(userId, existing)
}

export async function deleteTree(userId: string, treeId: string | number) {
  const existing = await getGrove(userId)
  return upsertGrove(userId, existing.filter(t => String(t.id) !== String(treeId)))
}

// ─── Inventory (stored as JSONB on player_profiles) ───

export interface InventoryItem {
  item_type: string
  quantity: number
}

export async function getInventory(userId: string): Promise<Record<string, number>> {
  const { data } = await supabase.from('player_profiles').select('inventory').eq('user_id', userId).single()
  return data?.inventory || {}
}

export async function upsertInventory(userId: string, inventory: Record<string, number>) {
  return supabase.from('player_profiles').upsert({ user_id: userId, inventory })
}

export async function updateInventoryItem(userId: string, itemType: string, quantity: number) {
  const inv = await getInventory(userId)
  if (quantity <= 0) delete inv[itemType]; else inv[itemType] = quantity
  return upsertInventory(userId, inv)
}

// ─── Unlocked Cosmetics (stored as JSONB on player_profiles) ───

export async function getUnlockedCosmetics(userId: string): Promise<string[]> {
  const { data } = await supabase.from('player_profiles').select('unlocked_cosmetics').eq('user_id', userId).single()
  return data?.unlocked_cosmetics || []
}

export async function unlockCosmetic(userId: string, cosmeticId: string) {
  const existing = await getUnlockedCosmetics(userId)
  if (existing.includes(cosmeticId)) return
  return supabase.from('player_profiles').upsert({ user_id: userId, unlocked_cosmetics: [...existing, cosmeticId] })
}

// ─── Chat Personalities (stored as JSONB on player_profiles) ───

export interface ChatPersonality {
  id: string
  name: string
  systemPrompt: string
}

export async function getChatPersonalities(userId: string): Promise<ChatPersonality[]> {
  const { data } = await supabase.from('player_profiles').select('chat_personalities').eq('user_id', userId).single()
  return data?.chat_personalities || []
}

export async function upsertChatPersonalities(userId: string, personalities: ChatPersonality[]) {
  return supabase.from('player_profiles').upsert({ user_id: userId, chat_personalities: personalities })
}

// ─── Unlocked Plots (stored as JSONB on player_profiles) ───

export async function getUnlockedPlots(userId: string): Promise<Record<string, number[]>> {
  const { data } = await supabase.from('player_profiles').select('unlocked_plots').eq('user_id', userId).single()
  return data?.unlocked_plots || {}
}

export async function unlockPlot(userId: string, notebookId: string, plotIndex: number) {
  const plots = await getUnlockedPlots(userId)
  if (!plots[notebookId]) plots[notebookId] = []
  if (!plots[notebookId].includes(plotIndex)) plots[notebookId].push(plotIndex)
  return supabase.from('player_profiles').upsert({ user_id: userId, unlocked_plots: plots })
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
  dashboard_layout: Record<string, unknown> | null
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
    const profileUpdate: Partial<PlayerProfile> = {
      gems: groveData.gems ?? 3,
      juice: groveData.juice ?? 50,
      last_char_count: groveData.lastCharCount ?? 0,
    }
    if (groveData.grove?.length) profileUpdate.grove = groveData.grove
    if (groveData.inventory) {
      const invMap: Record<string, number> = {}
      if (Array.isArray(groveData.inventory)) {
        for (const item of groveData.inventory) invMap[item] = (invMap[item] || 0) + 1
      } else {
        Object.assign(invMap, groveData.inventory)
      }
      profileUpdate.inventory = invMap
    }
    if (groveData.unlockedCosmetics?.length) {
      profileUpdate.unlocked_cosmetics = groveData.unlockedCosmetics
    }
    await upsertPlayerProfile(userId, profileUpdate)

    if (groveData.achievements?.length) {
      await upsertAchievements(userId, groveData.achievements)
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
    await Promise.all(s.trashNotes.map((noteId: string) => addToTrash(userId, noteId)))
  }
}

// ─── Social: friends ───
export interface PublicProfile {
  user_id: string
  username: string | null
  friend_code: string | null
  display_name?: string
  avatar_color?: string
  level?: number
}

export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from('player_profiles')
    .select('user_id, username, friend_code')
    .ilike('username', username)
    .single()
  return data
}

export async function getProfileByFriendCode(code: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from('player_profiles')
    .select('user_id, username, friend_code')
    .eq('friend_code', code)
    .single()
  return data
}

// ─── Social: groups ───
export interface StudyGroup {
  id: number
  owner_id: string
  name: string
  school: string | null
  invite_code: string
  term_start: string
  term_end: string
  status: 'active' | 'archived'
  max_members: number
}

export interface GroupMember {
  group_id: number
  user_id: string
  role: 'owner' | 'member'
  status: 'pending' | 'active'
  focus_minutes_total: number
}

export async function getMyGroups(userId: string): Promise<StudyGroup[]> {
  const { data } = await supabase
    .from('group_members')
    .select('study_groups(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
  return (data ?? []).map((r: any) => r.study_groups).filter(Boolean)
}
