import Foundation

struct TextBox: Codable, Identifiable {
    let id: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
    let content: String
    var textAlign: String?
    var boxFontFamily: String?
    var boxFontSize: Double?
    var boxHeadingStyle: String?
    var boxHighlightColor: String?
    var boxOutlineWidth: Double?
    var boxRotation: Double?
    var boxTextColor: String?
}

struct Note: Codable, Identifiable {
    let id: String
    let subject: String
    let pages: [String]
    let boxes: [String: [TextBox]]
    var folderId: Int?
    var parentId: String?
    var icon: String?
    var noteType: String?
    var cover: String?
    var userId: String?

    enum CodingKeys: String, CodingKey {
        case id, subject, pages, boxes, icon, cover
        case folderId = "folder_id"
        case parentId = "parent_id"
        case noteType = "note_type"
        case userId = "user_id"
    }

    var plainTextPreview: String {
        let allBoxes = boxes.values.flatMap { $0 }
        let text = allBoxes.map { stripHTML($0.content) }.joined(separator: " ")
        if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return pages.first.flatMap { stripHTML($0) } ?? ""
        }
        return String(text.prefix(200))
    }

    var totalWords: Int {
        let allBoxes = boxes.values.flatMap { $0 }
        let text = allBoxes.map { stripHTML($0.content) }.joined(separator: " ")
        return text.split(whereSeparator: { $0.isWhitespace }).count
    }
}

func stripHTML(_ html: String) -> String {
    html.replacingOccurrences(of: "<br\\s*/?>", with: "\n", options: .regularExpression)
        .replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        .replacingOccurrences(of: "&amp;", with: "&")
        .replacingOccurrences(of: "&lt;", with: "<")
        .replacingOccurrences(of: "&gt;", with: ">")
        .replacingOccurrences(of: "&quot;", with: "\"")
        .replacingOccurrences(of: "&#39;", with: "'")
}
