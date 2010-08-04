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
	   
	  }
	  
	 /* *//**
		* Getter and setter to handle errors
	    *//*
	 
	  set isError(error)    { this.json_.isError = error; },
	  get isError()         { return this.json_.isError; },
	  
	  set response(res)     { this.json_.response = res; },
	  get response()        { return this.json_.response; }*/
	   
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



	function WebDriverProxy(){
	
	 this.fxdriver = new FirefoxDriver();
	 this.driver = this.fxdriver.driver;
	 this.context = new Context(this.driver.id); 
	 
   
}
	
	var withoutElementIdMethod = ["getCurrentWindowHandle","get","getCurrentUrl","close","getPageSource","findChildElements","findElements","goBack","refresh","title","addCookie","getCookie","findElement","executeScript","setMouseSpeed","getMouseSpeed","addCookie","deleteCookie","deleteAllCookies","getMouseSpeed","getScreenshotAsBase64()"];

	var withElementIdMethod = ["click","getText","getTagName","submit","getValue","setSelected","sendKeys","getTagName","getAttribute","submit","isSelected","toggle","dragElement","getSize","getLocation","isDisplayed"];
 

	/**
	 * Create the new instance of driver with the right parameter for the methods
	 * 
	 */
	WebDriverProxy.prototype.getDriverInstance = function(){
	   
		 for (method in this.driver){
		 	if ( typeof this.driver[method] == "function"){
	  				if(withoutElementIdMethod.indexOf(method) != -1){
	  					 var realMethod = this.driver[method];
	  					 var f = this.createNewFunctionWithoutID(realMethod,this.driver,this.context,this.fxdriver.fxbrowser);
		    			 this.driver[method]= f;
	  				} 
	  				if(withElementIdMethod.indexOf(method) != -1){
	  					 var realMethod = this.driver[method];
	  					 var f = this.createNewFunctionWithID(realMethod,this.driver,this.context,this.fxdriver.fxbrowser);
		    			 this.driver[method]= f;
	  				}				
		    }	 
		    
		 }	
		 return this.driver;	   
	}


	/**
	 * Create the new function with the right parameter
	 * @param realF - the native function
	 * @param object - the object on which the function is called
	 * @param ct - the context
	 * @param fx - fxbrowser
	 */
	
	WebDriverProxy.prototype.createNewFunctionWithoutID = function(realF,object,ct,fxbrowser){
		return function(){	 
		
			if(newContext){		
				ct = newContext;
				if(newFxbrowser)
				fxbrowser = newFxbrowser;
			}			
			
			var response = new FakeRespond();
	        response.context = ct;
	        response.context.frame = null;
	        documentInFrame = null;
	   
	        var frameContext = searchFrames(fxbrowser,response.context);
			if(frameContext)
			response.context.frame = frameContext;
	        
	        response.context.fxbrowser = fxbrowser;
			var args = new Array(response);	
			
	       	if(!(arguments[0] instanceof FakeRespond)){	
	       		
	       		for(i=0;i<arguments.length;i++){    	 
	        	 	args.push(arguments[i]);
	        	}
	        	 		
	        	realF.apply(object,args); 
	       		return response.response;   
	       		
	       	}else{
	       		 	realF.apply(object,arguments); 
	        	 	return response.response;
	       	}
	        
		};
	}

	/**
	  * Create the new function with the right parameter
	  * @param realF - the native function
	  * @param object - the object on which the function is called
	  * @param ct - the context
	  * @param fx - fxbrowser
	  */
	
	WebDriverProxy.prototype.createNewFunctionWithID = function(realF,object,context,fxbrowser){
		
		return function(){	 
			
		
				if(newContext){
				context = newContext;
				if(newFxbrowser)
				fxbrowser = newFxbrowser;
				}
					
				var response = new FakeRespond();
	        	response.context = context;
	            response.context.frame = null;
	            documentInFrame = null;
	        	var args = new Array();	
	        
	        
			    var frameContext = searchFrames(fxbrowser,response.context);
			    if(frameContext)
			    response.context.frame = frameContext;
	          
			
	        	response.context.fxbrowser = fxbrowser;
	        	
			
			    // When the first argument is boolean means that 
				// elementId is already calculated
				if(typeof(arguments[0]) == 'boolean'){					   
						response.elementId = arguments[1];
						args.push(response);
						if(arguments[2]!='undefined'){
							args.push(arguments[2]);
						}
						realF.apply(object,args); 
		         		return response.response;
				}
				
				// When the first argument is not boolean 
				// we need to call findElement_ function to get elementId	
				if(!(arguments[0] instanceof FakeRespond)){					
						id = findElement_(object,arguments[0],context)[0];	
						response.elementId = id;							
						
						args.push(response);
						if( arguments[1] != 'undefined'){
							args.push(arguments[1]);
						}
	         			realF.apply(object,args); 
	         			return response.response;
				}else{ 
					  	realF.apply(object,arguments); 			
				}        
		};
	
	}
	
	function searchFrames(fxbrowser,context){	
		
				if (context.frameId !== undefined) {
				
	    			var frame = findFrame(fxbrowser,context.frameId);
	    			
	    			if(frame && frame.document){
	    				documentInFrame = frame.document;
	    				context.frame  = frame;
	    				
	    			}
	        		
	  			}
	            
	  			return context.frame;	
	}        
	
    findFrame = function(browser, frameId) {
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
	
	function switchToFrame_(driver,id,context,fxbrowser){	
		
		  
		    var frameId = new Array(id);
		 
			if(newContext){
				context = new Context(context,frameId[0]);
				if(newFxbrowser)
				fxbrowser = newFxbrowser;
			}
			
	
		
			var response = new FakeRespond();
	        response.context = context;
	        response.context.fxbrowser = fxbrowser;
	        
	
			driver.switchToFrame(response,frameId);
            context = response.context;
			 
		
			return context;
			 
	}
	
	function switchToWindow(windowId,opt_searchAttempt) {
		    var context;
		    var fxbrowser;
	  		var windowFound = false;
	  		var lookFor = windowId[0];
	  		
	  		var matches = function(win, lookFor) {
	    		return !win.closed &&
	           (win.content && win.content.name == lookFor) ||
	           (win.top && win.top.fxdriver && win.top.fxdriver.id == lookFor);
	  		}
	
	  		this.wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].
	  		getService(Components.interfaces.nsIWindowMediator);    
	  		var allWindows = this.wm.getEnumerator('navigator:browser');
	    	while (allWindows.hasMoreElements()) {
	    		var win = allWindows.getNext();   		
	   			 	if (matches(win,lookFor)) {  
	      		  	win.focus();
	      			if (win.top.fxdriver) {
	      				fxbrowser = win.getBrowser();
	        			context = new Context(win.fxdriver.id);
	      			} else {
	        				
	        				context = 'No driver found attached to top window!';
	      			}     
	      			// Found the desired window, stop the search.
	      			windowFound = true;
	      			break;
	    		} 
	   		}
	   		
		 	if (!windowFound) {	    
		    var searchAttempt = opt_searchAttempt || 0;
			    if (searchAttempt > 3) {
			      
			      context = 'Unable to locate window "' + lookFor + '"';
			      
			    } else {
			      var self = this;
			      this.wm.getMostRecentWindow('navigator:browser').
			          setTimeout("self.switchToWindow(windowId,(searchAttempt + 1))",500);
			    }
	  		}
	  		
	  		return [context,fxbrowser];
	}

	/**
	  * Retrieves a list of all known FirefoxDriver windows.
	  * 
	  */
	function getWindowHandles() {
		  var res = [];
		  this.wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].
		  getService(Components.interfaces.nsIWindowMediator);    
		  var allWindows = this.wm.getEnumerator('navigator:browser');
		  while (allWindows.hasMoreElements()) {
			  	var win = allWindows.getNext();
			    if (win.top && win.top.fxdriver) {
			      res.push(win.getBrowser());
			    } else if (win.content) {
			      res.push(win.getBrowser());
			    }
		  }
		  return res;
	}

