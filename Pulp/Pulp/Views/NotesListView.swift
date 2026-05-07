import SwiftUI

struct NotesListView: View {
    @EnvironmentObject var service: SupabaseService

    var body: some View {
        List {
            ForEach(service.notes) { note in
                NavigationLink(destination: NoteDetailView(note: note)) {
                    HStack(spacing: 12) {
                        Text(note.icon ?? "📄")
                            .font(.title2)

                        VStack(alignment: .leading, spacing: 3) {
                            Text(note.subject)
                                .font(.system(size: 15, weight: .semibold, design: .serif))
                                .lineLimit(1)

                            Text(note.plainTextPreview)
                                .font(.system(size: 12, design: .serif))
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }

                        Spacer()

                        if let type = note.noteType, type != "notebook" {
                            Text(type)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.gray.opacity(0.2))
                                .cornerRadius(4)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .listStyle(.plain)
        .refreshable {
            await service.fetchAll()
        }
    }
}
