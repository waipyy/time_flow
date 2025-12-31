import Foundation
import FirebaseFirestore
import Combine

class EventRepository: ObservableObject {
    @Published var events: [Event] = []
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
        
        listenerRegistration = db.collection("events").addSnapshotListener { [weak self] (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No documents")
                return
            }
            
            self?.events = documents.compactMap { queryDocumentSnapshot -> Event? in
                return try? queryDocumentSnapshot.data(as: Event.self)
            }
        }
    }
    
    func unsubscribe() {
        listenerRegistration?.remove()
        listenerRegistration = nil
    }
    
    func addEvent(_ event: Event) {
        do {
            if let id = event.id {
                try db.collection("events").document(id).setData(from: event)
            } else {
                _ = try db.collection("events").addDocument(from: event)
            }
        } catch {
            print("Error adding event: \(error)")
        }
    }
    
    func updateEvent(_ event: Event) {
        addEvent(event)
    }
    
    func deleteEvent(_ event: Event) {
        guard let id = event.id else { return }
        
        db.collection("events").document(id).delete { error in
            if let error = error {
                print("Error removing event: \(error)")
            }
        }
    }
}
