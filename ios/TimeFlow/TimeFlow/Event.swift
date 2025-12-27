import Foundation
import SwiftUI
import UIKit

struct Event: Identifiable, Equatable, Codable {
    let id: UUID
    var title: String
    var description: String?
    var tags: [String]
    var startTime: Date
    var endTime: Date
    var colorHex: String
    
    var color: Color {
        get { Color(hex: colorHex) }
        set { colorHex = newValue.toHex() ?? "#0000FF" }
    }
    
    init(id: UUID = UUID(), title: String, description: String? = nil, tags: [String] = [], startTime: Date, endTime: Date, color: Color = .blue) {
        self.id = id
        self.title = title
        self.description = description
        self.tags = tags
        self.startTime = startTime
        self.endTime = endTime
        self.colorHex = color.toHex() ?? "#0000FF"
    }
}

// Helper extensions for Color <-> Hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    func toHex() -> String? {
        let uic = UIColor(self)
        guard let components = uic.cgColor.components, components.count >= 3 else {
            return nil
        }
        let r = Float(components[0])
        let g = Float(components[1])
        let b = Float(components[2])
        var a = Float(1.0)
        if components.count >= 4 {
            a = Float(components[3])
        }
        if a != Float(1.0) {
            return String(format: "%02lX%02lX%02lX%02lX", lroundf(r * 255), lroundf(g * 255), lroundf(b * 255), lroundf(a * 255))
        } else {
            return String(format: "%02lX%02lX%02lX", lroundf(r * 255), lroundf(g * 255), lroundf(b * 255))
        }
    }
}

extension Event {
    static let sampleEvents: [Event] = [
        Event(
            title: "Morning Standup",
            startTime: Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: Date()) ?? Date(),
            endTime: Calendar.current.date(bySettingHour: 9, minute: 30, second: 0, of: Date()) ?? Date(),
            color: .blue
        ),
        Event(
            title: "Deep Work",
            startTime: Calendar.current.date(bySettingHour: 10, minute: 0, second: 0, of: Date()) ?? Date(),
            endTime: Calendar.current.date(bySettingHour: 12, minute: 0, second: 0, of: Date()) ?? Date(),
            color: .purple
        ),
        Event(
            title: "Lunch Break",
            startTime: Calendar.current.date(bySettingHour: 12, minute: 30, second: 0, of: Date()) ?? Date(),
            endTime: Calendar.current.date(bySettingHour: 13, minute: 30, second: 0, of: Date()) ?? Date(),
            color: .orange
        ),
        Event(
            title: "Team Sync",
            startTime: Calendar.current.date(bySettingHour: 14, minute: 0, second: 0, of: Date()) ?? Date(),
            endTime: Calendar.current.date(bySettingHour: 15, minute: 0, second: 0, of: Date()) ?? Date(),
            color: .green
        )
    ]
}
