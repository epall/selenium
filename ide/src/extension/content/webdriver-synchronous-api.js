	/**
  	  * This file describes the synchronous behavior. Functions call directly on the
      * FirefoxDriver object
      */
    var newContext;
    var newFxbrowser; 
    var documentInFrame;
	function SynchronousWebDriver(baseURL,window) {	
		
		this.baseUrl = baseURL;
	  	this.defaultTimeout = 30 * 1000;
	  	this.browserbot = BrowserBot.createForWindow(window, false); 	
	 	this.wdProxy = new WebDriverProxy();
	  	this.driver = this.wdProxy.getDriverInstance();
	  	this.fxbrowser = this.wdProxy.fxdriver.fxbrowser;
	  	this.context = this.wdProxy.context;

	  	this.locationStrategies = [];  	  	
	  	
	  	this.altKeyDown = false;
    	this.controlKeyDown = false;
    	this.shiftKeyDown = false;
    	this.metaKeyDown = false;
	  	
	}
	
	SynchronousWebDriver.createForWindow = function(window) {
		return new SynchronousWebDriver(window);       
	}
	
	SynchronousWebDriver.prototype.reset = function() {
	  
	}
	
	SynchronousWebDriver.prototype.ensureNoUnhandledPopups = function() {
	    
	}


// ========================================= ACTIONS ===========================

	/**
	  * Add a selection to the set of selected options in a multi-select element using an option locator.
	  * @param locator an element locator identifying a multi-select box
	  * @param optionLocator an option locator (a label by default)
	  */
	SynchronousWebDriver.prototype.doAddSelection = function(locator,optionLocator) {
		
	    var element = findElement_(this.driver,locator,this.context)[1];
	    var elementId = findElement_(this.driver,locator,this.context)[0];
	
	    if (!("options" in element)) {
	        throw new SeleniumError("Specified element is not a Select (has no options)");
	    }
	    
	    if (!this.isMultiple(elementId)) {
	      throw new SeleniumError("You may only add a selection to a select that supports multiple selections");
	    }
	    
	    this.doSelect(locator,optionLocator);
	    
	}
	
	/**
	  * Press the alt key and hold it down until doAltUp() is called or a new page is loaded.
	  *
	  */
	SynchronousWebDriver.prototype.doAltKeyDown = function() {
  		this.altKeyDown = true;
	}

	/**
	  * Release the alt key.
	  *
	  */
	SynchronousWebDriver.prototype.doAltKeyUp = function() {
		this.altKeyDown = false;
	}
	
	/**
	  * Sets the "id" attribute of the specified element.
	  * This ID will disappear once the page is
	  * reloaded.
	  * @param locator an element locator pointing to an element
	  * @param identifier a string to be used as the ID of the specified element
	  */	
	SynchronousWebDriver.prototype.doAssignId = function(locator,identifier) {
		var element = findElement_(this.driver,locator,this.context)[1];
		element.id = identifier;
	}
	
	
	SynchronousWebDriver.prototype.captureScreenshotToString = function() {
  		this.driver.getScreenshotAsBase64();
	}

	/**
   	  * Check a toggle-button (checkbox/radio)
   	  * @param locator an element locator
   	  */
	SynchronousWebDriver.prototype.doCheck = function(locator){
		this.driver.setSelected(locator); 
	}

 	/**
   	  * Clicks on a link, button .... If the click action causes a new page to
   	  * load (like a link usually does), call waitForPageToLoad.
   	  * @param locator an element locator
   	  */
   	SynchronousWebDriver.prototype.doClick = function(locator) { 
   		var script = [];
	    script.push("document.old = true");
	    this.driver.executeScript(script);
		this.driver.click(locator);	
	}

	/**
  	  * Simulates the user clicking the "close"
  	  * window or tab.
  	  */
	SynchronousWebDriver.prototype.doClose = function() {  
		this.driver.close();
	}
	
	SynchronousWebDriver.prototype.doCreateCookie = function(cookieName) {
		var cookie = [];
		cookie.push(cookie);
		this.driver.addCookie(cookieName);
	}

	/**
	  * Press the control key and hold it down until doControlUp() is called or a new page is loaded.
	  *
	  */
	SynchronousWebDriver.prototype.doControlKeyDown = function() {
	  this.controlKeyDown = true;
	}
	
	/**
	  * Release the control key.
	  *
	  */
	SynchronousWebDriver.prototype.doControlKeyUp = function() {
	  this.controlKeyDown = false;
	}
	
  	/**
      * Delete a named cookie.
      */
	SynchronousWebDriver.prototype.doDeleteCookie = function(cookieName) {
		this.driver.deleteCookie(cookieName);   
	}

	/**
  	  * Delete all cookies visible to the current page.
      * 
      */
	SynchronousWebDriver.prototype.doDeleteAllVisibleCookies = function() {
    	this.driver.deleteAllCookies(); 
	}

	/**
	  * Double clicks on a link, button, checkbox or radio button. If the double click action
	  * causes a new page to load, call
	  * waitForPageToLoad.
	  * @param locator an element locator
	  *
	  */
	SynchronousWebDriver.prototype.doDoubleClick = function(locator) {
   		this.driver.click(locator); 
   		this.driver.click(locator); 
	}
    
	 /**
	  * deprecated - use dragAndDrop instead
	  * @param locator - an element locator
	  * @param movementsString - offset in pixels from the current location to which the element should be moved
	  */   
	SynchronousWebDriver.prototype.doDragdrop = function(locator, movementsString) {
   		this.doDragAndDrop(locator,movementsString);
	}
	
	/**
	  * Drags an element a certain distance and then drops it
	  * @param locator - an element locator
	  * @param movementsString - offset in pixels from the current location to which the element should be moved
	  */   
	SynchronousWebDriver.prototype.doDragAndDrop = function(locator, movementsString) {
		var movements = movementsString.split(/,/);
		var movementsString = new Array(Number(movements[0]),Number(movements[1]));
		return this.driver.dragElement(locator,movementsString);
	}
	
	/**
	  * Drags an element and drops it on another element
	  * locatorOfObjectToBeDragged - an element to be dragged
	  * locatorOfDragDestinationObject - an element whose location (i.e., whose center-most pixel) will be the point where locatorOfObjectToBeDragged is dropped
	  */   
	SynchronousWebDriver.prototype.doDragAndDropToObject = function(locatorOfObjectToBeDragged, locatorOfDragDestinationObject) {
  
	   var startX = this.getElementPositionLeft(locatorOfObjectToBeDragged);
	   var startY = this.getElementPositionTop(locatorOfObjectToBeDragged);
	   
	   var destinationLeftX = this.getElementPositionLeft(locatorOfDragDestinationObject);
	   var destinationTopY = this.getElementPositionTop(locatorOfDragDestinationObject);
	   var destinationWidth = this.getElementWidth(locatorOfDragDestinationObject);
	   var destinationHeight = this.getElementHeight(locatorOfDragDestinationObject);
	
	   var endX = Math.round(destinationLeftX + (destinationWidth / 2));
	   var endY = Math.round(destinationTopY + (destinationHeight / 2));
	   
	   var deltaX = endX - startX;
	   var deltaY = endY - startY;
	   
	   var movementsString = "" + deltaX + "," + deltaY;
	   
	   this.doDragAndDrop(locatorOfObjectToBeDragged,movementsString);
	}
	
	/**
	  * Explicitly simulate an event, to trigger the corresponding on event
	  * handler.
	  * @param locator an element locator
	  * @param eventName the event name, e.g. "focus" or "blur"
	  */
	SynchronousWebDriver.prototype.doFireEvent = function(locator,value) {
	  	var element = findElement_(this.driver,locator,this.context)[1];
	  	triggerEvent(element,value,false);
	}
	
	/** 
	  * Move the focus to the specified element;
	  * @param locator an element locator
	  */
	SynchronousWebDriver.prototype.doFocus = function(locator) {
	  	var element = findElement_(this.driver,locator,this.context)[1];
			if (element.focus) {
	        	element.focus();
	    	} else {
	         	triggerEvent(element,"focus", false);
	    	}
	}


	/**
	  * Simulates the user clicking the "back" button on their browser.
	  *
	  */
	SynchronousWebDriver.prototype.doGoBack = function() {  
	  	this.driver.goBack();
	}
	
	/**
	  * Simulates a user pressing a key (without releasing it yet).
	  * @param locator an element locator
	  * @param keySequence Either be a string("\" followed by the numeric keycode
	  *  of the key to be pressed, normally the ASCII value of that key), or a single
	  *  character.
	  */
	SynchronousWebDriver.prototype.doKeyDown = function(locator, keySequence) {
	 
		var element = findElement_(this.driver,locator,this.context)[1];
		triggerKeyEvent(element, 'keydown', keySequence, true, 
	         this.controlKeyDown, 
	         	this.altKeyDown, 
	            	this.shiftKeyDown,
	            		this.metaKeyDown);
	}

	/**
	  * Simulates a user releasing a key.
	  * @param locator an element locator
	  * @param keySequence Either be a string("\" followed by the numeric keycode
	  *  of the key to be pressed, normally the ASCII value of that key), or a single
	  *  character. 
	  */
	SynchronousWebDriver.prototype.doKeyUp = function(locator, keySequence) {
		
		var element = findElement_(this.driver,locator,this.context)[1];
		triggerKeyEvent(element, 'keyup', keySequence, true, 
	         this.controlKeyDown, 
	         	this.altKeyDown, 
	            	this.shiftKeyDown,
	            		this.metaKeyDown);
	  
	}
	
	SynchronousWebDriver.prototype.doKeyPress = function(locator, keySequence) {
   	
		var element = findElement_(this.driver,locator,this.context)[1];
		triggerKeyEvent(element, 'keypress', keySequence, true, 
	         this.controlKeyDown, 
	         	this.altKeyDown, 
	            	this.shiftKeyDown,
	            		this.metaKeyDown);
	}
	
	/**
	  * Press the meta key and hold it down until doMetaUp() is called or a new page is loaded.
	  *
	  */
	SynchronousWebDriver.prototype.doMetaKeyDown = function() {
		this.metaKeyDown = true;
	}
	
	/**
	  * Release the meta key.
	  *
	  */
	SynchronousWebDriver.prototype.doMetaKeyUp = function() {
		this.metaKeyDown = false;
	}
	
	SynchronousWebDriver.prototype.triggerMouseEvent_ = function(element, eventType, clientX, clientY) {
		var event = element.ownerDocument.createEvent("MouseEvents");
		var view = element.ownerDocument.defaultView;
	
	  	event.initMouseEvent(eventType, true, true, view, 1, 0, 0, clientX, clientY,
	      false, false, false, false, 0, element);
	  	element.dispatchEvent(event);
	}

	SynchronousWebDriver.prototype.doMouseOver = function(locator) {
	    var element = findElement_(this.driver,locator,this.context)[1];
	    this.triggerMouseEvent_(element,'mouseover',0,0);
	}
	
	SynchronousWebDriver.prototype.doMouseOut = function(locator) {
	    var element = findElement_(this.driver,locator,this.context)[1];
	    this.triggerMouseEvent_(element,'mouseout',0,0);
	}
	
	SynchronousWebDriver.prototype.doMouseDown = function(locator) {
	    var element = findElement_(this.driver,locator,this.context)[1];
	    this.triggerMouseEvent_(element,'mousedown',0,0);
	}
	
	SynchronousWebDriver.prototype.doMouseDownAt = function(locator) {
	  
	    var element = findElement_(this.driver,locator,this.context)[1];
	    var clientXY = this.driver.getLocation(locator);
	    var clientX = clientXY.x;
	    var clientY = clientXY.y;
	    this.triggerMouseEvent_(element,'mousedown',clientX,clientY);
	}
	
	
	SynchronousWebDriver.prototype.doMouseUp = function(locator) { 
	    var element = findElement_(this.driver,locator,this.context)[1];
	    this.triggerMouseEvent_(element,'mouseup',0,0);
	}
	
	SynchronousWebDriver.prototype.doMouseUpAt = function(locator) {
	    var element = findElement_(this.driver,locator,this.context)[1];
	    var clientXY = this.driver.getLocation(locator);
	    var clientX = clientXY.x;
	    var clientY = clientXY.y;
	    this.triggerMouseEvent_(element,'mouseup',clientX,clientY);
	}
	
	SynchronousWebDriver.prototype.doMouseMove = function(locator) { 
	    var element = findElement_(this.driver,locator,this.context)[1];
	    this.triggerMouseEvent_(element,'mousemove',0,0);
	}
	
	SynchronousWebDriver.prototype.doMouseMoveAt = function(locator) {
	    var element = findElement_(this.driver,locator,this.context)[1];
	    var clientXY = this.driver.getLocation(locator);
	    var clientX = clientXY.x;
	    var clientY = clientXY.y;
	    this.triggerMouseEvent_(element,'mousemove',clientX,clientY);
	}
	
	/**
	   * Opens an URL in the test frame. This accepts both relative and absolute
	   * URLs.
	   * 
	   */

	SynchronousWebDriver.prototype.doOpen = function(url) {	
	    this.driver.get(absolutify(url, this.baseUrl));
	  	return this.makePageLoadCondition();
	}
	

 /**
   * Simulates the user clicking the "refresh" button on their browser.
   *
   */
	SynchronousWebDriver.prototype.doRefresh = function() {  
	    this.driver.refresh();
	}
	
	SynchronousWebDriver.prototype.isMultiple = function(theSelect) {
  	var attributeName = [];
    attributeName.push('multiple');
    var multiple = this.driver.getAttribute(true,theSelect,attributeName);
   
    if (multiple == null) { return false; }
    if ("false" == multiple) { return false; }
    if ("" == multiple) { return false; }
   
    return true;
  	}
	
	/**
	  * Remove a selection to the set of selected options in a multi-select element using an option locator.
	  * @param locator an element locator identifying a multi-select box
	  * @param optionLocator an option locator (a label by default)
	  */
	SynchronousWebDriver.prototype.doRemoveSelection = function(locator,optionLocator) {
	    var element = findElement_(this.driver,locator,this.context)[1];
	    var elementId = findElement_(this.driver,locator,this.context)[0];
	    
	    if (!("options" in element)) {
	        throw new SeleniumError("Specified element is not a Select (has no options)");
	    }
	    
	    if (!this.isMultiple(elementId)) {
	      throw new SeleniumError("You may only add a selection to a select that supports multiple selections");
	    }
	    this.doSelect(locator,optionLocator,false);
	}
	
	/**
	  * Remove a selection to the set of selected options in a multi-select element using an option locator.
	  * @param locator an element locator identifying a multi-select box
	  * @param optionLocator an option locator (a label by default)
	  */
	SynchronousWebDriver.prototype.doRemoveAllSelections = function(locator) {
		
		var select = findElement_(this.driver,locator,this.context)[0];
		var parameters = function(param1,param2,param3){
	  	this.using = param1;
	  	this.value = param2;
	  	this.id = param3;
	  	};
	  	var options = [];
	  	options.push(new parameters("tag name","option",select));    
	  	var allOptions = this.driver.findChildElements(options);
	    
	  
	  	var attributeName = [];
	    attributeName.push('multiple');
	    var multiple = this.driver.getAttribute(true,select,attributeName);
	    	   
	    if (multiple == null) {
	    	return;
	    }
	    
	    for (option in allOptions) {
	    	var selected = this.driver.isSelected(true,option);
	    		if(selected){
				this.driver.toggle(true,option);
	  			}		
	    }   
	
	 }
 

 	/**
	  * adds the specified text into the body of the current test window. 
	  * @param script the JavaScript snippet to run
	  * 
	  */
	SynchronousWebDriver.prototype.doRunScript = function(script) {
	  var scriptToRun = [];
	  scriptToRun.push(script);  	    
	  this.driver.executeScript(scriptToRun);
	}
	
	 /**
	   * Select an option from a drop-down using an option locator.
	   * @param selectLocator an identifying a drop-down menu
	   * @param optionLocator an option locator
	   * 
	   */
	SynchronousWebDriver.prototype.doSelect = function(selectLocator,optionLocator,wasSelected) {  
	  var driver = this.driver;
	  var strategyName = "implicit";
	  var use = optionLocator;
	  var pattern = /^([a-zA-Z]+)=(.*)$/;
	  var result = optionLocator.match(pattern);
	    
	  if(result != null){
	        strategyName = result[1];
	        use = result[2];
	   }
	    
	  var strategies = {
	     label: function(option){
	            var label = driver.getText(true,option);
	                if(label == use){
	                 
	                    	driver.setSelected(true,option);
	                        
	                        if(wasSelected == false){
	                        	driver.toggle(true,option);
	                        }
	                        
	                   
	                }
	      },
	        
	      id: function(option){
	        	var attributeName = [];
	        	attributeName.push('id');
	        	var id = driver.getAttribute(true,option,attributeName);
	                if(id == use){
	                 
	                    	driver.setSelected(true,option);
	                        if(wasSelected == false){
	                        	driver.toggle(true,option);
	                        }
	                  
	                }
	      },
	        
	      index: function(option, index){
	            if(index == use){
	                  
	                    	driver.setSelected(true,option);
	                        
	                        if(wasSelected == false){
	                       
	                        	driver.toggle(true,option);
	                        }
	                  
	            }
	      },
	        
	      value: function(option){
	        	var value = driver.getValue(true,option);
	                if(value == use){
	                  
	                    	driver.setSelected(true,option);
	                        if(wasSelected == false){
	                       
	                        	driver.toggle(true,option);
	                        }
	                        
	                   
	                }
	      }
	  }
	    
	  strategies['implicit'] = strategies['label'];
	    
	  var strategy = strategies[strategyName];
	  if(!strategy){
	        throw new SeleniumError("Strategy "+strategyName+" not supported");
	  }
	    
	  var select = findElement_(this.driver,selectLocator,this.context)[0];
	 
	  var parameters = function(param1,param2,param3){
	  this.using = param1;
	  this.value = param2;
	  this.id = param3;
	  };
	  
	  
	  var map = [];
	  map.push(new parameters(ElementLocator.TAG_NAME,"option",select));    
	  var allOptions = driver.findChildElements(map);
	  
	  for(var i = 0; i < allOptions.length; i++){
	       		strategy(allOptions[i], i);
	  }
	             
	}
	
	/**
	 * 
	 * Select Frame
	 */
	
	SynchronousWebDriver.prototype.doSelectFrame = function(frameId) {
		 newContext = switchToFrame_(this.driver,frameId,this.context,this.fxbrowser);	
	}

	SynchronousWebDriver.prototype.doSelectWindow = function(windowId) {	
		var windId;
	
		if(windowId == 'null'){
		 	newContext = this.context;
		 	newFxbrowser = this.fxbrowser;
		 		 	
		 } else{
		 	
				var pattern = /^([a-zA-Z]+)=(.*)$/;
			 	var result = windowId.match(pattern);
			 	if(result){
			 		windId = result[2];
			 	}else{
			 		windId = windowId;
			 	}
			 	
			 	var id = new Array(windId);
			 	newContext = switchToWindow(id)[0];
			 	newFxbrowser = switchToWindow(id)[1];
			 } 
 }
 
     SynchronousWebDriver.prototype.doSetBrowserLogLevel = function(logLevel) {  
	    if (logLevel == null || logLevel == "") {
	        throw new SeleniumError("You must specify a log level");
	    }
	    logLevel = logLevel.toLowerCase();
	    if (LOG.logLevels[logLevel] == null) {
	        throw new SeleniumError("Invalid log level: " + logLevel);
	    }
	    LOG.setLogLevelThreshold(logLevel);
	}
	
	
	/** 
	  * Configure the mouse speed
	  * If the mouse speed is negative,it is given the default mouse speed(10)
	  * @param pixels the number of pixels between "mousemove" events
	  */
	SynchronousWebDriver.prototype.doSetMouseSpeed = function(pixels) {	
	  if (pixels < 0 ) 
	  pixels = Selenium.DEFAULT_MOUSE_SPEED;
	  var speed = [];
	  speed.push(pixels);
	  this.driver.setMouseSpeed(speed);
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
		  * Press the shift key and hold it down until doShiftUp() is called or a new page is loaded.
		  *
		  */
	SynchronousWebDriver.prototype.doShiftKeyDown = function() {
		this.shiftKeyDown = true;
	}
	
	/**
	  * Release the shift key.
	  *
	  */
	SynchronousWebDriver.prototype.doShiftKeyUp = function() {
	   this.shiftKeyDown = false;
	}

	
	/**
	  * Submit the specified form. This is particularly useful for forms without
	  * submit buttons.
	  * @param formLocator an element locator for the form you want to submit
	  * 
	  */
	SynchronousWebDriver.prototype.doSubmit = function(locator) {	
	   this.driver.submit(locator);
	}
	
	
	/**
	  * Sets the value of an input field, as though you typed it in.
	  * @param locator an element locator
	  * @param value the value to type
	  */
	SynchronousWebDriver.prototype.doType = function(locator,value) {
		
		if (this.controlKeyDown || this.altKeyDown || this.metaKeyDown) {
        	throw new SeleniumError("type not supported immediately after call to controlKeyDown() or altKeyDown() or metaKeyDown()");
    	}
        
    	if (this.shiftKeyDown) {
        	value = new String(value).toUpperCase();
    	} 
    	
	  	var value = new Array(value);
	  	this.driver.sendKeys(locator,value);	
	}
	
	SynchronousWebDriver.prototype.doTypeKeys = function(locator,value) {	

		value = value.replace("\\38", 'up arrow');
	    value = value.replace("\\40", 'down arrow');
	    value = value.replace("\\37", 'left arrow');
	    value = value.replace("\\39", 'right arrow');
	
	    var value = new Array(value);
	    
	    this.driver.sendKeys(locator,value);   
	}

	
	/**
	  * Uncheck a toggle-button (checkbox/radio)
	  * @param locator an element locator</a>
	  */
	SynchronousWebDriver.prototype.doUncheck = function(locator) {  
		var selected = this.driver.isSelected(locator);
	    if(selected){
		this.driver.toggle(locator);
	    }		
	}
	
	/**
	  * Waits for a new page to load.
	  * @param timeout a timeout in milliseconds, after which this command will
	  * return with an error
	  */
	SynchronousWebDriver.prototype.doWaitForPageToLoad = function(timeout) {
	  setTimeout(fnBind(currentTest.continueTestWhenConditionIsTrue,currentTest),5);
	  return this.makePageLoadCondition(timeout);
	}
	
	/**
	  * Waits for a new page to load.
	  * @param timeout a timeout in milliseconds, after which this command will
	  * return with an error
	  */
	SynchronousWebDriver.prototype.doWaitForFrameToLoad = function(timeout) {
	setTimeout(fnBind(currentTest.continueTestWhenConditionIsTrue, currentTest),5);
	  return this.makePageLoadCondition(timeout);
	  
	}
	
	SynchronousWebDriver.prototype.doWaitForPopUp = function(name, timeout) {
		
	    if (timeout == null) {
	        timeout = this.defaultTimeout;
	    }
	    
	    
	    var timeoutTime = getTimeoutTime(timeout);
	    
	    var tryToSwitch = function() {
	      	     	
	     	try{
	     		var currentWindow = new Array(name);
	            newContext = switchToWindow(currentWindow)[0];
	            newFxbrowser = switchToWindow(currentWindow)[1];
	     		
	     	}catch(e){
	     		 if(new Date().getTime() > timeoutTime){
	               throw new SeleniumError("Timed out after " + timeout + "ms");
	            }
	     	}
	        
	    };
	    
	    tryToSwitch();
}
	
	/** 
	  * Gives focus to the currently selected window
	  *
	  */
	SynchronousWebDriver.prototype.doWindowFocus = function() {
		var script = [];
		script.push("window.focus()");
		this.driver.executeScript(script);
	}
	
	/** 
	  * Resize currently selected window to take up the entire screen
	  *
	  */
	SynchronousWebDriver.prototype.doWindowMaximize = function() {
  		var script = [];
  		script.push("if (window.screen) { window.moveTo(0, 0); window.resizeTo(window.screen.availWidth, window.screen.availHeight);};");
  		this.driver.executeScript(script);
	}

// ======================================== ACCESSORS ==========================

	/** 
	  * Returns the IDs of all buttons on the page.
	  * @return string[] the IDs of all buttons on the page
	  * 
	  */
	SynchronousWebDriver.prototype.getAllButtons = function(locator) {
		var buttons = [];
		var parameters = [];
		parameters.push(ElementLocator.XPATH);
		parameters.push("//input");
		allInputs = this.driver.findElements(parameters);	 
		var attributeId = [];
		attributeId.push("id"); 
		var attributeType = [];
		attributeType.push("type"); 
		  
		for(var input in allInputs){  	
		    type = this.driver.getAttribute(true, allInputs[input],attributeType);
		    if(("button" == type) || ("submit" == type) || ("reset" == type)){
		        var att = this.driver.getAttribute(true,allInputs[input],attributeId);	         
		        buttons.push(att);
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
	  	var fields = [];
	  	var parameters = [];
	  	parameters.push(ElementLocator.XPATH);
	  	parameters.push("//input");
	  	allInputs = this.driver.findElements(parameters);
	  	var attributeId = [];
	  	attributeId.push("id"); 
	  	var attributeType = [];
	  	attributeType.push("type");
	  
	  	for(var input in allInputs){  
	      type = this.driver.getAttribute(true,allInputs[input],attributeType);
	      if("text" == type){
	          var fld = this.driver.getAttribute(true,allInputs[input],attributeId);
	          fields.push(fld);
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
	  	var links = [];
	  	var parameters = [];
	  	parameters.push(ElementLocator.XPATH);
	  	parameters.push("//a");
	  	allLinks = this.driver.findElements(parameters);
	  	var elementAttribute = {};
	  	var attribute = [];
	  	attribute.push("id");
	  
	  	for(var idx = 0; idx < allLinks.length; idx++){                    
	     elementAttribute[idx] = allLinks[idx]; 
	  	}           
	     
	    for(var id in elementAttribute){  
	         var lk = this.driver.getAttribute(true,elementAttribute[id],attribute);
	         links.push(lk);
	    } 
	  	return links;	
	}

	SynchronousWebDriver.prototype.getAllWindowTitles = function() {
	 	
		var current = this.driver.getCurrentWindowHandle();
	    var handles = getWindowHandles();
	    attributes = [];
	    for (handle in handles) {
	      switchToWindow(handle);
	      attributes.push(this.driver.getTitle());
	    }
	
	    switchToWindow(current);
	
	    return attributes;	
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
	  	return this.driver.getAttribute(elementLocator,attribute);
	}

	/**
	  * Gets the entire text of the page.
	  * @return string the entire text of the page
	  * 
	  */
	SynchronousWebDriver.prototype.getBodyText = function() {
	  	var parameters = [];
	  	parameters.push(ElementLocator.XPATH);
	  	parameters.push("//body");
	  	elementId = this.driver.findElement(parameters);
	  	return this.driver.getText(true,elementId);
	}
	
	/**
	  * Gets all cookies of the current page under test.
	  * @return string all cookies of the current page under test
	  * 
	  */
	SynchronousWebDriver.prototype.getCookie = function() {
	  	return this.driver.getCookie();
	}
		
	/**
	  * Gets the value of the cookie with the specified name, or throws an error if the cookie is not present.
	  * @param name the name of the cookie
	  * @return string the value of the cookie
	  * 
	  */
	SynchronousWebDriver.prototype.getCookieByName = function(cookieName) {
		var name = null;
	  	var doc = getDocument(this.context);
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
	  	return (this.driver.getSize(locator)).height;	
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
	  	var element = findElement_(this.driver,locator,this.context)[1];
	  	var previousElement;
	  	var index = 0;
	  	while ((previousElement = element.previousSibling) != null) {
	        if (!this._isCommentOrEmptyTextNode(previousElement)) {
	            index++;
	        }
	        element = previousElement;
	  	}
	  	return index;
	}
	
	/**
	  * Retrieves the horizontal position of an element
	  * @param locator an element locator pointing to an element OR an element itself
	  * @return number of pixels from the edge of the frame.
	  */
	SynchronousWebDriver.prototype.getElementPositionLeft = function(locator) {
	  	return (this.driver.getLocation(locator)).x;	
	}
	
	/**
	  * Retrieves the vertical position of an element
	  * @param locator an element locator pointing to an element OR an element itself
	  * @return number of pixels from the edge of the frame.
	  */
	SynchronousWebDriver.prototype.getElementPositionTop = function(locator) {
	  	return (this.driver.getLocation(locator)).y;
	}
	
	/**
	  * Retrieves the width of an element
	  * @param locator an element locator pointing to an element
	  * @return width of an element in pixels
	  */
	SynchronousWebDriver.prototype.getElementWidth = function(locator) {  
	  	return (this.driver.getSize(locator)).width;
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
	  	return (this.driver.executeScript(value)).value;
	}
	
	/** 
	  * Returns the entire HTML source between the opening and
	  * closing "html" tags.
	  * @return string the entire HTML source
	  */
	SynchronousWebDriver.prototype.getHtmlSource = function() {  
	  	return this.driver.getPageSource();
	}
	
	/** 
	  * Gets the absolute URL of the current page.
	  * @return string the absolute URL of the current page
	  * 
	  */
	SynchronousWebDriver.prototype.getLocation = function() {  	
		return this.driver.getCurrentUrl();
	}
	
	/** 
	  * Returns the number of pixels between "mousemove" events during dragAndDrop commands
	  * @return number the number of pixels between "mousemove" events during dragAndDrop commands
	  * 
	  */
	SynchronousWebDriver.prototype.getMouseSpeed = function() {
	  	return this.driver.getMouseSpeed();
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
	   	var element = findElement_(this.driver,locator,this.context)[1];
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
	 	var element = findElement_(this.driver,selectLocator,this.context)[1];
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
	
	SynchronousWebDriver.prototype.getTable = function(tableCellAddress) {	
	 pattern = /(.*)\.(\d+)\.(\d+)/;
	 if(!pattern.test(tableCellAddress)) {
	        throw new SeleniumError("Invalid target format. Correct format is tableName.rowNum.columnNum");
	    }
	
	    matcher = tableCellAddress.match(pattern);
	    tableName = matcher[1];
	    row = matcher[2];
	    col = matcher[3];
	  
	   var tableIndex = this.driver.findElement(new Array(ElementLocator.ID,tableName));
	   var table = getElementAt_(tableIndex,this.context); 
	   
	    if (row > table.rows.length) {
	        Assert.fail("Cannot access row " + row + " - table has " + table.rows.length + " rows");
	    }
	    else if (col > table.rows[row].cells.length) {
	        Assert.fail("Cannot access column " + col + " - table row has " + table.rows[row].cells.length + " columns");
	    }
	    else {	    	
	    	    return table.rows[row].cells[col].innerHTML;
	    }
	    return null; 
	}
	
	
	/**
	  * Gets the text of an element.
	  * @param locator an element locator
	  * @return string the text of the element
	  */
	SynchronousWebDriver.prototype.getText = function(locator) {
	  	return this.driver.getText(locator);
	}

	/** Gets the title of the current page.
  	  *
      * @return string the title of the current page
      */
	
	SynchronousWebDriver.prototype.getTitle = function() { 	
    	var title =  this.driver.title(); 
    	if(documentInFrame){ 
		return documentInFrame.title;
		}else{
			return title;
		}
	}

	/**
	  * Gets the value of an input field 
	  * @param locator an element locator
	  * @return string the element value, or "on/off" for checkbox/radio elements
	  */
	SynchronousWebDriver.prototype.getValue = function(locator) {  
		return this.driver.getValue(locator);
	};
	
	/**
	  * Returns the number of nodes that match the specified xpath
	  * @param xpath
	  * the xpath expression to evaluate.
	  * @return number the number of nodes that match the specified xpath
	  */
	SynchronousWebDriver.prototype.getXpathCount = function(xpath) {
	  	var parameters = [];
	  	parameters.push(ElementLocator.XPATH);
	  	parameters.push(xpath);
	  	var elements = this.driver.findElements(parameters);
	  	return elements.length;
	}
	
	/**
	  *
	  */
	SynchronousWebDriver.prototype.highlight = function() {
	 
	
	}
	
	/**
	  * Gets whether a toggle-button (checkbox/radio) is checked.
	  * @param locator an element locator pointing to a checkbox or radio button
	  * @return boolean true if the checkbox is checked, false otherwise
	  */
	SynchronousWebDriver.prototype.isChecked = function(locator) {
	 	return this.driver.isSelected(locator);
	
	}
	
	/**
	  * Returns true if a cookie with the specified name is present, or false otherwise.
	  * @param name the name of the cookie
	  * @return boolean true if a cookie with the specified name is present, or false otherwise.
	  */
	SynchronousWebDriver.prototype.isCookiePresent = function(name) {
	    var v = this.getCookieByName(name);
	    var notPresent = (v === null);
	    return !notPresent;
	}  
	
	/**
	  * Determines whether the specified input element is editable, ie hasn't been disabled.
	  * @param locator an element locator
	  * @return boolean true if the input element is editable, false otherwise
	  */
	SynchronousWebDriver.prototype.isEditable = function(locator) {  

	 	var element = findElement_(this.driver,locator,this.context)[1];
	 
	  	if (element.disabled){
	      	return false;
	  	}
	  
	  	tagName = this.driver.getTagName(locator);
	  	acceptableTagName = ("input" == tagName) || ("select"== tagName);
	  	readonly = "";
	  	var attribute = [];
	  	attribute.push("readonly");
	  	if ("input" == tagName){
	  		readonly = this.driver.getAttribute(locator,attribute);
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
	     	findElement_(this.driver,locator,this.context)[1];
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
		
	  	var element1 = findElement_(this.driver,locator1,this.context)[1];
	  	var element2 = findElement_(this.driver,locator2,this.context)[1];
	
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
	  	var element = findElement_(this.driver,selectLocator,this.context)[1];
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
	  	var source = this.driver.getPageSource();
	  	return source.indexOf(pattern) != -1;	    
	}
	
	/**
	  * Determines if the specified element is visible.
	  * @param locator an element locator
	  * @return boolean true if the specified element is visible, false otherwise
	  */
	SynchronousWebDriver.prototype.isVisible = function(locator) {
	  	return this.driver.isDisplayed(locator);
	 
	}	
	

	/**
 	  * An enumeration of the supported element locator methods.
      * @enum {string}
      */
	ElementLocator = {
	  	ID: 'id',
	  	NAME: 'name',
	  	CLASS_NAME: 'class name',
	  	CSS_SELECTOR: 'css selector',
	  	TAG_NAME: 'tag name',
	  	LINK_TEXT: 'link text',
	  	PARTIAL_LINK_TEXT: 'partial link text',
	  	XPATH: 'xpath'
	};

	/**
	  * Finds element on the current page. The response value will be the UUID of the
	  * located element or an error message if an element could not be found.
	  */

	function findElement_(driver,locator,context){
	 
	  var pattern = /^([a-zA-Z]+)=(.*)$/;
	  var result = locator.match(pattern);
	  
	  var strategyName = "implicit";
	  var use = locator;
	  var res;
	  
	 
	    /**
		 * FIND_ELEMENT search an element on the current page. The response value
		 * will be the UUID of the located element, or an error message if an
		 * element could not be found.
		 * @param {Response} respond Object to send the command response with.
		 * @param {Array <string>} parameters A two-element array: the first element
		 * should be the type of locator strategy to use, the second is
		 * the target of the search.
		 */
	    
	  var makeSimpleFinder = function(type,target){  
	     var parameters =[];
	     parameters.push(type);
	     parameters.push(target);
	    
	     var elementId = driver.findElement(parameters);
	   
	     return elementId;
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
	                res = makeSimpleFinder(ElementLocator.XPATH,use);
	                strategyName = ElementLocator.XPATH;
	             
	        	} else if(use.match("^document\.")) {
	        	 	var script = [];
	    	     	script.push("return "+use+";");  	    
	             	res = (driver.executeScript(script)).value;    
	             
	        		} else {
	        			   
	            			res = makeSimpleFinder(ElementLocator.ID,use);  
	            			strategyName = ElementLocator.IDs;
	            			
	        				var error  = 'Unable to locate element: ' + JSON.stringify({
	      					method: "id",
	      					selector: use
	      					});
	      					 
	        				if(res == error){
	        					res = makeSimpleFinder(ElementLocator.NAME,use);
	        					strategyName = ElementLocator.NAME;
	        				}           			
	            			
	            	}
	         
	        break;
	        
	        case "link":
	      
	        if(use.indexOf("exact:") == 0){
	            // shortcut for fast case
	            res = makeSimpleFinder(ElementLocator.LINK_TEXT,use.substring(6));
	            strategyName = ElementLocator.LINK_TEXT;
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
	    		parameters.push(ElementLocator.XPATH);
	            parameters.push("//a");
	            var elements = driver.findElements(parameters);
	           
	            var elementTexts = {};
	                    for(var idx = 0; idx < elements.length; idx++){                    
	                        elementTexts[idx] = elements[idx]; 
	                    }    
	                  
	                    for(var id in elementTexts){  
	                        var text = driver.getText(true,elementTexts[id]);
	                        
	                            if(patternMatcher.matches(text)){
	                             
	                               res = elementTexts[id];
	                               break;
	                             }
	                    }       
	        }
	        break;
	        
	        case "alt":
			res = makeSimpleFinder(ElementLocator.XPATH,"//*[@alt='" + use + "']");
	        break;
	
	        case "class":	
			res = makeSimpleFinder(ElementLocator.CLASS_NAME,use);	
	        break;
	        
	        case "css":
			res = makeSimpleFinder(ElementLocator.CSS_SELECTOR,use);
	        break;
	
	        case "id":
			res = makeSimpleFinder(ElementLocator.ID,use);
	        break;
	
	        case "identifier":     
	        res = makeSimpleFinder(ElementLocator.ID,use);
	        var error  = 'Unable to locate element: ' + JSON.stringify({
	      	method: "id",
	      	selector: use
	      	});        	
	      
	        if(res == error)	
	       	res = makeSimpleFinder(ElementLocator.NAME,use);     	             
	        break;
	        
	        case "name":      
		    res = makeSimpleFinder(ElementLocator.NAME,use);
	        break;
	
	        case "xpath":  
		    if (use.match(/\/$/))
	        use = use.substring(0,(use.length-1));
	        res = makeSimpleFinder(ElementLocator.XPATH,use);
	        break;
	
	        case "dom":
	        var script = [];
	    	script.push("return "+use+";");  	
	        res = (driver.executeScript(script)).value;
	        break;
	     
	       
	        default:
	        throw new SeleniumError("Strategy not supported");
	    }
	     
	    var error  = 'Unable to locate element: ' + JSON.stringify({
	      	method: strategyName,
	      	selector: use
	    });     	
	       
	    if(res == error){
	    	throw new SeleniumError("Element "+use + " not found");
	    }
	    
	    var element = getElementAt_(res,context);    
	    
	    return [res,element];
	 
	}

	 function getElementAt_(index,context) {
		   if (context.frame) {
		    doc = context.frame.document;
		   }
		  	doc = context.fxbrowser.contentDocument;
		  	var e = doc.fxdriver_elements ? doc.fxdriver_elements[index] : undefined;
		  	return e;
	 }
	
	//==================================================================================

	SynchronousWebDriver.prototype.makePageLoadCondition = function(timeout) {
		var driver = this.driver;
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
	    return function(){
	        if (new Date().getTime() > timeoutTime) {
	            throw new SeleniumError("Timed out after " + timeout + "ms");
	        }
	        switch(state){
	            case "retry":
	            var script = [];
	            script.push("return(!document.old && 'complete' == document.readyState)");
	            currentRequest = driver.executeScript(script);
	            state = "requesting";
            	return false;
	       
            	case "requesting":          
            	if(currentRequest.value){
                    return true;
            	}   
            	state = "retry";
            	return false;
	        }
	    }

};
	
	SynchronousWebDriver.prototype.preprocessParameter = Selenium.prototype.preprocessParameter;
	SynchronousWebDriver.prototype.replaceVariables = Selenium.prototype.replaceVariables;


