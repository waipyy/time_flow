import SwiftUI

struct AddEventView: View {
    @Environment(\.dismiss) var dismiss
    
    var eventToEdit: Event?
    var onSave: (Event) -> Void
    var onDelete: ((Event) -> Void)?
    
    @StateObject private var tagRepository = TagRepository()
    
    // Form States
    @State private var title: String
    @State private var description: String
    @State private var selectedTagId: String = "" // Single tag selection for now
    @State private var startTime: Date
    @State private var endTime: Date
    
    init(eventToEdit: Event? = nil, onSave: @escaping (Event) -> Void, onDelete: ((Event) -> Void)? = nil) {
        self.eventToEdit = eventToEdit
        self.onSave = onSave
        self.onDelete = onDelete
        
        _title = State(initialValue: eventToEdit?.title ?? "")
        _description = State(initialValue: eventToEdit?.description ?? "")
        // Pre-select the first tag if available, otherwise empty
        _selectedTagId = State(initialValue: eventToEdit?.tags.first ?? "")
        _startTime = State(initialValue: eventToEdit?.startTime ?? Date())
        _endTime = State(initialValue: eventToEdit?.endTime ?? Date().addingTimeInterval(3600))
    }
    
    // Validation
    private var isValid: Bool {
        !title.isEmpty && endTime > startTime && !selectedTagId.isEmpty
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Details")) {
                    TextField("Title", text: $title)
                    TextField("Description (Optional)", text: $description)
                }
                
                Section(header: Text("Tag")) {
                    if tagRepository.tags.isEmpty {
                        Text("No tags available. Please create a tag first.")
                            .foregroundColor(.secondary)
                    } else {
                        Picker("Select Tag", selection: $selectedTagId) {
                            Text("Select a Tag").tag("")
                            ForEach(tagRepository.tags) { tag in
                                HStack {
                                    Circle()
                                        .fill(Color(hex: tag.color))
                                        .frame(width: 10, height: 10)
                                    Text(tag.name)
                                }
                                .tag(tag.name) // Using name as ID for now to match Event model (array of strings)
                            }
                        }
                    }
                }
                
                Section(header: Text("Time")) {
                    DatePicker("Start Time", selection: $startTime)
                    DatePicker("End Time", selection: $endTime)
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
        // Find the selected tag to get its color
        let tagColorHex = tagRepository.tags.first(where: { $0.name == selectedTagId })?.color ?? "#0000FF"
        let tags = [selectedTagId]
        
        // Use existing ID if editing, otherwise nil (Firestore will generate)
        let id = eventToEdit?.id
        
        var newEvent = Event(
            id: id,
            title: title,
            description: description.isEmpty ? nil : description,
            tags: tags,
            startTime: startTime,
            endTime: endTime
        )
        // Explicitly set the color from the tag
        newEvent.colorHex = tagColorHex
        
        onSave(newEvent)
        dismiss()
    }
}

#Preview {
    AddEventView(onSave: { _ in })
}
