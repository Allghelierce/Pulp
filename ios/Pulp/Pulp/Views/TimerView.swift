import SwiftUI

struct TimerView: View {
    @StateObject private var timer = TimerService()
    @EnvironmentObject var service: SupabaseService

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                    .frame(width: 220, height: 220)

                Circle()
                    .trim(from: 0, to: timer.progress)
                    .stroke(
                        Color("Amber"),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: 220, height: 220)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 1), value: timer.progress)

                VStack(spacing: 4) {
                    Text(timer.timeString)
                        .font(.system(size: 48, weight: .light, design: .monospaced))

                    if timer.isDone {
                        Text("Done!")
                            .font(.system(size: 14, weight: .semibold, design: .serif))
                            .foregroundColor(Color("Amber"))
                    }
                }
            }

            // Presets
            if !timer.isRunning {
                HStack(spacing: 12) {
                    ForEach(timer.presets, id: \.1) { name, seconds in
                        Button(name) {
                            timer.setPreset(seconds)
                        }
                        .font(.system(size: 13, weight: .medium, design: .serif))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(timer.total == seconds ? Color("Amber").opacity(0.15) : Color.gray.opacity(0.15))
                        .foregroundColor(timer.total == seconds ? Color("Amber") : .primary)
                        .cornerRadius(8)
                    }
                }
            }

            // Controls
            HStack(spacing: 20) {
                if timer.isRunning {
                    Button { timer.pause() } label: {
                        Label("Pause", systemImage: "pause.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(maxWidth: .infinity, minHeight: 48)
                    }
                    .background(Color.gray.opacity(0.2))
                    .foregroundColor(.primary)
                    .cornerRadius(12)
                } else if timer.isDone {
                    Button {
                        Task {
                            await service.saveDailyStat(
                                minutes: timer.total / 60,
                                sessions: 1
                            )
                        }
                        timer.reset()
                    } label: {
                        Label("Done", systemImage: "checkmark")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(maxWidth: .infinity, minHeight: 48)
                    }
                    .background(Color("Amber"))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                } else {
                    if timer.elapsed > 0 {
                        Button { timer.reset() } label: {
                            Label("Reset", systemImage: "arrow.counterclockwise")
                                .font(.system(size: 15, weight: .semibold))
                                .frame(maxWidth: .infinity, minHeight: 48)
                        }
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                    }

                    Button { timer.start() } label: {
                        Label("Start", systemImage: "play.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(maxWidth: .infinity, minHeight: 48)
                    }
                    .background(Color("Amber"))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
            .padding(.horizontal, 32)

            Spacer()

            // Stats bar
            if let profile = service.profile {
                HStack(spacing: 24) {
                    statPill(icon: "💎", value: "\(profile.gems)")
                    statPill(icon: "🧃", value: "\(profile.juice)")
                    if let streak = profile.streak, streak > 0 {
                        statPill(icon: "🔥", value: "\(streak)")
                    }
                }
                .padding(.bottom, 20)
            }
        }
    }

    private func statPill(icon: String, value: String) -> some View {
        HStack(spacing: 4) {
            Text(icon).font(.system(size: 14))
            Text(value)
                .font(.system(size: 13, weight: .semibold, design: .serif))
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.gray.opacity(0.15))
        .cornerRadius(8)
    }
}
