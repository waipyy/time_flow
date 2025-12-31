import SwiftUI

struct GoalsView: View {
    @StateObject private var repository = GoalRepository()
    @State private var showingAddGoal = false
    @State private var selectedGoal: Goal?
    
    var body: some View {
        NavigationView {
            List {
                ForEach(repository.goals) { goal in
                    Button {
                        selectedGoal = goal
                    } label: {
                        VStack(alignment: .leading) {
                            Text(goal.name)
                                .font(.headline)
                                .foregroundColor(.primary)
                            Text("\(goal.comparison == "at-least" ? "≥" : "≤") \(goal.targetAmount.formatted())h / \(goal.timePeriod)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
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
                        showingAddGoal = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddGoal) {
                AddGoalView(onSave: { newGoal in
                    repository.addGoal(newGoal)
                })
            }
            .sheet(item: $selectedGoal) { goal in
                AddGoalView(
                    goalToEdit: goal,
                    onSave: { updatedGoal in
                        repository.updateGoal(updatedGoal)
                    },
                    onDelete: { goalToDelete in
                        repository.deleteGoal(goalToDelete)
                    }
                )
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
