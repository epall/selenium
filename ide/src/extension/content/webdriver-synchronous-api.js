
/**
 * This file describes the synchronous behavior. 
 * Functions call directly on the FirefoxDriver object   
 *         
 */


/**
 * A FakeResponse which encapsulates the result of a command.
 * It is similar to the Response object used at the WebDriver extension 
 * except that the content of the send function
 * is emptied
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
   * @param {window} win The content window that the command will be executed on.
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
 * Enumeration of predefined names command names 
 * 
 */
SynchronousWebDriver.CommandName = {
 
  // Commands dispatched to the browser driver. -------------------------------
  NEW_SESSION: 'newSession',
  DELETE_SESSION: 'deleteSession',
  QUIT: 'quit',
  GET_CURRENT_WINDOW_HANDLE: 'getCurrentWindowHandle',
  GET_WINDOW_HANDLES: 'getWindowHandles',
  GET_CURRENT_URL: 'getCurrentUrl',
  CLOSE: 'close',
  SWITCH_TO_WINDOW: 'switchToWindow',
  SWITCH_TO_FRAME: 'switchToFrame',
  SWITCH_TO_DEFAULT_CONTENT: 'switchToDefaultContent',
  GET: 'get',
  FORWARD: 'goForward',
  BACK: 'goBack',
  REFRESH: 'refresh',
  GET_TITLE: 'title',
  GET_PAGE_SOURCE: 'getPageSource',
  EXECUTE_SCRIPT: 'executeScript',
  GET_MOUSE_SPEED: 'getMouseSpeed',
  SET_MOUSE_SPEED: 'setMouseSpeed',
  FIND_ELEMENT: 'findElement',
  FIND_ELEMENTS: 'findElements',
  FIND_CHILD_ELEMENT: 'findChildElement',
  FIND_CHILD_ELEMENTS: 'findChildElements',
  GET_ACTIVE_ELEMENT: 'getActiveElement',
  SET_VISIBLE: 'setVisible',
  GET_VISIBLE: 'getVisible',
  CLICK: 'click',
  CLEAR: 'clear',
  SUBMIT: 'submit',
  GET_TEXT: 'getText',
  SEND_KEYS: 'sendKeys',
  GET_VALUE: 'getValue',
  GET_TAG_NAME: 'getTagName',
  IS_SELECTED: 'isSelected',
  SET_SELECTED: 'setSelected',
  TOGGLE: 'toggle',
  IS_ENABLED: 'isEnabled',
  IS_DISPLAYED: 'isDisplayed',
  GET_LOCATION: 'getLocation',
  GET_SIZE: 'getSize',
  GET_ATTRIBUTE: 'getAttribute',
  DRAG_ELEMENT: 'dragElement',
  GET_VALUE_OF_CSS_PROPERTY: 'getValueOfCssProperty'
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
        fxbrowser, response.context.frameId);
  }
  
//  response.startCommand(this.win);
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
 * @param {Response} response The response object to send the command response
 *     in.
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

//========================================= ACTIONS ===============================================
 
 /**
   * Clicks on a link, button .... If the click action
   * causes a new page to load (like a link usually does), call
   * waitForPageToLoad.
   *
   * @param locator an element locator
   *
   */

SynchronousWebDriver.prototype.doClick = function(locator) {
	
     var response = this.initResponse();  
     var element = this.findElement_(locator);
     response.elementId = element;
     this.driver[SynchronousWebDriver.CommandName.CLICK](response);
          
}

 /**
   * Opens an URL in the test frame. This accepts both relative and absolute
   * URLs.
   *
   */

SynchronousWebDriver.prototype.doOpen = function(url) {

  var response = this.initResponse();
  this.driver[SynchronousWebDriver.CommandName.GET](response,absolutify(url, this.baseUrl)); 
  return this.makePageLoadCondition();

}

/**
   * Sets the value of an input field, as though you typed it in.
   * @param locator an element locator
   * @param value the value to type
   */

SynchronousWebDriver.prototype.doType = function(locator, value) {
	var val = [];
	val.push(value);
    var response = this.initResponse();
    var element = this.findElement_(locator);
    response.elementId = element;
	this.driver[SynchronousWebDriver.CommandName.SEND_KEYS](response,val);	
}

 /**
 	* Waits for a new page to load.
 	* @param timeout a timeout in milliseconds, after which this command will return with an error
 	*/

SynchronousWebDriver.prototype.doWaitForPageToLoad = function(timeout) {
    setTimeout(fnBind(currentTest.continueTestWhenConditionIsTrue, currentTest), 30000);
    return this.makePageLoadCondition(timeout);
};


// ======================================== ACCESSORS ===========================

/** Gets the result of evaluating the specified JavaScript snippet.  The snippet may
   * have multiple lines, but only the result of the last line will be returned.
   * @param script the JavaScript snippet to run
   * @return string the results of evaluating the snippet
   */

SynchronousWebDriver.prototype.getEval = function(script) {
	var value = [];
	value.push("return ("+script+");");
	this.driver[SynchronousWebDriver.CommandName.EXECUTE_SCRIPT](response,value);
	return response.response;
  
}

/**
   * Gets the text of an element.
   * @param locator an element locator
   * @return string the text of the element
   */

SynchronousWebDriver.prototype.getText = function(locator) {
    var response = this.initResponse();
    var element = this.findElement_(locator);
    response.elementId = element;
    this.driver[SynchronousWebDriver.CommandName.GET_TEXT](response);
    return response.response;
}

/** Gets the title of the current page.
   *
   * @return string the title of the current page
   */


SynchronousWebDriver.prototype.getTitle = function() {
    var response = this.initResponse();
    this.driver[SynchronousWebDriver.CommandName.GET_TITLE](response); 
    return response.response; 
}

/**
    * Returns the number of nodes that match the specified xpath
    * @param xpath the xpath expression to evaluate.
    * @return number the number of nodes that match the specified xpath
    */
SynchronousWebDriver.prototype.getXpathCount = function(xpath) {
	var response = this.initResponse();
	var parameters = [];
	parameters.push(By.xpath(xpath).type);
	parameters.push(By.xpath(xpath).target);
    this.driver[SynchronousWebDriver.CommandName.FIND_ELEMENTS](response,parameters);
    elements = response.response;
    return elements.length();
}

/**
   * Verifies that the specified text pattern appears somewhere on the rendered page shown to the user.
   * @param pattern to match with the text of the page
   * @return boolean true if the pattern matches the text, false otherwise
   */

SynchronousWebDriver.prototype.isTextPresent = function(pattern) {
    var response = this.initResponse();
    this.driver[SynchronousWebDriver.CommandName.GET_PAGE_SOURCE](response);
    var source = response.response;
    if(source.indexOf(pattern)!= -1)
    return source.indexOf(pattern);	
    
}

/**
   * Determines if the specified element is visible.
   * @param locator an element locator
   * @return boolean true if the specified element is visible, false otherwise
   */

SynchronousWebDriver.prototype.isVisible = function(locator) {
	var response = this.initResponse();
    var element = this.findElement_(locator);
    response.elementId = element;
    this.driver[SynchronousWebDriver.CommandName.IS_DISPLAYED](response);
    var visible = response.response;
    return visible;
}

/**
 * Finds element on the current page. The response value will be the UUID of
 * the located element or an error message if an element could not be found.
*/

SynchronousWebDriver.prototype.findElement_ = function(locator) {
	
	
	var pattern = /^([a-zA-Z]+)=(.*)$/;
    var result = locator.match(pattern);
    var strategyName = "implicit";
    var use = locator;
    var driver = this.driver;
    var response = this.initResponse();
    var res = [];
   
    /**
 	* FIND_ELEMENT search an element on the current page. The response value will be the UUID of
	 * the located element, or an error message if an element could not be found.
 	* @param {Response} respond Object to send the command response with.
 	* @param {Array.<string>} parameters A two-element array: the first element
 	*     should be the type of locator strategy to use, the second is the target
	*     of the search.
    */
    
    var makeSimpleFinder = function(strategy){  
        var parameters =[];
        parameters[0] = strategy.type;
        parameters[1] = strategy.target;
        driver[SynchronousWebDriver.CommandName.FIND_ELEMENT](response,parameters);
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
        if(use.substring(0, 2) == "//") {
            if (use.match(/\/$/))
                use = use.substring(0, use.length() - 1);           
                res = makeSimpleFinder(By.xpath(use));
             
        } else if(use.match("^document\.")) {
        	 var script = [];
    	     script.push("return "+use+";");  	    
             driver[SynchronousWebDriver.CommandName.EXECUTE_SCRIPT](response,script);
             res[0] = response.isError;
             res[1] = response.response;      
             
        } else {
            res = makeSimpleFinder(By.id(use));   
            // if the search by id was unsuccessful
            if(res[0]){
            	// search by name
            	res = makeSimpleFinder(By.name(use));
            	res[0] = false;
            }
        }
        break;
        
        case "link":
        if(use.indexOf("exact:") == 0){
            // shortcut for fast case
            elt = makeSimpleFinder(By.linkText(use.substring(6)));
        } else {
        	
        	/**
 			* FIND_ELEMENTS searches for multiple elements on the page. 
 			* The response value will be an array of UUIDs for the located elements.
 			* @param {Response} response Object to send the command response with.
		    * @param {Array.<string>} parameters A two-element array: the first element
 			*     should be the type of locator strategy to use, the second is the target
			 *     of the search.
 			*/
            var patternMatcher = new PatternMatcher(use);
    		var parameters = [];
    		parameters.push(By.xpath("//a").type);
            parameters.push(By.xpath("//a").target);
            driver[SynchronousWebDriver.CommandName.FIND_ELEMENTS](response,parameters);
            elements = response.response;
            var elementTexts = {};
              
                    for(var idx = 0; idx < elements.length; idx++){                    
                        elementTexts[idx] = elements[idx]; 
                    }
                              
                    for(var id in elementTexts){  
                        response.elementId = elementTexts[id];
                       	driver[SynchronousWebDriver.CommandName.GET_TEXT](response);
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
        //if the search by id was unsuccessful
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
            use = use.substring(0, use.length() - 1);
        res = makeSimpleFinder(By.xpath(use));
        break;

        case "dom":
        var script = [];
    	script.push("return "+use+";");  	
        driver[SynchronousWebDriver.CommandName.EXECUTE_SCRIPT](response,script);
        res[0] = response.isError;
        res[1] = response.response; 
        break;

       
        default:
        throw new SeleniumError("Strategy not supported");
    }
    
    if(res[0] || (res[0] == undefined ) || (res[1] == undefined )){
    	throw new SeleniumError("Element "+use + " not found");
    }
   			
    return res[1];
  
}

SynchronousWebDriver.prototype.makePageLoadCondition = function(timeout) {
	
    if (timeout == null) {
        timeout = this.defaultTimeout;
    }
    // if the timeout is zero, we won't wait for the page to load before returning
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
            driver[SynchronousWebDriver.CommandName.EXECUTE_SCRIPT](response,script);
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


