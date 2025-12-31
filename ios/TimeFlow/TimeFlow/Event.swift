import SwiftUI
import UIKit

import FirebaseFirestore

struct Event: Identifiable, Equatable, Codable {
    var id: String?
    var title: String
    var description: String?
    var tags: [String]
    var startTime: Date
    var endTime: Date
    var colorHex: String? // Web app doesn't send this
    
    var color: Color {
        get { 
            if let hex = colorHex {
                return Color(hex: hex)
            }
            return .blue // Default color
        }
        set { colorHex = newValue.toHex() ?? "#0000FF" }
    }
    
    init(id: String? = nil, title: String, description: String? = nil, tags: [String] = [], startTime: Date, endTime: Date, color: Color = .blue) {
        self.id = id
        self.title = title
        self.description = description
        self.tags = tags
        self.startTime = startTime
        self.endTime = endTime
        self.colorHex = color.toHex() ?? "#0000FF"
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case tags
        case startTime
        case endTime
        case colorHex
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        _id = try container.decode(DocumentID<String>.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        tags = try container.decodeIfPresent([String].self, forKey: .tags) ?? []
        startTime = try container.decode(Date.self, forKey: .startTime)
        endTime = try container.decode(Date.self, forKey: .endTime)
        colorHex = try container.decodeIfPresent(String.self, forKey: .colorHex)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(title, forKey: .title)
        try container.encode(description, forKey: .description)
        try container.encode(tags, forKey: .tags)
        try container.encode(startTime, forKey: .startTime)
        try container.encode(endTime, forKey: .endTime)
        try container.encode(colorHex, forKey: .colorHex)
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
