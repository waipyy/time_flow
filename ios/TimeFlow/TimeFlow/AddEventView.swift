import SwiftUI

struct AddEventView: View {
    @Environment(\.dismiss) var dismiss
    
    // Form States
    @State private var title: String = ""
    @State private var description: String = ""
    @State private var tagsString: String = "" // Simpler input for now: comma separated
    @State private var startTime = Date()
    @State private var endTime = Date().addingTimeInterval(3600)
    @State private var color: Color = .blue
    
    var onSave: (Event) -> Void
    
    // Validation
    private var isValid: Bool {
        !title.isEmpty && endTime > startTime
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Details")) {
                    TextField("Title", text: $title)
                    TextField("Description (Optional)", text: $description)
                    TextField("Tags (comma separated)", text: $tagsString)
                }
                
                Section(header: Text("Time")) {
                    DatePicker("Start Time", selection: $startTime)
                    DatePicker("End Time", selection: $endTime)
                }
                
                Section(header: Text("Appearance")) {
                    ColorPicker("Event Color", selection: $color)
                }
            }
            .navigationTitle("New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        saveEvent()
                    }
                    .disabled(!isValid)
                }
            }
        }
    }
    
    private func saveEvent() {
        let tags = tagsString.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        
        let newEvent = Event(
            title: title,
            description: description.isEmpty ? nil : description,
            tags: tags,
            startTime: startTime,
            endTime: endTime,
            color: color
        )
        onSave(newEvent)
        dismiss()
    }
}

#Preview {
    AddEventView(onSave: { _ in })
}
