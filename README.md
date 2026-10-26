# Vivo `vr.ko` patcher

A browser-based tool for removing the `vr.ko` kernel module from a Vivo device's `vendor_boot` image. The image is processed locally in your browser using WebAssembly; it is not uploaded to a server.

## Online demo

Open the [Vivo `vr.ko` patcher demo](https://bakasu.org/vivo-vr-patcher/demo).

## Usage

1. Back up the original `vendor_boot` image and make sure you have the image for the firmware currently installed on your device.
2. Open the online demo and select the `vendor_boot.img` file.
3. Click **Remove vr.ko and download**.
4. Wait for processing to finish, then save the generated `vendor_boot_no_vr.img`.

The tool supports `vendor_boot` v4 images that contain a vendor ramdisk table. It selects the `init_boot` ramdisk entry when present, otherwise it uses the first unnamed entry. It removes `vr.ko` from the matching module directories and cleans references from `modules.load`, `modules.dep`, `modules.softdep`, and `modules.load.recovery`.

> **Warning:** Flashing an incorrect or firmware-mismatched image can prevent your device from booting. Keep a backup of the original image and verify that the output is appropriate for your device and firmware before flashing it.

## Local development

Prerequisites: Node.js, Yarn, and Rust. The Rust toolchain configuration installs the `wasm32-unknown-unknown` target.

```sh
yarn install
yarn dev
```

This builds the WebAssembly module and starts the VitePress development server. To build the module and production documentation site:

```sh
yarn build
```

## Project structure

```text
.
├── src/
│   └── lib.rs                         # WebAssembly image patching logic
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts                 # VitePress site configuration
│   │   └── theme/
│   │       ├── components/
│   │       │   └── VivoVrPatcher.vue  # Interactive patching UI
│   │       ├── index.ts               # Registers the demo component and theme
│   │       └── style.css              # Custom theme and component styles
│   ├── public/
│   │   └── tools/
│   │       └── vivo-vr-patcher-worker.js  # Loads and runs the WebAssembly module
│   ├── demo.md                        # Interactive demo page
│   └── index.md                       # Documentation home page
├── build.mjs                          # Builds and copies the WebAssembly module
├── Cargo.toml                         # Rust package and dependencies
├── package.json                       # JavaScript dependencies and scripts
├── rust-toolchain.toml                # Rust toolchain configuration
├── LICENSE
└── README.md
```

## License

This project is licensed under the GNU General Public License v3.0 only. See [LICENSE](LICENSE).

## Original

https://github.com/ReSukiSU/ReSukiSU.github.io/tree/a458eb4922a7a97c5461b67c60b3baac68da20ce