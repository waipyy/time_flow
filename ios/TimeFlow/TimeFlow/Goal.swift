import FirebaseFirestore

struct Goal: Identifiable, Codable, Equatable {
    @DocumentID var id: String?
    var name: String
    var eligibleTags: [String]
    var targetAmount: Double
    var timePeriod: String
    var comparison: String
    
    init(id: String? = nil, name: String, eligibleTags: [String], targetAmount: Double, timePeriod: String, comparison: String) {
        self.id = id
        self.name = name
        self.eligibleTags = eligibleTags
        self.targetAmount = targetAmount
        self.timePeriod = timePeriod
        self.comparison = comparison
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case eligibleTags
        case targetAmount
        case timePeriod
        case comparison
        case title // Handle mismatch between 'name' vs 'title' if any
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        _id = try container.decode(DocumentID<String>.self, forKey: .id)
        
        // Handle name/title potential mismatch
        if let title = try? container.decodeIfPresent(String.self, forKey: .title) {
            name = title
        } else {
            name = try container.decodeIfPresent(String.self, forKey: .name) ?? "Untitled Goal"
        }
        
        eligibleTags = try container.decodeIfPresent([String].self, forKey: .eligibleTags) ?? []
        targetAmount = try container.decodeIfPresent(Double.self, forKey: .targetAmount) ?? 1.0
        timePeriod = try container.decodeIfPresent(String.self, forKey: .timePeriod) ?? "daily"
        comparison = try container.decodeIfPresent(String.self, forKey: .comparison) ?? "at-least"
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(eligibleTags, forKey: .eligibleTags)
        try container.encode(targetAmount, forKey: .targetAmount)
        try container.encode(timePeriod, forKey: .timePeriod)
        try container.encode(comparison, forKey: .comparison)
    }
}
