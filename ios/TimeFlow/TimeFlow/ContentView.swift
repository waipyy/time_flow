//
//  ContentView.swift
//  TimeFlow
//
//  Created for TimeFlow iOS App
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
            
            GoalsView()
                .tabItem {
                    Label("Goals", systemImage: "target")
                }
            
            TagsView()
                .tabItem {
                    Label("Tags", systemImage: "tag")
                }
        }
    }
}

#Preview {
    ContentView()
}

