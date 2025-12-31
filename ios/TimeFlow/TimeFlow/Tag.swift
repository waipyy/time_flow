import FirebaseFirestore

struct Tag: Identifiable, Codable, Equatable {
    @DocumentID var id: String?
    var name: String
    var color: String
    
    init(id: String? = nil, name: String, color: String) {
        self.id = id
        self.name = name
        self.color = color
    }
}
