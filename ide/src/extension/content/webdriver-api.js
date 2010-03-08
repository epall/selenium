DirectCommandProcessor = function() {
  webdriver.AbstractCommandProcessor.call(this);

  var iface = Components.classes['@googlecode.com/webdriver/command-processor;1'];
  if(!iface) {
      throw Error(
          'The current browser does not support a DirectCommandProcessor');
  }
  this.commandProcessor = iface.getService(Components.interfaces.nsICommandProcessor);
};

goog.inherits(DirectCommandProcessor, webdriver.AbstractCommandProcessor);

/**
 * @override
 */
DirectCommandProcessor.prototype.dispatchDriverCommand = function(command) {
  if (command.getName() == webdriver.CommandName.SEND_KEYS) {
    command.setParameters(command.getParameters().join(''));
  }

  var jsonCommand = {
    'commandName': command.getName(),
    'context': command.getDriver().getContext().toString(),
    'parameters': command.getParameters()
  };

  if (command.element) {
    try {
      jsonCommand['elementId'] = command.element.getId().getValue();
    } catch (ex) {
      currentTest.handleAsyncError(ex, "Internal error: "+ex.message);
    }
  }

  jsonCommand = goog.json.serialize(jsonCommand);
  LOG.debug('sending: ' + jsonCommand+'\n');

  this.commandProcessor.execute(jsonCommand, function(jsonResponse){
      LOG.debug('received: '+jsonResponse+'\n');
      var rawResponse = goog.json.parse(jsonResponse);
      var response = new webdriver.Response(
          rawResponse['isError'],
          webdriver.Context.fromString(rawResponse['context']),
          rawResponse['response']);
      if(response.isFailure) {
          LOG.debug("WebDriver error: "+response.getErrorMessage()+"\n");
      }

      command.setResponse(response);
  });
};

(function(){
    var dead = false;
    goog.debug.Logger.getLogger('webdriver.WebDriver').addHandler(function(logRecord){
        if(!dead){
            if(logRecord.getLevel() == goog.debug.Logger.Level.SEVERE){
                LOG.error(logRecord.getMessage());
                dead = true; // only log this once, because WebDriver gets really angry
            } else {
                LOG.debug(logRecord.getLevel().name+": "+logRecord.getMessage());
            }
        }
    });
})();

function WebDriver(window) {
    this.driver = new webdriver.WebDriver(new DirectCommandProcessor());
    this.baseUrl = window.location.href;
    this.defaultTimeout = 30 * 1000;
}

WebDriver.createForWindow = function(window) {
    return new WebDriver(window);
}

WebDriver.prototype.reset = function() {
    this.driver.newSession();
}

WebDriver.prototype.ensureNoUnhandledPopups = function() {
    // TODO
}

// ACTIONS //

WebDriver.prototype.doClick = function(locator) {
    var driver = this.driver;
    this.findElement_(locator, function(element){
        driver.executeScript("document.old = true");
        element.click();
        driver.callFunction(function(result){
            currentTest.resumeFromCallback();
        });
    });
}

WebDriver.prototype.doOpen = function(url) {
    this.driver.get(absolutify(url, this.baseUrl));
    this.driver.callFunction(function(result){
        currentTest.resumeFromCallback();
    });
}

WebDriver.prototype.doSelect = function(selectLocator, optionLocator) {
    var driver = this.driver;
    
    // figure out option locator strategy
    var strategyName = "implicit";
    var use = optionLocator;
    var pattern = /^([a-zA-Z]+)=(.*)$/;
    var result = optionLocator.match(pattern);
    var wasSelected = false;
    
    if(result != null){
        strategyName = result[1];
        use = result[2];
    }
    
    var strategies = {
        label: function(option){
            var label = option.getText();
            driver.callFunction(function(){
                if(label.getValue() == use){
                    wasSelected = true;
                    option.setSelected();
                }
            });
        },
        
        id: function(option){
            var id = option.getAttribute('id');
            driver.callFunction(function(){
                if(id.getValue() == use){
                    wasSelected = true;
                    option.setSelected();
                }
            });
        },
        
        index: function(option, index){
            if(index == use){
                driver.callFunction(function(){
                    wasSelected = true;
                    option.setSelected();
                });
            }
        },
        
        value: function(option){
            var value = option.getValue();
            driver.callFunction(function(){
                if(value.getValue() == use){
                    wasSelected = true;
                    option.setSelected();
                }
            });
        }
    }
    
    strategies['implicit'] = strategies['label'];
    
    var strategy = strategies[strategyName];
    if(!strategy){
        throw new SeleniumError("Strategy "+strategyName+" not supported");
    }
    
    this.findElement_(selectLocator, function(select){
        var isMultipleFuture = select.getAttribute("multiple");
        // TODO: support multi-selects
        
        select.findElements(By.tagName("option"));
        driver.callFunction(function(allOptions){
            for(var i = 0; i < allOptions.length; i++){
                strategy(allOptions[i], i);
            }
            driver.callFunction(function(){
                if(wasSelected){
                    currentTest.resumeFromCallback();
                } else {
                    currentTest.handleAsyncError(new Error(), "Option "+optionLocator+" not found");
                }
            });
        });
    });
}

WebDriver.prototype.doSelectFrame = function(name) {
    this.driver.switchToFrame(name);
    var fail = false;
    this.driver.ifPreviousCommandFailsCall(function(){
        fail = true;
        currentTest.handleAsyncError(new Error(), "frame "+name+" not found");
    });
    this.driver.callFunction(function(){
        if(!fail){
            currentTest.resumeFromCallback();
        }
    });
}

WebDriver.prototype.doSelectWindow = function(name) {
    this.driver.switchToWindow(name);
    var fail = false;
    this.driver.ifPreviousCommandFailsCall(function(){
        fail = true;
        currentTest.handleAsyncError(new Error(), "window "+name+" not found");
    });
    this.driver.callFunction(function(){
        if(!fail){
            currentTest.resumeFromCallback();
        }
    });
}

WebDriver.prototype.doType = function(locator, value) {
    var driver = this.driver;
    this.findElement_(locator, function(element){
        element.sendKeys(value);
        driver.callFunction(function(result){
            currentTest.resumeFromCallback();
        });
    });
}

WebDriver.prototype.doWaitForPageToLoad = function(timeout) {
    setTimeout(fnBind(currentTest.resumeFromCallback, currentTest), 5);
    return this.makePageLoadCondition(timeout);
};

WebDriver.prototype.doWaitForPopUp = function(name, timeout) {
    if (timeout == null) {
        timeout = this.defaultTimeout;
    }
    var timeoutTime = getTimeoutTime(timeout);
    
    var driver = this.driver;
    var currentWindow = driver.getWindowHandle();
    
    var tryToSwitch = function() {
        var failed = false;
        driver.switchToWindow(name);
        driver.ifPreviousCommandFailsCall(function(){
            failed = true;
            if(new Date().getTime() > timeoutTime){
                currentTest.handleAsyncError(new Error(), "Timeout exceeded waiting for popup");
            } else {
                tryToSwitch();
            }
        });
        driver.callFunction(function(){
            if(!failed){
                driver.switchToWindow(currentWindow.getValue());
                currentTest.resumeFromCallback();
            }
        });
    };
    
    tryToSwitch();
}

// ACCESSORS //

WebDriver.prototype.getEval = function(callback, script) {
    this.driver.executeScript("return ("+script+");");
    this.driver.callFunction(function(result){
        callback(result);
    });
}

WebDriver.prototype.getText = function(callback, locator) {
    var driver = this.driver;
    this.findElement_(locator, function(element){
        var text = element.getText();
        driver.callFunction(function(){
            callback(text.getValue());
        })
    });
}

WebDriver.prototype.getTitle = function(callback) {
    var title = this.driver.getTitle();
    this.driver.callFunction(function(){
        callback(title.getValue());
    })
}

WebDriver.prototype.getXpathCount = function(callback, xpath) {
    this.driver.findElements(By.xpath(xpath));
    this.driver.callFunction(function(elements){
        callback(elements.length);
    })
}

WebDriver.prototype.isElementPresent = function(callback, pattern) {
    var strategies = this.inferStrategy_(pattern)[0];
    var result = null;
    var driver = this.driver;
    var key = null;
    var done = false;
    
    var continueOrStop = function(){
        if(result.isSet() && result.getValue().getId().isSet()) {
            goog.events.unlistenByKey(key);
            done = true;
            callback(true);
        } else {
            if(strategies.length > 0) {
                var strategy = strategies.shift();
                result = strategy();
                driver.callFunction(continueOrStop);
            } else {
                done = true;
                callback(false);
            }
        }
    }
    
    var errorListener = function(err){
        driver.abortCommand(null);
        err.preventDefault();
        err.stopPropagation();
        if(!done) {
            if(strategies.length == 0) {
                goog.events.unlistenByKey(key);
                callback(false);
            } else {
                var strategy = strategies.shift();
                result = strategy();
                driver.callFunction(continueOrStop);
            }
        }
    }
    
    key = goog.events.listen(driver, webdriver.Command.ERROR_EVENT, errorListener);
    
    var strategy = strategies.shift();
    result = strategy();
    driver.callFunction(continueOrStop);
}

WebDriver.prototype.isTextPresent = function(callback, pattern) {
    var source = this.driver.getPageSource();
    this.driver.callFunction(function(result){
        callback(source.getValue().indexOf(pattern) != -1);
    });
}

WebDriver.prototype.isVisible = function(callback, locator) {
    var driver = this.driver;
    this.findElement_(locator, function(element){
        var visible = element.isDisplayed();
        driver.callFunction(function(){
            callback(visible.getValue());
        });
    });
}

// PRIVATE / INTERNAL //

WebDriver.prototype.inferStrategy_ = function(locator) {
    var pattern = /^([a-zA-Z]+)=(.*)$/;
    var result = locator.match(pattern);
    var strategyName = "implicit";
    var use = locator;
    var strategies = [];
    var driver = this.driver;
    var makeSimpleFinder = function(strategy){
      return function(){
        var fut = new webdriver.Future(driver);
        fut.setValue(driver.findElement(strategy));
        return fut;
      }
    }
    
    var domFinder = function(){
      var fut = new webdriver.Future(driver);
      var cmd = driver.executeScript("return "+use+";");
      driver.callFunction(function(result){
        fut.setValue(result);
      });
      return fut;
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
            strategies.push(makeSimpleFinder(By.xpath(use)));
        } else if(use.match("^document\.")) {
            strategies.push(domFinder);
        } else {
            strategies.push(makeSimpleFinder(By.id(use)));
            strategies.push(makeSimpleFinder(By.name(use)));
        }
        break;

        case "alt":
        strategies.push(makeSimpleFinder(By.xpath("//*[@alt='" + use + "']")));
        break;

        case "class":
        strategies.push(makeSimpleFinder(By.className(use)));
        break;
        
        case "css":
        strategies.push(makeSimpleFinder(By.selector(use)));
        break;

        case "id":
        strategies.push(makeSimpleFinder(By.id(use)));
        break;

        case "identifier":
        strategies.push(makeSimpleFinder(By.id(use)));
        strategies.push(makeSimpleFinder(By.name(use)));
        break;

        case "link":
        if(use.indexOf("exact:") == 0){
            // shortcut for fast case
            strategies.push(makeSimpleFinder(By.linkText(use.substring(6))));
        } else {
            var patternMatcher = new PatternMatcher(use);

            strategies.push(function(){
                var fut = new webdriver.Future(driver);
                driver.findElements(By.xpath("//a"));
                var elementTexts = {};
                driver.callFunction(function(elements){
                    for(var idx = 0; idx < elements.length; idx++){
                        var el = elements[idx];
                        elementTexts[el.getId().getValue()] = el.getText();
                    }
                    driver.callFunction(function(){
                        for(var id in elementTexts){
                            var text = elementTexts[id].getValue();
                            if(patternMatcher.matches(text)){
                                if(!fut.isSet()){
                                    var el = new webdriver.WebElement(driver);
                                    el.getId().setValue(id);
                                    fut.setValue(el);
                                    break;
                                }
                            }
                        }
                    });
                });

                return fut;
            });
        }
        break;

        case "name":
        strategies.push(makeSimpleFinder(By.name(use)));
        break;

        case "xpath":
        if (use.match(/\/$/))
            use = use.substring(0, use.length() - 1);
        strategies.push(makeSimpleFinder(By.xpath(use)));
        break;

        case "dom":
        strategies.push(domFinder);
        break;

        default:
        throw new SeleniumError("Strategy not supported");
    }

    if(strategies.length == 0){
        throw new SeleniumError("Strategy not supported");
    }
    return [strategies, use];
}

WebDriver.prototype.findElement_ = function(locator, callback) {
    var strategiesAndUse = this.inferStrategy_(locator);
    var strategies = strategiesAndUse[0];
    var use = strategiesAndUse[1];
    var driver = this.driver;
    var done = false;
    
    var tryNextStrategy = function(){
        var strategy = strategies.shift();
        var error = false;
        var key = null;
        
        var errorListener = function(err){
            error = true;
            driver.abortCommand(null);
            err.preventDefault();
            err.stopPropagation();
            if(!done) {
                if(strategies.length == 0) {
                    goog.events.unlistenByKey(key);
                    currentTest.handleAsyncError(err, "Element "+use+" not found");
                } else {
                    tryNextStrategy();
                }
            }
        };

        key = goog.events.listen(driver, webdriver.Command.ERROR_EVENT, errorListener);
        
        var result = strategy();
        
        driver.callFunction(function(){
            if(!error) {
                goog.events.unlistenByKey(key);
                done = true;
                if(!result.isSet()){
                    currentTest.handleAsyncError(err, "Element "+use+" not found");
                } else {
                    callback(result.getValue());
                }
            }
        });
    }
    
    tryNextStrategy();
}

// this may not actually be necessary with WebDriver's semantics
WebDriver.prototype.makePageLoadCondition = function(timeout) {
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

    return function(){
        if (new Date().getTime() > timeoutTime) {
            throw new SeleniumError("Timed out after " + timeout + "ms");
        }
        switch(state){
            case "retry":
            currentRequest = driver.executeScript("return (!document.old && 'complete' == document.readyState)");
            state = "requesting";
            return false;

            case "requesting":
            if(currentRequest.isSet()){
                if(currentRequest.getValue()){
                    return true;
                }
                state = "retry";
            }
            return false;
        }
    }
};

WebDriver.prototype.preprocessParameter = Selenium.prototype.preprocessParameter;
WebDriver.prototype.replaceVariables = Selenium.prototype.replaceVariables;

WebDriver.prototype.browserbot = {
    runScheduledPollers: function(){ }
}
