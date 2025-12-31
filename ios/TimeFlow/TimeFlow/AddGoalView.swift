import SwiftUI

struct AddGoalView: View {
    @Environment(\.dismiss) var dismiss
    
    var goalToEdit: Goal?
    var onSave: (Goal) -> Void
    var onDelete: ((Goal) -> Void)?
    
    @State private var name: String
    @State private var targetAmount: Double
    @State private var timePeriod: String
    @State private var comparison: String
    @State private var eligibleTagsString: String
    
    let timePeriods = ["daily", "weekly", "monthly"]
    let comparisons = ["at-least", "no-more-than"]
    
    init(goalToEdit: Goal? = nil, onSave: @escaping (Goal) -> Void, onDelete: ((Goal) -> Void)? = nil) {
        self.goalToEdit = goalToEdit
        self.onSave = onSave
        self.onDelete = onDelete
        
        _name = State(initialValue: goalToEdit?.name ?? "")
        _targetAmount = State(initialValue: goalToEdit?.targetAmount ?? 1.0)
        _timePeriod = State(initialValue: goalToEdit?.timePeriod ?? "daily")
        _comparison = State(initialValue: goalToEdit?.comparison ?? "at-least")
        _eligibleTagsString = State(initialValue: goalToEdit?.eligibleTags.joined(separator: ", ") ?? "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Goal Details")) {
                    TextField("Name", text: $name)
                    Stepper(value: $targetAmount, in: 0.5...24, step: 0.5) {
                        Text("Target: \(targetAmount.formatted()) hours")
                    }
                    Picker("Period", selection: $timePeriod) {
                        ForEach(timePeriods, id: \.self) { period in
                            Text(period.capitalized).tag(period)
                        }
                    }
                    Picker("Comparison", selection: $comparison) {
                        ForEach(comparisons, id: \.self) { comp in
                            Text(comp.replacingOccurrences(of: "-", with: " ").capitalized).tag(comp)
                        }
                    }
                }
                
                Section(header: Text("Eligible Tags"), footer: Text("Comma separated list of tag names")) {
                    TextField("Tags", text: $eligibleTagsString)
                }
                
                if let goal = goalToEdit, let onDelete = onDelete {
                    Section {
                        Button("Delete Goal", role: .destructive) {
                            onDelete(goal)
                            dismiss()
                        }
                    }
                }
            }
            .navigationTitle(goalToEdit != nil ? "Edit Goal" : "New Goal")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveGoal()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
    
    private func saveGoal() {
        let tags = eligibleTagsString.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        
        let newGoal = Goal(
            id: goalToEdit?.id,
            name: name,
            eligibleTags: tags,
            targetAmount: targetAmount,
            timePeriod: timePeriod,
            comparison: comparison
        )
        
        onSave(newGoal)
        dismiss()
    }
}
