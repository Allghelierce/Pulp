import SwiftUI

struct NoteDetailView: View {
    let note: Note
    @State private var pageIdx = 0

    private var pageBoxes: [TextBox] {
        note.boxes[String(pageIdx)] ?? []
    }

    private var pageContent: String {
        let boxText = pageBoxes
            .sorted { $0.y == $1.y ? $0.x < $1.x : $0.y < $1.y }
            .map { stripHTML($0.content) }
            .joined(separator: "\n\n")

        if boxText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return stripHTML(note.pages[safe: pageIdx] ?? "")
        }
        return boxText
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                Text(pageContent.isEmpty ? "Empty page" : pageContent)
                    .font(.system(size: 16, design: .serif))
                    .foregroundColor(pageContent.isEmpty ? .secondary : .primary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
            }

            if note.pages.count > 1 {
                pageScrubber
            }
        }
        .navigationTitle(note.subject)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }

    private var pageScrubber: some View {
        HStack(spacing: 20) {
            Button {
                if pageIdx > 0 { pageIdx -= 1 }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .semibold))
            }
            .disabled(pageIdx == 0)

            Text("\(pageIdx + 1) / \(note.pages.count)")
                .font(.system(size: 13, weight: .medium, design: .serif))
                .foregroundColor(.secondary)
                .monospacedDigit()

            Button {
                if pageIdx < note.pages.count - 1 { pageIdx += 1 }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
            }
            .disabled(pageIdx >= note.pages.count - 1)
        }
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity)
        .background(.ultraThinMaterial)
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
