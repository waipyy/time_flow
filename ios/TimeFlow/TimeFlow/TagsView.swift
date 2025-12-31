import SwiftUI

struct TagsView: View {
    @StateObject private var repository = TagRepository()
    @State private var showingAddTag = false
    @State private var newTagName = ""
    @State private var newTagColor = Color.red
    
    var body: some View {
        NavigationView {
            List {
                ForEach(repository.tags) { tag in
                    HStack {
                        Circle()
                            .fill(Color(hex: tag.color))
                            .frame(width: 12, height: 12)
                        Text(tag.name)
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
                    .navigationTitle("New Tag")
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Cancel") {
                                showingAddTag = false
                            }
                        }
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Add") {
                                let tag = Tag(name: newTagName, color: newTagColor.toHex() ?? "#FF0000")
                                repository.addTag(tag)
                                showingAddTag = false
                            }
                            .disabled(newTagName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                    }
                }
                .presentationDetents([.medium])
            }
        }
    }
}
