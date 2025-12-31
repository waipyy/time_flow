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
}
