import Foundation

struct PlayerProfile: Codable {
    let userId: String
    var gems: Int
    var juice: Int
    var xp: Int?
    var level: Int?
    var streak: Int?
    var lastStreakDate: String?
    var lastCharCount: Int?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case gems, juice, xp, level, streak
        case lastStreakDate = "last_streak_date"
        case lastCharCount = "last_char_count"
    }
}

struct TreeData: Codable, Identifiable {
    let id: String
    let userId: String
    var treeType: String
    var stage: String
    var progress: Double
    var plantedAt: String
    var notebookId: String?
    var dead: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case treeType = "tree_type"
        case stage, progress
        case plantedAt = "planted_at"
        case notebookId = "notebook_id"
        case dead
    }
}

struct DailyStat: Codable {
    let userId: String
    let statDate: String
    var minutesFocused: Int
    var wordsWritten: Int
    var treesGrown: Int
    var sessionsCompleted: Int

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case statDate = "stat_date"
        case minutesFocused = "minutes_focused"
        case wordsWritten = "words_written"
        case treesGrown = "trees_grown"
        case sessionsCompleted = "sessions_completed"
    }
}
