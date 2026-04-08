cmake_minimum_required(VERSION 3.19)
include(cmake/GetGitVersion.cmake)
get_git_version(DEMO_GIT_DESCRIBE DEMO_VERSION)
project(
  Demo
  VERSION ${DEMO_VERSION}
  DESCRIPTION "Application that does nothing really fast."
  LANGUAGES CXX)

find_package(Qt6 6.5 REQUIRED COMPONENTS Core)

qt_standard_project_setup()

set(TARGET_NAME demo)
qt_add_executable(${TARGET_NAME} main.cpp)

target_link_libraries(${TARGET_NAME} PRIVATE Qt::Core)

install(
  TARGETS ${TARGET_NAME}
  COMPONENT ${TARGET_NAME}
  BUNDLE DESTINATION .
  RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
  LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR})

# packaging
set(DEMO_IFW_SHORTCUT_ARGUMENTS "test") # only to stay close to the original
                                        # project
configure_file("${CMAKE_CURRENT_SOURCE_DIR}/installscript.js"
               "${CMAKE_CURRENT_BINARY_DIR}/installscript.js" @ONLY)
set(CPACK_IFW_ROOT
    "C:/Qt/Tools/QtInstallerFramework/4.10"
    CACHE PATH "Path to Qt Installer Framework")

set(CPACK_GENERATOR "IFW")
set(CPACK_PACKAGE_NAME "${PROJECT_NAME}")
set(CPACK_PACKAGE_VENDOR "Example Company")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "${PROJECT_DESCRIPTION}")
set(CPACK_PACKAGE_INSTALL_DIRECTORY "${PROJECT_NAME}")
set(CPACK_PACKAGE_EXECUTABLES "${TARGET_NAME}" "${PROJECT_NAME}")
set(CPACK_PACKAGE_FILE_NAME "${PROJECT_NAME}-${DEMO_VERSION}-Setup")
# this is needed to have cpack respect and use the installer scripts
set(CPACK_COMPONENTS_ALL "${TARGET_NAME}")
set(CPACK_VERBATIM_VARIABLES ON)

set(CPACK_IFW_PACKAGE_NAME "${PROJECT_NAME}")
set(CPACK_IFW_PACKAGE_TITLE "${PROJECT_NAME} Installation Wizard")
set(CPACK_IFW_PACKAGE_PUBLISHER "Example Company")
set(CPACK_IFW_PACKAGE_START_MENU_DIRECTORY "${PROJECT_NAME}")
set(CPACK_IFW_PACKAGE_ALLOW_NON_ASCII_CHARACTERS ON)
set(CPACK_IFW_PACKAGE_ALLOW_SPACE_IN_PATH ON)
set(CPACK_IFW_PACKAGE_REMOVE_TARGET_DIR ON)
set(CPACK_IFW_PACKAGE_MAINTENANCE_TOOL_NAME "Uninstall")
set(CPACK_IFW_PACKAGE_WIZARD_STYLE "Modern")
set(CPACK_IFW_PACKAGE_CONTROL_SCRIPT
    "${CMAKE_CURRENT_SOURCE_DIR}/controlscript.js")
set(CPACK_IFW_TARGET_DIRECTORY "@HomeDir@/AppData/Local/${PROJECT_NAME}")
set(CPACK_IFW_ADMIN_TARGET_DIRECTORY "@ApplicationsDirX64@/${PROJECT_NAME}")
set(CPACK_IFW_PACKAGE_RUN_PROGRAM "@TargetDir@/${TARGET_NAME}.exe")
set(CPACK_IFW_PACKAGE_RUN_PROGRAM_DESCRIPTION "Run ${PROJECT_NAME} now")

include(CPackComponent)
include(CPackIFW)

cpack_add_component(
  "${TARGET_NAME}"
  DISPLAY_NAME "${PROJECT_NAME}"
  DESCRIPTION "${PROJECT_DESCRIPTION}"
  REQUIRED)

cpack_ifw_configure_component(
  "${TARGET_NAME}"
  NAME "de.example.demo"
  DISPLAY_NAME "${PROJECT_NAME}"
  DESCRIPTION "${PROJECT_DESCRIPTION}"
  VERSION "${DEMO_VERSION}"
  SCRIPT "${CMAKE_CURRENT_BINARY_DIR}/installscript.js"
  FORCED_INSTALLATION)

include(CPack)
