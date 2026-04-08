/******************************************************************************
 * Copyright (C) 2026 Volkswagen AG, Berliner Ring 2, 38440 Wolfsburg, Germany
 * https://www.volkswagen.de
 * All rights reserved.
 *
 * This software is protected by the inclusion of the above copyright
 * notice. This software may not be provided or otherwise made available
 * to, or used by, any other person. No title to or ownership of the
 * software is hereby transferred.
 *
 * The information contained in this document is considered the
 * CONFIDENTIAL and PROPRIETARY information of Volkswagen AG and may
 * not be disclosed or discussed with anyone who is not employed by
 * Volkswagen AG, unless the individual/company
 *   (i)  has an express need to know such information, and
 *   (ii) disclosure of information is subject to the terms of a duly
 *        executed confidentiality and non-disclosure agreement between
 *        Volkswagen AG and the individual/company.
 *****************************************************************************/
#include <QCoreApplication>

int main(int argc, char *argv[])
{
  QCoreApplication a(argc, argv);

  // Set up code that uses the Qt event loop here.
  // Call QCoreApplication::quit() or QCoreApplication::exit() to quit the application.
  // A not very useful example would be including
  // #include <QTimer>
  // near the top of the file and calling
  // QTimer::singleShot(5000, &a, &QCoreApplication::quit);
  // which quits the application after 5 seconds.

  // If you do not need a running Qt event loop, remove the call
  // to QCoreApplication::exec() or use the Non-Qt Plain C++ Application template.

  return QCoreApplication::exec();
}
