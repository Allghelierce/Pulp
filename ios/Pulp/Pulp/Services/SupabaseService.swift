import Foundation
import Supabase

let supabaseURL = URL(string: "https://lfoiwfoegtayvdzxnfwv.supabase.co")!
let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxmb2l3Zm9lZ3RheXZkenhuZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Njk4MDQsImV4cCI6MjA4ODI0NTgwNH0._fpJYx_xxSq4sWmENrhqvfbjHC6ftPuuVUPInVVRGxo"

let supabase = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: supabaseKey)

@MainActor
class SupabaseService: ObservableObject {
    @Published var user: User?
    @Published var notes: [Note] = []
    @Published var profile: PlayerProfile?
    @Published var grove: [TreeData] = []
    @Published var isLoading = true

    init() {
        Task { await checkSession() }
    }

    func checkSession() async {
        do {
            let session = try await supabase.auth.session
            self.user = session.user
            await fetchAll()
        } catch {
            self.user = nil
            self.isLoading = false
        }
    }

    func signIn(email: String, password: String) async throws {
        let session = try await supabase.auth.signIn(email: email, password: password)
        self.user = session.user
        await fetchAll()
    }

    func signOut() async {
        try? await supabase.auth.signOut()
        self.user = nil
        self.notes = []
        self.profile = nil
        self.grove = []
    }

    func fetchAll() async {
        guard let userId = user?.id else { return }
        isLoading = true
        async let notesTask: () = fetchNotes(userId: userId)
        async let profileTask: () = fetchProfile(userId: userId)
        async let groveTask: () = fetchGrove(userId: userId)
        _ = await (notesTask, profileTask, groveTask)
        isLoading = false
    }

    private func fetchNotes(userId: UUID) async {
        do {
            let data: [Note] = try await supabase
                .from("notes")
                .select()
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            self.notes = data.sorted { $0.subject.localizedCaseInsensitiveCompare($1.subject) == .orderedAscending }
        } catch {
            print("Failed to fetch notes: \(error)")
        }
    }

    private func fetchProfile(userId: UUID) async {
        do {
            let data: [PlayerProfile] = try await supabase
                .from("player_profiles")
                .select()
                .eq("user_id", value: userId.uuidString)
                .limit(1)
                .execute()
                .value
            self.profile = data.first
        } catch {
            print("Failed to fetch profile: \(error)")
        }
    }

    private func fetchGrove(userId: UUID) async {
        do {
            let data: [TreeData] = try await supabase
                .from("grove")
                .select()
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            self.grove = data
        } catch {
            print("Failed to fetch grove: \(error)")
        }
    }

    func saveDailyStat(minutes: Int, sessions: Int) async {
        guard let userId = user?.id else { return }
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
        let stat = DailyStat(
            userId: userId.uuidString,
            statDate: String(today),
            minutesFocused: minutes,
            wordsWritten: 0,
            treesGrown: 0,
            sessionsCompleted: sessions
        )
        do {
            try await supabase
                .from("daily_stats")
                .upsert(stat)
                .execute()
        } catch {
            print("Failed to save daily stat: \(error)")
        }
    }
}
