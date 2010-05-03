﻿using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;
using OpenQA.Selenium;

namespace Selenium.Internal.SeleniumEmulation
{
    class GetAllButtons : SeleneseCommand
    {
        protected override object HandleSeleneseCommand(IWebDriver driver, string locator, string value)
        {
            ReadOnlyCollection<IWebElement> allInputs = driver.FindElements(By.XPath("//input"));
            List<string> ids = new List<string>();

            foreach (IWebElement input in allInputs)
            {
                string type = input.GetAttribute("type").ToLowerInvariant();
                if (type == "button" || type == "submit" || type == "reset")
                {
                    ids.Add(input.GetAttribute("id"));
                }
            }

            return ids.ToArray();
        }
    }
}
