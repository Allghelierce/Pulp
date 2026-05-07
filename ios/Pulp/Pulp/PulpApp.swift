import SwiftUI

@main
struct PulpApp: App {
    @StateObject private var service = SupabaseService()

    var body: some Scene {
        WindowGroup {
            Group {
                if service.user != nil {
                    HomeView()
                } else {
                    LoginView()
                }
            }
            .environmentObject(service)
            .preferredColorScheme(.dark)
        }
    }
}
