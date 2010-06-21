
/**
  * This file describes the synchronous behavior. Functions call directly on the
  * FirefoxDriver object
  * 
  */

/**
  * A FakeResponse which encapsulates the result of a command. It is similar to
  * the Response object used at the WebDriver extension except that the content
  * of the send function is emptied
  * 
  */
var FakeRespond = function() {
  this.statusBarLabel_ = null;
  this.json_ = {
    commandName:'' ,
    isError: false,
    response: '',
    elementId: '',
    context: ''
  };
};

FakeRespond.prototype = {

  /**
	* Updates the extension status label to indicate we are about to execute a
	* command.
	* @param {window}
	* win The content window that the command will be executed on.
	*/
  startCommand: function(win) {
    this.statusBarLabel_ = win.document.getElementById("fxdriver-label");
    if (this.statusBarLabel_) {
      this.statusBarLabel_.style.color = "red";
    }
  },

  /**
	* Sends the encapsulated response to the registered callback.
	*/
  send: function() {
   
  },
  
  /**
	* Getter and setter to handle errors
    */
  set isError(error)    { this.json_.isError = error; },
  get isError()         { return this.json_.isError; }
   
};

/**
  * Get the object from win.fxdriver which is an instance of FirefoxDriver.
  * 
  */
function FirefoxDriver() {	 
  // handle open windows
  this.wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].
  getService(Components.interfaces.nsIWindowMediator);    
  // get an enumerator which iterates over all windows from the oldest window to the youngest
  var allWindows = this.wm.getEnumerator(null);
  while (allWindows.hasMoreElements()) {
    win = allWindows.getNext();
    if (win["fxdriver"]) {
      // access to the browser
      this.fxbrowser = win.getBrowser();
      // access to the fxdriver
      this.driver = win.fxdriver;   
      break;
    }
  }
}

/**
  * Context Definition
  * 
  */
function Context(windowId, frameId) {
  this.windowId = windowId;
  if (typeof frameId == 'number' || (typeof frameId == 'string' && frameId)) {
    this.frameId = frameId;
  }
}


Context.fromString = function(text) {
  var bits = text.split(" ");
  return new Context(bits[0], bits[1]);
};


Context.prototype.toString = function() {
  return this.windowId + " " +
         (this.frameId !== undefined ? this.frameId.toString() : "");
};


function findFrame(browser, frameId) {
  var stringId = "" + frameId;
  var names = stringId.split(".");
  var frame = browser.contentWindow;
  for (var i = 0; i < names.length; i++) {
    // Try a numerical index first
    var index = names[i] - 0;
    if (!isNaN(index)) {
      frame = frame.frames[index];
      if (frame) {
        return frame;
      }
    } else {
      // Fine. Use the name and loop
      var found = false;
      for (var j = 0; j < frame.frames.length; j++) {
        var f = frame.frames[j];
        if (f.name == names[i] || f.frameElement.id == names[i]) {
          frame = f;
          found = true;
          break;
        }
      }

      if (!found) {
        return null;
      }
    }
  }

  return frame;
};

/**
  * Main Object
  * 
  */

function SynchronousWebDriver(baseURL,window) {		
  this.baseUrl = baseURL;
  this.defaultTimeout = 30 * 1000;
  fxdriver = new FirefoxDriver();
  this.fbrowser = fxdriver.fxbrowser;
  this.driver =  fxdriver.driver; 
  this.context = new Context(this.driver.id);
  this.browserbot = BrowserBot.createForWindow(window, false);  
}

/**
  * handles response object 
  * initialize values for this object
  */
SynchronousWebDriver.prototype.initResponse = function() {
 var response = new FakeRespond();
 response.context = this.context;
 
 if (!this.fbrowser) {
    response.isError = true;
    response.response = 'Unable to find browser with id ' +
                        response.context.windowId;
    return response.response;
  }

  if (!this.driver) {
    response.isError = true;
    response.response = 'Unable to find the driver for browser with id ' +
                        response.context.windowId;
    return response.response;
  }
  
  response.context.fxbrowser = this.fbrowser;
  
  // Determine whether or not we need to care about frames.
  var frames = this.fbrowser.contentWindow.frames;
  if ("?" == response.context.frameId) {
    if (frames && frames.length) {
      if ("FRAME" == frames[0].frameElement.tagName) {
          response.context.frameId = 0;
      } else {
          response.context.frameId = undefined;
      }
    } else {
      response.context.frameId = undefined;
    }
  }
 
  if (response.context.frameId !== undefined) {
    response.context.frame = findFrame(
        this.fbrowser, response.context.frameId);
  }
  
// response.startCommand(this.win);
  return response;
       
}


SynchronousWebDriver.createForWindow = function(window) {
  return new SynchronousWebDriver(window);       
}

SynchronousWebDriver.prototype.reset = function() {
  var response = new FakeRespond();
  this.newSession(response);
}

/**
  * Locates the most recently used FirefoxDriver window.
  *  @param {Response} response The response object to send the command response in.
  */
SynchronousWebDriver.prototype.newSession = function(response) {
  this.wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].
      getService(Components.interfaces.nsIWindowMediator);
      
  // open the recent browser window
  var win = this.wm.getMostRecentWindow("navigator:browser");
  // get the fxdriver
  var driver = win.fxdriver;
 
  if (!driver) {
    response.isError = true;
    response.response = 'No drivers associated with the window';
  } else {
    response.context = new Context(driver.id);
    response.response = driver.id;
  }  
  return response.response;
};

SynchronousWebDriver.prototype.ensureNoUnhandledPopups = function() {
    // TODO
}

// ========================================= ACTIONS ===========================

/**
  * Sets the "id" attribute of the specified element.
  * This ID will disappear once the page is
  * reloaded.
  * @param locator an element locator pointing to an element
  * @param identifier a string to be used as the ID of the specified element
  */
SynchronousWebDriver.prototype.doAssignId = function(locator, identifier) {
  var element = this.findElement_(locator)[1];
  element.id = identifier;
}
 
 /**
   * Clicks on a link, button .... If the click action causes a new page to
   * load (like a link usually does), call waitForPageToLoad.
   * @param locator an element locator
   * 
   */
SynchronousWebDriver.prototype.doClick = function(locator) { 
  var response = this.findElement_(locator)[0];
  this.driver.click(response);          
}

 /**
   * Check a toggle-button (checkbox/radio)
   * @param locator an element locator
   * 
   */
SynchronousWebDriver.prototype.doCheck = function(locator){
   var response = this.findElement_(locator)[0];
   this.driver.setSelected(response); 
}

/**
  * Simulates the user clicking the "close"
  * window or tab.
  * 
  */
SynchronousWebDriver.prototype.doClose = function() {  
	var response = this.initResponse();
	this.driver.close(response);
}

/*SynchronousWebDriver.prototype.doCreateCookie = function(cookieString) {
	var response = this.initResponse();	
	var name = [];
	name.push(cookieString)
	this.driver.addCookie(response,name);
}*/

/**
  * Delete a named cookie.
  * 
  */
SynchronousWebDriver.prototype.doDeleteCookie = function(name) {
	var response = this.initResponse();
	this.driver.deleteCookie(response,name);   
}

/**
  * Delete all cookies visible to the current page.
  * 
  */
SynchronousWebDriver.prototype.doDeleteAllVisibleCookies = function() {
   var response = this.initResponse();
   this.driver.deleteAllCookies(response); 
}

 /**
   * Double clicks on a link, button, checkbox or radio button. If the double click action
   * causes a new page to load, call
   * waitForPageToLoad.
   * @param locator an element locator
   *
   */

SynchronousWebDriver.prototype.doDoubleClick = function(locator) {
  var response = this.findElement_(locator)[0];
  this.driver.click(response); 
  this.driver.click(response); 
}

/**
  * Simulates the user clicking the "back" button on their browser.
  *
  */
SynchronousWebDriver.prototype.doGoBack = function() {  
  var response = this.initResponse();
  this.driver.goBack(response);
}

 /**
   * Opens an URL in the test frame. This accepts both relative and absolute
   * URLs.
   * 
   */

SynchronousWebDriver.prototype.doOpen = function(url) {
  var response = this.initResponse();
  this.driver.get(response,absolutify(url, this.baseUrl));
  return this.makePageLoadCondition();
}

 /**
   * Simulates the user clicking the "refresh" button on their browser.
   *
   */
SynchronousWebDriver.prototype.doRefresh = function() {  
  var response = this.initResponse();
  this.driver.refresh(response);
}

 /**
   * adds the specified text into the body of the current test window. 
   * @param script the JavaScript snippet to run
   * 
   */
SynchronousWebDriver.prototype.doRunScript = function(script) {
  var response = this.initResponse();  
  var scriptToRun = [];
  scriptToRun.push(script);  	    
  this.driver.executeScript(response,scriptToRun);
}

 /**
   * Select an option from a drop-down using an option locator.
   * @param selectLocator an identifying a drop-down menu
   * @param optionLocator an option locator
   * 
   */
SynchronousWebDriver.prototype.doSelect = function(selectLocator, optionLocator) {
    
  var driver = this.driver;
  // figure out option locator strategy
  var strategyName = "implicit";
  var use = optionLocator;
  var pattern = /^([a-zA-Z]+)=(.*)$/;
  var result = optionLocator.match(pattern);
  var wasSelected = false;
  var response = this.initResponse(); 
    
  if(result != null){
        strategyName = result[1];
        use = result[2];
   }
    
  var strategies = {
     label: function(option){
        	response.elementId = option;
            driver.getText(response);
            var label = response.response;
                if(label == use){
                    wasSelected = true;
                    driver.setSelected(response);
                }
      },
        
      id: function(option){
        	response.elementId = option;
        	var attributeName = [];
        	attributeName.push('id');
        	driver.getAttribute(response,attributeName);
            var id = response.response;
                if(id == use){
                   driver.setSelected(response);
                }
      },
        
      index: function(option, index){
            if(index == use){
                    response.elementId = option;
                    driver.setSelected(response); 
            }
      },
        
      value: function(option){
            response.elementId = option;
        	driver.getValue(response);
        	var value = response.response;
                if(value == use){
                    driver.setSelected(response);
                }
      }
  }
    
  strategies['implicit'] = strategies['label'];
    
  var strategy = strategies[strategyName];
  if(!strategy){
        throw new SeleniumError("Strategy "+strategyName+" not supported");
  }
    
  var select = this.findElement_(selectLocator)[2];
  var parameters = function(param1,param2,param3){
  this.using = param1;
  this.value = param2;
  this.id = param3;
  };
  var map = [];
  map.push(new parameters(By.tagName("option").type,By.tagName("option").target,select));    
  driver.findChildElements(response,map);
  allOptions = response.response;
  for(var i = 0; i < allOptions.length; i++){
       		strategy(allOptions[i], i);
  }
             
}

/*SynchronousWebDriver.prototype.doSelectFrame = function(name) {
	var response = this.initResponse();	
	var frameId = [];
  	frameId.push(name);  
    this.driver.switchToFrame(response,frameId);
}*/

/**
  * Specifies the amount of time that Selenium will wait for actions to complete.
  * The default timeout is 30 seconds.
  * @param timeout a timeout in milliseconds, after which the action will return with an error
  */
SynchronousWebDriver.prototype.doSetTimeout = function(timeout) {
  if(!timeout) {
     timeout = this.defaultTimeout;
  }
  this.defaultTimeout = timeout;
}

/**
  * Submit the specified form. This is particularly useful for forms without
  * submit buttons.
  * @param formLocator an element locator for the form you want to submit
  * 
  */
SynchronousWebDriver.prototype.doSubmit = function(formLocator) {	
  var response = this.findElement_(formLocator)[0];
  this.driver.submit(response);
}

/** 
  * Configure the mouse speed
  * If the mouse speed is negative,it is given the default mouse speed(10)
  * @param pixels the number of pixels between "mousemove" events
  */
SynchronousWebDriver.prototype.doSetMouseSpeed = function(pixels) {
  var response = this.initResponse();	
  if (pixels < 0 ) 
  pixels = Selenium.DEFAULT_MOUSE_SPEED;
  var speed = [];
  speed.push(pixels);
  this.driver.setMouseSpeed(response,speed);
}
/**
  * Set execution speed 
  *@param value the number of milliseconds to pause after operation
  *
  */
SynchronousWebDriver.prototype.doSetSpeed = function(value) {
  throw new SeleniumError("this operation is only implemented in selenium-rc, and should never result in a request making it across the wire");
}

/**
  * Sets the value of an input field, as though you typed it in.
  * @param locator an element locator
  * @param value the value to type
  */
SynchronousWebDriver.prototype.doType = function(locator, value) {
  var val = [];
  val.push(value); 
  var response = this.findElement_(locator)[0];
  this.driver.sendKeys(response,val);	
}

/**
  * Uncheck a toggle-button (checkbox/radio)
  * @param locator an element locator</a>
  */
 SynchronousWebDriver.prototype.doUncheck = function(locator) {  
  var response = this.findElement_(locator)[0]; 
  this.driver.isSelected(response);
  var selected = response.response;
  if(selected){
	this.driver.toggle(response);
  }		
}

/**
  * Waits for a new page to load.
  * @param timeout a timeout in milliseconds, after which this command will
  * return with an error
  */
SynchronousWebDriver.prototype.doWaitForPageToLoad = function(timeout) {
  setTimeout(fnBind(currentTest.continueTestWhenConditionIsTrue, currentTest),30000);
  return this.makePageLoadCondition(timeout);
}

/** 
  * Gives focus to the currently selected window
  *
  */
SynchronousWebDriver.prototype.doWindowFocus = function() {
  var response = this.initResponse();	
  var script = [];
  script.push("window.focus()");
  this.driver.executeScript(response,script);
}

/** 
  * Resize currently selected window to take up the entire screen
  *
  */
SynchronousWebDriver.prototype.doWindowMaximize = function() {
  var response = this.initResponse();	
  var script = [];
  script.push("if (window.screen) { window.moveTo(0, 0); window.resizeTo(window.screen.availWidth, window.screen.availHeight);};");
  this.driver.executeScript(response,script);
}



// ======================================== ACCESSORS ==========================

/** 
  * Returns the IDs of all buttons on the page.
  * @return string[] the IDs of all buttons on the page
  * 
  */
SynchronousWebDriver.prototype.getAllButtons = function(locator) {
  var response = this.initResponse();	
  var buttons = [];
  var parameters = [];
  parameters.push(By.xpath("//input").type);
  parameters.push(By.xpath("//input").target);
  this.driver.findElements(response,parameters);
  allInputs = response.response;
  var attributeId = [];
  attributeId.push("id"); 
  var attributeType = [];
  attributeType.push("type"); 
  
  for(var input in allInputs){  
      response.elementId = input;
      this.driver.getAttribute(response,attributeType);
      type = response.response;
      if(("button" == type) || ("submit" == type) || ("reset" == type)){
          this.driver.getAttribute(response,attributeId);
          buttons.push(response.response);
      }
  }
  return buttons;	
}

/** 
  * Returns the IDs of all input fields on the page.
  * @return string[] the IDs of all field on the page
  * 
  */
SynchronousWebDriver.prototype.getAllFields = function(attributeLocator) {  
  var response = this.initResponse();	
  var fields = [];
  var parameters = [];
  parameters.push(By.xpath("//input").type);
  parameters.push(By.xpath("//input").target);
  this.driver.findElements(response,parameters);
  allInputs = response.response;
  var attributeId = [];
  attributeId.push("id"); 
  var attributeType = [];
  attributeType.push("type");
  
  for(var input in allInputs){  
      response.elementId = input;
      this.driver.getAttribute(response,attributeType);
      type = response.response;
      if("text" == type){
          this.driver.getAttribute(response,attributeId);
          fields.push(response.response);
      }
  }
  return fields;	
}

/** 
  * Returns the IDs of all links on the page.
  * @return string[] the IDs of all links on the page
  * 
  */
SynchronousWebDriver.prototype.getAllLinks = function(attributeLocator) {  
  var response = this.initResponse();	
  var links = [];
  var parameters = [];
  parameters.push(By.xpath("//a").type);
  parameters.push(By.xpath("//a").target);
  this.driver.findElements(response,parameters);
  allLinks = response.response;
  var elementAttribute = {};
  var attribute = [];
  attribute.push("id");
  
  for(var idx = 0; idx < allLinks.length; idx++){                    
     elementAttribute[idx] = allLinks[idx]; 
  }           
     for(var id in elementAttribute){  
         response.elementId = elementAttribute[id];
         this.driver.getAttribute(response,attribute);
         links.push(response.response);
     }
     
  return links;	
}

/**
  * Gets the value of an element attribute.
  * @param attributeLocator an element locator
  * @return string the value of the specified attribute
  * 
  */
SynchronousWebDriver.prototype.getAttribute = function(attributeLocator) {  
  attributePos = attributeLocator.lastIndexOf("@");
  elementLocator = attributeLocator.slice(0, attributePos);
  attributeName = attributeLocator.slice(attributePos + 1);
 
  var attribute = [];
  attribute.push(attributeName);
  var response = this.findElement_(elementLocator)[0];
  this.driver.getAttribute(response,attribute);
  return response.response;
}

/**
  * Gets the entire text of the page.
  * @return string the entire text of the page
  * 
  */
SynchronousWebDriver.prototype.getBodyText = function() {
  var response = this.initResponse();
  var parameters = [];
  parameters.push(By.xpath("//body").type);
  parameters.push(By.xpath("//body").target);
  this.driver.findElement(response,parameters);
  response.elementId = response.response;
  this.driver.getText(response);	
  return response.response;
}

/**
  * Gets all cookies of the current page under test.
  * @return string all cookies of the current page under test
  * 
  */
SynchronousWebDriver.prototype.getCookie = function() {
  var response = this.initResponse();	
  this.driver.getCookie(response);
  return response.response;
}

/**
  * Gets the value of the cookie with the specified name, or throws an error if the cookie is not present.
  * @param name the name of the cookie
  * @return string the value of the cookie
  * 
  */
SynchronousWebDriver.prototype.getCookieByName = function(cookieName) {
  var name = null;
  this.driver.getCurrentWindowHandle();
  var doc = response.response.document;
  var ck = doc.cookie;
  if (!ck) return null;
  var ckPairs = ck.split(/;/);
  for (var i = 0; i < ckPairs.length; i++){
    var ckPair = ckPairs[i].trim();
    var ckNameValue = ckPair.split(/=/);
    var ckName = decodeURIComponent(ckNameValue[0]);
    if (ckName === cookieName) {
        name = decodeURIComponent(ckNameValue[1]);
    }
  }

  if (name === null) {
    throw new SeleniumError("Cookie '"+cookieName+"' was not found");
  }
  return name;
}

/**
  * Retrieves the height of an element
  * @param locator an element locator pointing to an element
  * @return height of an element in pixels
  */
SynchronousWebDriver.prototype.getElementHeight = function(locator) {  
  var response = this.findElement_(locator)[0];
  this.driver.getSize(response);
  return response.response.height;	
}


SynchronousWebDriver.prototype._isCommentOrEmptyTextNode = function(node) {
  return node.nodeType == 8 || ((node.nodeType == 3) && !(/[^\t\n\r ]/.test(node.data)));
}

/**
  * Gets the relative index of an element to its parent. 
  * @param locator an element locator pointing to an element
  * @return number of relative index of the element to its parent
  */
SynchronousWebDriver.prototype.getElementIndex = function(locator) {
  var element = this.findElement_(locator)[1];
  var previousSibling;
  var index = 0;
  while ((previousSibling = element.previousSibling) != null) {
        if (!this._isCommentOrEmptyTextNode(previousSibling)) {
            index++;
        }
        element = previousSibling;
  }
  return index;
}

/**
  * Retrieves the horizontal position of an element
  * @param locator an element locator pointing to an element OR an element itself
  * @return number of pixels from the edge of the frame.
  */
SynchronousWebDriver.prototype.getElementPositionLeft = function(locator) {
  var response = this.findElement_(locator)[0];
  this.driver.getLocation(response);	
  return response.response.x;
}

/**
  * Retrieves the vertical position of an element
  * @param locator an element locator pointing to an element OR an element itself
  * @return number of pixels from the edge of the frame.
  */
SynchronousWebDriver.prototype.getElementPositionTop = function(locator) {
  var response = this.findElement_(locator)[0];
  this.driver.getLocation(response);
  return response.response.y;
}

/**
  * Retrieves the width of an element
  * @param locator an element locator pointing to an element
  * @return width of an element in pixels
  */
SynchronousWebDriver.prototype.getElementWidth = function(locator) {  
  var response = this.findElement_(locator)[0];
  this.driver.getSize(response);
  return response.response.width;	
}

/**
  * Gets the result of evaluating the specified JavaScript snippet. The snippet
  * may have multiple lines, but only the result of the last line will be
  * returned.
  * @param script the JavaScript snippet to run
  * @return string the results of evaluating the snippet
  */
SynchronousWebDriver.prototype.getEval = function(script) {
  var value = [];
  value.push("return ("+script+");");  
  var response = this.initResponse(); 
  this.driver.executeScript(response,value);
  return response.response.value;
}

/** 
  * Returns the entire HTML source between the opening and
  * closing "html" tags.
  * @return string the entire HTML source
  */
SynchronousWebDriver.prototype.getHtmlSource = function() {  
  var response = this.initResponse();
  this.driver.getPageSource(response);
  return response.response;
}

/** 
  * Gets the absolute URL of the current page.
  * @return string the absolute URL of the current page
  * 
  */
SynchronousWebDriver.prototype.getLocation = function() {  
  var response = this.initResponse(response);
  this.driver.getCurrentUrl(response);
  return response.response;
}

/** 
  * Returns the number of pixels between "mousemove" events during dragAndDrop commands
  * @return number the number of pixels between "mousemove" events during dragAndDrop commands
  * 
  */
SynchronousWebDriver.prototype.getMouseSpeed = function() {
  var response = this.initResponse();	
  this.driver.getMouseSpeed(response);
  return response.response;
}

/** 
  * Gets option element ID for selected option in the specified select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string the selected option ID in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedId = function(selectLocator) {
  return this.findSelectedOptionProperty_(selectLocator, "id");
}


/** 
  * Gets all option element IDs for selected options in the specified select or multi-select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string[] an array of all selected option IDs in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedIds = function(selectLocator) {
  return this.findSelectedOptionProperties_(selectLocator, "id");
}

/** 
  * Gets option index for selected option in the specified select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string the selected option index in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedIndex = function(selectLocator) {
  return this.findSelectedOptionProperty_(selectLocator, "index");
}

/** 
  * Gets all option indexes for selected options in the specified select or multi-select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string[] an array of all selected option indexes in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedIndexes = function(selectLocator) {
  return this.findSelectedOptionProperties_(selectLocator,"index");
}

/** 
  * Gets option label (visible text) for selected option in the specified select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string the selected option label in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedLabel = function(selectLocator) {
  return this.findSelectedOptionProperty_(selectLocator, "text");
}

/** 
  * Gets all option labels (visible text) for selected options in the specified select or multi-select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string[] an array of all selected option labels in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedLabels = function(selectLocator) {
  return this.findSelectedOptionProperties_(selectLocator, "text");
}


/** 
  * Gets all option values (value attributes) for selected options in the specified select or multi-select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string[] an array of all selected option values in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedValues = function(selectLocator) {
  return this.findSelectedOptionProperties_(selectLocator,"value");
}

/** 
  * Gets option value (value attribute) for selected option in the specified select element.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return string the selected option value in the specified select drop-down
  */
SynchronousWebDriver.prototype.getSelectedValue = function(selectLocator) {
  return this.findSelectedOptionProperty_(selectLocator,"value");
}

SynchronousWebDriver.prototype.findSelectedOptionProperties_ = function(locator, property) {
   var element = this.findElement_(locator)[1];
   if (!("options" in element)) {
        throw new SeleniumError("Specified element is not a Select (has no options)");
    }

    var selectedOptions = [];

    for (var i = 0; i < element.options.length; i++) {
        if (element.options[i].selected)
        {
            var propVal = element.options[i][property];
            selectedOptions.push(propVal);
        }
    }
    if (selectedOptions.length == 0)  throw new SeleniumError("No option selected");
    return selectedOptions;
}

SynchronousWebDriver.prototype.findSelectedOptionProperty_ = function(locator, property) {
    var selectedOptions = this.findSelectedOptionProperties_(locator, property);
    if (selectedOptions.length > 1) {
        throw new SeleniumError("More than one selected option!");
    }
    return selectedOptions[0];
}

/** 
   * Gets all option labels in the specified select drop-down.
   * @param selectLocator an element locator identifying a drop-down menu
   * @return string[] an array of all option labels in the specified select drop-down
   * 
   */
SynchronousWebDriver.prototype.getSelectOptions = function(selectLocator) {  
   var element = this.findElement_(selectLocator)[1];
   var selectOptions = [];
    for (var i = 0; i < element.options.length; i++) {
        var option = element.options[i].text;
        selectOptions.push(option);
    }
    return selectOptions;
}

/**
  * Get execution speed 
  * @return string the execution speed in milliseconds.
  */
SynchronousWebDriver.prototype.getSpeed = function() {
  throw new SeleniumError("this operation is only implemented in selenium-rc, and should never result in a request making it across the wire");
}

/**
  * Gets the text of an element.
  * @param locator an element locator
  * @return string the text of the element
  */
SynchronousWebDriver.prototype.getText = function(locator) {
  var response = this.findElement_(locator)[0];
  this.driver.getText(response);
  return response.response;
}

/**
  * Gets the title of the current page.
  * @return string the title of the current page
  * 
  */
SynchronousWebDriver.prototype.getTitle = function() {
  var response = this.initResponse();
  this.driver.title(response); 
  return response.response; 
}

/**
  * Gets the value of an input field 
  * @param locator an element locator
  * @return string the element value, or "on/off" for checkbox/radio elements
  */
SynchronousWebDriver.prototype.getValue = function(locator) {  
    var response = this.findElement_(locator)[0];
	this.driver.getValue(response);
    return response.response;
};

/**
  * Returns the number of nodes that match the specified xpath
  * @param xpath
  * the xpath expression to evaluate.
  * @return number the number of nodes that match the specified xpath
  */
SynchronousWebDriver.prototype.getXpathCount = function(xpath) {
  var response = this.initResponse();
  var parameters = [];
  parameters.push(By.xpath(xpath).type);
  parameters.push(By.xpath(xpath).target);
  this.driver.findElements(response,parameters);
  elements = response.response;
  return elements.length;
}

/**
  * Gets whether a toggle-button (checkbox/radio) is checked.
  * @param locator an element locator pointing to a checkbox or radio button
  * @return boolean true if the checkbox is checked, false otherwise
  */
SynchronousWebDriver.prototype.isChecked = function(locator) {
 var response = this.findElement_(locator)[0];
 this.driver.isSelected(response);
 return response.response;
}

/**
  * Determines whether the specified input element is editable, ie hasn't been disabled.
  * @param locator an element locator
  * @return boolean true if the input element is editable, false otherwise
  */
SynchronousWebDriver.prototype.isEditable = function(locator) {  
  var response = this.findElement_(locator)[0];
  var element = this.findElement_(locator)[1];
  if (element.disabled){
      return false;
  }
  
  this.driver.getTagName(response);
  tagName = response.response;
  acceptableTagName = ("input" == tagName) || ("select"== tagName);
  readonly = "";
  var attribute = [];
  attribute.push("readonly");
  if ("input" == tagName){
  	this.driver.getAttribute(response,attribute);
  	readonly = response.response;
  	if (readonly == null || "false"=== readonly) {
        readonly = "";
  	}
  }
  return acceptableTagName && ("" == readonly);  	
}

/**
  * Verifies that the specified element is somewhere on the page.
  * @param locator an element locator
  * @return boolean true if the element is present, false otherwise
  */
SynchronousWebDriver.prototype.isElementPresent = function(locator) {
  try{
     this.findElement_(locator)[1];
  	 return true;
  }catch(e){
  	 return false;
  }
}

/**
  * Check if these two elements have same parent and are ordered siblings in the DOM. 
  * @param locator1 an element locator pointing to the first element
  * @param locator2 an element locator pointing to the second element
  * @return boolean true if element1 is the previous sibling of element2, false otherwise
  */
SynchronousWebDriver.prototype.isOrdered = function(locator1,locator2) {  
  var element1 = this.findElement_(locator1)[1];
  var element2 = this.findElement_(locator2)[1];

  if (element1 === element2) return false;
	var previousSibling;
    while ((previousSibling = element2.previousSibling) != null) {
        if (previousSibling === element1) {
            return true;
        }
        element2 = previousSibling;
    }
  
  return false;
}

/** 
  * Determines whether some option in a drop-down menu is selected.
  * @param selectLocator an element locator identifying a drop-down menu
  * @return boolean true if some option has been selected, false otherwise
  */
SynchronousWebDriver.prototype.isSomethingSelected = function(selectLocator) {
  var element = this.findElement_(selectLocator)[1];
  if (!("options" in element)) {
        throw new SeleniumError("Specified element is not a Select (has no options)");
  }
   for (var i = 0; i < element.options.length; i++) {
       if (element.options[i].selected){
            return true;
       }
   }
   
   return false;
}

/**
  * Verifies that the specified text pattern appears somewhere on the rendered
  * page shown to the user.
  * @param pattern to match with the text of the page
  * @return boolean true if the pattern matches the text, false otherwise
  */
SynchronousWebDriver.prototype.isTextPresent = function(pattern) {
  var response = this.initResponse();
  this.driver.getPageSource(response);
  var source = response.response;
  return source.indexOf(pattern) != -1;	    
}

/**
  * Determines if the specified element is visible.
  * @param locator an element locator
  * @return boolean true if the specified element is visible, false otherwise
  */
SynchronousWebDriver.prototype.isVisible = function(locator) {
  var response = this.findElement_(locator)[0]; 
  this.driver.isDisplayed(response);
  return response.response;
}

SynchronousWebDriver.prototype.getElementAt_ = function(index, context) {
   if (context.frame) {
    doc = context.frame.document;
  }
  doc = context.fxbrowser.contentDocument;
  var e = doc.fxdriver_elements ? doc.fxdriver_elements[index] : undefined;
  return e;
};

/**
 	* Finds element on the current page. The response value will be the UUID of the
 	* located element or an error message if an element could not be found.
 	*/

SynchronousWebDriver.prototype.findElement_ = function(locator) {
  var pattern = /^([a-zA-Z]+)=(.*)$/;
  var result = locator.match(pattern);
  var strategyName = "implicit";
  var use = locator;
  var response = this.initResponse();
  var res =[];
  var driver = this.driver;
 
    /**
	 * FIND_ELEMENT search an element on the current page. The response value
	 * will be the UUID of the located element, or an error message if an
	 * element could not be found.
	 * @param {Response} respond Object to send the command response with.
	 * @param {Array <string>} parameters A two-element array: the first element
	 * should be the type of locator strategy to use, the second is
	 * the target of the search.
	 */
    
  var makeSimpleFinder = function(strategy){  
     var parameters =[];
     parameters[0] = strategy.type;
     parameters[1] = strategy.target;
     response.isError = false;
     driver.findElement(response,parameters);
     res[0] = response.isError;
     LOG.debug('response.isError : '+res[0]);
     res[1] = response.response;
     LOG.debug('response.response : '+res[1]);
     return res;
    }
    	  
    if(result != null){
       strategyName = result[1];
       use = result[2];
    }
    switch(strategyName){
        case "implicit":
        if(use.slice(0, 2) == "//") {
            if (use.match(/\/$/))
            	use = use.slice(0,(use.length-1));   
                res = makeSimpleFinder(By.xpath(use));
             
        } else if(use.match("^document\.")) {
        	 var script = [];
    	     script.push("return "+use+";");  	    
             driver.executeScript(response,script);
             res[0] = response.isError;
             res[1] = response.response;      
             
        } else {
            res = makeSimpleFinder(By.id(use));  
            if(res[0]){
            	// search by name
            	res = makeSimpleFinder(By.name(use));
            }
        }
        break;
        
        case "link":
        if(use.indexOf("exact:") == 0){
            // shortcut for fast case
            elt = makeSimpleFinder(By.linkText(use.substring(6)));
        } else {
        	
        	/**
			 * FIND_ELEMENTS searches for multiple elements on the page. The
			 * response value will be an array of UUIDs for the located
			 * elements.
			 * @param {Response} response Object to send the command response with.
			 * @param {Array. <string>} parameters A two-element array: the first
			 * element should be the type of locator strategy to use,
			 * the second is the target of the search.
			 */
            var patternMatcher = new PatternMatcher(use);
    		var parameters = [];
    		parameters.push(By.xpath("//a").type);
            parameters.push(By.xpath("//a").target);
            driver.findElements(response,parameters);
            elements = response.response;
            var elementTexts = {};
                    for(var idx = 0; idx < elements.length; idx++){                    
                        elementTexts[idx] = elements[idx]; 
                    }           
                    for(var id in elementTexts){  
                        response.elementId = elementTexts[id];
                       	driver.getText(response);
                        var text = response.response;
                        var isError = response.isError;
                            if(patternMatcher.matches(text)){
                               res[0] = isError;
                               res[1] = elementTexts[id];
                               break;
                             }
                    }       
        }
        break;

        
        case "alt":
        res = makeSimpleFinder(By.xpath("//*[@alt='" + use + "']"));
        break;

        case "class":
        res = makeSimpleFinder(By.className(use));
        break;
        
        case "css":
        res = makeSimpleFinder(By.selector(use));
        break;

        case "id":
        res = makeSimpleFinder(By.id(use));
        break;

        case "identifier":     
        res = makeSimpleFinder(By.id(use));
        // if the search by id was unsuccessful
        if(res[0]){
        	// search by name
            res = makeSimpleFinder(By.name(use));
            res[0] = false;
        }
        
        break;
        
        case "name":      
        res = makeSimpleFinder(By.name(use));
        break;

        case "xpath":
        if (use.match(/\/$/))
        use = use.substring(0,(use.length-1));
        res = makeSimpleFinder(By.xpath(use));
        break;

        case "dom":
        var script = [];
    	script.push("return "+use+";");  	
        driver.executeScript(response,script);
        res[0] = response.isError;
        res[1] = response.response; 
        break;

       
        default:
        throw new SeleniumError("Strategy not supported");
    }
    
    response.elementId = res[1];
	var element = this.getElementAt_(response.elementId, response.context);
	
    if(res[0] || (res[0] == undefined ) || (res[1] == undefined )){
    	throw new SeleniumError("Element "+use + " not found");
    }
    return [response,element,res[1]]; 
}

SynchronousWebDriver.prototype.makePageLoadCondition = function(timeout) {
	
    if (timeout == null) {
        timeout = this.defaultTimeout;
    }
    // if the timeout is zero, we won't wait for the page to load before
	// returning
    if (timeout == 0) {
	  return;
    }
    var currentRequest;
    var state = "retry";
    var timeoutTime = getTimeoutTime(timeout);
    var driver = this.driver;
    var response = this.initResponse();

    return function(){
        if (new Date().getTime() > timeoutTime) {
            throw new SeleniumError("Timed out after " + timeout + "ms");
        }
        switch(state){
            case "retry":
            var script = [];
            script.push("return (!document.old && 'complete' == document.readyState)");
            driver.executeScript(response,script);
            currentRequest = response.response;
            if(currentRequest.value){
              return true;
            }
            return false;
        }
    }
};

SynchronousWebDriver.prototype.preprocessParameter = Selenium.prototype.preprocessParameter;
SynchronousWebDriver.prototype.replaceVariables = Selenium.prototype.replaceVariables;


