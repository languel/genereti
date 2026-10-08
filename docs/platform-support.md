# Platform support

Genereti's supported Comfy framework consists of browser creative coding, drawing/capture, audio, textures, signals, data, lessons and timeline tools. It does not require Apple's model runtime. Use the [single-folder Comfy installation](comfy-distribution.md) on macOS, Windows or Linux with a supported Comfy version and modern browser.

WebGPU texture operators require browser/GPU WebGPU support. Audio needs an explicit user start. Camera and screen capture depend on browser permissions and host support. Platform-specific MIDI/OSC connections are optional.

The historical Core ML generator required macOS 14+ on Apple silicon; its source is now archived for migration to [GeneretiCore](https://github.com/languel/genereticore). Core AI experiments there require macOS 27+. GeneretiCore is not yet an installable replacement. No inference demos are installed by this lightweight package.
