import SwiftUI

struct AddEventView: View {
    @Environment(\.dismiss) var dismiss
    
    var eventToEdit: Event?
    var onSave: (Event) -> Void
    var onDelete: ((Event) -> Void)?
    
    // Form States
    @State private var title: String
    @State private var description: String
    @State private var tagsString: String
    @State private var startTime: Date
    @State private var endTime: Date
    @State private var color: Color
    
    init(eventToEdit: Event? = nil, onSave: @escaping (Event) -> Void, onDelete: ((Event) -> Void)? = nil) {
        self.eventToEdit = eventToEdit
        self.onSave = onSave
        self.onDelete = onDelete
        
        _title = State(initialValue: eventToEdit?.title ?? "")
        _description = State(initialValue: eventToEdit?.description ?? "")
        _tagsString = State(initialValue: eventToEdit?.tags.joined(separator: ", ") ?? "")
        _startTime = State(initialValue: eventToEdit?.startTime ?? Date())
        _endTime = State(initialValue: eventToEdit?.endTime ?? Date().addingTimeInterval(3600))
        _color = State(initialValue: eventToEdit?.color ?? .blue)
    }
    
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
                
                if let event = eventToEdit, let onDelete = onDelete {
                    Section {
                        Button("Delete Event", role: .destructive) {
                            onDelete(event)
                            dismiss()
                        }
                    }
                }
            }
            .navigationTitle(eventToEdit != nil ? "Edit Event" : "New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveEvent()
                    }
                    .disabled(!isValid)
                }
            }
        }
    }
    
    private func saveEvent() {
        let tags = tagsString.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        
        // Use existing ID if editing, otherwise new UUID
        let id = eventToEdit?.id ?? UUID()
        
        let newEvent = Event(
            id: id,
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
