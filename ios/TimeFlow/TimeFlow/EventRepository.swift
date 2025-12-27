import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift
import Combine

class EventRepository: ObservableObject {
    @Published var events: [Event] = []
    private var db = Firestore.firestore()
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
            try db.collection("events").document(event.id.uuidString).setData(from: event)
        } catch {
            print("Error adding event: \(error)")
        }
    }
    
    func updateEvent(_ event: Event) {
        addEvent(event) // Overwrites with new data
    }
    
    func deleteEvent(_ event: Event) {
        db.collection("events").document(event.id.uuidString).delete { error in
            if let error = error {
                print("Error removing event: \(error)")
            }
        }
    }
}
