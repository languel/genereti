import AppKit
import WebKit

// One user-started, local output surface. No capture, models or remote browsing.
final class OutputApp: NSObject, NSApplicationDelegate, NSWindowDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var view: WKWebView!
    let url: URL
    init(url: URL) { self.url = url }
    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 960, height: 720),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "ꘇ output"
        window.delegate = self
        window.isReleasedWhenClosed = false
        window.isOpaque = false
        window.backgroundColor = .clear
        window.collectionBehavior = [.fullScreenPrimary]
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        view = WKWebView(frame: .zero, configuration: configuration)
        view.setValue(false, forKey: "drawsBackground")
        view.underPageBackgroundColor = .clear
        view.navigationDelegate = self
        window.contentView = view
        window.center()
        window.makeKeyAndOrderFront(nil)
        view.load(URLRequest(url: url))
        NSApp.activate(ignoringOtherApps: true)
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard let self = self else { return event }
            if event.charactersIgnoringModifiers?.lowercased() == "f", !event.modifierFlags.contains(.command), !event.modifierFlags.contains(.control) {
                self.window.toggleFullScreen(nil); return nil
            }
            if event.keyCode == 53, self.window.styleMask.contains(.fullScreen) { self.window.toggleFullScreen(nil); return nil }
            return event
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Keep the helper confined to the supplied loopback origin.
        guard let destination = navigationAction.request.url,
              destination.scheme == url.scheme, destination.host == url.host,
              destination.port == url.port else { decisionHandler(.cancel); return }
        decisionHandler(.allow)
    }
    func windowWillClose(_ notification: Notification) { NSApp.terminate(nil) }
}
let args = CommandLine.arguments
 guard args.count == 2, let url = URL(string: args[1]), url.scheme == "http",
       ["127.0.0.1", "localhost", "::1"].contains(url.host ?? ""),
       url.path.hasPrefix("/genereti/native-output/") else { exit(2) }
let application = NSApplication.shared
application.setActivationPolicy(.regular)
let delegate = OutputApp(url: url)
application.delegate = delegate
let menu = NSMenu()
let item = NSMenuItem(); menu.addItem(item)
let appMenu = NSMenu(); item.submenu = appMenu
appMenu.addItem(withTitle: "Quit ꘇ output", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
application.mainMenu = menu
application.run()
