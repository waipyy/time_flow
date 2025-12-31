import SwiftUI

struct TagsView: View {
    @StateObject private var repository = TagRepository()
    @State private var showingAddTag = false
    @State private var tagToEdit: Tag? // Valid ID means editing
    @State private var newTagName = ""
    @State private var newTagColor = Color.red
    
    var body: some View {
        NavigationView {
            List {
                ForEach(repository.tags) { tag in
                    Button {
                        // Prepare for editing
                        tagToEdit = tag
                        newTagName = tag.name
                        newTagColor = Color(hex: tag.color) // Load existing color
                        showingAddTag = true
                    } label: {
                        HStack {
                            Circle()
                                .fill(Color(hex: tag.color))
                                .frame(width: 12, height: 12)
                            Text(tag.name)
                                .foregroundColor(.primary)
                        }
                    }
                }
                .onDelete { indexSet in
                    indexSet.forEach { index in
                        let tag = repository.tags[index]
                        repository.deleteTag(tag)
                    }
                }
            }
            .navigationTitle("Tags")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        // Prepare for creating new
                        tagToEdit = nil
                        newTagName = ""
                        newTagColor = .red
                        showingAddTag = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddTag) {
                NavigationView {
                    Form {
                        Section(header: Text("Tag Details")) {
                            TextField("Tag Name", text: $newTagName)
                            ColorPicker("Color", selection: $newTagColor)
                        }
                    }
                    .navigationTitle(tagToEdit == nil ? "New Tag" : "Edit Tag")
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Cancel") {
                                showingAddTag = false
                            }
                        }
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Save") {
                                saveTag()
                            }
                            .disabled(newTagName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                    }
                }
                .presentationDetents([.medium])
            }
        }
    }
    
    private func saveTag() {
        let colorHex = newTagColor.toHex() ?? "#FF0000"
        
        let tag = Tag(
            id: tagToEdit?.id, // ID is nil for new, existing for edit
            name: newTagName,
            color: colorHex
        )
        
        if tag.id != nil {
            repository.updateTag(tag)
        } else {
            repository.addTag(tag)
        }
        
        showingAddTag = false
    }
}
