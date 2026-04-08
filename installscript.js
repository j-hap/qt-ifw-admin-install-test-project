function Component() {
  // constructor
  // sets target directory based on admin rights
  if (installer.hasAdminRights()) {
    installer.setValue("TargetDir", installer.value("ApplicationsDirX64") + "/@PROJECT_NAME@");
    var publicDesktop = installer.environmentVariable("PUBLIC");
    if (publicDesktop !== "") {
      installer.setValue("DesktopDir", publicDesktop + "/Desktop");
    }
    // StartMenuDir is a full absolute path in cli-mode (e.g. "C:\Users\...\Start Menu\Programs\Demo").
    // extracts just the leaf folder name to build the all-users path correctly
    var startMenuDir = installer.value("StartMenuDir");
    https://www.javaspring.net/blog/how-to-get-last-folder-name-from-folder-path-in-javascript/
    var match = startMenuDir.match(/([^\/\\]+)[\/\\]?$/);
    var dirName = match ? match[1] : startMenuDir;
    installer.setValue("StartMenuPath", installer.value("AllUsersStartMenuProgramsPath") + "/" + dirName);
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
    if (installer.containsValue("StartMenuPath")) {
      var allUsersLinkPath = installer.value("StartMenuPath") + "/" + linkName;
      // moves the Start menu shortcut to the all-users Start menu if the installer was run with admin rights, because otherwise a windows but would
      // swallow the arguments as listed in https://doc.qt.io/qtinstallerframework/operations.html
      component.addOperation("Mkdir", installer.value("StartMenuPath"));
      component.addOperation("Move", linkPath, allUsersLinkPath);
    }
  }
}
