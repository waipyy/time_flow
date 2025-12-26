//
//  ContentView.swift
//  TimeFlow
//
//  Created for TimeFlow iOS App
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        ZStack {
            Color.clear
            Text("TimeFlow")
                .font(.largeTitle)
                .fontWeight(.medium)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    ContentView()
}

