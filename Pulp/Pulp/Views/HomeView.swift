import SwiftUI

struct HomeView: View {
    @EnvironmentObject var service: SupabaseService
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                Group {
                    if service.isLoading {
                        ProgressView()
                    } else if service.notes.isEmpty {
                        VStack(spacing: 12) {
                            Text("📄")
                                .font(.system(size: 48))
                            Text("No notebooks yet")
                                .font(.system(size: 15, design: .serif))
                                .foregroundColor(.secondary)
                            Text("Create notebooks on the web app")
                                .font(.system(size: 13, design: .serif))
                                .foregroundStyle(.tertiary)
                        }
                    } else {
                        NotesListView()
                    }
                }
                .navigationTitle("Pulp")
                .toolbar {
                    ToolbarItem(placement: .automatic) {
                        Button {
                            Task { await service.signOut() }
                        } label: {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .font(.system(size: 14))
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .tabItem {
                Image(systemName: "book.closed.fill")
                Text("Notes")
            }
            .tag(0)

            NavigationStack {
                TimerView()
                    .navigationTitle("Focus")
            }
            .tabItem {
                Image(systemName: "timer")
                Text("Focus")
            }
            .tag(1)
        }
        .tint(Color("Amber"))
    }
}
