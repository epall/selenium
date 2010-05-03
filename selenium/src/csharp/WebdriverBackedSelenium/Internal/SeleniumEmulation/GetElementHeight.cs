﻿using System;
using System.Collections.Generic;
using System.Text;
using OpenQA.Selenium;
using System.Drawing;

namespace Selenium.Internal.SeleniumEmulation
{
    class GetElementHeight : SeleneseCommand
    {
        private ElementFinder finder;

        public GetElementHeight(ElementFinder elementFinder)
        {
            finder = elementFinder;
        }

        protected override object HandleSeleneseCommand(IWebDriver driver, string locator, string value)
        {
            Size size = ((IRenderedWebElement)finder.FindElement(driver, locator)).Size;
            return size.Height;
        }
    }
}
