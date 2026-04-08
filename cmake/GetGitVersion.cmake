function(
  get_git_version
  gitDescribeOutVar
  projectVersionOutVar
)
  find_package(Git QUIET)

  if(Git_FOUND)
    execute_process(
      COMMAND "${GIT_EXECUTABLE}" describe --tags --dirty --always
      WORKING_DIRECTORY "${CMAKE_CURRENT_LIST_DIR}"
      RESULT_VARIABLE gitDescribeResult
      OUTPUT_VARIABLE gitDescribeOutput
      ERROR_QUIET OUTPUT_STRIP_TRAILING_WHITESPACE
    )
  endif()

  if(Git_FOUND
     AND gitDescribeResult
         EQUAL
         0
     AND NOT
         gitDescribeOutput
         STREQUAL
         ""
  )
    set(gitDescribe "${gitDescribeOutput}")
  else()
    set(gitDescribe "0.0.0-unknown")
    message(WARNING "Falling back to default version because git describe is unavailable.")
  endif()

  string(
    REGEX MATCH
          "[0-9]+\\.[0-9]+(\\.[0-9]+)?"
          projectVersion
          "${gitDescribe}"
  )

  if(projectVersion
     STREQUAL
     ""
  )
    set(projectVersion "0.0.0")
    message(WARNING "Could not extract numeric project version from '${gitDescribe}', using ${projectVersion}.")
  endif()

  set(${gitDescribeOutVar}
      "${gitDescribe}"
      PARENT_SCOPE
  )
  set(${projectVersionOutVar}
      "${projectVersion}"
      PARENT_SCOPE
  )
endfunction()
