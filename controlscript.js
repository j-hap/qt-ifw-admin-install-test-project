function Controller() {
  // stores the last checked directory to avoid duplicate prompts
  installer.setValue("LastCheckedDirectory", "");
}

Controller.prototype.TargetDirectoryPageCallback = function () {
  // Run the check once for the current directory
  checkAndPromptForUninstall(installer.value("TargetDir"));
  // Now connect the signal for subsequent user-driven directory changes
  installer.installDirectoryChanged.connect(checkAndPromptForUninstall);
}

function checkAndPromptForUninstall(targetDir) {
  console.log("=== Checking directory:", targetDir);

  // skips check if we're in uninstaller mode
  if (installer.isUninstaller()) {
    console.log("Uninstaller mode, skipping check");
    return;
  }

  // prevents duplicate checks for the same directory
  var lastChecked = installer.value("LastCheckedDirectory");
  if (lastChecked === targetDir) {
    console.log("Already checked this directory, skipping");
    return;
  }
  installer.setValue("LastCheckedDirectory", targetDir);

  var maintenanceToolName = installer.value("MaintenanceToolName");
  var exeSuffix = systemInfo.productType === "windows" ? ".exe" : "";
  var uninstallerPath = targetDir + "/" + maintenanceToolName + exeSuffix;
  var componentsXmlPath = targetDir + "/components.xml";

  if (installer.fileExists(uninstallerPath)) {
    console.log("Found existing uninstaller:", uninstallerPath);

    // verifies it's a Qt Installer Framework installation
    if (!installer.fileExists(componentsXmlPath)) {
      QMessageBox.critical(
        "unknown.installation",
        "Existing Installation Found",
        "An existing installation was found in the selected directory.<br>" +
        "However, it appears to be from a different application.<br><br>" +
        "Please select a different directory or manually remove the existing files.",
        QMessageBox.Ok
      );
      return;
    }

    // reads and validates the installed product
    var xmlContent = installer.readFile(componentsXmlPath, "UTF-8");
    var appNameMatch = xmlContent.match(/<ApplicationName>([^<]+)<\/ApplicationName>/);

    if (!appNameMatch) {
      QMessageBox.critical(
        "invalid.components",
        "Existing Installation Found",
        "An existing installation was found in the selected directory.<br>" +
        "However, the installation appears to be corrupted or invalid.<br><br>" +
        "Please manually remove the installation or select a different directory.",
        QMessageBox.Ok
      );
      return;
    }

    var installedAppName = appNameMatch[1];
    var currentAppName = installer.value("ProductName");

    if (installedAppName !== currentAppName) {
      QMessageBox.critical(
        "wrong.product",
        "Existing Installation Found",
        "An existing installation was found in the selected directory.<br>" +
        "The directory contains '" + installedAppName + "', not '" + currentAppName + "'.<br><br>" +
        "Please select a different directory.",
        QMessageBox.Ok
      );
      return;
    }

    // shows dialog to uninstall old version
    var result = QMessageBox.question(
      "uninstall.required",
      "Existing Installation Found",
      "An existing " + currentAppName + " installation was found in:<br><br>" + targetDir + "<br><br>" +
      "The old version must be uninstalled before continuing.<br><br>" +
      "Do you want to uninstall it now?<br>" +
      "Note: If you click 'No', you must select a different installation directory.",
      QMessageBox.Yes | QMessageBox.No
    );

    if (result === QMessageBox.Yes) {
      console.log("User confirmed uninstall, launching uninstaller");

      // launches uninstaller with GUI (detached process)
      installer.executeDetached(uninstallerPath, ["--confirm-command", "uninstall"]);

      QMessageBox.information(
        "uninstall.launched",
        "Uninstaller Started",
        "The uninstaller has been started.<br><br>" +
        "Please complete the uninstallation, then return to this installer to continue.",
        QMessageBox.Ok
      );
    } else {
      console.log("User declined uninstall");
      QMessageBox.information(
        "change.directory",
        "Change Installation Directory",
        "Please select a different installation directory to continue.",
        QMessageBox.Ok
      );
      // resetting last checked directory to allow re-check after user declined uninstall
      installer.setValue("LastCheckedDirectory", "");
    }
  }
}
