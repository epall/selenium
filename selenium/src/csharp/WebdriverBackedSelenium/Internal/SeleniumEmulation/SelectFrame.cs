﻿using System;
using System.Collections.Generic;
using System.Text;
using OpenQA.Selenium;

namespace Selenium.Internal.SeleniumEmulation
{
    class SelectFrame : SeleneseCommand
    {
        WindowSelector windows;

        public SelectFrame(WindowSelector windowSelector)
        {
            windows = windowSelector;
        }

        protected override object HandleSeleneseCommand(IWebDriver driver, string locator, string value)
        {
            windows.SelectFrame(driver, locator);
            return null;
        }
    }
}
