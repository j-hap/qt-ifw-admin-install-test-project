# Qt IFW Admin Install Test Project

Minimal reproducer to verify that a Qt Installer Framework (IFW) installer
correctly performs system-wide installations when run with administrator
privileges, and that the expected Windows registry entries are created so
the application appears in **Settings > Apps > Installed apps**.

## Background

When Qt IFW installers are executed from an elevated (administrator) prompt,
several things must work correctly:

- The application installs to `C:\Program Files\<AppName>` instead of the
  per-user `AppData\Local` directory.
- Desktop shortcuts are placed on the **Public Desktop** (visible to all users).
- Start Menu shortcuts are created in the **All Users** Start Menu.
- An **Uninstall registry entry** is written under
  `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall` so that Windows
  lists the application in "Installed apps" / "Programs and Features".

This project packages a trivial Qt application (`demo.exe`) with CPack's IFW
generator and provides an automated test script to verify all of the above.

## Prerequisites

- **Qt 6.5+** (tested with Qt 6.9.1, MSVC 2022 x64)
- **Qt Installer Framework 4.x** (tested with 4.10)
- **Visual Studio 2022/2026** with the C++ desktop workload
- **CMake 3.19+**

## Project Structure

| File                | Purpose |
|---------------------|---------|
| `CMakeLists.txt`    | Builds `demo.exe` and configures the IFW installer via CPack |
| `installscript.js`  | IFW component script — creates shortcuts and handles admin vs. user paths |
| `controlscript.js`  | IFW controller script — detects existing installations and offers uninstall |
| `build_and_test.ps1`| Automated end-to-end test: build → install → verify registry → uninstall |
| `main.cpp`          | Trivial Qt application (the payload) |

## Usage

### Build the installer

Configure and build from your IDE or command line:

```powershell
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build --target package
```

The generated `Demo-<version>-Setup.exe` will be in the build directory.

### Run the automated test

The test script builds the installer, runs a silent installation, checks the
registry, and uninstalls — all in one step. **Run it from an elevated
(administrator) PowerShell prompt** to test the admin install path:

```powershell
.\build_and_test.ps1
```

The script exits with code 0 on success. If the registry entry is missing, it
exits with code 1 and prints a diagnostic message.

### Manual testing

Launch the installer interactively (from an elevated prompt to test admin
behavior):

```powershell
.\build\Qt-6.9.1\Release\Demo-0.0.0-Setup.exe --verbose
```

## Key Implementation Details

### Component assignment (`CPACK_COMPONENTS_ALL`)

CPack's IFW generator only applies per-component settings (install scripts,
component names, etc.) when component-aware packaging is enabled. This
requires:

1. `install(TARGETS ... COMPONENT <name>)` — assigns files to a named component.
2. `set(CPACK_COMPONENTS_ALL "<name>")` — tells CPack to use component-based
   packaging. Without this, all IFW component configuration is silently
   ignored.

### Start Menu path handling

`installer.value("StartMenuDir")` returns a relative name (`"Demo"`) in
interactive mode but a fully resolved absolute path in CLI/silent mode. The
install script extracts the leaf folder name to safely construct the All Users
Start Menu path regardless of mode.
