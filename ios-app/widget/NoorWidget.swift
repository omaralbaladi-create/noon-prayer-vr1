import WidgetKit
import SwiftUI

// NoorPrayer widget: next prayer, its time and a live countdown.
// The app saves the prayer times (next ~8 days) in the shared App Group; this widget only reads them,
// so it keeps working and counting down without opening the app.

private let appGroup = "group.com.ageandcalculate.noorprayer"
private let prayerKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"]

// MARK: - Data

struct PrayerData: Codable {
    var lang: String?
    var names: [String: String]?
    var days: [[String: Double]]?
}

struct PrayerItem: Hashable {
    let key: String
    let name: String
    let time: Date
}

struct PrayerEntry: TimelineEntry {
    let date: Date
    let next: PrayerItem?
    let today: [PrayerItem]
    let lang: String
}

enum PrayerStore {
    static func load() -> PrayerData? {
        guard let text = UserDefaults(suiteName: appGroup)?.string(forKey: "prayerData"),
              let data = text.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(PrayerData.self, from: data)
    }

    static func items(_ data: PrayerData) -> [PrayerItem] {
        var out: [PrayerItem] = []
        for day in data.days ?? [] {
            for key in prayerKeys {
                if let ms = day[key], ms > 0 {
                    let name = data.names?[key] ?? key.capitalized
                    out.append(PrayerItem(key: key, name: name, time: Date(timeIntervalSince1970: ms / 1000)))
                }
            }
        }
        return out.sorted { $0.time < $1.time }
    }
}

// MARK: - Timeline

struct Provider: TimelineProvider {
    private static var sample: PrayerEntry {
        let now = Date()
        let items = [
            PrayerItem(key: "fajr", name: "Fajr", time: now.addingTimeInterval(-3600 * 6)),
            PrayerItem(key: "dhuhr", name: "Dhuhr", time: now.addingTimeInterval(3600 * 1.5)),
            PrayerItem(key: "asr", name: "Asr", time: now.addingTimeInterval(3600 * 5)),
            PrayerItem(key: "maghrib", name: "Maghrib", time: now.addingTimeInterval(3600 * 8)),
            PrayerItem(key: "isha", name: "Isha", time: now.addingTimeInterval(3600 * 9.5)),
        ]
        return PrayerEntry(date: now, next: items[1], today: items, lang: "en")
    }

    func placeholder(in context: Context) -> PrayerEntry {
        Provider.sample
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
        completion(Provider.build(at: Date()) ?? Provider.sample)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let now = Date()
        guard let data = PrayerStore.load() else {
            let empty = PrayerEntry(date: now, next: nil, today: [], lang: "ar")
            completion(Timeline(entries: [empty], policy: .after(now.addingTimeInterval(1800))))
            return
        }

        let lang = data.lang == "en" ? "en" : "ar"
        let all = PrayerStore.items(data)
        let future = all.filter { $0.time > now }
        let calendar = Calendar.current

        func todayList(_ date: Date) -> [PrayerItem] {
            all.filter { calendar.isDate($0.time, inSameDayAs: date) }
        }

        var entries: [PrayerEntry] = [
            PrayerEntry(date: now, next: future.first, today: todayList(now), lang: lang)
        ]
        // One entry at each prayer time, showing the prayer after it.
        let upcoming = Array(future.prefix(48))
        for (index, prayer) in upcoming.enumerated() {
            let following: PrayerItem? = index + 1 < future.count ? future[index + 1] : nil
            entries.append(PrayerEntry(date: prayer.time, next: following, today: todayList(prayer.time), lang: lang))
        }

        let refresh = max(upcoming.last?.time ?? now, now.addingTimeInterval(900))
        completion(Timeline(entries: entries, policy: .after(refresh)))
    }

    private static func build(at date: Date) -> PrayerEntry? {
        guard let data = PrayerStore.load() else { return nil }
        let all = PrayerStore.items(data)
        let calendar = Calendar.current
        let today = all.filter { calendar.isDate($0.time, inSameDayAs: date) }
        return PrayerEntry(date: date, next: all.first { $0.time > date }, today: today, lang: data.lang == "en" ? "en" : "ar")
    }
}

// MARK: - Views

private let green = Color(red: 0.04, green: 0.56, blue: 0.42)
private let deepGreen = Color(red: 0.02, green: 0.36, blue: 0.28)

private struct Strings {
    let lang: String
    var nextPrayer: String { lang == "ar" ? "الصلاة القادمة" : "Next prayer" }
    var openApp: String { lang == "ar" ? "افتح نور الصلاة لعرض المواقيت" : "Open NoorPrayer to load prayer times" }
    var app: String { lang == "ar" ? "نور الصلاة" : "NoorPrayer" }
}

struct PrayerWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: PrayerEntry

    private var strings: Strings { Strings(lang: entry.lang) }

    var body: some View {
        content
            .environment(\.layoutDirection, entry.lang == "ar" ? .rightToLeft : .leftToRight)
            .widgetBackground(accessory: isAccessory)
    }

    private var isAccessory: Bool {
        switch family {
        case .accessoryInline, .accessoryRectangular, .accessoryCircular: return true
        default: return false
        }
    }

    @ViewBuilder
    private var content: some View {
        switch family {
        case .accessoryInline: inline
        case .accessoryRectangular: rectangular
        case .accessoryCircular: circular
        case .systemMedium: medium
        default: small
        }
    }

    // Home screen, small.
    private var small: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(strings.nextPrayer)
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
            if let next = entry.next {
                Text(next.name)
                    .font(.title2.bold())
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Text(next.time, style: .time)
                    .font(.title3)
                    .foregroundColor(.white)
                Spacer(minLength: 0)
                Text(next.time, style: .timer)
                    .font(.subheadline.monospacedDigit())
                    .foregroundColor(.white.opacity(0.9))
            } else {
                Text(strings.openApp)
                    .font(.footnote)
                    .foregroundColor(.white)
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    // Home screen, medium: next prayer on one side, today's five prayers on the other.
    private var medium: some View {
        HStack(alignment: .top, spacing: 12) {
            small
            VStack(alignment: .leading, spacing: 3) {
                ForEach(entry.today, id: \.self) { item in
                    let isNext = item == entry.next
                    HStack {
                        Text(item.name)
                        Spacer(minLength: 4)
                        Text(item.time, style: .time)
                    }
                    .font(.caption.weight(isNext ? .bold : .regular))
                    .foregroundColor(.white.opacity(isNext ? 1 : 0.75))
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    // Lock screen widgets.
    private var inline: some View {
        Group {
            if let next = entry.next {
                Text("\(next.name) ") + Text(next.time, style: .time)
            } else {
                Text(strings.app)
            }
        }
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 1) {
            if let next = entry.next {
                Text(next.name).font(.headline)
                Text(next.time, style: .time)
                Text(next.time, style: .timer).monospacedDigit()
            } else {
                Text(strings.app).font(.headline)
                Text(strings.openApp).font(.caption)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var circular: some View {
        VStack(spacing: 0) {
            if let next = entry.next {
                Text(next.name).font(.caption2).minimumScaleFactor(0.6).lineLimit(1)
                Text(next.time, style: .time).font(.caption2.bold()).minimumScaleFactor(0.6).lineLimit(1)
            } else {
                Text(strings.app).font(.caption2).minimumScaleFactor(0.6).lineLimit(1)
            }
        }
    }
}

extension View {
    @ViewBuilder
    func widgetBackground(accessory: Bool) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(for: .widget) {
                if accessory {
                    Color.clear
                } else {
                    LinearGradient(colors: [green, deepGreen], startPoint: .topLeading, endPoint: .bottomTrailing)
                }
            }
        } else {
            if accessory {
                self
            } else {
                self.padding().background(LinearGradient(colors: [green, deepGreen], startPoint: .topLeading, endPoint: .bottomTrailing))
            }
        }
    }
}

// MARK: - Widget

struct NoorPrayerWidget: Widget {
    let kind = "NoorPrayerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PrayerWidgetView(entry: entry)
        }
        .configurationDisplayName("NoorPrayer")
        .description("Next prayer, its time and a countdown. الصلاة القادمة ووقتها والوقت المتبقي.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline, .accessoryCircular])
    }
}

@main
struct NoorWidgetBundle: WidgetBundle {
    var body: some Widget {
        NoorPrayerWidget()
    }
}
