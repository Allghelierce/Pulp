import Foundation
import Combine

@MainActor
class TimerService: ObservableObject {
    @Published var elapsed: Int = 0
    @Published var total: Int = 1500 // 25 min default
    @Published var isRunning = false
    @Published var isDone = false

    private var timer: AnyCancellable?

    var remaining: Int { max(0, total - elapsed) }
    var progress: Double { total > 0 ? Double(elapsed) / Double(total) : 0 }

    var timeString: String {
        let t = remaining
        let m = t / 60
        let s = t % 60
        return String(format: "%02d:%02d", m, s)
    }

    let presets: [(String, Int)] = [
        ("15 min", 900),
        ("25 min", 1500),
        ("50 min", 3000),
        ("90 min", 5400),
    ]

    func setPreset(_ seconds: Int) {
        guard !isRunning else { return }
        total = seconds
        elapsed = 0
        isDone = false
    }

    func start() {
        guard !isRunning && !isDone else { return }
        isRunning = true
        timer = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self else { return }
                if self.elapsed >= self.total {
                    self.complete()
                } else {
                    self.elapsed += 1
                }
            }
    }

    func pause() {
        isRunning = false
        timer?.cancel()
        timer = nil
    }

    func reset() {
        pause()
        elapsed = 0
        isDone = false
    }

    private func complete() {
        pause()
        isDone = true
    }
}
