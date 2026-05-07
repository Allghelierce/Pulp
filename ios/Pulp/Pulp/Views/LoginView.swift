import SwiftUI

struct LoginView: View {
    @EnvironmentObject var service: SupabaseService
    @State private var email = ""
    @State private var password = ""
    @State private var error: String?
    @State private var loading = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 8) {
                Text("Pulp")
                    .font(.system(size: 42, weight: .bold, design: .serif))
                    .foregroundColor(Color("Amber"))

                Text("Sign in to view your notes")
                    .font(.system(size: 14, design: .serif))
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 40)

            VStack(spacing: 16) {
                TextField("Email", text: $email)
                    #if os(iOS)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    #endif
                    .padding(14)
                    .background(Color.gray.opacity(0.15))
                    .cornerRadius(10)

                SecureField("Password", text: $password)
                    .textContentType(.password)
                    .padding(14)
                    .background(Color.gray.opacity(0.15))
                    .cornerRadius(10)

                if let error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }

                Button {
                    Task { await signIn() }
                } label: {
                    if loading {
                        ProgressView()
                            .tint(.white)
                            .frame(maxWidth: .infinity, minHeight: 44)
                    } else {
                        Text("Sign In")
                            .font(.system(size: 15, weight: .semibold, design: .serif))
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                }
                .background(Color("Amber"))
                .foregroundColor(.white)
                .cornerRadius(10)
                .disabled(loading || email.isEmpty || password.isEmpty)
            }
            .padding(.horizontal, 32)

            Spacer()
            Spacer()
        }
    }

    private func signIn() async {
        loading = true
        error = nil
        do {
            try await service.signIn(email: email, password: password)
        } catch {
            self.error = "Invalid email or password"
        }
        loading = false
    }
}
