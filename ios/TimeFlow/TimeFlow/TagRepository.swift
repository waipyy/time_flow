import Foundation
import FirebaseFirestore
import Combine

class TagRepository: ObservableObject {
    @Published var tags: [Tag] = []
    private var db = Firestore.firestore(database: "timeflow")
    private var listenerRegistration: ListenerRegistration?
    
    init() {
        subscribe()
    }
    
    deinit {
        unsubscribe()
    }
    
    func subscribe() {
        if listenerRegistration != nil {
            unsubscribe()
        }
        
        listenerRegistration = db.collection("tags").addSnapshotListener { [weak self] (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No tag documents")
                return
            }
            
            self?.tags = documents.compactMap { queryDocumentSnapshot -> Tag? in
                if var tag = try? queryDocumentSnapshot.data(as: Tag.self) {
                    tag.id = queryDocumentSnapshot.documentID
                    return tag
                }
                return nil
            }
        }
    }
    
    func unsubscribe() {
        listenerRegistration?.remove()
        listenerRegistration = nil
    }
    
    func addTag(_ tag: Tag) {
        do {
            if let id = tag.id {
                try db.collection("tags").document(id).setData(from: tag)
            } else {
                _ = try db.collection("tags").addDocument(from: tag)
            }
        } catch {
            print("Error adding tag: \(error)")
        }
    }
    
    func updateTag(_ tag: Tag) {
        addTag(tag)
    }
    
    func deleteTag(_ tag: Tag) {
        guard let id = tag.id else { return }
        db.collection("tags").document(id).delete { error in
            if let error = error {
                print("Error removing tag: \(error)")
            }
        }
    }
}
