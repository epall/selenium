using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using OpenQA.Selenium;

namespace Selenium.Internal.SeleniumEmulation
{
    public abstract class BaseOptionSelectStragety : IOptionSelectStrategy
    {
        public bool Select(ReadOnlyCollection<IWebElement> fromOptions, string selectThis, bool setSelected, bool allowMultipleSelect)
        {
            bool matchMade = false;
            IEnumerator<IWebElement> allOptions = fromOptions.GetEnumerator();

            while (allOptions.MoveNext())
            {
                IWebElement option = allOptions.Current;
                bool matchThisTime = SelectOption(option, selectThis);
                if (matchThisTime)
                {
                    if (setSelected)
                    {
                        option.Select();
                    }
                    else if (option.Selected)
                    {
                        option.Toggle();
                    }
                }
                matchMade |= matchThisTime;
                if (matchMade && !allowMultipleSelect)
                {
                    return true;
                }
            }
            return matchMade;
        }

        protected abstract bool SelectOption(IWebElement option, String selectThis);
    }
}