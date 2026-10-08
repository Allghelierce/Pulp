// Server rules for Party focus reports, without a server: the input checks
// and creditFocus (RPC path + the fallback used until the migration is
// applied) against an in-memory fake of the few Supabase calls it makes.
import { test, expect } from "@playwright/test"
import type { SupabaseClient } from "@supabase/supabase-js"
import { parseReportMinutes, weekCapAt, creditFor, parseId, parseUserId, REPORT_MAX_MINUTES, DAILY_MAX_MINUTES } from "@/lib/social"
import { creditFocus, type FocusReport } from "@/lib/partyCredit"

const ME = "00000000-0000-0000-0000-0000000000aa"
const WEEK = "2026-10-05" // a Monday
const at = (iso: string) => Date.parse(iso)

test.describe("report input", () => {
  test("minutes: whole numbers from 1, one session at most", () => {
    expect(parseReportMinutes(25)).toBe(25)
    expect(parseReportMinutes(1)).toBe(1)
    expect(parseReportMinutes(REPORT_MAX_MINUTES)).toBe(180)
    expect(parseReportMinutes(600)).toBe(180)
    for (const bad of [0, -5, 12.5, NaN, Infinity, "30", null, undefined, {}]) expect(parseReportMinutes(bad)).toBeNull()
  })

  test("daily cap: 16h for each day of the week so far", () => {
    expect(DAILY_MAX_MINUTES).toBe(960)
    expect(weekCapAt(WEEK, at("2026-10-05T00:00:00Z"))).toBe(960)
    expect(weekCapAt(WEEK, at("2026-10-05T23:59:00Z"))).toBe(960)
    expect(weekCapAt(WEEK, at("2026-10-07T09:00:00Z"))).toBe(3 * 960)
    expect(weekCapAt(WEEK, at("2026-10-11T23:00:00Z"))).toBe(7 * 960)
    // Clock skew either side of the week stays in 1..7 days; a bad date is one day.
    expect(weekCapAt(WEEK, at("2026-10-04T22:00:00Z"))).toBe(960)
    expect(weekCapAt(WEEK, at("2026-10-20T00:00:00Z"))).toBe(7 * 960)
    expect(weekCapAt("nope", at("2026-10-07T09:00:00Z"))).toBe(960)
  })

  test("credit: what fits under the cap", () => {
    expect(creditFor(60, 0, 960)).toBe(60)
    expect(creditFor(60, 930, 960)).toBe(30)
    expect(creditFor(60, 960, 960)).toBe(0)
    expect(creditFor(60, 5000, 960)).toBe(0)
  })

  test("ids: positive whole numbers / uuids only", () => {
    expect(parseId(7)).toBe(7)
    expect(parseId("7")).toBe(7)
    for (const bad of [0, -1, 1.5, "", " ", "7; drop", "1e400", null, undefined, {}]) expect(parseId(bad)).toBeNull()
    expect(parseUserId(ME)).toBe(ME)
    for (const bad of ["", "abc", `${ME},addressee_id.eq.x`, 5, null]) expect(parseUserId(bad)).toBeNull()
  })
})

// ── a fake of the Supabase calls creditFocus makes ───────────────────
type Row = Record<string, unknown>
type Rpc = (name: string, args: Record<string, unknown>) => { data: unknown; error: { code?: string; message: string } | null }

function fakeDb(seed: { members?: Row[]; weekly?: Row[] }, rpc?: Rpc) {
  const tables: Record<string, Row[]> = {
    group_members: (seed.members ?? []).map(r => ({ ...r })),
    group_weekly: (seed.weekly ?? []).map(r => ({ ...r })),
  }
  const calls: string[] = []
  let nextId = 100

  // Each query runs on a later tick, all at once (like one SQL statement), so
  // two creditFocus calls in parallel interleave the way two requests would.
  class Query {
    private filters: [string, unknown][] = []
    private op: "select" | "update" | "insert" = "select"
    private payload: Row = {}
    private one = false
    private returning = false
    constructor(private table: string) {}
    select() { if (this.op !== "select") this.returning = true; return this }
    eq(col: string, v: unknown) { this.filters.push([col, v]); return this }
    maybeSingle() { this.one = true; return this }
    update(p: Row) { this.op = "update"; this.payload = p; return this }
    insert(p: Row) { this.op = "insert"; this.payload = p; return this }
    private async run() {
      await new Promise(r => setTimeout(r, 0))
      calls.push(`${this.op} ${this.table}`)
      const rows = tables[this.table]
      const match = (r: Row) => this.filters.every(([c, v]) => r[c] === v)
      if (this.op === "insert") {
        const p = this.payload
        if (rows.some(r => r.group_id === p.group_id && r.user_id === p.user_id && r.week_start === p.week_start)) {
          return { data: null, error: { code: "23505", message: "duplicate key value" } }
        }
        rows.push({ id: nextId++, ...p })
        return { data: null, error: null }
      }
      const hit = rows.filter(match)
      if (this.op === "update") {
        hit.forEach(r => Object.assign(r, this.payload))
        return { data: this.returning ? hit.map(r => ({ id: r.id })) : null, error: null }
      }
      const copy = hit.map(r => ({ ...r }))
      return { data: this.one ? copy[0] ?? null : copy, error: null }
    }
    then<A, B>(ok: (v: { data: unknown; error: unknown }) => A, fail?: (e: unknown) => B) { return this.run().then(ok, fail) }
  }

  const missing: Rpc = () => ({ data: null, error: { code: "PGRST202", message: "Could not find the function" } })
  const db = {
    from: (t: string) => new Query(t),
    rpc: async (name: string, args: Record<string, unknown>) => { calls.push(`rpc ${name}`); return (rpc ?? missing)(name, args) },
  } as unknown as SupabaseClient
  return { db, tables, calls }
}

const member = (over: Row = {}): Row => ({ id: 1, group_id: 7, user_id: ME, status: "active", focus_minutes_total: 0, ...over })
const report = (over: Partial<FocusReport> = {}): FocusReport => ({ groupId: 7, userId: ME, week: WEEK, minutes: 50, cap: 960, ...over })
const weekOf = (t: Record<string, Row[]>, group = 7) => t.group_weekly.find(r => r.group_id === group)?.focus_minutes

test.describe("creditFocus", () => {
  test("uses the RPC when the migration is applied", async () => {
    let args: Record<string, unknown> = {}
    const { db, calls } = fakeDb({}, (_n, a) => { args = a; return { data: 40, error: null } })
    expect(await creditFocus(db, report({ minutes: 50, cap: 2000 }))).toBe(40)
    expect(args).toEqual({ p_group: 7, p_user: ME, p_week: WEEK, p_minutes: 50, p_cap: 2000 })
    expect(calls).toEqual(["rpc party_report_focus"]) // nothing else touched
  })

  test("RPC: not a member is null; any other error throws (a 500, not ok)", async () => {
    expect(await creditFocus(fakeDb({}, () => ({ data: null, error: null })).db, report())).toBeNull()
    const broken = fakeDb({}, () => ({ data: null, error: { code: "57014", message: "statement timeout" } }))
    await expect(creditFocus(broken.db, report())).rejects.toThrow(/statement timeout/)
    expect(broken.calls).toEqual(["rpc party_report_focus"]) // no fallback on a real error
  })

  test("fallback: adds to the week and the lifetime total", async () => {
    const { db, tables } = fakeDb({ members: [member({ focus_minutes_total: 300 })] })
    expect(await creditFocus(db, report({ minutes: 50 }))).toBe(50)
    expect(await creditFocus(db, report({ minutes: 25 }))).toBe(25)
    expect(weekOf(tables)).toBe(75)
    expect(tables.group_members[0].focus_minutes_total).toBe(375)
  })

  test("fallback: the cap counts every party this week, and a capped report writes nothing", async () => {
    const { db, tables } = fakeDb({
      members: [member()],
      weekly: [{ id: 9, group_id: 3, user_id: ME, week_start: WEEK, focus_minutes: 900 }], // an old party, same week
    })
    expect(await creditFocus(db, report({ minutes: 180, cap: 960 }))).toBe(60)
    expect(await creditFocus(db, report({ minutes: 180, cap: 960 }))).toBe(0)
    expect(weekOf(tables)).toBe(60)
    expect(tables.group_members[0].focus_minutes_total).toBe(60)
  })

  test("fallback: not an active member is null", async () => {
    expect(await creditFocus(fakeDb({}).db, report())).toBeNull()
    const pending = fakeDb({ members: [member({ status: "pending" })] })
    expect(await creditFocus(pending.db, report())).toBeNull()
    expect(pending.tables.group_weekly).toHaveLength(0)
  })

  test("fallback: parallel reports all count, and never past the cap", async () => {
    const { db, tables, calls } = fakeDb({ members: [member()] })
    const got = await Promise.all([1, 2, 3, 4].map(() => creditFocus(db, report({ minutes: 30 }))))
    expect(got).toEqual([30, 30, 30, 30])
    expect(weekOf(tables)).toBe(120) // a read-modify-write would have kept only one
    expect(tables.group_weekly).toHaveLength(1)
    expect(tables.group_members[0].focus_minutes_total).toBe(120)
    expect(calls.filter(c => c === "insert group_weekly").length).toBeGreaterThan(1) // they really raced

    const capped = fakeDb({ members: [member()] })
    const parts = await Promise.all([1, 2, 3].map(() => creditFocus(capped.db, report({ minutes: 180, cap: 400 }))))
    expect(parts.reduce<number>((a, b) => a + (b ?? 0), 0)).toBe(400)
    expect(weekOf(capped.tables)).toBe(400)
  })
})
