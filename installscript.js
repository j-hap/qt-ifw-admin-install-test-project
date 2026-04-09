function Component() {
  // constructor
  // sets target directory based on admin rights
  if (installer.hasAdminRights()) {
    // this is honored when the installer determines where the registry entries for the uninstaller go in windows
    installer.setValue("AllUsers", "true");
    installer.setValue("TargetDir", installer.value("ApplicationsDirX64") + "/@PROJECT_NAME@");

    // DesktopDir is determined in the constructor of the installer based on the "AllUsers" value ONCE!
    // so setting AllUsers late in this script has no effect
    var publicDesktop = installer.environmentVariable("PUBLIC");
    if (publicDesktop !== "") {
      installer.setValue("DesktopDir", publicDesktop + "/Desktop");
    }
  }
}

function addShortcut(targetPath, shortcutPath) {
  component.addOperation("CreateShortcut",
    targetPath,
    shortcutPath,
    "workingDirectory=" + installer.value("TargetDir"),
    "iconPath=" + targetPath,
    "iconId=0",
    "description=@PROJECT_NAME@ Application",
    "@DEMO_IFW_SHORTCUT_ARGUMENTS@");
}

Component.prototype.createOperations = function () {
  // call default implementation to actually install the files
  component.createOperations();

  if (systemInfo.productType === "windows") {
    var targetPath = installer.value("TargetDir") + "/@CMAKE_INSTALL_BINDIR@/@TARGET_NAME@.exe";
    var linkName = "@PROJECT_NAME@.lnk";
    addShortcut(targetPath, installer.value("DesktopDir") + "/" + linkName);
    var linkPath = installer.value("StartMenuDir") + "/" + linkName;
    addShortcut(targetPath, linkPath);
    if (installer.hasAdminRights()) {
      // The all-users start menu path must be computed here in createOperations() rather than in
      // the Component() constructor, because in GUI mode StartMenuDir only gets its final value
      // when the user leaves the StartMenuDirectoryPage — which happens after the constructor runs.
      //
      // StartMenuDir is a full absolute path in CLI mode (e.g. "C:\Users\...\Start Menu\Programs\Demo")
      // and after the StartMenuDirectoryPage in GUI mode. Extract the leaf folder name to build
      // the all-users path correctly.
      var startMenuDir = installer.value("StartMenuDir");
      // extracting the leaf folder from a path as proposed on
      // https://www.javaspring.net/blog/how-to-get-last-folder-name-from-folder-path-in-javascript/
      var match = startMenuDir.match(/([^\/\\]+)[\/\\]?$/);
      var dirName = match ? match[1] : startMenuDir;
      var allUsersStartMenuPath = installer.value("AllUsersStartMenuProgramsPath") + "/" + dirName;
      var allUsersLinkPath = allUsersStartMenuPath + "/" + linkName;
      // Moves the Start menu shortcut to the all-users Start menu if the installer was run with
      // admin rights, because otherwise a windows bug would swallow the arguments as listed in
      // https://doc.qt.io/qtinstallerframework/operations.html
      component.addOperation("Mkdir", allUsersStartMenuPath);
      component.addOperation("Move", linkPath, allUsersLinkPath);
    }
  }
}
