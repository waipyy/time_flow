import SwiftUI

struct TagsView: View {
    @StateObject private var repository = TagRepository()
    @State private var showingAddTag = false
    @State private var newTagName = ""
    @State private var newTagColor = "#FF0000"
    
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
                        showingAddTag = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .alert("New Tag", isPresented: $showingAddTag) {
                TextField("Tag Name", text: $newTagName)
                Button("Add") {
                    let tag = Tag(name: newTagName, color: newTagColor)
                    repository.addTag(tag)
                    newTagName = ""
                    newTagColor = "#" + String(Int.random(in: 0...0xFFFFFF), radix: 16, uppercase: true) // Random color next
                }
                Button("Cancel", role: .cancel) { }
            }
        }
    }
}
