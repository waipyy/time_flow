import SwiftUI

struct GoalsView: View {
    @StateObject private var repository = GoalRepository()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(repository.goals) { goal in
                    VStack(alignment: .leading) {
                        Text(goal.name)
                            .font(.headline)
                        Text("\(goal.targetAmount.formatted()) hours / \(goal.timePeriod)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .onDelete { indexSet in
                    indexSet.forEach { index in
                        let goal = repository.goals[index]
                        repository.deleteGoal(goal)
                    }
                }
            }
            .navigationTitle("Goals")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        // TODO: Implement Add Goal Sheet
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .overlay {
                if repository.goals.isEmpty {
                    Text("No goals yet")
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}
