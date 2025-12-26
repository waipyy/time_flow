import SwiftUI

struct CalendarView: View {
    @State private var events: [Event] = Event.sampleEvents
    @State private var currentDate = Date()
    
    private let hourHeight: CGFloat = 60
    private let startHour = 0
    private let endHour = 24
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text(currentDate.formatted(date: .complete, time: .omitted))
                        .font(.headline)
                        .padding()
                    Spacer()
                }
                .background(Color(uiColor: .systemBackground))
                .shadow(radius: 1)
                
                // Timeline
                ScrollView {
                    ZStack(alignment: .topLeading) {
                        // Grid lines and times
                        VStack(spacing: 0) {
                            ForEach(startHour..<endHour, id: \.self) { hour in
                                HStack(alignment: .top) {
                                    Text("\(hour):00")
                                        .font(.caption)
                                        .frame(width: 50, alignment: .trailing)
                                        .padding(.trailing, 8)
                                        .offset(y: -7) // Align with line
                                    
                                    Rectangle()
                                        .fill(Color.gray.opacity(0.2))
                                        .frame(height: 1)
                                }
                                .frame(height: hourHeight, alignment: .top)
                            }
                        }
                        .padding(.top, 10) // Padding for first label
                        
                        // Events
                        ForEach(events) { event in
                            EventView(event: event)
                                .frame(height: height(for: event))
                                .offset(x: 60, y: offset(for: event) + 10) // +10 matches top padding
                                .padding(.trailing, 70) // Prevent going off screen
                        }
                        
                        // Current Time Indicator (if today)
                        if Calendar.current.isDateInToday(currentDate) {
                            CurrentTimeLine()
                                .offset(x: 60, y: currentTimeOffset() + 10)
                        }
                    }
                    .padding(.bottom, 20)
                }
            }
            .navigationTitle("TimeFlow")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    // Helper functions for layout
    private func offset(for event: Event) -> CGFloat {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: event.startTime)
        let minute = calendar.component(.minute, from: event.startTime)
        return CGFloat(hour) * hourHeight + CGFloat(minute) / 60 * hourHeight
    }
    
    private func height(for event: Event) -> CGFloat {
        let duration = event.endTime.timeIntervalSince(event.startTime)
        return CGFloat(duration) / 3600 * hourHeight
    }
    
    private func currentTimeOffset() -> CGFloat {
        let calendar = Calendar.current
        let now = Date()
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        return CGFloat(hour) * hourHeight + CGFloat(minute) / 60 * hourHeight
    }
}

struct EventView: View {
    let event: Event
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(event.title)
                .font(.caption)
                .bold()
            Text(event.startTime.formatted(date: .omitted, time: .shortened))
                .font(.caption2)
        }
        .padding(4)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .background(event.color.opacity(0.3))
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(event.color, lineWidth: 1)
        )
    }
}

struct CurrentTimeLine: View {
    var body: some View {
        HStack {
            Circle()
                .fill(.red)
                .frame(width: 8, height: 8)
            Rectangle()
                .fill(.red)
                .frame(height: 1)
        }
    }
}

#Preview {
    CalendarView()
}
