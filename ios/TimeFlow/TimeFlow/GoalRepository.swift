import Foundation
import FirebaseFirestore
import Combine

class GoalRepository: ObservableObject {
    @Published var goals: [Goal] = []
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
        
        listenerRegistration = db.collection("goals").addSnapshotListener { [weak self] (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No goal documents")
                return
            }
            
            self?.goals = documents.compactMap { queryDocumentSnapshot -> Goal? in
                if var goal = try? queryDocumentSnapshot.data(as: Goal.self) {
                    goal.id = queryDocumentSnapshot.documentID
                    return goal
                }
                return nil
            }
        }
    }
    
    func unsubscribe() {
        listenerRegistration?.remove()
        listenerRegistration = nil
    }
    
    func addGoal(_ goal: Goal) {
        do {
            if let id = goal.id {
                try db.collection("goals").document(id).setData(from: goal)
            } else {
                _ = try db.collection("goals").addDocument(from: goal)
            }
        } catch {
            print("Error adding goal: \(error)")
        }
    }
    
    func updateGoal(_ goal: Goal) {
        addGoal(goal)
    }
    
    func deleteGoal(_ goal: Goal) {
        guard let id = goal.id else { return }
        db.collection("goals").document(id).delete { error in
            if let error = error {
                print("Error removing goal: \(error)")
            }
        }
    }
}
